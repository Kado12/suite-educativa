const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed académico (sedes/turnos/secciones/áreas/cursos/período/bloques/planes)...');

  const sedeCentral = await prisma.sede.upsert({ where: { name: 'Sede Central' }, update: {}, create: { name: 'Sede Central' } });
  const sedeNorte = await prisma.sede.upsert({ where: { name: 'Sede Norte' }, update: {}, create: { name: 'Sede Norte' } });

  const manana = await prisma.turno.upsert({ where: { name: 'Mañana' }, update: {}, create: { name: 'Mañana', slot1Start: '08:00', slot1End: '11:00', slot2Start: '11:00', slot2End: '14:00' } });
  const tarde = await prisma.turno.upsert({ where: { name: 'Tarde' }, update: {}, create: { name: 'Tarde', slot1Start: '14:00', slot1End: '17:00', slot2Start: '17:00', slot2End: '20:00' } });
  await prisma.turno.upsert({ where: { name: 'Noche' }, update: {}, create: { name: 'Noche', slot1Start: '18:00', slot1End: '21:00', slot2Start: '21:00', slot2End: '22:00' } });

  // Salones + secciones
  const salones = [{ n: 'A11', s: sedeCentral }, { n: 'A12', s: sedeCentral }, { n: 'B11', s: sedeCentral }, { n: 'C11', s: sedeNorte }, { n: 'C12', s: sedeNorte }];
  let secCount = 0;
  for (const s of salones) {
    const classroom = await prisma.classroom.upsert({ where: { name_sedeId: { name: s.n, sedeId: s.s.id } }, update: {}, create: { name: s.n, sedeId: s.s.id } });
    for (const t of [manana, tarde]) {
      await prisma.section.upsert({ where: { classroomId_turnoId: { classroomId: classroom.id, turnoId: t.id } }, update: {}, create: { name: `${s.n} - ${t.name.charAt(0)}`, classroomId: classroom.id, turnoId: t.id, capacity: 25, enrollmentPriority: 0, isActive: true } });
      secCount++;
    }
  }

  // Áreas + cursos (10 cursos para llenar un bloque)
  const areaDefs = { 'Matemáticas': ['Álgebra', 'Aritmética', 'Geometría'], 'Ciencias': ['Física', 'Química', 'Biología'], 'Letras': ['Lenguaje', 'Literatura'], 'Inglés': ['English I', 'English II'] };
  const courses = {};
  for (const [aname, names] of Object.entries(areaDefs)) {
    const area = await prisma.area.upsert({ where: { name: aname }, update: {}, create: { name: aname } });
    for (const cn of names) {
      let c = await prisma.course.findFirst({ where: { name: cn, areaId: area.id } });
      if (!c) c = await prisma.course.create({ data: { name: cn, areaId: area.id } });
      courses[cn] = c;
    }
  }

  // Período (inicia el lunes más cercano) + bloques
  const today = new Date();
  const start = new Date(today); start.setUTCDate(today.getUTCDate() - today.getUTCDay() + 1); start.setUTCHours(0, 0, 0, 0);
  if (start > today) start.setUTCDate(start.getUTCDate() - 7);
  const periodName = `Semestre ${today.getUTCFullYear()}-II`;
  let period = await prisma.period.findUnique({ where: { name: periodName } });
  if (!period) period = await prisma.period.create({ data: { name: periodName, startDate: start, weeks: 12, isActive: true } });

  const b1 = await prisma.block.upsert({ where: { periodId_name: { periodId: period.id, name: 'Bloque 1' } }, update: {}, create: { periodId: period.id, name: 'Bloque 1', startWeek: 1, endWeek: 6 } });
  await prisma.block.upsert({ where: { periodId_name: { periodId: period.id, name: 'Bloque 2' } }, update: {}, create: { periodId: period.id, name: 'Bloque 2', startWeek: 7, endWeek: 12 } });
  for (const c of Object.values(courses)) {
    await prisma.blockCourse.upsert({ where: { blockId_courseId: { blockId: b1.id, courseId: c.id } }, update: {}, create: { blockId: b1.id, courseId: c.id } });
  }

  // Planes de pago
  await prisma.paymentPlan.upsert({ where: { name: 'Mensual regular' }, update: {}, create: { name: 'Mensual regular', installments: 6, amount: 600, isActive: true } });
  await prisma.paymentPlan.upsert({ where: { name: 'Beca 50%' }, update: {}, create: { name: 'Beca 50%', installments: 6, amount: 300, isActive: true } });

  console.log(`✅ Seed académico listo: ${secCount} secciones, ${Object.keys(courses).length} cursos`);
}
main().catch((e) => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());