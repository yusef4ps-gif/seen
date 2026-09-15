'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/actions/auth';

export async function getStoreNotificationsAction(storeId: string) {
  try {
    await requireAuth();

    // 1. Fetch Abandoned Carts
    const abandonedCarts = await prisma.abandonedCart.findMany({
      where: {
        storeId,
        recovered: false
      }
    });
    
    const abandonedCount = abandonedCarts.length;
    let abandonedTotal = 0;
    abandonedCarts.forEach(cart => {
      abandonedTotal += cart.total;
    });

    // 2. Fetch Low Stock Products
    const lowStockProducts = await prisma.product.findMany({
      where: {
        storeId,
        stock: {
          lte: prisma.product.fields.lowStockAlert
        }
      },
      select: {
        name: true,
        stock: true
      },
      take: 5
    });

    // 3. Fetch Store Creation Date for Subscription Trial Calculation
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { createdAt: true, planStatus: true, planTier: true }
    });

    // 4. Fetch New Orders Count
    const newOrdersCount = await prisma.order.count({
      where: {
        storeId,
        status: 'new'
      }
    });

    // 5. Fetch New Returns Count
    const newReturnsCount = await prisma.orderReturn.count({
      where: {
        storeId,
        status: 'pending_approval'
      }
    });

    return {
      success: true,
      data: {
        abandoned: {
          count: abandonedCount,
          total: abandonedTotal
        },
        lowStock: lowStockProducts,
        storeDetails: store,
        newOrdersCount,
        newReturnsCount
      }
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
