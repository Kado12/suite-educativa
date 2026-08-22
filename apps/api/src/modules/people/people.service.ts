import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class PeopleService {
  constructor(private prisma: PrismaService, private uploadService: UploadService) {}

  private validateDocument(docType: string, dni: string) {
    if (docType === 'DNI') {
      if (!/^\d{8}$/.test(dni)) throw new BadRequestException('El DNI debe tener exactamente 8 dígitos');
    } else {
      if (!/^0\d{0,8}$/.test(dni)) throw new BadRequestException('El Carnet de Extranjería debe comenzar con 0 y tener hasta 9 dígitos');
    }
  }

  async updateStudentFull(id: string, data: {
    firstName?: string; lastName?: string; docType?: string; dni?: string;
    phone?: string; email?: string; birthDate?: string; gender?: string; address?: string; photoUrl?: string
  }) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Alumno no encontrado');

    const updateData: any = {};
    let renamedPhotoUrl: string | null = null;

    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

    // Si cambió el documento, validar y renombrar foto
    if (data.dni && data.dni !== person.dni) {
      const docType = data.docType || person.docType;
      this.validateDocument(docType, data.dni);

      const exists = await this.prisma.person.findFirst({ where: { dni: data.dni, NOT: { id } } });
      if (exists) throw new ConflictException('Ya existe una persona con ese documento');

      updateData.dni = data.dni;
      updateData.docType = docType;

      // Renombrar foto en Cloudinary
      if (person.photoUrl && person.dni) {
        const oldPid = person.dni;
        const newPid = data.dni;
        renamedPhotoUrl = await this.uploadService.renameImage(oldPid, newPid);
        if (renamedPhotoUrl) updateData.photoUrl = renamedPhotoUrl;
      }
    }

    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.address !== undefined) updateData.address = data.address;

    return this.prisma.person.update({ where: { id }, data: updateData });
  }

  async replaceStudentPhoto(id: string, newDni: string) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Alumno no encontrado');
    // Devuelve el publicId viejo para que el frontend lo use al reemplazar
    return {
      oldPublicId: person.dni || null,
      newPublicId: newDni
    };
  }

  // ===== ALUMNOS =====
  async createStudent(data: {
    firstName: string;
    lastName: string;
    dni?: string;
    phone?: string;
    email?: string;
    birthDate?: string;
    gender?: string;
    address?: string;
  }) {
    if (data.dni && await this.prisma.person.findUnique({ where: { dni: data.dni } })) {
      throw new ConflictException('Ya existe una persona con ese DNI');
    }
    return this.prisma.person.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        dni: data.dni || null,
        phone: data.phone || null,
        email: data.email || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        gender: data.gender || null,
        address: data.address || null,
      },
    });
  }

  async listStudents(search?: string) {
    // Alumnos = Person sin teacherProfile
    return this.prisma.person.findMany({
      where: {
        teacherProfile: null,
        ...(search ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { dni: { contains: search } },
          ],
        } : {}),
      },
      include: {
        _count: { select: { enrollments: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { section: { include: { turno: true, classroom: { include: { sede: true } } } } },
          take: 1,
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async getStudentEnrollments(personId: string): Promise<any> {
    return this.prisma.enrollment.findMany({
      where: { studentId: personId },
      include: {
        section: { include: { classroom: { include: { sede: true } }, turno: true } },
        period: true,
        payments: { orderBy: { installment: 'asc' } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async updatePerson(id: string, data: any) {
    const person = await this.prisma.person.findUnique({ where: { id } });
    if (!person) throw new NotFoundException('Persona no encontrada');
    if (data.dni && data.dni !== person.dni) {
      const exists = await this.prisma.person.findFirst({ where: { dni: data.dni, NOT: { id } } });
      if (exists) throw new ConflictException('DNI ya usado');
    }
    return this.prisma.person.update({ where: { id }, data });
  }

  async deletePerson(id: string) {
    const count = await this.prisma.enrollment.count({ where: { studentId: id } });
    if (count > 0) throw new ConflictException('La persona tiene matrículas');
    return this.prisma.person.delete({ where: { id } });
  }

  // ===== DOCENTES =====
  async createTeacher(data: {
    firstName: string;
    lastName: string;
    dni: string;
    phone?: string;
    email?: string;
    priority?: number;
    yearsExperience?: number;
    maxSessionsPerWeek?: number;
    maxSections?: number;
    notes?: string;
  }) {
    if (!data.dni) throw new BadRequestException('El DNI es obligatorio para docentes');
    const existing = await this.prisma.person.findUnique({ where: { dni: data.dni } });
    if (existing) throw new ConflictException('Ya existe una persona con ese DNI');

    return this.prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          dni: data.dni,
          phone: data.phone || null,
          email: data.email || null,
        },
      });
      const profile = await tx.teacherProfile.create({
        data: {
          personId: person.id,
          priority: data.priority ?? 5,
          yearsExperience: data.yearsExperience ?? null,
          maxSessionsPerWeek: data.maxSessionsPerWeek ?? null,
          maxSections: data.maxSections ?? null,
          notes: data.notes || null,
        },
      });
      return tx.person.findUnique({ where: { id: person.id }, include: { teacherProfile: true } });
    });
  }

  async listTeachers(search?: string) {
    return this.prisma.person.findMany({
      where: {
        teacherProfile: { isNot: null },
        ...(search ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { dni: { contains: search } },
          ],
        } : {}),
      },
      include: {
        teacherProfile: {
          include: {
            courses: { include: { course: true } },
            turnos: { include: { turno: true } },
            sedes: { include: { sede: true } },
            unavailableDays: true,
            sedeDays: { include: { sede: true } },
            slotPrefs: { include: { turno: true } },
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async updateTeacherProfile(teacherProfileId: string, data: {
    priority?: number;
    yearsExperience?: number | null;
    maxSessionsPerWeek?: number | null;
    maxSections?: number | null;
    notes?: string | null;
  }) {
    return this.prisma.teacherProfile.update({ where: { id: teacherProfileId }, data });
  }

  async setTeacherCourses(teacherProfileId: string, courseIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.teacherCourse.deleteMany({ where: { teacherProfileId } });
      if (courseIds.length > 0) {
        await tx.teacherCourse.createMany({
          data: courseIds.map((courseId) => ({ teacherProfileId, courseId })),
        });
      }
      return tx.teacherProfile.findUnique({ where: { id: teacherProfileId }, include: { courses: { include: { course: true } } } });
    });
  }

  async setTeacherTurnos(teacherProfileId: string, turnoIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.teacherTurno.deleteMany({ where: { teacherProfileId } });
      if (turnoIds.length > 0) {
        await tx.teacherTurno.createMany({
          data: turnoIds.map((turnoId) => ({ teacherProfileId, turnoId })),
        });
      }
      return tx.teacherProfile.findUnique({ where: { id: teacherProfileId }, include: { turnos: { include: { turno: true } } } });
    });
  }

  async setTeacherSedes(teacherProfileId: string, sedeIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.teacherSede.deleteMany({ where: { teacherProfileId } });
      if (sedeIds.length > 0) {
        await tx.teacherSede.createMany({
          data: sedeIds.map((sedeId) => ({ teacherProfileId, sedeId })),
        });
      }
      return tx.teacherProfile.findUnique({ where: { id: teacherProfileId }, include: { sedes: { include: { sede: true } } } });
    });
  }

  async setTeacherUnavailableDays(teacherProfileId: string, days: number[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.teacherUnavailableDay.deleteMany({ where: { teacherProfileId } });
      if (days.length > 0) {
        await tx.teacherUnavailableDay.createMany({
          data: days.map((dayOfWeek) => ({ teacherProfileId, dayOfWeek })),
        });
      }
      return tx.teacherProfile.findUnique({ where: { id: teacherProfileId }, include: { unavailableDays: true } });
    });
  }
}