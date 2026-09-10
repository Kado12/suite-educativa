import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { addHours } from 'date-fns';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { ResendService } from '../../common/services/resend.service';
import { NotificationsGateway } from '../../common/gateways/notifications.gateway';

@Injectable()
export class PasswordResetService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private resendService: ResendService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async requestPasswordReset(email: string) {
    // Verificar si el usuario existe
    const user = await this.prisma.user.findUnique({ where: { email } });
    
    // Siempre devolvemos éxito para evitar enumeración
    if (!user || !user.isActive) {
      return { 
        message: 'Si el email existe, recibirás una notificación cuando tu solicitud sea procesada' 
      };
    }

    // Verificar rate limit (15 minutos)
    const rateLimitMinutes = parseInt(this.configService.get('PASSWORD_RESET_RATE_LIMIT', '15'));
    const recentRequest = await this.prisma.passwordResetRequest.findFirst({
      where: {
        userEmail: email,
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - rateLimitMinutes * 60 * 1000),
        },
      },
    });

    if (recentRequest) {
      throw new BadRequestException(
        `Ya tienes una solicitud pendiente. Espera ${rateLimitMinutes} minutos antes de solicitar otra.`,
      );
    }

    // Crear solicitud
    const expiryHours = parseInt(this.configService.get('PASSWORD_RESET_EXPIRY_HOURS', '24'));
    const request = await this.prisma.passwordResetRequest.create({
      data: {
        userEmail: email,
        userName: `${user.firstName} ${user.lastName}`,
        expiresAt: addHours(new Date(), expiryHours),
      },
    });

    // Emitir notificación en tiempo real
    this.notificationsGateway.emitNewPasswordRequest({
      requestId: request.id,
      userEmail: email,
      userName: `${user.firstName} ${user.lastName}`,
    });

    return { 
      message: 'Tu solicitud ha sido enviada al equipo de TI. Recibirás un correo cuando sea procesada.' 
    };
  }

  async listPendingRequests() {
    return this.prisma.passwordResetRequest.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolveRequest(requestId: string, resolvedById: string, customPassword?: string) {
    const request = await this.prisma.passwordResetRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException('Esta solicitud ya fue procesada');
    }

    if (request.expiresAt < new Date()) {
      await this.prisma.passwordResetRequest.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Esta solicitud ha expirado');
    }

    // Generar contraseña
    const newPassword = customPassword || this.generateSecurePassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    const user = await this.prisma.user.findUnique({ where: { email: request.userEmail } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Marcar solicitud como resuelta
    await this.prisma.passwordResetRequest.update({
      where: { id: requestId },
      data: {
        status: 'RESOLVED',
        resolvedById,
        resolvedAt: new Date(),
      },
    });

    // Obtener nombre del que resolvió
    const resolvedBy = await this.prisma.user.findUnique({ where: { id: resolvedById } });

    // Enviar email al usuario
    try {
      await this.resendService.sendPasswordResetEmail(
        request.userEmail,
        request.userName || 'Usuario',
        newPassword,
        `${resolvedBy?.firstName} ${resolvedBy?.lastName}`,
      );
    } catch (error) {
      console.error('Error enviando email:', error);
    }

    // Emitir evento de resolución
    this.notificationsGateway.emitPasswordRequestResolved({
      requestId,
      resolvedBy: `${resolvedBy?.firstName} ${resolvedBy?.lastName}`,
    });

    return { message: 'Contraseña restablecida y email enviado' };
  }

  private generateSecurePassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }

  async getPendingCount(): Promise<number> {
    return this.prisma.passwordResetRequest.count({
      where: { status: 'PENDING' },
    });
  }
}