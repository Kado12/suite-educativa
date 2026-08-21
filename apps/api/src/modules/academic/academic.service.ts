import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AcademicService {
  constructor(private prisma: PrismaService) {}

  // ===== SEDES =====
  async createSede(name: string) {
    if (await this.prisma.sede.findUnique({ where: { name } })) throw new ConflictException('Sede ya existe');
    return this.prisma.sede.create({ data: { name } });
  }
  async listSedes() {
    return this.prisma.sede.findMany({ include: { classrooms: { include: { sections: { include: { turno: true } } } } }, orderBy: { name: 'asc' } });
  }
  async updateSede(id: string, name: string) {
    const s = await this.prisma.sede.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Sede no encontrada');
    if (name !== s.name) {
      const exists = await this.prisma.sede.findUnique({ where: { name } });
      if (exists) throw new ConflictException('Ya existe una sede con ese nombre');
    }
    return this.prisma.sede.update({ where: { id }, data: { name } });
  }
  async deleteSede(id: string) {
    const s = await this.prisma.sede.findUnique({ where: { id }, include: { classrooms: true } });
    if (!s) throw new NotFoundException('Sede no encontrada');
    if (s.classrooms.length > 0) throw new ConflictException('La sede tiene salones');
    return this.prisma.sede.delete({ where: { id } });
  }

  // ===== TURNOS =====
  async createTurno(d: { name: string; slot1Start: string; slot1End: string; slot2Start: string; slot2End: string }) {
    if (await this.prisma.turno.findUnique({ where: { name: d.name } })) throw new ConflictException('Turno ya existe');
    return this.prisma.turno.create({ data: d });
  }
  async listTurnos() { return this.prisma.turno.findMany({ orderBy: { name: 'asc' } }); }
  async updateTurno(id: string, d: { name?: string; slot1Start?: string; slot1End?: string; slot2Start?: string; slot2End?: string }) {
    const t = await this.prisma.turno.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Turno no encontrado');
    if (d.name && d.name !== t.name) {
      const exists = await this.prisma.turno.findUnique({ where: { name: d.name } });
      if (exists) throw new ConflictException('Ya existe un turno con ese nombre');
    }
    return this.prisma.turno.update({ where: { id }, data: d });
  }
  async deleteTurno(id: string) {
    const t = await this.prisma.turno.findUnique({ where: { id }, include: { sections: true } });
    if (!t) throw new NotFoundException('Turno no encontrado');
    if (t.sections.length > 0) throw new ConflictException('El turno tiene secciones');
    return this.prisma.turno.delete({ where: { id } });
  }

  // ===== SALONES =====
  async createClassroom(name: string, sedeId: string) {
    if (await this.prisma.classroom.findFirst({ where: { name, sedeId } })) throw new ConflictException('Salón ya existe en la sede');
    return this.prisma.classroom.create({ data: { name, sedeId } });
  }
  async updateClassroom(id: string, d: { name?: string; sedeId?: string }) {
    const c = await this.prisma.classroom.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Salón no encontrado');
    if (d.name && d.name !== c.name) {
      const sedeId = d.sedeId || c.sedeId;
      const exists = await this.prisma.classroom.findFirst({ where: { name: d.name, sedeId } });
      if (exists) throw new ConflictException('Ya existe un salón con ese nombre en la sede');
    }
    return this.prisma.classroom.update({ where: { id }, data: d });
  }
  async deleteClassroom(id: string) {
    const c = await this.prisma.classroom.findUnique({ where: { id }, include: { sections: true } });
    if (!c) throw new NotFoundException('Salón no encontrado');
    if (c.sections.length > 0) throw new ConflictException('El salón tiene secciones');
    return this.prisma.classroom.delete({ where: { id } });
  }

  // ===== SECCIONES =====
  async createSection(d: { name?: string; classroomId: string; turnoId: string; capacity?: number; enrollmentPriority?: number }) {
    if (await this.prisma.section.findFirst({ where: { classroomId: d.classroomId, turnoId: d.turnoId } }))
      throw new ConflictException('Ya existe sección para ese salón y turno');
    const [c, t] = await Promise.all([
      this.prisma.classroom.findUnique({ where: { id: d.classroomId } }),
      this.prisma.turno.findUnique({ where: { id: d.turnoId } }),
    ]);
    if (!c || !t) throw new NotFoundException('Salón o turno no encontrado');
    return this.prisma.section.create({
      data: {
        name: d.name || `${c.name} - ${t.name.charAt(0)}`,
        classroomId: d.classroomId,
        turnoId: d.turnoId,
        capacity: d.capacity || 30,
        enrollmentPriority: d.enrollmentPriority || 0,
      },
    });
  }
  async updateSection(id: string, d: { name?: string; capacity?: number; enrollmentPriority?: number }) {
    const s = await this.prisma.section.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Sección no encontrada');
    return this.prisma.section.update({ where: { id }, data: d });
  }
  //! DOS METODOS IGUALES
  async updateSectionFull(id: string, d: { name?: string; capacity?: number; enrollmentPriority?: number }) {
    const s = await this.prisma.section.findUnique({ where: { id } });
    if (!s) throw new NotFoundException('Sección no encontrada');
    return this.prisma.section.update({ where: { id }, data: d });
  }
  async listSections() {
    return this.prisma.section.findMany({ include: { classroom: { include: { sede: true } }, turno: true }, orderBy: { name: 'asc' } });
  }
  async deleteSection(id: string) {
    const count = await this.prisma.enrollment.count({ where: { sectionId: id } });
    if (count > 0) throw new ConflictException('La sección tiene matrículas');
    return this.prisma.section.delete({ where: { id } });
  }

  // ===== ÁREAS / CURSOS =====
  async createArea(name: string) {
    if (await this.prisma.area.findUnique({ where: { name } })) throw new ConflictException('Área ya existe');
    return this.prisma.area.create({ data: { name } });
  }
  async listAreas() { return this.prisma.area.findMany({ include: { courses: true }, orderBy: { name: 'asc' } }); }
  async updateArea(id: string, name: string) {
    const a = await this.prisma.area.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Área no encontrada');
    if (name !== a.name) {
      const exists = await this.prisma.area.findUnique({ where: { name } });
      if (exists) throw new ConflictException('Ya existe un área con ese nombre');
    }
    return this.prisma.area.update({ where: { id }, data: { name } });
  }
  async deleteArea(id: string) {
    const a = await this.prisma.area.findUnique({ where: { id }, include: { courses: true } });
    if (!a) throw new NotFoundException('Área no encontrada');
    if (a.courses.length > 0) throw new ConflictException('El área tiene cursos');
    return this.prisma.area.delete({ where: { id } });
  }
  async createCourse(name: string, areaId: string) {
    return this.prisma.course.create({ data: { name, areaId } });
  }
  async updateCourse(id: string, d: { name?: string; areaId?: string }) {
    const c = await this.prisma.course.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Curso no encontrado');
    return this.prisma.course.update({ where: { id }, data: d });
  }
  async deleteCourse(id: string) {
    const uses = await this.prisma.teacherCourse.count({ where: { courseId: id } });
    if (uses > 0) throw new ConflictException('El curso está asignado a docentes');
    return this.prisma.course.delete({ where: { id } });
  }

  // ===== PERÍODOS / BLOQUES =====
  async createPeriod(d: { name: string; startDate: string; weeks?: number }) {
    if (await this.prisma.period.findUnique({ where: { name: d.name } })) throw new ConflictException('Período ya existe');
    const date = new Date(`${d.startDate}T00:00:00Z`);
    if (date.getUTCDay() !== 1) throw new BadRequestException('La fecha debe ser LUNES');
    return this.prisma.period.create({ data: { name: d.name, startDate: date, weeks: d.weeks || 12, isActive: true } });
  }
  async listPeriods() { return this.prisma.period.findMany({ include: { blocks: { include: { blockCourses: true } } }, orderBy: { startDate: 'desc' } }); }
  async updatePeriod(id: string, d: { name?: string; startDate?: string; weeks?: number }) {
    const p = await this.prisma.period.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Período no encontrado');
    const updateData: any = {};
    if (d.name && d.name !== p.name) {
      const exists = await this.prisma.period.findUnique({ where: { name: d.name } });
      if (exists) throw new ConflictException('Ya existe un período con ese nombre');
      updateData.name = d.name;
    }
    if (d.startDate) {
      const date = new Date(`${d.startDate}T00:00:00Z`);
      if (date.getUTCDay() !== 1) throw new BadRequestException('La fecha debe ser LUNES');
      updateData.startDate = date;
    }
    if (d.weeks) {
      if (d.weeks < 1) throw new BadRequestException('Debe tener al menos 1 semana');
      updateData.weeks = d.weeks;
    }
    return this.prisma.period.update({ where: { id }, data: updateData });
  }
  async togglePeriod(id: string, isActive: boolean) { return this.prisma.period.update({ where: { id }, data: { isActive } }); }
  async deletePeriod(id: string) {
    const b = await this.prisma.block.count({ where: { periodId: id } });
    if (b > 0) throw new ConflictException('El período tiene bloques');
    return this.prisma.period.delete({ where: { id } });
  }
  async listBlocks(periodId?: string) {
    return this.prisma.block.findMany({
      where: periodId ? { periodId } : {},
      include: { period: true, blockCourses: { include: { course: true } } },
      orderBy: [{ periodId: 'asc' }, { startWeek: 'asc' }],
    });
  }
  async createBlock(d: { periodId: string; name: string; startWeek: number; endWeek: number }) {
    const p = await this.prisma.period.findUnique({ where: { id: d.periodId } });
    if (!p) throw new NotFoundException('Período no encontrado');
    if (d.startWeek < 1 || d.endWeek > p.weeks || d.startWeek > d.endWeek) throw new BadRequestException('Rango inválido');
    return this.prisma.block.create({ data: d });
  }
  async updateBlock(id: string, d: { name?: string; startWeek?: number; endWeek?: number }) {
    const b = await this.prisma.block.findUnique({ where: { id }, include: { period: true } });
    if (!b) throw new NotFoundException('Bloque no encontrado');
    const updateData: any = {};
    if (d.name && d.name !== b.name) {
      const exists = await this.prisma.block.findFirst({ where: { periodId: b.periodId, name: d.name } });
      if (exists) throw new ConflictException('Ya existe un bloque con ese nombre en el período');
      updateData.name = d.name;
    }
    if (d.startWeek !== undefined && d.endWeek !== undefined) {
      if (d.startWeek < 1 || d.endWeek > b.period.weeks || d.startWeek > d.endWeek) {
        throw new BadRequestException(`Rango inválido. El período tiene ${b.period.weeks} semanas.`);
      }
      updateData.startWeek = d.startWeek;
      updateData.endWeek = d.endWeek;
    }
    return this.prisma.block.update({ where: { id }, data: updateData });
  }
  async deleteBlock(id: string) {
    const s = await this.prisma.scheduleSession.count({ where: { blockId: id } });
    if (s > 0) throw new ConflictException('El bloque tiene sesiones');
    return this.prisma.$transaction(async (tx) => {
      await tx.blockCourse.deleteMany({ where: { blockId: id } });
      return tx.block.delete({ where: { id } });
    });
  }
  async addCourseToBlock(blockId: string, courseId: string) {
    return this.prisma.blockCourse.upsert({ where: { blockId_courseId: { blockId, courseId } }, update: {}, create: { blockId, courseId } });
  }
  async removeCourseFromBlock(blockId: string, courseId: string) {
    return this.prisma.blockCourse.delete({ where: { blockId_courseId: { blockId, courseId } } });
  }

    // ===== PLANES DE PAGO =====
  async createPaymentPlan(d: { name: string; installments: number; amount: number }): Promise<any> {
    if (await this.prisma.paymentPlan.findUnique({ where: { name: d.name } })) {
      throw new ConflictException('Plan ya existe');
    }
    if (d.installments < 1) throw new BadRequestException('Debe tener al menos 1 cuota');
    return this.prisma.paymentPlan.create({ data: { name: d.name, installments: d.installments, amount: d.amount } });
  }

  async listPaymentPlans(includeInactive = false): Promise<any> {
    return this.prisma.paymentPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async updatePaymentPlan(id: string, d: { name?: string; installments?: number; amount?: number; isActive?: boolean }): Promise<any> {
    return this.prisma.paymentPlan.update({ where: { id }, data: d });
  }

  async deletePaymentPlan(id: string): Promise<any> {
    const uses = await this.prisma.payment.count({ where: { paymentPlanId: id } });
    if (uses > 0) throw new ConflictException('El plan tiene pagos asociados. Desactívalo en su lugar.');
    return this.prisma.paymentPlan.delete({ where: { id } });
  }
}