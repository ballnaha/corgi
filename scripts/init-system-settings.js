const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function initializeSystemSettings() {
  console.log("Initializing system settings...");

  const settings = [
    {
      key: "deposit.min_amount",
      value: "10000",
      type: "number",
      category: "payment",
      description: "จำนวนเงินขั้นต่ำสำหรับการจ่ายมัดจำ (บาท)"
    },
    {
      key: "deposit.percentage",
      value: "10",
      type: "number", 
      category: "payment",
      description: "เปอร์เซ็นต์การจ่ายมัดจำ (%)"
    },
    {
      key: "deposit.enabled",
      value: "true",
      type: "boolean",
      category: "payment",
      description: "เปิด/ปิดระบบการจ่ายมัดจำ"
    }
  ];

  for (const setting of settings) {
    try {
      // ตรวจสอบว่ามี setting นี้อยู่แล้วหรือไม่
      const existing = await prisma.systemSetting.findUnique({
        where: { key: setting.key }
      });

      if (!existing) {
        await prisma.systemSetting.create({
          data: setting,
        });
        console.log(`✅ Created system setting: ${setting.key} = ${setting.value}`);
      } else {
        console.log(`⚠️  Setting already exists: ${setting.key} = ${existing.value}`);
      }
    } catch (error) {
      console.error(`❌ Error creating setting ${setting.key}:`, error);
    }
  }

  console.log("✅ System settings initialization completed!");
}

if (require.main === module) {
  initializeSystemSettings()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = initializeSystemSettings;