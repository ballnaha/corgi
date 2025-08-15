// Script to promote a user to admin for testing
// Usage: node scripts/promote-admin.js [LINE_USER_ID]

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function promoteToAdmin(lineUserId) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { lineUserId },
      select: { id: true, displayName: true, role: true, isAdmin: true }
    });

    if (!user) {
      console.error(`❌ User with LINE ID "${lineUserId}" not found`);
      return;
    }

    console.log('👤 Current user info:');
    console.log(`   Name: ${user.displayName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Is Admin: ${user.isAdmin}`);

    if (user.isAdmin) {
      console.log('✅ User is already an admin');
      return;
    }

    // Promote to admin
    const updatedUser = await prisma.user.update({
      where: { lineUserId },
      data: {
        role: 'ADMIN',
        isAdmin: true
      }
    });

    console.log('\n🎉 Successfully promoted user to admin!');
    console.log(`   Updated Role: ${updatedUser.role}`);
    console.log(`   Updated Is Admin: ${updatedUser.isAdmin}`);
    
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function listAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        lineUserId: true,
        displayName: true,
        role: true,
        isAdmin: true,
        email: true,
        createdAt: true,
        lastLoginAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n👥 All users in the system:');
    console.log('=====================================');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName}`);
      console.log(`   LINE ID: ${user.lineUserId}`);
      console.log(`   Role: ${user.role} | Admin: ${user.isAdmin ? '✅' : '❌'}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   Last Login: ${user.lastLoginAt ? user.lastLoginAt.toLocaleDateString() : 'Never'}`);
      if (user.email) console.log(`   Email: ${user.email}`);
      console.log('---');
    });

    console.log(`\nTotal users: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const lineUserId = args[0];

  console.log('🔧 Admin Promotion Tool');
  console.log('=======================\n');

  if (!lineUserId) {
    console.log('📋 No LINE User ID provided. Listing all users...\n');
    await listAllUsers();
    console.log('\n💡 To promote a user to admin, run:');
    console.log('   node scripts/promote-admin.js [LINE_USER_ID]');
    return;
  }

  console.log(`🎯 Attempting to promote user: ${lineUserId}\n`);
  await promoteToAdmin(lineUserId);
}

main().catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
