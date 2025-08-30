import { PrismaClient, ProductType, AnimalType } from '@prisma/client';

const prisma = new PrismaClient();

export const products = [
  // สุนัข
  {
    name: 'อาหารสุนัขโต Royal Canin Adult',
    description: 'อาหารสำหรับสุนัขโตวัย 1-7 ปี สูตรบำรุงระบบย่อย เสริมภูมิคุ้มกัน',
    price: 450.00,
    imageUrl: '/images/products/dog-food-royal-canin.jpg',
    category: 'dogs',
    stock: 50,
    productType: 'FOOD' as ProductType,
    animalType: 'DOG' as AnimalType,
    size: 'MEDIUM',
    weight_grams: 1500,
    dimensions: '25x15x8',
    material: 'อาหารแห้ง',
    brand: 'Royal Canin'
  },
  {
    name: 'ลูกบอลเล่นสุนัข Kong Classic',
    description: 'ลูกบอลยางธรรมชาติ ทนทาน สำหรับฝึกสุนัขและออกกำลังกาย',
    price: 280.00,
    imageUrl: '/images/products/kong-ball.jpg',
    category: 'dogs',
    stock: 30,
    productType: 'TOY' as ProductType,
    animalType: 'DOG' as AnimalType,
    size: 'MEDIUM',
    weight_grams: 200,
    dimensions: '8x8x8',
    material: 'ยางธรรมชาติ',
    brand: 'Kong'
  },
  {
    name: 'ปลอกคอสุนัขหนังแท้',
    description: 'ปลอกคอหนังแท้ นุ่ม ทนทาน ปรับขนาดได้ มีป้ายชื่อฟรี',
    price: 320.00,
    imageUrl: '/images/products/leather-collar.jpg',
    category: 'dogs',
    stock: 25,
    productType: 'ACCESSORY' as ProductType,
    animalType: 'DOG' as AnimalType,
    size: 'ADJUSTABLE',
    weight_grams: 100,
    dimensions: '40x2x0.5',
    material: 'หนังแท้'
  },

  // แมว
  {
    name: 'อาหารแมว Whiskas Adult ปลาทูน่า',
    description: 'อาหารเปียกสำหรับแมวโต รสปลาทูน่า อุดมด้วยโปรตีนและวิตามิน',
    price: 35.00,
    imageUrl: '/images/products/whiskas-tuna.jpg',
    category: 'cats',
    stock: 100,
    productType: 'FOOD' as ProductType,
    animalType: 'CAT' as AnimalType,
    size: 'SMALL',
    weight_grams: 85,
    dimensions: '10x7x3',
    material: 'อาหารเปียก',
    brand: 'Whiskas'
  },
  {
    name: 'ทรายแมว Catsan Ultra Plus',
    description: 'ทรายแมวเบนโทไนต์ จับกลิ่นดี ฝุ่นน้อย ใช้ได้นาน',
    price: 185.00,
    imageUrl: '/images/products/catsan-litter.jpg',
    category: 'cats',
    stock: 40,
    productType: 'ACCESSORY' as ProductType,
    animalType: 'CAT' as AnimalType,
    size: 'LARGE',
    weight_grams: 5000,
    dimensions: '35x25x15',
    material: 'เบนโทไนต์',
    brand: 'Catsan'
  },
  {
    name: 'บ้านแมวไม้ 3 ชั้น',
    description: 'บ้านแมวไม้สน 3 ชั้น มีเสาลับเล็บ ห้องนอน และที่เล่น',
    price: 2450.00,
    imageUrl: '/images/products/cat-tree-3level.jpg',
    category: 'cats',
    stock: 8,
    productType: 'HOUSING' as ProductType,
    animalType: 'CAT' as AnimalType,
    size: 'LARGE',
    weight_grams: 15000,
    dimensions: '60x40x120',
    material: 'ไม้สน'
  },

  // นก
  {
    name: 'อาหารนกแก้ว Versele-Laga',
    description: 'อาหารเม็ดสำหรับนกแก้วขนาดกลาง มีวิตามินครบถ้วน',
    price: 340.00,
    imageUrl: '/images/products/parrot-food.jpg',
    category: 'birds',
    stock: 20,
    productType: 'FOOD' as ProductType,
    animalType: 'BIRD' as AnimalType,
    breed: 'PARROT',
    size: 'MEDIUM',
    weight_grams: 1000,
    dimensions: '20x15x5',
    material: 'เม็ดอาหาร',
    brand: 'Versele-Laga'
  },
  {
    name: 'กรงนกแก้วสแตนเลส',
    description: 'กรงนกขนาดใหญ่ ทำจากสแตนเลส ทนทาน มีล้อเลื่อน',
    price: 3200.00,
    imageUrl: '/images/products/bird-cage-large.jpg',
    category: 'birds',
    stock: 5,
    productType: 'HOUSING' as ProductType,
    animalType: 'BIRD' as AnimalType,
    breed: 'PARROT',
    size: 'LARGE',
    weight_grams: 8500,
    dimensions: '80x60x120',
    material: 'สแตนเลส'
  },

  // ปลา
  {
    name: 'อาหารปลาสวยงาม Tetra ColorBits',
    description: 'อาหารเม็ดเพื่อเสริมสีสำหรับปลาสวยงาม ทำให้สีสันสดใส',
    price: 125.00,
    imageUrl: '/images/products/tetra-colorbits.jpg',
    category: 'fish',
    stock: 60,
    productType: 'FOOD' as ProductType,
    animalType: 'FISH' as AnimalType,
    size: 'SMALL',
    weight_grams: 300,
    dimensions: '12x8x15',
    material: 'เม็ดอาหาร',
    brand: 'Tetra'
  },
  {
    name: 'ตู้ปลา 2 ฟุต พร้อมไฟ LED',
    description: 'ตู้ปลากระจกใส ขนาด 2 ฟุต พร้อมไฟ LED และระบบกรองในตัว',
    price: 1850.00,
    imageUrl: '/images/products/aquarium-2ft.jpg',
    category: 'fish',
    stock: 12,
    productType: 'HOUSING' as ProductType,
    animalType: 'FISH' as AnimalType,
    size: 'MEDIUM',
    weight_grams: 12000,
    dimensions: '60x30x35',
    material: 'กระจก'
  },

  // กระต่าย
  {
    name: 'อาหารเม็ดกระต่าย Oxbow Adult',
    description: 'อาหารเม็ดคุณภาพสูงสำหรับกระต่ายโต มีไฟเบอร์สูง',
    price: 280.00,
    imageUrl: '/images/products/oxbow-rabbit.jpg',
    category: 'rabbits',
    stock: 35,
    productType: 'FOOD' as ProductType,
    animalType: 'RABBIT' as AnimalType,
    size: 'MEDIUM',
    weight_grams: 1000,
    dimensions: '25x18x8',
    material: 'เม็ดอาหาร',
    brand: 'Oxbow'
  },

  // แฮมสเตอร์
  {
    name: 'บ้านแฮมสเตอร์ 2 ชั้น',
    description: 'บ้านแฮมสเตอร์พลาสติก 2 ชั้น มีท่อเชื่อม ล้อวิ่ง และที่ใส่อาหาร',
    price: 680.00,
    imageUrl: '/images/products/hamster-house-2level.jpg',
    category: 'hamsters',
    stock: 15,
    productType: 'HOUSING' as ProductType,
    animalType: 'HAMSTER' as AnimalType,
    size: 'MEDIUM',
    weight_grams: 2500,
    dimensions: '40x30x35',
    material: 'พลาสติก'
  },

  // สัตว์เลื้อยคลาน
  {
    name: 'หลอดไฟ UVB สำหรับเต่า',
    description: 'หลอดไฟ UVB 10.0 สำหรับเต่าบกและสัตว์เลื้อยคลาน ช่วยสังเคราะห์วิตามิน D3',
    price: 450.00,
    imageUrl: '/images/products/uvb-lamp.jpg',
    category: 'reptiles',
    stock: 18,
    productType: 'ACCESSORY' as ProductType,
    animalType: 'REPTILE' as AnimalType,
    breed: 'TURTLE',
    size: 'MEDIUM',
    weight_grams: 300,
    dimensions: '45x3x3',
    material: 'แก้ว'
  }
];

