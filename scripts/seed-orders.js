const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedOrders() {
  console.log('📦 Seeding sample orders...');

  try {
    // Find test user
    const testUser = await prisma.user.findUnique({
      where: { lineUserId: 'test-user-123' },
    });

    if (!testUser) {
      console.log('❌ Test user not found. Please run main seed first.');
      return;
    }

    // Find some products to create orders (prefer dogs)
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    if (products.length === 0) {
      console.log('❌ No products found. Please run main seed first.');
      return;
    }

    // Create sample orders
    const sampleOrders = [
      {
        userId: testUser.id,
        status: 'DELIVERED',
        totalAmount: 25000.00,
        createdAt: new Date('2025-01-15'),
        items: [
          {
            productId: products[0]?.id,
            quantity: 1,
            price: 25000.00,
          },
        ],
      },
      {
        userId: testUser.id,
        status: 'DELIVERED',
        totalAmount: 18500.00,
        createdAt: new Date('2024-12-03'),
        items: [
          {
            productId: products[1]?.id,
            quantity: 1,
            price: 18500.00,
          },
        ],
      },
      {
        userId: testUser.id,
        status: 'PROCESSING',
        totalAmount: 15000.00,
        createdAt: new Date('2024-12-28'),
        items: [
          {
            productId: products[2]?.id,
            quantity: 1,
            price: 15000.00,
          },
        ],
      },
    ];

    for (const orderData of sampleOrders) {
      const { items, ...order } = orderData;
      
      // Check if order already exists
      const existingOrder = await prisma.order.findFirst({
        where: {
          userId: order.userId,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
        },
      });

      if (!existingOrder && items[0]?.productId) {
        const createdOrder = await prisma.order.create({
          data: {
            ...order,
            orderItems: {
              create: items,
            },
          },
          include: {
            orderItems: {
              include: {
                product: true,
              },
            },
          },
        });

        console.log(`✅ Created order: ${createdOrder.id} - ฿${createdOrder.totalAmount}`);
      } else {
        console.log(`⏭️  Order already exists or product not found`);
      }
    }

    console.log('🎉 Order seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
  }
}

seedOrders()
  .catch((e) => {
    console.error('❌ Order seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });