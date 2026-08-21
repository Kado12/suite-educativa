import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

export const AUDIT_KEY = 'audit';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditMeta = this.reflector.get<{ action: string; entity: string }>(AUDIT_KEY, context.getHandler());
    if (!auditMeta) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ipAddress = request.ip || request.headers['x-forwarded-for'] || request.connection.remoteAddress;

    return next.handle().pipe(
      tap(async (response) => {
        if (user) {
          // Obtener datos completos del usuario para el snapshot
          let userName = null;
          let userEmail = null;
          try {
            const fullUser = await this.prisma.user.findUnique({ where: { id: user.id } });
            if (fullUser) {
              userName = `${fullUser.lastName}, ${fullUser.firstName}`;
              userEmail = fullUser.email;
            }
          } catch {}

          const entityId = request.params?.id || response?.id;
          this.auditService.log({
            userId: user.id,
            userName,
            userEmail,
            action: auditMeta.action,
            entity: auditMeta.entity,
            entityId,
            details: {
              method: request.method,
              path: request.path,
              body: this.sanitizeBody(request.body),
            },
            ipAddress,
          }).catch(() => {});
        }
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.passwordHash;
    delete sanitized.currentPassword;
    delete sanitized.newPassword;
    return sanitized;
  }
}