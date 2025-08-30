const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedPaymentMethods() {
  console.log("Seeding payment methods...");

  const paymentMethods = [
    {
      name: "โอนเงินผ่านธนาคาร",
      type: "bank_transfer",
      description: "โอนเงินผ่านแอปธนาคารหรือ ATM",
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "บัตรเครดิต/เดบิต",
      type: "credit_card",
      description: "ชำระด้วยบัตรเครดิตหรือเดบิต Visa, MasterCard, JCB",
      isActive: false,
      sortOrder: 2,
    },
    

  ];

  for (const method of paymentMethods) {
    const existing = await prisma.paymentMethod.findFirst({
      where: { name: method.name },
    });

    if (existing) {
      await prisma.paymentMethod.update({
        where: { id: existing.id },
        data: method,
      });
      console.log(`Updated payment method: ${method.name}`);
    } else {
      await prisma.paymentMethod.create({
        data: method,
      });
      console.log(`Created payment method: ${method.name}`);
    }
  }

  console.log("Payment methods seeded successfully!");
}

if (require.main === module) {
  seedPaymentMethods()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
