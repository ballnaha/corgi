const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserIdMapping() {
  console.log('🔍 Checking user ID mapping issues...');
  
  try {
    // ค้นหา users ทั้งหมด
    const users = await prisma.user.findMany({
      select: {
        id: true,
        lineUserId: true,
        displayName: true,
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`   - ID: ${user.id}`);
      console.log(`     LINE ID: ${user.lineUserId}`);
      console.log(`     Name: ${user.displayName}`);
      console.log(`     Orders: ${user._count.orders}`);
      
      // ตรวจสอบว่า ID และ LINE ID เหมือนกันหรือไม่
      if (user.id === user.lineUserId) {
        console.log(`     ⚠️  ID และ LINE ID เหมือนกัน - อาจเป็นปัญหา`);
      } else {
        console.log(`     ✅ ID mapping ปกติ`);
      }
      console.log('');
    }
    
    // ค้นหา orders ทั้งหมดเพื่อดู userId pattern
    const orders = await prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        user: {
          select: {
            displayName: true,
            lineUserId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    console.log(`📦 Recent orders (${orders.length}):`);
    for (const order of orders) {
      console.log(`   - Order: ${order.orderNumber}`);
      console.log(`     User ID: ${order.userId}`);
      console.log(`     User Name: ${order.user?.displayName}`);
      console.log(`     LINE ID: ${order.user?.lineUserId}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// เรียกใช้ฟังก์ชัน
fixUserIdMapping()
  .then(() => {
    console.log('✅ User ID mapping check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
