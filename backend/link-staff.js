const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const staff = await prisma.user.findFirst({ where: { email: 'staff@voicefirst.com' } });
  if (!staff) { console.error("No staff found"); return; }
  
  const tp = await prisma.touchpoint.updateMany({
    where: { token: 'HQ-V1' },
    data: { staffId: staff.id }
  });
  
  console.log(`Updated ${tp.count} touchpoints to staff ${staff.id}`);
  await prisma.$disconnect();
}

fix();