export async function seedProducts() {
  console.log('🌱 เริ่มต้น seed products...');

  try {
    // ตรวจสอบว่ามี categories อยู่หรือไม่
    const categoryCount = await prisma.category.count();
    if (categoryCount === 0) {
      throw new Error('ไม่พบ categories กรุณารัน seed categories ก่อน');
    }

    // ลบ products เก่า (ถ้ามี)
    await prisma.product.deleteMany({});
    console.log('🗑️ ลบ products เก่าเรียบร้อย');

    // เพิ่ม products ใหม่
    let addedCount = 0;
    for (const product of products) {
      // ตรวจสอบว่า category มีอยู่จริง
      const categoryExists = await prisma.category.findUnique({
        where: { key: product.category }
      });

      if (categoryExists) {
        await prisma.product.create({
          data: {
            ...product,
            categoryId: categoryExists.id
          }
        });
        console.log(`✅ เพิ่ม product: ${product.name}`);
        addedCount++;
      } else {
        console.log(`⚠️ ข้าม product: ${product.name} (ไม่พบ category: ${product.category})`);
      }
    }

    console.log('🎉 Seed products เสร็จสิ้น!');
    console.log(`📊 เพิ่มทั้งหมด ${addedCount} products`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการ seed products:', error);
    throw error;
  }
}

// ถ้ารันไฟล์นี้โดยตรง
if (require.main === module) {
  seedProducts()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}