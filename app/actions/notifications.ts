'use server';

import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/actions/auth';

export async function getStoreNotificationsAction(storeId: string) {
  try {
    await requireAuth();

    // Execute all notification queries in parallel via Promise.all to cut database latency
    const [
      abandonedCarts,
      lowStockProducts,
      store,
      recentNewOrders,
      newOrdersCount,
      newReturnsCount
    ] = await Promise.all([
      // 1. Abandoned carts total & count (select only total to minimize payload)
      prisma.abandonedCart.findMany({
        where: {
          storeId,
          recovered: false
        },
        select: {
          total: true
        }
      }),

      // 2. Low Stock Products
      prisma.product.findMany({
        where: {
          storeId,
          stock: {
            lte: 5
          }
        },
        select: {
          name: true,
          stock: true
        },
        take: 5
      }),

      // 3. Store Details for Trial Calculation
      prisma.store.findUnique({
        where: { id: storeId },
        select: { createdAt: true, planStatus: true, planTier: true, planStartDate: true, planEndDate: true }
      }),

      // 4. Recent New Orders
      prisma.order.findMany({
        where: {
          storeId,
          status: 'new'
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          total: true,
          currency: true,
          createdAt: true,
          items: true,
        }
      }),

      // 5. Total New Orders Count
      prisma.order.count({
        where: {
          storeId,
          status: 'new'
        }
      }),

      // 6. New Returns Count
      prisma.orderReturn.count({
        where: {
          storeId,
          status: 'pending_approval'
        }
      }),

      // 7. Active System Broadcasts & Platform Updates from Admin
      prisma.systemBroadcast.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const abandonedCount = abandonedCarts.length;
    let abandonedTotal = 0;
    for (let i = 0; i < abandonedCarts.length; i++) {
      abandonedTotal += abandonedCarts[i].total;
    }

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
        recentNewOrders,
        newReturnsCount,
        systemBroadcasts: systemBroadcasts || []
      }
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
