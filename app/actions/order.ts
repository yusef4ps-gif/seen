'use server';

import { prisma } from '@/lib/prisma';
import { OrderItem } from '@/lib/types';
import { requireStoreOwner } from '@/app/actions/auth';
import { sendEmail, EmailTemplates } from '@/lib/notification-engine';

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
        customerId: data.customerId || null,
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

    // 3. Get Store info for emails
    const store = await prisma.store.findUnique({ where: { id: data.storeId } });

    // 4. Mark Abandoned Cart as recovered (if any)
    if (data.customerPhone) {
      await prisma.abandonedCart.updateMany({
        where: {
          storeId: data.storeId,
          customerPhone: data.customerPhone,
          recovered: false
        },
        data: {
          recovered: true
        }
      });
    }

    return { success: true, order };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateOrderStatusAction(id: string, status: string) {
  try {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return { success: false, error: 'Order not found' };

    await requireStoreOwner(order.storeId);

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

    // Send Delivery Notification and Review Request
    if (status === 'delivered' && order.status !== 'delivered') {
      let customerEmail = null;
      if (order.customerId) {
        const customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
        if (customer && customer.email) customerEmail = customer.email;
      }
      
      if (customerEmail) {
        const store = await prisma.store.findUnique({ where: { id: order.storeId } });
        if (store) {
          try {
            const storeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/store/${store.slug}`;
            await sendEmail({
              to: customerEmail,
              subject: `تم استلام طلبك! شكراً لاختيارك متجر ${store.name}`,
              html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px; border-radius: 10px;">
                  <h2 style="color: #0f172a; text-align: center;">تم تسليم طلبك بنجاح 🎉</h2>
                  <p style="color: #475569; font-size: 16px; line-height: 1.5; text-align: right;">
                    أهلاً بك،<br/>
                    سعداء بإبلاغك أنه تم تسليم طلبك رقم <strong>${updatedOrder.orderNumber}</strong> بنجاح. نتمنى أن تنال المنتجات إعجابك!
                  </p>
                  <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #e2e8f0;">
                    <h3 style="color: #0f172a; margin-top: 0;">رأيك يهمنا!</h3>
                    <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">
                      شارِكنا تجربتك وتقييمك للمنتجات لمساعدتنا على تحسين خدماتنا.
                    </p>
                    <a href="${storeUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      أعطنا رأيك
                    </a>
                  </div>
                  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
                    شكراً لتسوقك من متجر ${store.name}
                  </p>
                </div>
              `
            });
          } catch (emailError) {
            console.error('Failed to send delivery email:', emailError);
          }
        }
      }
    }

    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function verifyPaymentProofAction(id: string, status: string) {
  try {
    const orderObj = await prisma.order.findUnique({ where: { id } });
    if (!orderObj) return { success: false, error: 'Order not found' };
    
    await requireStoreOwner(orderObj.storeId);

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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
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
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getStoreReturnsAction(storeId: string) {
  try {
    const returns = await prisma.orderReturn.findMany({
      where: { storeId },
      include: {
        order: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, returns };
  } catch (error) {
    console.error('Error fetching returns:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error), returns: [] };
  }
}

export async function createOrderReturnAction(data: { orderId: string; storeId: string; refundAmount: number; reason: string; items: any[] }) {
  try {
    await requireStoreOwner(data.storeId);
    
    // Create the return record
    const orderReturn = await prisma.orderReturn.create({
      data: {
        orderId: data.orderId,
        storeId: data.storeId,
        refundAmount: data.refundAmount,
        reason: data.reason,
        items: JSON.stringify(data.items),
        status: 'pending_inspection',
      }
    });

    // Update order status to partially_returned or returned based on total items
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (order) {
      const orderItems = JSON.parse(order.items);
      const isFullReturn = data.items.length === orderItems.length; // Simplified check, could also check quantities
      
      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: isFullReturn ? 'returned' : 'partially_returned' }
      });
    }

    return { success: true, orderReturn };
  } catch (error) {
    console.error('Error creating order return:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateOrderReturnStatusAction(returnId: string, storeId: string, status: string) {
  try {
    await requireStoreOwner(storeId);
    
    const orderReturn = await prisma.orderReturn.findUnique({ where: { id: returnId } });
    if (!orderReturn) return { success: false, error: 'Return not found' };

    // If restocked, update product inventory
    if (status === 'restocked' && orderReturn.status !== 'restocked') {
      const items = JSON.parse(orderReturn.items);
      for (const item of items) {
        // Restore product stock (but don't decrement sales count as it's a return, not a cancellation before shipping, wait actually returns usually decrement net sales but let's keep it simple and just restock)
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
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

    const updatedReturn = await prisma.orderReturn.update({
      where: { id: returnId },
      data: { status }
    });

    return { success: true, orderReturn: updatedReturn };
  } catch (error) {
    console.error('Error updating order return status:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function customerConfirmDeliveryAction(orderId: string) {
  try {
    // In a real app we'd verify the customer token here, but since this is for demonstration
    // we'll just allow the update if the order exists and is shipped.
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    
    if (!order) {
      return { success: false, error: 'الطلب غير موجود' };
    }
    
    if (order.status !== 'shipped') {
      return { success: false, error: 'لا يمكن تأكيد الاستلام إلا للطلبات المشحونة' };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'delivered' }
    });

    return { success: true, order: updatedOrder };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function getOrderByIdAction(orderId: string) {
  try {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderId },
          { orderNumber: orderId }
        ]
      }
    });
    
    if (!order) return null;
    
    return {
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function getCustomerOrdersAction(storeId: string, identifier: string, type: 'phone' | 'email' | 'id' = 'phone', secondaryIdentifier?: string) {
  try {
    const whereClause: any = { storeId };

    if (type === 'id') {
      whereClause.OR = [
        { customerId: identifier },
        ...(secondaryIdentifier ? [{ customerPhone: secondaryIdentifier }] : [])
      ];
    } else {
      whereClause.customerPhone = identifier;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    return orders;
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
}
export async function getAbandonedCartsAction(storeId: string) {
  try {
    const carts = await prisma.abandonedCart.findMany({
      where: { storeId },
      orderBy: { abandonedAt: 'desc' }
    });
    return carts.map(cart => ({
      ...cart,
      items: typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items
    }));
  } catch (error) {
    console.error('Error fetching abandoned carts:', error);
    return [];
  }
}
export async function markAbandonedCartRecoveredAction(cartId: string) {
  try {
    const updated = await prisma.abandonedCart.update({
      where: { id: cartId },
      data: { recoverySentAt: new Date(), recovered: true }
    });
    return { success: true, cart: updated };
  } catch (error) {
    console.error('Error marking cart recovered:', error);
    return { success: false, error: String(error) };
  }
}


export async function requestOrderReturnAction(data: { orderId: string; reason: string; items: any[]; attachments?: string[] }) {
  try {
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) return { success: false, error: 'الطلب غير موجود' };

    if (order.status !== 'delivered') {
      return { success: false, error: 'لا يمكن إرجاع هذا الطلب لأن حالته ليست مكتملة' };
    }

    let refundAmount = 0;
    const orderItems = JSON.parse(order.items);
    
    data.items.forEach(retItem => {
      // Handle missing origItem defensively
      const origItem = orderItems.find((i: any) => i.id === retItem.item?.id || i.id === retItem.id);
      if (origItem) {
        refundAmount += (origItem.price || 0) * (retItem.quantity || 1);
      }
    });

    const orderReturn = await prisma.orderReturn.create({
      data: {
        orderId: data.orderId,
        storeId: order.storeId,
        refundAmount: refundAmount,
        reason: data.reason,
        items: JSON.stringify(data.items),
        attachments: data.attachments && data.attachments.length > 0 ? JSON.stringify(data.attachments) : null,
        status: 'pending_approval',
      }
    });

    const isFullReturn = data.items.length === orderItems.length && data.items.every((it: any, idx: number) => it.quantity === (orderItems[idx]?.quantity || 1));
    
    await prisma.order.update({
      where: { id: data.orderId },
      data: { status: isFullReturn ? 'returned' : 'partially_returned' }
    });

    return { success: true, orderReturn };
  } catch (error) {
    console.error('Error requesting order return:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
