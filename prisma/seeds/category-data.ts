import { PrismaClient, AnimalType } from '@prisma/client';

const prisma = new PrismaClient();

export const categories = [
  {
    key: 'dogs',
    name: 'สุนัข',
    icon: '🐕',
    description: 'สินค้าสำหรับสุนัขทุกสายพันธุ์ ทุกขนาด',
    animalType: AnimalType.DOG,
    isActive: true,
    sortOrder: 1
  },
  {
    key: 'cats',
    name: 'แมว',
    icon: '🐱',
    description: 'สินค้าสำหรับแมวทุกสายพันธุ์ ทุกขนาด',
    animalType: AnimalType.CAT,
    isActive: true,
    sortOrder: 2
  },
  {
    key: 'birds',
    name: 'นก',
    icon: '🐦',
    description: 'สินค้าสำหรับนกทุกชนิด นกแก้ว นกขับร้อง',
    animalType: AnimalType.BIRD,
    isActive: true,
    sortOrder: 3
  },
  {
    key: 'fish',
    name: 'ปลา',
    icon: '🐠',
    description: 'สินค้าสำหรับปลาสวยงาม ปลาเลี้ยง อุปกรณ์ตู้ปลา',
    animalType: AnimalType.FISH,
    isActive: true,
    sortOrder: 4
  },
  {
    key: 'rabbits',
    name: 'กระต่าย',
    icon: '🐰',
    description: 'สินค้าสำหรับกระต่ายทุกสายพันธุ์',
    animalType: AnimalType.RABBIT,
    isActive: true,
    sortOrder: 5
  },
  {
    key: 'hamsters',
    name: 'แฮมสเตอร์',
    icon: '🐹',
    description: 'สินค้าสำหรับแฮมสเตอร์และสัตว์เลี้ยงตัวเล็ก',
    animalType: AnimalType.HAMSTER,
    isActive: true,
    sortOrder: 6
  },
  {
    key: 'reptiles',
    name: 'สัตว์เลื้อยคลาน',
    icon: '🦎',
    description: 'สินค้าสำหรับเต่า อิกัวนา งู และสัตว์เลื้อยคลาน',
    animalType: AnimalType.REPTILE,
    isActive: true,
    sortOrder: 7
  },
  {
    key: 'small-pets',
    name: 'สัตว์เลี้ยงตัวเล็ก',
    icon: '🐾',
    description: 'สินค้าสำหรับสัตว์เลี้ยงตัวเล็กอื่นๆ',
    animalType: AnimalType.SMALL_PET,
    isActive: true,
    sortOrder: 8
  },
  {
    key: 'accessories',
    name: 'ของใช้อื่นๆ',
    icon: '🎾',
    description: 'อุปกรณ์และของใช้สำหรับสัตว์เลี้ยงทั่วไป',
    animalType: AnimalType.GENERAL,
    isActive: true,
    sortOrder: 9
  }
];

export async function seedCategories() {
  console.log('🌱 เริ่มต้น seed categories...');

  try {
    // ลบ categories เก่า (ถ้ามี)
    await prisma.category.deleteMany({});
    console.log('🗑️ ลบ categories เก่าเรียบร้อย');

    // เพิ่ม categories ใหม่
    for (const category of categories) {
      await prisma.category.create({
        data: category
      });
      console.log(`✅ เพิ่ม category: ${category.name}`);
    }

    console.log('🎉 Seed categories เสร็จสิ้น!');
    console.log(`📊 เพิ่มทั้งหมด ${categories.length} categories`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการ seed categories:', error);
    throw error;
  }
}

// ถ้ารันไฟล์นี้โดยตรง
if (require.main === module) {
  seedCategories()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
