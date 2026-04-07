import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const branches = await prisma.branch.findMany({
    where: {
      OR: [
        { name: 'CHENNAI' },
        { code: 'CHENNAI-600001' }
      ]
    }
  });
  console.log('Branches found:', JSON.stringify(branches, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
