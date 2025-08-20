const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTotalAmountStructure() {
  console.log('🚀 เริ่มการปรับปรุงโครงสร้าง totalAmount...');
  
  try {
    // 1. ดึงข้อมูล orders ทั้งหมดที่มี discountAmount > 0
    const ordersWithDiscount = await prisma.order.findMany({
      where: {
        discountAmount: {
          gt: 0
        }
      },
      select: {
        id: true,
        totalAmount: true,
        discountAmount: true,
        depositAmount: true,
        remainingAmount: true,
        requiresDeposit: true,
        orderNumber: true
      }
    });

    console.log(`📊 พบ ${ordersWithDiscount.length} orders ที่มีส่วนลด`);

    // 2. ปรับปรุงข้อมูลทีละ order
    for (const order of ordersWithDiscount) {
      const currentTotal = parseFloat(order.totalAmount.toString());
      const discount = parseFloat(order.discountAmount.toString());
      const newTotal = currentTotal - discount;
      
      let newDeposit = null;
      let newRemaining = null;
      
      if (order.requiresDeposit) {
        newDeposit = Math.round(newTotal * 0.1 * 100) / 100; // 10% rounded to 2 decimal places
        newRemaining = Math.round((newTotal - newDeposit) * 100) / 100;
      }

      console.log(`📝 Order ${order.orderNumber || order.id}:`);
      console.log(`   เก่า: total=${currentTotal}, discount=${discount}, deposit=${order.depositAmount}, remaining=${order.remainingAmount}`);
      console.log(`   ใหม่: total=${newTotal}, discount=${discount}, deposit=${newDeposit}, remaining=${newRemaining}`);

      // อัพเดทข้อมูล
      await prisma.order.update({
        where: { id: order.id },
        data: {
          totalAmount: newTotal,
          ...(order.requiresDeposit && {
            depositAmount: newDeposit,
            remainingAmount: newRemaining
          })
        }
      });
    }

    // 3. ตรวจสอบ orders ที่ไม่มีส่วนลดแต่มี deposit/remaining ไม่ถูกต้อง
    const ordersWithoutDiscount = await prisma.order.findMany({
      where: {
        requiresDeposit: true,
        OR: [
          { discountAmount: 0 },
          { discountAmount: null }
        ]
      },
      select: {
        id: true,
        totalAmount: true,
        depositAmount: true,
        remainingAmount: true,
        orderNumber: true
      }
    });

    console.log(`\n📊 ตรวจสอบ ${ordersWithoutDiscount.length} orders ที่ไม่มีส่วนลดแต่ต้องการ deposit`);

    for (const order of ordersWithoutDiscount) {
      const total = parseFloat(order.totalAmount.toString());
      const currentDeposit = order.depositAmount ? parseFloat(order.depositAmount.toString()) : 0;
      const currentRemaining = order.remainingAmount ? parseFloat(order.remainingAmount.toString()) : 0;
      
      const expectedDeposit = Math.round(total * 0.1 * 100) / 100;
      const expectedRemaining = Math.round((total - expectedDeposit) * 100) / 100;
      
      // ตรวจสอบว่าต้องอัพเดทหรือไม่
      const needsUpdate = Math.abs(currentDeposit - expectedDeposit) > 0.01 || 
                         Math.abs(currentRemaining - expectedRemaining) > 0.01;
      
      if (needsUpdate) {
        console.log(`📝 แก้ไข Order ${order.orderNumber || order.id}:`);
        console.log(`   เก่า: deposit=${currentDeposit}, remaining=${currentRemaining}`);
        console.log(`   ใหม่: deposit=${expectedDeposit}, remaining=${expectedRemaining}`);

        await prisma.order.update({
          where: { id: order.id },
          data: {
            depositAmount: expectedDeposit,
            remainingAmount: expectedRemaining
          }
        });
      }
    }

    // 4. สรุปผลการดำเนินการ
    const summary = await prisma.order.groupBy({
      by: ['requiresDeposit'],
      _count: {
        id: true
      },
      _avg: {
        totalAmount: true,
        depositAmount: true,
        remainingAmount: true
      }
    });

    console.log('\n✅ การปรับปรุงเสร็จสิ้น!');
    console.log('📊 สรุปผล:');
    summary.forEach(group => {
      console.log(`   ${group.requiresDeposit ? 'มี Deposit' : 'ไม่มี Deposit'}: ${group._count.id} orders`);
      console.log(`   - เฉลี่ย totalAmount: ฿${group._avg.totalAmount?.toFixed(2) || '0.00'}`);
      if (group.requiresDeposit) {
        console.log(`   - เฉลี่ย depositAmount: ฿${group._avg.depositAmount?.toFixed(2) || '0.00'}`);
        console.log(`   - เฉลี่ย remainingAmount: ฿${group._avg.remainingAmount?.toFixed(2) || '0.00'}`);
      }
    });

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// รัน script
if (require.main === module) {
  fixTotalAmountStructure()
    .then(() => {
      console.log('🎉 Migration เสร็จสิ้น!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration ล้มเหลว:', error);
      process.exit(1);
    });
}

module.exports = { fixTotalAmountStructure };
