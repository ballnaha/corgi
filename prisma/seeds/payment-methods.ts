import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedPaymentMethods() {
  console.log("Seeding payment methods...");

  const paymentMethods = [
    {
      name: "บัตรเครดิต/เดบิต",
      type: "credit_card",
      description: "ชำระด้วยบัตรเครดิตหรือเดบิต Visa, MasterCard, JCB",
      isActive: true,
      sortOrder: 1,
    },
    {
      name: "โอนเงินผ่านธนาคาร",
      type: "bank_transfer",
      description: "โอนเงินผ่านแอปธนาคารหรือ ATM",
      isActive: true,
      sortOrder: 2,
    },
    {
      name: "TrueMoney Wallet",
      type: "e_wallet",
      description: "ชำระผ่าน TrueMoney Wallet",
      isActive: true,
      sortOrder: 3,
    },
    {
      name: "PromptPay",
      type: "e_wallet",
      description: "สแกน QR Code PromptPay",
      isActive: true,
      sortOrder: 4,
    },
    {
      name: "เก็บเงินปลายทาง",
      type: "cash_on_delivery",
      description: "ชำระเงินเมื่อได้รับสินค้า (COD)",
      isActive: true,
      sortOrder: 5,
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
    } else {
      await prisma.paymentMethod.create({
        data: method,
      });
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