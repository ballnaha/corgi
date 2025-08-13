const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDogs() {
  console.log('🐕 Adding new dog products...');

  const newDogs = [
    {
      name: 'คอร์กี้ผู้ชาย - พิเศษ',
      price: 25000.00,
      imageUrl: '/product/corgi-1.jpg',
      category: 'dogs',
      description: 'คอร์กี้ผู้ชายน่ารัก อายุ 3 เดือน มีใบรับรอง พร้อมวัคซีนครบ สุขภาพแข็งแรง นิสัยดี เหมาะกับครอบครัวที่มีเด็ก',
      stock: 2,
      gender: 'MALE',
      age: '3 เดือน',
      weight: '2.5 กก.',
      breed: 'คอร์กี้',
      color: 'น้ำตาล-ขาว',
      vaccinated: true,
      certified: true,
      location: 'กรุงเทพฯ',
      healthNote: 'สุขภาพแข็งแรง ตรวจสุขภาพครบถ้วน',
      contactInfo: 'โทร: 02-123-4567 หรือ Line: @petshop',
      images: [
        { imageUrl: '/product/corgi-1.jpg', order: 0, isMain: true, altText: 'คอร์กี้ผู้ชาย - รูปหลัก' },
        { imageUrl: '/product/corgi-2.jpg', order: 1, isMain: false, altText: 'คอร์กี้ผู้ชาย - รูปที่ 2' }
      ]
    },
    {
      name: 'คอร์กี้สาวน้อย',
      price: 23000.00,
      imageUrl: '/product/corgi-2.jpg',
      category: 'dogs',
      description: 'คอร์กี้ผู้หญิงน่ารัก อายุ 2.5 เดือน ขาสั้นน่ารัก หน้าตาหวาน นิสัยเล่นง่าย รักเด็ก',
      stock: 1,
      gender: 'FEMALE',
      age: '2.5 เดือน',
      weight: '2.2 กก.',
      breed: 'คอร์กี้',
      color: 'น้ำตาล-ขาว',
      vaccinated: true,
      certified: true,
      location: 'กรุงเทพฯ',
      healthNote: 'สุขภาพดีเยี่ยม ไม่มีโรคประจำตัว',
      contactInfo: 'โทร: 02-123-4567 หรือ Line: @petshop',
      images: [
        { imageUrl: '/product/corgi-2.jpg', order: 0, isMain: true, altText: 'คอร์กี้สาวน้อย - รูปหลัก' },
        { imageUrl: '/product/corgi-1.jpg', order: 1, isMain: false, altText: 'คอร์กี้สาวน้อย - รูปที่ 2' }
      ]
    }
  ];

  for (const dogData of newDogs) {
    try {
      // Check if product exists first
      const existingProduct = await prisma.product.findFirst({
        where: { name: dogData.name },
      });

      if (!existingProduct) {
        // Separate images from product data
        const { images, ...product } = dogData;
        
        // Create product with images
        const createdProduct = await prisma.product.create({
          data: {
            ...product,
            images: images ? {
              create: images.map(img => ({
                imageUrl: img.imageUrl,
                order: img.order,
                isMain: img.isMain,
                altText: img.altText || `${product.name} - รูปที่ ${img.order + 1}`
              }))
            } : undefined
          },
          include: {
            images: true
          }
        });
        console.log(`✅ Created dog: ${product.name} with ${images?.length || 0} images`);
      } else {
        console.log(`⏭️  Dog already exists: ${dogData.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating dog ${dogData.name}:`, error);
    }
  }

  console.log('🎉 Dog seeding completed!');
}

addDogs()
  .catch((e) => {
    console.error('❌ Dog seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });