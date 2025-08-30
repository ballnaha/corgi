const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedShippingOptions() {
  console.log("Seeding shipping options...");

  const shippingOptions = [
    // สำหรับสัตว์เลี้ยง - รับด้วยตัวเอง
    {
      name: "ทางร้านจัดส่งด้วยตัวเอง (สัตว์เลี้ยง)",
      description: "ทางร้านจัดส่งด้วยตัวเอง",
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
      description: "จัดส่งภายใน 1-2 วันทำการ",
      price: 50.00,
      estimatedDays: "1-2 วันทำการ",
      method: "delivery",
      forPetsOnly: false,
      isActive: true,
      sortOrder: 2,
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
