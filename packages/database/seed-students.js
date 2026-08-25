const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ALUMNOS = [
  ['Andrea', 'Soto', '90000001'], ['Bruno', 'Rivas', '90000002'], ['Carmen', 'León', '90000003'],
  ['Diego', 'Paredes', '90000004'], ['Elena', 'Cruz', '90000005'], ['Felipe', 'Molina', '90000006'],
  ['Gabriela', 'Salas', '90000007'], ['Hugo', 'Vargas', '90000008'], ['Inés', 'Campos', '90000009'],
  ['Javier', 'Reyes', '90000010'], ['Karen', 'Silva', '90000011'], ['Leonardo', 'Paz', '90000012'],
  ['Mónica', 'Ortiz', '90000013'], ['Nicolás', 'Arias', '90000014'], ['Olivia', 'Vega', '90000015'],
  ['Paula', 'Dávila', '90000016'], ['Quino', 'Meza', '90000017'], ['Ricardo', 'Flores', '90000018'],
];

async function main() {
  console.log('🌱 Seed alumnos (con matrícula y pagos)...');
  const period = await prisma.period.findFirst({ where: { isActive: true } });
  if (!period) { console.log('❌ No hay período activo. Corre seed-academic primero.'); return; }
  const sections = await prisma.section.findMany({ where: { isActive: true } });
  const plan = await prisma.paymentPlan.findFirst({ where: { name: 'Mensual regular' } });

  let created = 0;
  for (let i = 0; i < ALUMNOS.length; i++) {
    const [f, l, dni] = ALUMNOS[i];
    const person = await prisma.person.upsert({ where: { dni }, update: { firstName: f, lastName: l }, create: { firstName: f, lastName: l, dni } });
    const existing = await prisma.enrollment.findFirst({ where: { studentId: person.id, periodId: period.id, status: 'ACTIVE' } });
    if (existing) continue;

    const enrollment = await prisma.enrollment.create({ data: { studentId: person.id, sectionId: sections[i % sections.length].id, periodId: period.id, status: 'ACTIVE' } });
    if (plan) {
      const amount = Number(plan.amount) / plan.installments;
      for (let k = 0; k < plan.installments; k++) {
        const due = new Date(period.startDate); due.setUTCMonth(due.getUTCMonth() + k); due.setUTCDate(1);
        const paid = k === 0;
        await prisma.payment.create({ data: { enrollmentId: enrollment.id, paymentPlanId: plan.id, installment: k + 1, amount, dueDate: due, status: paid ? 'PAID' : 'PENDING', paidAmount: paid ? amount : null, paidDate: paid ? new Date() : null } });
      }
    }
    created++;
  }
  console.log(`✅ Seed alumnos listo: ${created} matrículas nuevas`);
}
main().catch((e) => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());