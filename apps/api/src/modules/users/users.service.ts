import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@suite/database';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: { email: string; password: string; firstName: string; lastName: string; role: Role }) {
    if (await this.prisma.user.findUnique({ where: { email: data.email } })) {
      throw new ConflictException('Email ya en uso');
    }
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: await bcrypt.hash(data.password, 10),
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    });
  }

  async list() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true, personId: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: { email?: string; firstName?: string; lastName?: string; role?: Role; isActive?: boolean; newPassword?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (data.email && data.email !== user.email) {
      const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (exists) throw new ConflictException('Email ya en uso');
    }
    const updateData: any = {
      email: data.email, firstName: data.firstName, lastName: data.lastName,
      role: data.role, isActive: data.isActive,
    };
    if (data.newPassword) updateData.passwordHash = await bcrypt.hash(data.newPassword, 10);
    return this.prisma.user.update({
      where: { id }, data: updateData,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
  }

  async remove(id: string, currentUserId: string) {
    if (id === currentUserId) throw new BadRequestException('No puedes desactivar tu propio usuario');
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }
}