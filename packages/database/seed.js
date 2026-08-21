const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function upsertUser(data) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  const { password, ...rest } = data;
  await prisma.user.upsert({
    where: { email: rest.email },
    update: { ...rest, passwordHash, isActive: true },
    create: { ...rest, passwordHash },
  });
}

async function main() {
  console.log('🌱 Seed suite educativa...');

  // ===== Usuarios =====
  await upsertUser({ email: 'admin@suite.edu', password: 'Admin2026!', firstName: 'Admin', lastName: 'General', role: Role.ADMIN });
  await upsertUser({ email: 'informatica@suite.edu', password: 'Info2026!', firstName: 'Área', lastName: 'Informática', role: Role.INFORMATICO });
  await upsertUser({ email: 'coordinador@suite.edu', password: 'Coord2026!', firstName: 'Coordinador', lastName: 'Académico', role: Role.COORDINADOR });
  await upsertUser({ email: 'secretaria@suite.edu', password: 'Secre2026!', firstName: 'Secretaría', lastName: 'Académica', role: Role.SECRETARIA });

  // ===== Sedes =====
  const sedeC = await prisma.sede.upsert({ where: { name: 'Sede Central' }, update: {}, create: { name: 'Sede Central' } });
  const sedeN = await prisma.sede.upsert({ where: { name: 'Sede Norte' }, update: {}, create: { name: 'Sede Norte' } });

  // ===== Turnos =====
  const manana = await prisma.turno.upsert({ where: { name: 'Mañana' }, update: {}, create: { name: 'Mañana', slot1Start: '08:00', slot1End: '11:00', slot2Start: '11:00', slot2End: '14:00' } });
  const noche = await prisma.turno.upsert({ where: { name: 'Noche' }, update: {}, create: { name: 'Noche', slot1Start: '18:00', slot1End: '21:00', slot2Start: '21:00', slot2End: '22:00' } });

  // ===== Salones + Secciones =====
  const salones = [
    { name: 'A11', sede: sedeC }, { name: 'A12', sede: sedeC }, { name: 'B11', sede: sedeN },
  ];
  for (const s of salones) {
    const classroom = await prisma.classroom.upsert({
      where: { name_sedeId: { name: s.name, sedeId: s.sede.id } }, update: {}, create: { name: s.name, sedeId: s.sede.id },
    });
    for (const [t, suf] of [[manana, 'M'], [noche, 'N']]) {
      await prisma.section.upsert({
        where: { classroomId_turnoId: { classroomId: classroom.id, turnoId: t.id } },
        update: {}, create: { name: `${s.name} - ${suf}`, classroomId: classroom.id, turnoId: t.id },
      });
    }
  }

  // ===== Áreas y Cursos =====
  const mat = await prisma.area.upsert({ where: { name: 'Matemáticas' }, update: {}, create: { name: 'Matemáticas' } });
  const hum = await prisma.area.upsert({ where: { name: 'Humanidades' }, update: {}, create: { name: 'Humanidades' } });
  const courses = {};
  for (const [name, area] of [['Álgebra', mat], ['Aritmética', mat], ['Geometría', mat], ['Historia', hum], ['Lenguaje', hum]]) {
    courses[name] = await prisma.course.upsert({
      where: { name_areaId: undefined, ...{} }, update: {},
      create: { name, areaId: area.id },
    }).catch(async () => {
      const existing = await prisma.course.findFirst({ where: { name, areaId: area.id } });
      return existing || prisma.course.create({ data: { name, areaId: area.id } });
    });
  }

  // ===== Período y Bloques =====
  const period = await prisma.period.upsert({
    where: { name: '2026' }, update: {}, create: { name: '2026', startDate: new Date('2026-03-02'), weeks: 12, isActive: true },
  });
  const b1 = await prisma.block.upsert({ where: { periodId_name: { periodId: period.id, name: 'Bloque 1' } }, update: {}, create: { periodId: period.id, name: 'Bloque 1', startWeek: 1, endWeek: 6 } });
  const b2 = await prisma.block.upsert({ where: { periodId_name: { periodId: period.id, name: 'Bloque 2' } }, update: {}, create: { periodId: period.id, name: 'Bloque 2', startWeek: 7, endWeek: 12 } });

  for (const [i, name] of Object.keys(courses).entries()) {
    const block = i < 3 ? b1 : b2;
    await prisma.blockCourse.upsert({
      where: { blockId_courseId: { blockId: block.id, courseId: courses[name].id } },
      update: {}, create: { blockId: block.id, courseId: courses[name].id },
    });
  }

  // ===== Docentes (Person + TeacherProfile) =====
  const teachers = [
    { firstName: 'Juan', lastName: 'Pérez', dni: '11111111', priority: 9, yearsExperience: 12 },
    { firstName: 'María', lastName: 'Gómez', dni: '22222222', priority: 7, yearsExperience: 8 },
    { firstName: 'Luis', lastName: 'Díaz', dni: '33333333', priority: 5 },
  ];
  for (const t of teachers) {
    const person = await prisma.person.upsert({
      where: { dni: t.dni }, update: {},
      create: { firstName: t.firstName, lastName: t.lastName, dni: t.dni },
    });
    await prisma.teacherProfile.upsert({
      where: { personId: person.id }, update: {},
      create: { personId: person.id, priority: t.priority || 5, yearsExperience: t.yearsExperience || null },
    });
  }

  // ===== Alumnos =====
  for (const [i, s] of [['Ana', 'Torres', '44444444'], ['Pedro', 'Ruiz', '55555555']].entries()) {
    await prisma.person.upsert({
      where: { dni: s[2] }, update: {},
      create: { firstName: s[0], lastName: s[1], dni: s[2] },
    });
  }

  console.log('✅ Seed completado');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());