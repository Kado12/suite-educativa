const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function upsertUser({ email, password, firstName, lastName, role }) {
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      firstName,
      lastName,
      role,
      isActive: true
    },
    create: {
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      isActive: true
    }
  });
}

async function main() {
  console.log('🌱 Seed suite educativa...');

  await upsertUser({
    email: 'admin@suite.edu',
    password: 'Admin2026!',
    firstName: 'Administrador',
    lastName: 'General',
    role: Role.ADMIN
  });

  await upsertUser({
    email: 'informatica@suite.edu',
    password: 'Info2026!',
    firstName: 'Área',
    lastName: 'Informática',
    role: Role.INFORMATICO
  });

  await upsertUser({
    email: 'coordinador@suite.edu',
    password: 'Coord2026!',
    firstName: 'Coordinador',
    lastName: 'Académico',
    role: Role.COORDINADOR
  });

  await upsertUser({
    email: 'secretaria@suite.edu',
    password: 'Secre2026!',
    firstName: 'Secretaría',
    lastName: 'Académica',
    role: Role.SECRETARIA
  });

  console.log('✅ Seed completado');
  console.log('');
  console.log('Usuarios iniciales:');
  console.log('ADMIN       -> admin@suite.edu / Admin2026!');
  console.log('INFORMATICO -> informatica@suite.edu / Info2026!');
  console.log('COORDINADOR -> coordinador@suite.edu / Coord2026!');
  console.log('SECRETARIA  -> secretaria@suite.edu / Secre2026!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });