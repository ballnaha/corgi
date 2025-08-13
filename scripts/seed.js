const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Seed categories first
  const categorySeeds = [
    { key: 'dogs', name: 'สุนัข', icon: '🐕', description: 'สุนัขพันธุ์ต่างๆ น่ารักและเป็นมิตร' },
    { key: 'cats', name: 'แมว', icon: '🐱', description: 'แมวน้อยน่ารัก เลี้ยงง่าย' },
    { key: 'birds', name: 'นก', icon: '🐦', description: 'นกสวยงาม เสียงใสไพเราะ' },
    { key: 'food', name: 'อาหาร', icon: '🍖', description: 'อาหารสัตว์คุณภาพดี มีครบทุกชนิด' },
    { key: 'toys', name: 'ของเล่น', icon: '🎾', description: 'ของเล่นสัตว์เลี้ยง สนุกสนาน' },
  ];

  const keyToCategoryId = {};
  for (const cat of categorySeeds) {
    const existing = await prisma.category.findUnique({ where: { key: cat.key } });
    const created = existing || await prisma.category.create({ data: cat });
    keyToCategoryId[cat.key] = created.id;
    console.log(`${existing ? '⏭️ ' : '✅'} Category ${cat.name}`);
  }

  // Seed products from your existing data
  const products = [
    // Dogs
    {
      name: 'คอร์กี้ผู้ชาย',
      price: 25000.00,
      discountPercent: 12.5,
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
        { imageUrl: '/product/corgi-1.jpg', order: 0, isMain: true },
        { imageUrl: '/product/corgi-2.jpg', order: 1, isMain: false },
        { imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop&crop=face', order: 2, isMain: false }
      ]
    },
    {
      name: 'คอร์กี้สาวน้อย',
      price: 23000.00,
      salePrice: 19900.00,
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
        { imageUrl: '/product/corgi-2.jpg', order: 0, isMain: true },
        { imageUrl: '/product/corgi-1.jpg', order: 1, isMain: false }
      ]
    },
    {
      name: 'โกลเด้น รีทรีฟเวอร์',
      price: 20000.00,
      discountPercent: 10.00,
      imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop&crop=face',
      category: 'dogs',
      description: 'โกลเด้น รีทรีฟเวอร์ สุขภาพดี ฉีดวัคซีนครบ อายุ 2 เดือน',
      stock: 1,
      gender: 'FEMALE',
      age: '2 เดือน',
      weight: '3.2 กก.',
      breed: 'โกลเด้น รีทรีฟเวอร์',
      color: 'ทอง',
      vaccinated: true,
      certified: true,
      location: 'นนทบุรี',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face', order: 0, isMain: true },
        { imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop&crop=face', order: 1, isMain: false }
      ]
    },
    {
      name: 'ชิบะ อินุ',
      price: 30000.00,
      salePrice: 27900.00,
      imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=300&h=300&fit=crop&crop=face',
      category: 'dogs',
      description: 'ชิบะ อินุ สายพันธุ์ญี่ปุ่น น่ารัก อายุ 4 เดือน',
      stock: 1,
      gender: 'MALE',
      age: '4 เดือน',
      weight: '4.1 กก.',
      breed: 'ชิบะ อินุ',
      color: 'แดง-ขาว',
      vaccinated: true,
      certified: true,
      location: 'ปทุมธานี',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop&crop=face', order: 0, isMain: true }
      ]
    },
    {
      name: 'ปอมเมอเรเนียน',
      price: 18000.00,
      discountPercent: 5.00,
      imageUrl: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=300&h=300&fit=crop&crop=face',
      category: 'dogs',
      description: 'ปอมเมอเรเนียน ขนฟู น่ารัก ขนาดเล็ก เหมาะกับคอนโด',
      stock: 3,
      gender: 'FEMALE',
      age: '5 เดือน',
      weight: '1.8 กก.',
      breed: 'ปอมเมอเรเนียน',
      color: 'ครีม',
      vaccinated: true,
      certified: false,
      location: 'กรุงเทพฯ',
      healthNote: 'สุขภาพดี ขนสวย',
      contactInfo: 'โทร: 02-987-6543',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=400&h=400&fit=crop&crop=face', order: 0, isMain: true }
      ]
    },
    {
      name: 'ลาบราดอร์ผู้ชาย',
      price: 22000.00,
      imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&h=300&fit=crop&crop=face',
      category: 'dogs',
      description: 'ลาบราดอร์ผู้ชาย สีทอง นิสัยดี ฉลาด เชื่อง เหมาะกับครอบครัว รักเด็ก เล่นน้ำเก่ง',
      stock: 1,
      gender: 'MALE',
      age: '4 เดือน',
      weight: '8.5 กก.',
      breed: 'ลาบราดอร์ รีทรีฟเวอร์',
      color: 'ทองอ่อน',
      vaccinated: true,
      certified: true,
      location: 'สมุทรปราการ',
      healthNote: 'สุขภาพแข็งแรง พ่อแม่พันธุ์ดี',
      contactInfo: 'โทร: 08-1234-5678 หรือ Line: @labradorlove',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=400&fit=crop&crop=face', order: 0, isMain: true },
        { imageUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=400&fit=crop&crop=face', order: 1, isMain: false }
      ]
    },

    // Cats
    {
      name: 'แมวเปอร์เซีย',
      price: 15000.00,
      imageUrl: 'https://images.unsplash.com/photo-1574231164645-d6f0e8553590?w=300&h=300&fit=crop&crop=face',
      category: 'cats',
      description: 'แมวเปอร์เซียขนยาว สีขาว น่ารักมาก อายุ 3 เดือน',
      stock: 3,
      gender: 'FEMALE',
      age: '3 เดือน',
      weight: '1.2 กก.',
      breed: 'เปอร์เซีย',
      color: 'ขาว',
      vaccinated: true,
      certified: true,
      location: 'กรุงเทพฯ',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1574231164645-d6f0e8553590?w=400&h=400&fit=crop&crop=face', order: 0, isMain: true }
      ]
    },
    {
      name: 'แมวสก็อตติช โฟลด์',
      price: 18000.00,
      imageUrl: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=300&h=300&fit=crop&crop=face',
      category: 'cats',
      description: 'แมวสก็อตติช โฟลด์ หูพับ น่ารักเป็นพิเศษ อายุ 2 เดือน',
      stock: 2,
      gender: 'MALE',
      age: '2 เดือน',
      weight: '0.8 กก.',
      breed: 'สก็อตติช โฟลด์',
      color: 'เทา-ขาว',
      vaccinated: true,
      certified: true,
      location: 'สมุทรปราการ',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1513245543132-31f507417b26?w=400&h=400&fit=crop&crop=face', order: 0, isMain: true }
      ]
    },
    {
      name: 'แมวรัสเซียน บลู',
      price: 22000.00,
      imageUrl: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=300&h=300&fit=crop&crop=face',
      category: 'cats',
      description: 'แมวรัสเซียน บลู ขนสีเทาสวย นิสัยดี อายุ 3 เดือน',
      stock: 1,
      gender: 'FEMALE',
      age: '3 เดือน',
      weight: '1.5 กก.',
      breed: 'รัสเซียน บลู',
      color: 'เทาเงิน',
      vaccinated: true,
      certified: true,
      location: 'ชลบุรี',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400&h=400&fit=crop&crop=face', order: 0, isMain: true }
      ]
    },
    {
      name: 'แมวเมนคูน',
      price: 25000.00,
      imageUrl: 'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=300&h=300&fit=crop&crop=face',
      category: 'cats',
      description: 'แมวเมนคูน ขนาดใหญ่ ขนยาวสวย นิสัยเป็นมิตร',
      stock: 1,
      gender: 'MALE',
      age: '6 เดือน',
      weight: '3.8 กก.',
      breed: 'เมนคูน',
      color: 'น้ำตาล-ขาว',
      vaccinated: true,
      certified: true,
      location: 'ระยอง',
      images: [
        { imageUrl: 'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=400&h=400&fit=crop&crop=face', order: 0, isMain: true }
      ]
    },

    // Birds
    {
      name: 'นกแก้วโคคาเทล',
      price: 3500.00,
      imageUrl: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=300&h=300&fit=crop',
      category: 'birds',
      description: 'นกแก้วโคคาเทล เลี้ยงง่าย เสียงใส สีสวย',
      stock: 5
    },
    {
      name: 'นกแก้วลอฟเบิร์ด',
      price: 2500.00,
      imageUrl: 'https://images.unsplash.com/photo-1544923408-75c5cef46f14?w=300&h=300&fit=crop',
      category: 'birds',
      description: 'นกแก้วลอฟเบิร์ด คู่รัก สีสวย เลี้ยงง่าย',
      stock: 8
    },
    {
      name: 'นกคานารี',
      price: 1800.00,
      imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop',
      category: 'birds',
      description: 'นกคานารี เสียงเพราะ สีเหลืองสวย เลี้ยงง่าย',
      stock: 10
    },

    // Food
    {
      name: 'อาหารสุนัข Royal Canin',
      price: 1200.00,
      imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300&h=300&fit=crop',
      category: 'food',
      description: 'อาหารสุนัขคุณภาพสูง Royal Canin 3kg เหมาะสำหรับสุนัขโต',
      stock: 20
    },
    {
      name: 'อาหารแมว Whiskas',
      price: 800.00,
      imageUrl: 'https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=300&h=300&fit=crop',
      category: 'food',
      description: 'อาหารแมวเปียก Whiskas รสปลาทูน่า 12 ซอง',
      stock: 15
    },
    {
      name: 'อาหารลูกสุนัข Pedigree',
      price: 950.00,
      imageUrl: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300&h=300&fit=crop',
      category: 'food',
      description: 'อาหารลูกสุนัข Pedigree 2.5kg สำหรับลูกสุนัข 2-12 เดือน',
      stock: 12
    },
    {
      name: 'อาหารนก Versele-Laga',
      price: 450.00,
      imageUrl: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=300&h=300&fit=crop',
      category: 'food',
      description: 'อาหารนกแก้ว Versele-Laga 1kg คุณภาพสูง',
      stock: 25
    },

    // Toys
    {
      name: 'ลูกบอลยาง',
      price: 150.00,
      imageUrl: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=300&h=300&fit=crop',
      category: 'toys',
      description: 'ลูกบอลยางสำหรับสุนัข ขนาดกลาง ทนทาน ปลอดภัย',
      stock: 30
    },
    {
      name: 'ของเล่นแมว ปลาแคทนิป',
      price: 200.00,
      imageUrl: 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=300&h=300&fit=crop',
      category: 'toys',
      description: 'ของเล่นแมวรูปปลา มีแคทนิป กระตุ้นการเล่น',
      stock: 25
    },
    {
      name: 'เชือกดึงสำหรับสุนัข',
      price: 180.00,
      imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop',
      category: 'toys',
      description: 'เชือกดึงสำหรับสุนัข ทำจากผ้าฝ้าย ปลอดภัย',
      stock: 20
    },
    {
      name: 'หนูของเล่นแมว',
      price: 120.00,
      imageUrl: 'https://images.unsplash.com/photo-1574231164645-d6f0e8553590?w=300&h=300&fit=crop',
      category: 'toys',
      description: 'หนูของเล่นแมว มีเสียง กระตุ้นสัญชาตญาณการล่า',
      stock: 35
    },
    {
      name: 'ของเล่นนก กิ่งไม้',
      price: 250.00,
      imageUrl: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=300&h=300&fit=crop',
      category: 'toys',
      description: 'ของเล่นนก กิ่งไม้ธรรมชาติ ปลอดภัย ช่วยลับเล็บ',
      stock: 15
    }
  ];

  for (const productData of products) {
    // Check if product exists first
    const existingProduct = await prisma.product.findFirst({
      where: { name: productData.name },
    });

    if (!existingProduct) {
      // Separate images from product data
      const { images, category, ...product } = productData;
      const categoryId = keyToCategoryId[category] || null;
      
      // Create product with images
      const createdProduct = await prisma.product.create({
        data: {
          ...product,
          category,
          categoryId,
          images: images ? {
            create: images.map(img => ({
              imageUrl: img.imageUrl,
              order: img.order,
              isMain: img.isMain,
              altText: `${product.name} - รูปที่ ${img.order + 1}`
            }))
          } : undefined
        },
        include: {
          images: true
        }
      });
      console.log(`✅ Created product: ${product.name} with ${images?.length || 0} images`);
    } else {
      // Update existing product with new discount fields if provided
      const { salePrice, discountPercent } = productData;
      if (salePrice != null || discountPercent != null) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: {
            salePrice: salePrice != null ? salePrice : undefined,
            discountPercent: discountPercent != null ? discountPercent : undefined,
          }
        });
        console.log(`🔄 Updated discounts for: ${productData.name}`);
      } else {
        console.log(`⏭️  Product already exists: ${productData.name}`);
      }
    }
  }

  console.log('✅ Products seeded successfully');

  // Create a test user (optional)
  const existingUser = await prisma.user.findUnique({
    where: { lineUserId: 'test-user-123' },
  });

  let testUser;
  if (!existingUser) {
    testUser = await prisma.user.create({
      data: {
        lineUserId: 'test-user-123',
        displayName: 'Test User',
        email: 'test@example.com',
        statusMessage: 'This is a test user',
      },
    });
    console.log('✅ Test user created:', testUser.displayName);
  } else {
    testUser = existingUser;
    console.log('⏭️  Test user already exists:', testUser.displayName);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });