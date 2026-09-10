import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class ResendService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_API_KEY'));
  }

  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    newPassword: string,
    resolvedByName: string,
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2492CD;">Tu contraseña ha sido restablecida</h2>
        <p>Hola ${userName},</p>
        <p>Tu solicitud de recuperación de contraseña ha sido procesada por <strong>${resolvedByName}</strong>.</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">Tu nueva contraseña temporal:</p>
          <p style="font-size: 24px; font-weight: bold; color: #2492CD; margin: 10px 0; font-family: monospace;">
            ${newPassword}
          </p>
        </div>

        <p><strong>Importante:</strong> Te recomendamos cambiar esta contraseña después de iniciar sesión por seguridad.</p>
        
        <p>Puedes iniciar sesión en: <a href="${this.configService.get('FRONTEND_URL')}" style="color: #2492CD;">${this.configService.get('FRONTEND_URL')}</a></p>
        
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          Este es un correo automático, por favor no respondas.<br>
          Si no solicitaste este cambio, contacta al administrador del sistema.
        </p>
      </div>
    `;

    await this.resend.emails.send({
      from: this.configService.get('RESEND_FROM_EMAIL'),
      to: userEmail,
      subject: 'Tu contraseña ha sido restablecida - Suite Educativa',
      html,
    });
  }
}