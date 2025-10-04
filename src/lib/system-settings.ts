import { prisma } from "./prisma";

/**
 * ดึงค่า system setting จาก database
 */
export async function getSystemSetting(key: string): Promise<string | null> {
  try {
    const settings = await prisma.$queryRaw<any[]>`
      SELECT value FROM system_settings WHERE \`key\` = ${key}
    `;
    return settings[0]?.value || null;
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error);
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
    // ตรวจสอบว่า key มีอยู่หรือไม่
    const existing = await prisma.$queryRaw<any[]>`
      SELECT id FROM system_settings WHERE \`key\` = ${key}
    `;

    if (existing.length > 0) {
      // อัปเดต
      await prisma.$executeRaw`
        UPDATE system_settings 
        SET value = ${value}, updated_at = NOW()
        WHERE \`key\` = ${key}
      `;
    } else {
      // สร้างใหม่
      await prisma.$executeRaw`
        INSERT INTO system_settings (\`key\`, value, type, category, is_active, created_at, updated_at)
        VALUES (${key}, ${value}, ${type}, ${category}, true, NOW(), NOW())
      `;
    }
    return true;
  } catch (error) {
    console.error(`Error updating system setting ${key}:`, error);
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
      await prisma.$executeRaw`
        INSERT INTO system_settings (\`key\`, value, type, category, description, is_active, created_at, updated_at)
        VALUES (${setting.key}, ${setting.value}, ${setting.type}, ${setting.category}, ${setting.description}, true, NOW(), NOW())
      `;
      console.log(`Created default system setting: ${setting.key}`);
    }
  }
}

/**
 * ดึงการตั้งค่าทั้งหมด
 */
export async function getAllSystemSettings() {
  try {
    const settings = await prisma.$queryRaw<any[]>`
      SELECT * FROM system_settings 
      ORDER BY category ASC, \`key\` ASC
    `;
    return settings;
  } catch (error) {
    console.error("Error fetching all system settings:", error);
    return [];
  }
}

/**
 * ดึงการตั้งค่าตาม category
 */
export async function getSystemSettingsByCategory(category: string) {
  try {
    const settings = await prisma.$queryRaw<any[]>`
      SELECT * FROM system_settings 
      WHERE category = ${category}
      ORDER BY \`key\` ASC
    `;
    return settings;
  } catch (error) {
    console.error(`Error fetching system settings for category ${category}:`, error);
    return [];
  }
}

/**
 * สร้างการตั้งค่าใหม่
 */
export async function createSystemSetting(key: string, value: string, type: string = "string", category: string = "general", description?: string) {
  try {
    const result = await prisma.$executeRaw`
      INSERT INTO system_settings (\`key\`, value, type, category, description, is_active, created_at, updated_at)
      VALUES (${key}, ${value}, ${type}, ${category}, ${description || null}, true, NOW(), NOW())
    `;
    
    // ดึงข้อมูลที่เพิ่งสร้าง
    const settings = await prisma.$queryRaw<any[]>`
      SELECT * FROM system_settings WHERE \`key\` = ${key}
    `;
    return settings[0];
  } catch (error) {
    console.error(`Error creating system setting ${key}:`, error);
    throw error;
  }
}