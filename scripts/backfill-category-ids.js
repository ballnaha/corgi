const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function ensureBaseCategories() {
  const baseCategories = [
    { key: 'dogs', name: 'สุนัข', icon: '🐕', description: 'สุนัขพันธุ์ต่างๆ น่ารักและเป็นมิตร' },
    { key: 'birds', name: 'นก', icon: '🐦', description: 'นกสวยงาม เสียงใสไพเราะ' },
    { key: 'cats', name: 'แมว', icon: '🐱', description: 'แมวน้อยน่ารัก เลี้ยงง่าย' },
    { key: 'accessories', name: 'ของใช้อื่นๆ', icon: '🎾', description: 'ของใช้อื่นๆ' },
  ];

  const categoryKeyToId = {};

  for (const category of baseCategories) {
    const existing = await prisma.category.findUnique({ where: { key: category.key } });
    const created = existing || (await prisma.category.create({ data: category }));
    categoryKeyToId[category.key] = created.id;
    console.log(`${existing ? '⏭️' : '✅'} Category ready: ${category.key}`);
  }

  return categoryKeyToId;
}

async function backfillProductCategoryIds() {
  const categoryKeyToId = await ensureBaseCategories();

  const supportedKeys = Object.keys(categoryKeyToId);

  const productsNeedingBackfill = await prisma.product.findMany({
    where: {
      categoryId: null,
      category: { in: supportedKeys },
    },
    select: { id: true, name: true, category: true },
  });

  console.log(`🧩 Products needing backfill: ${productsNeedingBackfill.length}`);

  for (const product of productsNeedingBackfill) {
    const categoryId = categoryKeyToId[product.category];
    if (!categoryId) continue;
    await prisma.product.update({
      where: { id: product.id },
      data: { categoryId },
    });
    console.log(`🔗 ${product.name} -> ${product.category} (${categoryId})`);
  }

  console.log('✅ Backfill completed');
}

backfillProductCategoryIds()
  .catch((e) => {
    console.error('❌ Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


