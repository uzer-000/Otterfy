import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcryptjs.hash('otterfy2024', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@otterfy.co.mz' },
    update: {},
    create: {
      email: 'admin@otterfy.co.mz',
      name: 'Admin',
      passwordHash,
    },
  });

  const product1 = await prisma.product.upsert({
    where: { id: 'seed-prod-1' },
    update: {},
    create: {
      id: 'seed-prod-1',
      name: 'Curso de Marketing Digital',
      description: 'Curso completo sobre marketing digital.',
      price: 1500.00,
      userId: admin.id,
    },
  });

  const product2 = await prisma.product.upsert({
    where: { id: 'seed-prod-2' },
    update: {},
    create: {
      id: 'seed-prod-2',
      name: 'Template para Loja Online',
      description: 'Template moderno para loja virtual.',
      price: 750.00,
      userId: admin.id,
    },
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
