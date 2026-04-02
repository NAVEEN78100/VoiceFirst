require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function test() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const branches = await prisma.branch.findMany();
    console.log('Available Branches:', branches.map(b => `${b.id} (${b.name})` || 'N/A'));

    if (branches.length === 0) {
      console.error('No branches found. Please seed first.');
      return;
    }

    const branch = branches.find(b => b.name.includes('CHENNAI')) || branches[0];
    console.log(`Using branch: ${branch.name} (${branch.id})`);

    const tp = await prisma.touchpoint.create({
      data: {
        name: 'DEBUG TP',
        type: 'BRANCH_DESK',
        branchId: branch.id,
        staffId: null
      }
    });
    console.log('✅ Touchpoint created successfully!', tp.id);
  } catch (error) {
    console.error('❌ Touchpoint Creation Error Details:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Meta:', error.meta);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
