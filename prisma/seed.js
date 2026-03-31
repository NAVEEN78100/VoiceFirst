// VoiceFirst Auth Module - Database Seed Script
// Usage: node prisma/seed.js
// This script is idempotent — safe to run multiple times.

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter, log: ['error'] });

const SALT_ROUNDS = 12;

const seedUsers = [
  {
    email: 'admin@voicefirst.com',
    password: 'Admin@123!',
    role: 'ADMIN',
    branchId: null,
  },
  {
    email: 'manager@voicefirst.com',
    password: 'Manager@123!',
    role: 'MANAGER',
    branchId: 'branch-001',
  },
  {
    email: 'staff@voicefirst.com',
    password: 'Staff@123!',
    role: 'STAFF',
    branchId: 'branch-001',
  },
  {
    email: 'cx@voicefirst.com',
    password: 'CxUser@123!',
    role: 'CX',
    branchId: null,
  },
];

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Insert base branches
  const mainBranch = await prisma.branch.upsert({
    where: { id: 'branch-001' },
    update: {},
    create: {
      id: 'branch-001',
      name: 'Central HQ VoiceFirst',
      code: 'HQ-V1',
      location: 'Central Plaza',
      isActive: true,
    },
  });

  const secondaryBranch = await prisma.branch.upsert({
    where: { id: 'branch-002' },
    update: {},
    create: {
      id: 'branch-002',
      name: 'Northside Operations',
      code: 'NS-V2',
      location: 'Northside Campus',
      isActive: true,
    },
  });

  console.log(`✅ Base branches verified`);

  for (const userData of seedUsers) {
    const normalizedEmail = userData.email.toLowerCase().trim();

    // Check if user already exists (idempotent)
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      console.log(`⏭️  User already exists: ${normalizedEmail} (${existing.role})`);
      continue;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        role: userData.role,
        branchId: userData.branchId,
      },
    });

    console.log(`✅ Created user: ${user.email} | Role: ${user.role} | Branch: ${user.branchId || 'N/A'}`);
  }

  // Find staff user for touchpoint linking
  const staffUser = await prisma.user.findFirst({
    where: { role: 'STAFF' }
  });

  // Create/Upsert Test Touchpoint for HQ
  const hqTouchpoint = await prisma.touchpoint.upsert({
    where: { token: 'HQ-V1' },
    update: { staffId: staffUser.id },
    create: {
      name: 'Central Reception',
      token: 'HQ-V1',
      branchId: mainBranch.id,
      staffId: staffUser.id,
      type: 'STAFF'
    }
  });

  console.log(`\n✅ Created central touchpoint (HQ-V1) linked to staff ${staffUser.email}`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Default credentials:');
  console.log('─'.repeat(50));
  seedUsers.forEach((u) => {
    console.log(`  ${u.role.padEnd(10)} → ${u.email} / ${u.password}`);
  });
  console.log('─'.repeat(50));
  console.log('\n⚠️  Change these passwords in production!\n');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
