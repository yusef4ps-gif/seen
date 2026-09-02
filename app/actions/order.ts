'use server';

import { prisma } from '@/lib/prisma';
import { OrderItem } from '@/lib/types';

export async function createOrderAction(data: any) {
  try {
    // Determine the next sequential order number for this store
    const storeOrderCount = await prisma.order.count({
      where: { storeId: data.storeId }
    });
    const sequentialOrderNumber = `#${1000 + storeOrderCount + 1}`;

    // 1. Create the order
    const order = await prisma.order.create({
      data: {
        id: data.id,
        orderNumber: sequentialOrderNumber,
        storeId: data.storeId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        city: data.city,
        address: data.address,
        deliveryType: data.deliveryType,
        items: JSON.stringify(data.items),
        subtotal: data.subtotal,
        shippingCost: data.shippingCost,
        discount: data.discount,
        total: data.total,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        paymentProofUrl: data.paymentProofUrl,
        paymentProofStatus: data.paymentProofStatus,
        status: data.status,
        notes: data.notes,
      }
    });

    // 2. Decrement stock & increment sales count for each item
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        // Update product stock and sales count
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            salesCount: { increment: item.quantity }
          }
        });

        // If the item has a variant, also update the variant's stock
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: { decrement: item.quantity }
            }
          });
        }
      }
    }

    return { success: true, order };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error };
  }
}

export async function updateOrderStatusAction(id: string, status: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return { success: false, error: 'Order not found' };

    // If order is transitioning to cancelled, restore stock
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const items = JSON.parse(order.items);
      for (const item of items) {
        // Restore product stock and sales count
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            salesCount: { decrement: item.quantity }
          }
        });

        // Restore variant stock
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });
    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error };
  }
}

export async function verifyPaymentProofAction(id: string, status: string) {
  try {
    const order = await prisma.order.update({
      where: { id },
      data: { 
        paymentProofStatus: status,
        status: status === 'verified' ? 'processing' : 'pending_payment'
      }
    });
    return { success: true, order };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { success: false, error };
  }
}

export async function captureAbandonedCartAction(data: any) {
  try {
    const existing = await prisma.abandonedCart.findFirst({
      where: {
        storeId: data.storeId,
        customerPhone: data.customerPhone
      },
      orderBy: { abandonedAt: 'desc' }
    });

    if (existing && !existing.recovered) {
      const updated = await prisma.abandonedCart.update({
        where: { id: existing.id },
        data: {
          customerName: data.customerName,
          items: JSON.stringify(data.items),
          total: data.total,
          currency: data.currency,
          abandonedAt: new Date()
        }
      });
      return { success: true, cart: updated };
    } else {
      const cart = await prisma.abandonedCart.create({
        data: {
          storeId: data.storeId,
          customerName: data.customerName || '',
          customerPhone: data.customerPhone,
          items: JSON.stringify(data.items),
          total: data.total,
          currency: data.currency,
        }
      });
      return { success: true, cart };
    }
  } catch (error) {
    console.error('Error capturing abandoned cart:', error);
    return { success: false, error };
  }
}

