const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFS = [
  { f: 'Juan', l: 'Pérez', dni: '11111111', prio: 9, yrs: 15, cursos: ['Álgebra', 'Aritmética', 'Geometría'] },
  { f: 'María', l: 'Gómez', dni: '22222222', prio: 8, yrs: 10, cursos: ['Geometría', 'Física', 'Aritmética'] },
  { f: 'Luis', l: 'Díaz', dni: '33333333', prio: 7, yrs: 8, cursos: ['Química', 'Biología', 'Física'] },
  { f: 'Ana', l: 'Torres', dni: '44444444', prio: 6, yrs: 5, cursos: ['Lenguaje', 'Literatura'] },
  { f: 'Pedro', l: 'Ruiz', dni: '55555555', prio: 7, yrs: 12, cursos: ['English I', 'English II'] },
  { f: 'Lucía', l: 'Vega', dni: '66666666', prio: 5, yrs: 3, cursos: ['Aritmética', 'Álgebra', 'Geometría'] },
  { f: 'Jorge', l: 'Castro', dni: '77777777', prio: 8, yrs: 14, cursos: ['Física', 'Geometría', 'Química'] },
  { f: 'Rosa', l: 'Mendoza', dni: '88888888', prio: 6, yrs: 7, cursos: ['Biología', 'Química', 'Física'] },
  { f: 'Carlos', l: 'Flores', dni: '12312312', prio: 5, yrs: 4, cursos: ['Lenguaje', 'Literatura'] },
  { f: 'Elena', l: 'Vargas', dni: '32132132', prio: 6, yrs: 6, cursos: ['English I', 'English II', 'Lenguaje'] },
];

async function main() {
  console.log('🌱 Seed docentes (listos para generar horario)...');
  const turnos = {}; for (const t of await prisma.turno.findMany()) turnos[t.name] = t;
  const sedes = {}; for (const s of await prisma.sede.findMany()) sedes[s.name] = s;
  const courses = {}; for (const c of await prisma.course.findMany()) courses[c.name] = c;

  for (const d of DEFS) {
    const person = await prisma.person.upsert({
      where: { dni: d.dni }, update: { firstName: d.f, lastName: d.l },
      create: { firstName: d.f, lastName: d.l, dni: d.dni, phone: '999' + d.dni.slice(-6), email: `${d.f.toLowerCase()}.${d.l.toLowerCase()}@suite.edu` },
    });
    const profile = await prisma.teacherProfile.upsert({
      where: { personId: person.id },
      update: { priority: d.prio, yearsExperience: d.yrs, maxSessionsPerWeek: 30, maxSections: 10 },
      create: { personId: person.id, priority: d.prio, yearsExperience: d.yrs, maxSessionsPerWeek: 30, maxSections: 10 },
    });

    await prisma.teacherCourse.deleteMany({ where: { teacherProfileId: profile.id } });
    for (const cn of d.cursos) if (courses[cn]) await prisma.teacherCourse.create({ data: { teacherProfileId: profile.id, courseId: courses[cn].id } });

    await prisma.teacherTurno.deleteMany({ where: { teacherProfileId: profile.id } });
    for (const tn of ['Mañana', 'Tarde']) if (turnos[tn]) await prisma.teacherTurno.create({ data: { teacherProfileId: profile.id, turnoId: turnos[tn].id } });

    await prisma.teacherSede.deleteMany({ where: { teacherProfileId: profile.id } });
    for (const sn of Object.keys(sedes)) await prisma.teacherSede.create({ data: { teacherProfileId: profile.id, sedeId: sedes[sn].id } });
  }
  console.log(`✅ Seed docentes listo: ${DEFS.length} docentes`);
}
main().catch((e) => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());