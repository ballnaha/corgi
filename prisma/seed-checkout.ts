import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedCheckoutData() {
  // Create shipping options
  const shippingOptions = [
    {
      name: "จัดส่งมาตรฐาน",
      description: "จัดส่งทั่วไป",
      price: 50,
      estimatedDays: "3-5 วัน",
      sortOrder: 1,
    },
    {
      name: "จัดส่งด่วน",
      description: "จัดส่งด่วนพิเศษ",
      price: 100,
      estimatedDays: "1-2 วัน",
      sortOrder: 2,
    },
    {
      name: "จัดส่งในวันเดียวกัน",
      description: "สำหรับกรุงเทพและปริมณฑล",
      price: 200,
      estimatedDays: "ภายในวันนี้",
      sortOrder: 3,
    },
  ];

  for (const option of shippingOptions) {
    await prisma.shippingOption.create({
      data: option,
    });
  }

  // Create discount codes
  const discountCodes = [
    {
      code: "WELCOME10",
      type: "percentage",
      value: 10,
      minAmount: 500,
      description: "ลด 10% สำหรับยอดซื้อขั้นต่ำ 500 บาท",
    },
    {
      code: "SAVE50",
      type: "fixed",
      value: 50,
      minAmount: 300,
      description: "ลด 50 บาท สำหรับยอดซื้อขั้นต่ำ 300 บาท",
    },
    {
      code: "FREESHIP",
      type: "fixed",
      value: 0,
      description: "ฟรีค่าจัดส่ง",
    },
    {
      code: "NEWUSER",
      type: "percentage",
      value: 15,
      minAmount: 1000,
      description: "ลด 15% สำหรับสมาชิกใหม่ ยอดซื้อขั้นต่ำ 1,000 บาท",
    },
  ];

  for (const code of discountCodes) {
    await prisma.discountCode.upsert({
      where: { code: code.code },
      update: code,
      create: code,
    });
  }

  console.log("✅ Checkout data seeded successfully");
}

seedCheckoutData()
  .catch((e) => {
    console.error("❌ Error seeding checkout data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
