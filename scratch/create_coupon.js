const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const store = await prisma.store.findFirst();
    if (!store) return console.log("No store found");

    const coupon = await prisma.coupon.create({
      data: {
        storeId: store.id,
        code: 'TEST2026',
        discount: 10,
        type: 'percentage',
        maxUses: 0,
        expiry: null,
        appliesTo: 'all',
      }
    });
    console.log("Success:", coupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
