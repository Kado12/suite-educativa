const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed mínimo (solo ADMIN)...');

  const passwordHash = await bcrypt.hash('Admin2026!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@suite.edu' },
    update: { firstName: 'Admin', lastName: 'General', role: Role.ADMIN, passwordHash, isActive: true },
    create: { email: 'admin@suite.edu', passwordHash, firstName: 'Admin', lastName: 'General', role: Role.ADMIN, isActive: true },
  });

  console.log('✅ Usuario ADMIN creado: admin@suite.edu / Admin2026!');
  console.log('');
  console.log('Para poblar con datos de prueba, ejecuta:');
  console.log('   node packages/database/seed-full.js');
}

main().catch((e) => { console.error('❌', e); process.exit(1); }).finally(() => prisma.$disconnect());