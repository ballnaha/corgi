import { PrismaClient } from '@prisma/client';
import { seedCategories } from './category-data';
import { seedProducts } from './product-data';
import { seedBlogData } from './blog-data';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 เริ่มต้น Database Seeding...\n');

  try {
    // 1. Seed Categories
    console.log('1️⃣ Seeding Categories...');
    await seedCategories();
    console.log('✅ Categories seeding สำเร็จ!\n');

    // 2. Seed Products
    console.log('2️⃣ Seeding Products...');
    await seedProducts();
    console.log('✅ Products seeding สำเร็จ!\n');

    // 3. Seed Blog Data
    console.log('3️⃣ Seeding Blog Data...');
    await seedBlogData();
    console.log('✅ Blog Data seeding สำเร็จ!\n');

    console.log('🎉 Database Seeding เสร็จสมบูรณ์!');
    console.log('📊 สรุปข้อมูลที่เพิ่ม:');
    
    // แสดงสรุปข้อมูล
    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();
    
    console.log(`   - Categories: ${categoryCount} รายการ`);
    console.log(`   - Products: ${productCount} รายการ`);
    
    // ตรวจสอบและแสดงข้อมูล Blog ถ้ามี
    try {
      const blogCategoryCount = await (prisma as any).blogCategory.count();
      const blogPostCount = await (prisma as any).blogPost.count();
      console.log(`   - Blog Categories: ${blogCategoryCount} รายการ`);
      console.log(`   - Blog Posts: ${blogPostCount} รายการ`);
    } catch (blogError) {
      console.log(`   - Blog Data: ยังไม่ได้ seed หรือไม่มี blog tables`);
    }

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการ seed database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n🔌 ปิดการเชื่อมต่อ database แล้ว');
  });
