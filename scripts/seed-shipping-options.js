const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedShippingOptions() {
  console.log("Seeding shipping options...");

  const shippingOptions = [
    // สำหรับสัตว์เลี้ยง - รับด้วยตัวเอง
    {
      name: "รับด้วยตัวเอง (สัตว์เลี้ยง)",
      description: "มารับสัตว์เลี้ยงด้วยตัวเองที่ร้าน - ตรวจสุขภาพก่อนรับมอบ",
      price: 0.00,
      estimatedDays: "ตามนัดหมาย",
      method: "pickup",
      forPetsOnly: true,
      isActive: true,
      sortOrder: 1,
    },
    
    // สำหรับของอื่นๆ - จัดส่งด่วน
    {
      name: "จัดส่งด่วน",
      description: "จัดส่งภายใน 1-2 วันทำการ (ไม่รวมสัตว์เลี้ยง)",
      price: 50.00,
      estimatedDays: "1-2 วันทำการ",
      method: "delivery",
      forPetsOnly: false,
      isActive: true,
      sortOrder: 2,
    },
    
    {
      name: "จัดส่งธรรมดา",
      description: "จัดส่งภายใน 3-5 วันทำการ (ไม่รวมสัตว์เลี้ยง)",
      price: 30.00,
      estimatedDays: "3-5 วันทำการ",
      method: "delivery",
      forPetsOnly: false,
      isActive: true,
      sortOrder: 3,
    },
    
    {
      name: "รับด้วยตัวเอง (อุปกรณ์)",
      description: "มารับสินค้าด้วยตัวเองที่ร้าน - ฟรีค่าจัดส่ง",
      price: 0.00,
      estimatedDays: "ตามนัดหมาย",
      method: "pickup",
      forPetsOnly: false,
      isActive: true,
      sortOrder: 4,
    },
  ];

  // ลบ shipping options เก่าออกก่อน (เพื่อให้ seed ใหม่ได้)
  await prisma.shippingOption.deleteMany({});

  for (const option of shippingOptions) {
    await prisma.shippingOption.create({
      data: option,
    });
    console.log(`Created shipping option: ${option.name}`);
  }

  console.log("Shipping options seeded successfully!");
}

if (require.main === module) {
  seedShippingOptions()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
