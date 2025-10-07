import { prisma } from "./prisma";

/**
 * ดึงค่า system setting จาก database
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting?.value || null;
  } catch (error) {
    console.error(`❌ Error fetching system setting ${key}:`, error);
    return null;
  }
}

/**
 * ดึงค่าเป็นตัวเลข
 */
export async function getSystemSettingNumber(key: string, defaultValue: number = 0): Promise<number> {
  const value = await getSystemSetting(key);
  if (!value) return defaultValue;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * ดึงค่าเป็น boolean
 */
export async function getSystemSettingBoolean(key: string, defaultValue: boolean = false): Promise<boolean> {
  const value = await getSystemSetting(key);
  if (!value) return defaultValue;
  
  return value.toLowerCase() === 'true';
}

/**
 * ดึงการตั้งค่าที่เกี่ยวข้องกับ deposit
 */
export async function getDepositSettings() {
  const [minAmount, percentage, enabled] = await Promise.all([
    getSystemSettingNumber("deposit.min_amount", 10000),
    getSystemSettingNumber("deposit.percentage", 10),
    getSystemSettingBoolean("deposit.enabled", true)
  ]);

  return {
    minAmount,
    percentage: percentage / 100, // แปลงเป็น decimal (10% -> 0.1)
    enabled
  };
}

/**
 * อัปเดตค่า system setting
 */
export async function updateSystemSetting(key: string, value: string, type: string = "string", category: string = "general"): Promise<boolean> {
  try {
    console.log(`📝 Updating system setting: ${key} = ${value} (type: ${type}, category: ${category})`);
    
    // ตรวจสอบว่า key มีอยู่หรือไม่
    const existing = await prisma.systemSetting.findUnique({
      where: { key },
    });

    if (existing) {
      // อัปเดต
      await prisma.systemSetting.update({
        where: { key },
        data: {
          value,
          type,
          category,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Updated system setting: ${key}`);
    } else {
      // สร้างใหม่
      await prisma.systemSetting.create({
        data: {
          key,
          value,
          type,
          category,
          isActive: true,
        },
      });
      console.log(`✅ Created system setting: ${key}`);
    }
    return true;
  } catch (error: any) {
    console.error(`❌ Error updating system setting ${key}:`, error);
    console.error(`❌ Error details:`, {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return false;
  }
}

/**
 * สร้างค่าเริ่มต้นสำหรับ deposit settings ถ้ายังไม่มี
 */
export async function initializeDepositSettings() {
  const defaultSettings = [
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

  for (const setting of defaultSettings) {
    const exists = await getSystemSetting(setting.key);
    if (!exists) {
      try {
        await prisma.systemSetting.create({
          data: {
            key: setting.key,
            value: setting.value,
            type: setting.type,
            category: setting.category,
            description: setting.description,
            isActive: true,
          },
        });
        console.log(`✅ Created default system setting: ${setting.key}`);
      } catch (error) {
        console.error(`❌ Error creating default setting ${setting.key}:`, error);
      }
    }
  }
}

/**
 * ดึงการตั้งค่าทั้งหมด
 */
export async function getAllSystemSettings() {
  try {
    const settings = await prisma.systemSetting.findMany({
      orderBy: [
        { category: 'asc' },
        { key: 'asc' },
      ],
    });
    return settings;
  } catch (error) {
    console.error("❌ Error fetching all system settings:", error);
    return [];
  }
}

/**
 * ดึงการตั้งค่าตาม category
 */
export async function getSystemSettingsByCategory(category: string) {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
    return settings;
  } catch (error) {
    console.error(`❌ Error fetching system settings for category ${category}:`, error);
    return [];
  }
}

/**
 * สร้างการตั้งค่าใหม่
 */
export async function createSystemSetting(key: string, value: string, type: string = "string", category: string = "general", description?: string) {
  try {
    console.log(`📝 Creating system setting: ${key} = ${value}`);
    
    const setting = await prisma.systemSetting.create({
      data: {
        key,
        value,
        type,
        category,
        description: description || null,
        isActive: true,
      },
    });
    
    console.log(`✅ Created system setting: ${key}`);
    return setting;
  } catch (error: any) {
    console.error(`❌ Error creating system setting ${key}:`, error);
    console.error(`❌ Error details:`, {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    throw error;
  }
}