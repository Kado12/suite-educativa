const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const SESSION_HOURS = 3;
const addDays = (d, days) => { const r = new Date(d); r.setUTCDate(r.getUTCDate() + days); return r; };
const hash = (pw) => bcrypt.hash(pw, 10);

async function upsertUser({ email, password, firstName, lastName, role }) {
  const passwordHash = await hash(password);
  await prisma.user.upsert({
    where: { email }, update: { firstName, lastName, role, passwordHash, isActive: true },
    create: { email, passwordHash, firstName, lastName, role, isActive: true },
  });
}

async function main() {
  console.log('🌱 Seed completo suite-educativa...');

  // ===== USUARIOS =====
  console.log('  👤 Usuarios...');
  await upsertUser({ email: 'admin@suite.edu', password: 'Admin2026!', firstName: 'Admin', lastName: 'General', role: Role.ADMIN });
  await upsertUser({ email: 'informatica@suite.edu', password: 'Info2026!', firstName: 'Área', lastName: 'Informática', role: Role.INFORMATICO });
  await upsertUser({ email: 'coordinador@suite.edu', password: 'Coord2026!', firstName: 'Laura', lastName: 'Coordinadora', role: Role.COORDINADOR });
  await upsertUser({ email: 'secretaria@suite.edu', password: 'Secre2026!', firstName: 'María', lastName: 'Secretaria', role: Role.SECRETARIA });

  // ===== SEDES =====
  console.log('  🏫 Sedes...');
  const sedeCentral = await prisma.sede.upsert({ where: { name: 'Sede Central' }, update: {}, create: { name: 'Sede Central' } });
  const sedeNorte = await prisma.sede.upsert({ where: { name: 'Sede Norte' }, update: {}, create: { name: 'Sede Norte' } });

  // ===== TURNOS =====
  console.log('  ⏰ Turnos...');
  const manana = await prisma.turno.upsert({ where: { name: 'Mañana' }, update: {}, create: { name: 'Mañana', slot1Start: '08:00', slot1End: '11:00', slot2Start: '11:00', slot2End: '14:00' } });
  const tarde = await prisma.turno.upsert({ where: { name: 'Tarde' }, update: {}, create: { name: 'Tarde', slot1Start: '14:00', slot1End: '17:00', slot2Start: '17:00', slot2End: '20:00' } });
  const noche = await prisma.turno.upsert({ where: { name: 'Noche' }, update: {}, create: { name: 'Noche', slot1Start: '18:00', slot1End: '21:00', slot2Start: '21:00', slot2End: '22:00' } });

  // ===== SALONES + SECCIONES =====
  console.log('  🚪 Salones y secciones...');
  const salones = [
    { name: 'A11', sede: sedeCentral }, { name: 'A12', sede: sedeCentral }, { name: 'B11', sede: sedeCentral },
    { name: 'C11', sede: sedeNorte }, { name: 'C12', sede: sedeNorte },
  ];
  const sections = [];
  for (const s of salones) {
    const classroom = await prisma.classroom.upsert({
      where: { name_sedeId: { name: s.name, sedeId: s.sede.id } }, update: {}, create: { name: s.name, sedeId: s.sede.id },
    });
    const turnosSede = s.sede.id === sedeCentral.id ? [manana, tarde] : [manana, noche];
    for (const t of turnosSede) {
      const sec = await prisma.section.upsert({
        where: { classroomId_turnoId: { classroomId: classroom.id, turnoId: t.id } },
        update: {}, create: { name: `${s.name} - ${t.name.charAt(0)}`, classroomId: classroom.id, turnoId: t.id, capacity: 25, enrollmentPriority: 0 },
      });
      sections.push(sec);
    }
  }

  // ===== ÁREAS Y CURSOS =====
  console.log('  📚 Áreas y cursos...');
  const areas = {};
  for (const name of ['Matemáticas', 'Ciencias', 'Letras', 'Inglés']) {
    areas[name] = await prisma.area.upsert({ where: { name }, update: {}, create: { name } });
  }
  const courseNames = {
    'Matemáticas': ['Álgebra', 'Aritmética', 'Geometría'],
    'Ciencias': ['Física', 'Química', 'Biología'],
    'Letras': ['Lenguaje', 'Literatura'],
    'Inglés': ['English I', 'English II'],
  };
  const courses = {};
  for (const [areaName, names] of Object.entries(courseNames)) {
    for (const n of names) {
      const existing = await prisma.course.findFirst({ where: { name: n, areaId: areas[areaName].id } });
      courses[n] = existing || await prisma.course.create({ data: { name: n, areaId: areas[areaName].id } });
    }
  }

  // ===== PERÍODO Y BLOQUES =====
  console.log('  📅 Período y bloques...');
  // Inicio en el lunes más cercano pasado o igual a hoy (para pruebas realistas)
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - today.getUTCDay() + 1);
  start.setUTCHours(0, 0, 0, 0);
  if (start > today) start.setUTCDate(start.getUTCDate() - 7);

  const periodName = `Semestre ${today.getFullYear()}-II`;
  let period = await prisma.period.findUnique({ where: { name: periodName } });
  if (!period) period = await prisma.period.create({ data: { name: periodName, startDate: start, weeks: 12, isActive: true } });

  const b1 = await prisma.block.upsert({ where: { periodId_name: { periodId: period.id, name: 'Bloque 1' } }, update: {}, create: { periodId: period.id, name: 'Bloque 1', startWeek: 1, endWeek: 6 } });
  const b2 = await prisma.block.upsert({ where: { periodId_name: { periodId: period.id, name: 'Bloque 2' } }, update: {}, create: { periodId: period.id, name: 'Bloque 2', startWeek: 7, endWeek: 12 } });

  // Asignar cursos al Bloque 1 (10 cursos)
  const courseList = Object.values(courses).slice(0, 10);
  for (const c of courseList) {
    await prisma.blockCourse.upsert({ where: { blockId_courseId: { blockId: b1.id, courseId: c.id } }, update: {}, create: { blockId: b1.id, courseId: c.id } });
  }

  // ===== PLANES DE PAGO =====
  console.log('  💰 Planes de pago...');
  const planMensual = await prisma.paymentPlan.upsert({ where: { name: 'Mensual regular' }, update: {}, create: { name: 'Mensual regular', installments: 6, amount: 600, isActive: true } });
  const planBeca = await prisma.paymentPlan.upsert({ where: { name: 'Beca 50%' }, update: {}, create: { name: 'Beca 50%', installments: 6, amount: 300, isActive: true } });
  await prisma.paymentPlan.upsert({ where: { name: 'Contado' }, update: {}, create: { name: 'Contado', installments: 1, amount: 550, isActive: true } });

  // ===== DOCENTES =====
  console.log('  👨‍🏫 Docentes...');
  const teachersData = [
    { f: 'Juan', l: 'Pérez', dni: '11111111', priority: 9, yrs: 15, courses: ['Álgebra', 'Aritmética'], turnos: [manana, tarde], sedes: [sedeCentral] },
    { f: 'María', l: 'Gómez', dni: '22222222', priority: 8, yrs: 10, courses: ['Geometría', 'Física'], turnos: [manana], sedes: [sedeCentral, sedeNorte] },
    { f: 'Luis', l: 'Díaz', dni: '33333333', priority: 7, yrs: 8, courses: ['Química', 'Biología'], turnos: [manana, tarde], sedes: [sedeCentral] },
    { f: 'Ana', l: 'Torres', dni: '44444444', priority: 6, yrs: 5, courses: ['Lenguaje', 'Literatura'], turnos: [manana, tarde, noche], sedes: [sedeCentral, sedeNorte] },
    { f: 'Pedro', l: 'Ruiz', dni: '55555555', priority: 7, yrs: 12, courses: ['English I', 'English II'], turnos: [noche], sedes: [sedeNorte] },
    { f: 'Lucía', l: 'Vega', dni: '66666666', priority: 5, yrs: 3, courses: ['Aritmética', 'Álgebra'], turnos: [tarde, noche], sedes: [sedeCentral] },
    { f: 'Jorge', l: 'Castro', dni: '77777777', priority: 8, yrs: 14, courses: ['Física', 'Geometría'], turnos: [manana, tarde], sedes: [sedeCentral] },
    { f: 'Rosa', l: 'Mendoza', dni: '88888888', priority: 6, yrs: 7, courses: ['Biología', 'Química'], turnos: [manana], sedes: [sedeCentral] },
  ];

  const teachers = [];
  for (const t of teachersData) {
    const person = await prisma.person.upsert({
      where: { dni: t.dni }, update: { firstName: t.f, lastName: t.l },
      create: { firstName: t.f, lastName: t.l, dni: t.dni, phone: '999' + t.dni.slice(-6), email: `${t.f.toLowerCase()}.${t.l.toLowerCase()}@suite.edu` },
    });
    const profile = await prisma.teacherProfile.upsert({
      where: { personId: person.id }, update: { priority: t.priority, yearsExperience: t.yrs, maxSessionsPerWeek: 20 },
      create: { personId: person.id, priority: t.priority, yearsExperience: t.yrs, maxSessionsPerWeek: 20 },
    });
    // Asignar cursos
    for (const cn of t.courses) {
      const c = courses[cn];
      if (c) await prisma.teacherCourse.upsert({ where: { teacherProfileId_courseId: { teacherProfileId: profile.id, courseId: c.id } }, update: {}, create: { teacherProfileId: profile.id, courseId: c.id } });
    }
    // Asignar turnos
    for (const tr of t.turnos) {
      await prisma.teacherTurno.upsert({ where: { teacherProfileId_turnoId: { teacherProfileId: profile.id, turnoId: tr.id } }, update: {}, create: { teacherProfileId: profile.id, turnoId: tr.id } });
    }
    // Asignar sedes
    for (const s of t.sedes) {
      await prisma.teacherSede.upsert({ where: { teacherProfileId_sedeId: { teacherProfileId: profile.id, sedeId: s.id } }, update: {}, create: { teacherProfileId: profile.id, sedeId: s.id } });
    }
    teachers.push(profile);
  }

  // ===== ALUMNOS =====
  console.log('  🧑🎓 Alumnos...');
  const students = [];
  const alumnosData = [
    ['Andrea', 'Soto', '90000001'], ['Bruno', 'Rivas', '90000002'], ['Carmen', 'León', '90000003'],
    ['Diego', 'Paredes', '90000004'], ['Elena', 'Cruz', '90000005'], ['Felipe', 'Molina', '90000006'],
    ['Gabriela', 'Salas', '90000007'], ['Hugo', 'Vargas', '90000008'], ['Inés', 'Campos', '90000009'],
    ['Javier', 'Reyes', '90000010'], ['Karen', 'Silva', '90000011'], ['Leonardo', 'Paz', '90000012'],
    ['Mónica', 'Ortiz', '90000013'], ['Nicolás', 'Arias', '90000014'], ['Olivia', 'Vega', '90000015'],
    ['Paula', 'Dávila', '90000016'], ['Quino', 'Meza', '90000017'], ['Ricardo', 'Flores', '90000018'],
  ];
  for (const [f, l, dni] of alumnosData) {
    const p = await prisma.person.upsert({
      where: { dni }, update: { firstName: f, lastName: l },
      create: { firstName: f, lastName: l, dni },
    });
    students.push(p);
  }

  // ===== MATRÍCULAS Y PAGOS =====
  console.log('  🎓 Matrículas...');
  const usedSections = new Set();
  for (let i = 0; i < students.length; i++) {
    const section = sections[i % sections.length];
    if (usedSections.has(section.id) && Math.random() < 0.3) continue;
    usedSections.add(section.id);

    const existing = await prisma.enrollment.findFirst({
      where: { studentId: students[i].id, periodId: period.id, status: 'ACTIVE' },
    });
    if (existing) continue;

    const plan = i % 5 === 0 ? planBeca : planMensual;
    const enrollment = await prisma.enrollment.create({
      data: { studentId: students[i].id, sectionId: section.id, periodId: period.id, status: 'ACTIVE' },
    });
    const amount = Number(plan.amount) / plan.installments;
    for (let k = 0; k < plan.installments; k++) {
      const dueDate = new Date(period.startDate);
      dueDate.setUTCMonth(dueDate.getUTCMonth() + k);
      dueDate.setUTCDate(1);
      const paidDate = k <= 2 ? addDays(dueDate, Math.floor(Math.random() * 5)) : null;
      await prisma.payment.create({
        data: {
          enrollmentId: enrollment.id, paymentPlanId: plan.id, installment: k + 1,
          amount, dueDate,
          paidAmount: paidDate ? amount : null, paidDate,
          status: paidDate ? 'PAID' : (dueDate < today ? 'OVERDUE' : 'PENDING'),
        },
      });
    }
  }

  // ===== HORARIO: generar sesiones manuales en Bloque 1 =====
  console.log('  🗓️ Generando horario manual...');
  const existingSessions = await prisma.scheduleSession.count({ where: { blockId: b1.id } });
  if (existingSessions === 0) {
    const occupation = new Set();
    for (const section of sections.slice(0, 6)) {
      for (let d = 1; d <= 5; d++) {
        for (let slot = 1; slot <= 2; slot++) {
          const courseId = courseList[(d + slot) % courseList.length].id;
          const validTeachers = teachers.filter((tp) => {
            const hasCourse = courseList.some((c) => c.id === courseId);
            if (!hasCourse) return false;
            return true;
          });
          for (const t of validTeachers.slice(0, 3)) {
            const key = `${t.id}::${d}::${slot}`;
            if (occupation.has(key)) continue;
            const hasCourse = await prisma.teacherCourse.findFirst({ where: { teacherProfileId: t.id, courseId } });
            if (!hasCourse) continue;
            try {
              await prisma.scheduleSession.create({
                data: { sectionId: section.id, courseId, teacherProfileId: t.id, blockId: b1.id, dayOfWeek: d, slot },
              });
              occupation.add(key);
              break;
            } catch {}
          }
        }
      }
    }
  }

  // ===== ASISTENCIA: últimas 3 semanas =====
  console.log('  ✓ Registrando asistencia...');
  const sessionsB1 = await prisma.scheduleSession.findMany({ where: { blockId: b1.id } });
  const weeksBack = 3;
  for (let w = 0; w < weeksBack; w++) {
    for (let d = 0; d < 5; d++) {
      const date = addDays(today, -w * 7 + (d - today.getUTCDay() + 1));
      const dow = d + 1;
      const daySessions = sessionsB1.filter((s) => s.dayOfWeek === dow);
      for (const s of daySessions.slice(0, Math.max(3, Math.floor(daySessions.length * 0.7)))) {
        const status = Math.random() < 0.92 ? 'PRESENT' : 'ABSENT';
        const late = status === 'PRESENT' && Math.random() < 0.15 ? Math.floor(Math.random() * 20) + 5 : 0;
        await prisma.attendanceRecord.upsert({
          where: { sessionId_date: { sessionId: s.id, date } },
          update: {},
          create: { sessionId: s.id, date, status, lateMinutes: late },
        });
      }
    }
  }

  // ===== VALIDACIONES =====
  console.log('  ✅ Validando semanas pasadas...');
  const coord = await prisma.user.findFirst({ where: { role: 'COORDINADOR' } });
  if (coord) {
    for (let w = 1; w <= weeksBack; w++) {
      for (const t of teachers.slice(0, 4)) {
        await prisma.weekValidation.upsert({
          where: { teacherProfileId_periodId_weekNumber: { teacherProfileId: t.id, periodId: period.id, weekNumber: w } },
          update: {},
          create: { teacherProfileId: t.id, periodId: period.id, weekNumber: w, status: 'VALIDATED', validatedById: coord.id },
        });
      }
    }
  }

  console.log('');
  console.log('✅ Seed completo terminado');
  console.log('');
  console.log('👤 Usuarios de prueba:');
  console.log('   ADMIN       → admin@suite.edu / Admin2026!');
  console.log('   INFORMATICO → informatica@suite.edu / Info2026!');
  console.log('   COORDINADOR → coordinador@suite.edu / Coord2026!');
  console.log('   SECRETARIA  → secretaria@suite.edu / Secre2026!');
  console.log('');
  console.log('📊 Datos creados:');
  console.log(`   ${sections.length} secciones · ${courseList.length} cursos · ${teachers.length} docentes · ${students.length} alumnos`);
}

main().catch((e) => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());