// Script to create a test admin user
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function createTestAdmin() {
  try {
    const testAdmin = await prisma.user.create({
      data: {
        lineUserId: 'test-admin-line-id',
        displayName: 'Test Admin',
        pictureUrl: null,
        email: 'admin@test.com',
        phoneNumber: '081-234-5678',
        statusMessage: 'System Administrator',
        role: 'ADMIN',
        isAdmin: true
      }
    });

    console.log('✅ Test admin user created successfully!');
    console.log('📋 Admin Details:');
    console.log(`   ID: ${testAdmin.id}`);
    console.log(`   LINE ID: ${testAdmin.lineUserId}`);
    console.log(`   Name: ${testAdmin.displayName}`);
    console.log(`   Role: ${testAdmin.role}`);
    console.log(`   Is Admin: ${testAdmin.isAdmin}`);
    console.log(`   Email: ${testAdmin.email}`);

    console.log('\n🔧 To test admin access:');
    console.log('1. Update your LINE provider in auth.ts to accept this test user');
    console.log('2. Or modify the lineUserId to match your actual LINE account');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Test admin user already exists');
      
      // Try to update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { lineUserId: 'test-admin-line-id' },
        data: { role: 'ADMIN', isAdmin: true }
      });
      
      console.log('✅ Updated existing user to admin');
      console.log(`   Name: ${updatedUser.displayName}`);
      console.log(`   Role: ${updatedUser.role}`);
      console.log(`   Is Admin: ${updatedUser.isAdmin}`);
    } else {
      console.error('❌ Error creating test admin:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestAdmin();
