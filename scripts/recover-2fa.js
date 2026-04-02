require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function recover() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.update({
      where: { email: 'admin@voicefirst.com' },
      data: { 
        twoFactorEnabled: false, 
        twoFactorMethod: null, 
        totpSecret: null 
      }
    });
    console.log(`✅ SUCCESS: 2FA is now DISABLED for ${user.email}.`);
    console.log(`🔑 You can now log in using only your password: Admin@123!`);
  } catch (error) {
    console.error(`❌ FAILED: ${error.message}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

recover();
