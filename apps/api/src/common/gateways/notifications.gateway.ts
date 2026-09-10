import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, { socket: Socket; userId: string; role: string }> = new Map();

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

      if (!user || !user.isActive) {
        client.disconnect();
        return;
      }

      // Solo admins e informáticos reciben notificaciones de password reset
      if (user.role !== 'ADMIN' && user.role !== 'INFORMATICO') {
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, {
        socket: client,
        userId: user.id,
        role: user.role,
      });

      console.log(`✅ Cliente conectado: ${user.email} (${user.role})`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    console.log(`❌ Cliente desconectado: ${client.id}`);
  }

  // Emitir evento a todos los admins/informáticos
  emitNewPasswordRequest(data: { requestId: string; userEmail: string; userName: string }) {
    this.connectedClients.forEach(({ socket, role }) => {
      if (role === 'ADMIN' || role === 'INFORMATICO') {
        socket.emit('new-password-request', data);
      }
    });
  }

  // Emitir evento cuando se resuelve una solicitud
  emitPasswordRequestResolved(data: { requestId: string; resolvedBy: string }) {
    this.connectedClients.forEach(({ socket, role }) => {
      if (role === 'ADMIN' || role === 'INFORMATICO') {
        socket.emit('password-request-resolved', data);
      }
    });
  }

  // Obtener contador de solicitudes pendientes
  async getPendingCount(): Promise<number> {
    return this.prisma.passwordResetRequest.count({
      where: { status: 'PENDING' },
    });
  }
}