import test from 'node:test';
import assert from 'node:assert/strict';
import 'dotenv/config';
import { prisma } from '../lib/prisma';

const TEST_PREFIX = `__audit_test_${Date.now()}`;

test('DB integration: full store -> product -> variant -> coupon -> order -> return lifecycle with cleanup', async () => {
  let storeId: string | null = null;
  let ownerId: string | null = null;

  try {
    // 1. Create synthetic test owner & store
    const owner = await prisma.user.create({
      data: {
        name: 'Audit Test Owner',
        email: `${TEST_PREFIX}@example.test`,
        phone: '779999999',
        password: '$2b$10$syntheticHashValueForIntegrationTestingOnly123456',
        role: 'STORE_OWNER',
        status: 'active',
      },
    });
    ownerId = owner.id;

    const store = await prisma.store.create({
      data: {
        slug: `${TEST_PREFIX}-store`,
        name: 'Audit Test Store',
        phone: '779999999',
        baseCurrency: 'SAR',
        ownerId: owner.id,
        planTier: 'pro',
        planStatus: 'active',
      },
    });
    storeId = store.id;

    // 2. Create product & variant
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: 'Audit Product',
        description: 'Synthetic product for integration verification',
        category: 'اختبار',
        price: 120,
        baseCurrency: 'SAR',
        stock: 10,
        variants: {
          create: [{ name: 'Large', stock: 5, priceOverride: 150 }],
        },
      },
      include: { variants: true },
    });
    assert.equal(product.variants.length, 1);

    // 3. Create coupon & order
    const coupon = await prisma.coupon.create({
      data: {
        storeId: store.id,
        code: `${TEST_PREFIX}_CODE`.toUpperCase(),
        discount: 10,
        type: 'percentage',
        maxUses: 5,
      },
    });
    assert.equal(coupon.discount, 10);

    const order = await prisma.order.create({
      data: {
        orderNumber: '#9001',
        storeId: store.id,
        customerName: 'Synthetic Customer',
        customerPhone: '778888888',
        city: 'عدن',
        items: JSON.stringify([
          {
            productId: product.id,
            productName: product.name,
            variantId: product.variants[0].id,
            price: 150,
            quantity: 2,
            total: 300,
          },
        ]),
        subtotal: 300,
        shippingCost: 0,
        discount: 30,
        total: 270,
        currency: 'SAR',
        paymentMethod: 'cod',
        status: 'delivered',
      },
    });

    // 4. Create return linked cleanly via foreign keys
    const ret = await prisma.orderReturn.create({
      data: {
        orderId: order.id,
        storeId: store.id,
        refundAmount: 150,
        reason: 'Integration check',
        items: JSON.stringify([{ productId: product.id, quantity: 1 }]),
        status: 'pending_approval',
      },
    });
    assert.equal(ret.refundAmount, 150);

    // 5. Query back via relational include and verify consistency
    const loadedStore = await prisma.store.findUnique({
      where: { id: store.id },
      include: { products: true, orders: true, coupons: true, returns: true },
    });
    assert.ok(loadedStore);
    assert.equal(loadedStore.products.length, 1);
    assert.equal(loadedStore.orders.length, 1);
    assert.equal(loadedStore.coupons.length, 1);
    assert.equal(loadedStore.returns.length, 1);
  } finally {
    if (storeId) {
      await prisma.store.delete({ where: { id: storeId } }).catch(() => {});
    }
    if (ownerId) {
      await prisma.user.delete({ where: { id: ownerId } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
});
