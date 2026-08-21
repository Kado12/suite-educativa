import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

    async log(data: {
    userId: string;
    userName?: string;
    userEmail?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
  }): Promise<any> {
    return this.prisma.auditLog.create({ data });
  }

  async list(filters: {
    userId?: string;
    entity?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }): Promise<any>  {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.entity) where.entity = filters.entity;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getStats(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [total, byAction, byEntity] = await Promise.all([
      this.prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
    ]);

    return {
      total,
      byAction: byAction.map((a) => ({ action: a.action, count: a._count })),
      byEntity: byEntity.map((e) => ({ entity: e.entity, count: e._count })),
    };
  }
}