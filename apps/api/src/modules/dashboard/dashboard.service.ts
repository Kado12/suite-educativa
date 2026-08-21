import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const [
      totalStudents,
      totalTeachers,
      totalSections,
      activeEnrollments,
      todaySessions,
      todayAttendance,
      pendingPayments,
      overduePayments,
      paidThisMonth,
      recentValidations,
      recentEnrollments,
    ] = await Promise.all([
      this.prisma.person.count({ where: { teacherProfile: null, isActive: true } }),
      this.prisma.person.count({ where: { teacherProfile: { isNot: null } } }),
      this.prisma.section.count(),
      this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      this.prisma.scheduleSession.count({ where: { dayOfWeek: new Date().getUTCDay() || 7 } }),
      this.prisma.attendanceRecord.count({
        where: { date: new Date().toISOString().split('T')[0] as any },
      }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'OVERDUE' } }),
      this.prisma.payment.aggregate({
        where: {
          status: 'PAID',
          paidDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { paidAmount: true },
      }),
      this.prisma.weekValidation.findMany({
        where: { status: { in: ['VALIDATED', 'OBSERVED'] } },
        orderBy: { id: 'desc' }, take: 5,
        include: { teacherProfile: { include: { person: true } }, validatedBy: true },
      }),
      this.prisma.enrollment.findMany({
        orderBy: { enrolledAt: 'desc' }, take: 5,
        include: { student: true, section: { include: { classroom: { include: { sede: true } }, turno: true } }, period: true },
      }),
    ]);

    return {
      metrics: {
        students: totalStudents,
        teachers: totalTeachers,
        sections: totalSections,
        enrollments: activeEnrollments,
        todaySessions,
        todayAttendance,
        pendingPayments,
        overduePayments,
        paidThisMonth: Number(paidThisMonth._sum.paidAmount || 0),
      },
      recentValidations: recentValidations.map((v) => ({
        id: v.id,
        teacher: `${v.teacherProfile.person.lastName}, ${v.teacherProfile.person.firstName}`,
        week: v.weekNumber,
        status: v.status,
        comment: v.comment,
      })),
      recentEnrollments: recentEnrollments.map((e) => ({
        id: e.id,
        student: `${e.student.lastName}, ${e.student.firstName}`,
        section: `${e.section.name} · ${e.section.turno.name}`,
        sede: e.section.classroom.sede.name,
        period: e.period.name,
        enrolledAt: e.enrolledAt,
      })),
    };
  }
}