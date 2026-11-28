'use server';

import { prisma } from '@/lib/prisma';
import { CurrencyCode, OrderItem } from '@/lib/types';
import { requireStoreOwner } from '@/app/actions/auth';
import { sendEmail, EmailTemplates } from '@/lib/notification-engine';
import { convertCurrency } from '@/lib/currency-engine';
import { extractDigitalMetaFromTags } from '@/lib/digital-assets';
import { invalidateCachedProducts } from '@/lib/server-cache';

export async function createOrderAction(data: any) {
  try {
    const store = await prisma.store.findFirst({
      where: {
        OR: [{ id: data.storeId }, { slug: data.storeId }]
      }
    });
    if (!store) {
      return { success: false, error: 'المتجر غير موجود.' };
    }
    if (store.planStatus === 'suspended') {
      return { success: false, error: 'المتجر موقوف مؤقتاً ولا يمكن استقبال طلبات جديدة حالياً.' };
    }

    const effectiveStoreId = store.id;
    const orderCurrency = (data.currency || store.baseCurrency || 'SAR') as CurrencyCode;

    let customRates: any = {};
    try { customRates = store.customRates ? JSON.parse(store.customRates) : {}; } catch {}
    let themeCfg: any = {};
    try { themeCfg = store.themeConfig ? JSON.parse(store.themeConfig) : {}; } catch {}
    const isServiceStore =
      themeCfg?.storeType === 'SERVICE' ||
      themeCfg?.storeType === 'DIGITAL' ||
      themeCfg?.presetId === 'service-expert';

    const rawItems: any[] = Array.isArray(data.items) ? data.items : [];
    if (rawItems.length === 0) {
      return { success: false, error: 'السلة فارغة.' };
    }

    const prodIds = rawItems.map(i => i?.productId).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: prodIds }, storeId: effectiveStoreId },
      include: { variants: true }
    });
    const productMap = new Map(dbProducts.map(p => [p.id, p]));

    let authoritativeSubtotalBase = 0;
    const sanitizedItems = rawItems.map(item => {
      const qty = Math.max(1, Math.round(Number(item?.quantity) || 1));
      const dbProd = item?.productId ? productMap.get(item.productId) : undefined;
      if (dbProd) {
        const variant = item.variantId ? dbProd.variants.find(v => v.id === item.variantId) : undefined;
        const unitBase = variant?.priceOverride ?? dbProd.price;
        const digitalMeta = extractDigitalMetaFromTags(dbProd.tags);
        authoritativeSubtotalBase += unitBase * qty;
        return {
          ...item,
          productName: dbProd.name,
          price: unitBase,
          quantity: qty,
          total: unitBase * qty,
          digitalFileUrl: digitalMeta.digitalFileUrl || item?.digitalFileUrl || '',
          digitalFileName: digitalMeta.digitalFileName || item?.digitalFileName || '',
          digitalFileAccess: digitalMeta.digitalFileUrl
            ? digitalMeta.digitalFileAccess
            : (item?.digitalFileAccess || 'instant'),
        };
      }
      const fallbackPrice = Math.max(0, Number(item?.price) || 0);
      authoritativeSubtotalBase += fallbackPrice * qty;
      return { ...item, price: fallbackPrice, quantity: qty, total: fallbackPrice * qty };
    });

    // If matching DB products use baseCurrency, convert subtotal into requested orderCurrency
    const baseProdCurrency = (dbProducts[0]?.baseCurrency || store.baseCurrency || 'SAR') as CurrencyCode;
    const authoritativeSubtotal = convertCurrency(authoritativeSubtotalBase, baseProdCurrency, orderCurrency, customRates);

    let authoritativeShipping = 0;
    if (!isServiceStore && data.deliveryType !== 'pickup') {
      let shippingList: any[] = [];
      try { shippingList = store.shippingMethods ? JSON.parse(store.shippingMethods) : []; } catch {}
      const activeDelivery = shippingList.find((m: any) => m.isActive && !m.isPickup);
      authoritativeShipping = activeDelivery ? Number(activeDelivery.cost) || 0 : (Number(data.shippingCost) || 0);
    }

    let authoritativeDiscount = 0;
    let validCouponId: string | null = null;
    if (data.couponCode && typeof data.couponCode === 'string') {
      const coupon = await prisma.coupon.findUnique({
        where: { storeId_code: { storeId: effectiveStoreId, code: data.couponCode.trim().toUpperCase() } }
      });
      if (
        coupon &&
        coupon.isActive &&
        (coupon.maxUses === 0 || coupon.usageCount < coupon.maxUses) &&
        (!coupon.expiry || new Date() <= coupon.expiry)
      ) {
        validCouponId = coupon.id;
        if (coupon.type === 'shipping') {
          authoritativeShipping = 0;
        } else if (coupon.type === 'percentage') {
          authoritativeDiscount = Math.round(authoritativeSubtotal * (coupon.discount / 100) * 100) / 100;
        } else if (coupon.type === 'fixed') {
          authoritativeDiscount = convertCurrency(coupon.discount, (store.baseCurrency || 'SAR') as CurrencyCode, orderCurrency, customRates);
        }
      }
    }

    const authoritativeTotal = Math.max(0, Math.round((authoritativeSubtotal + authoritativeShipping - authoritativeDiscount) * 100) / 100);
    const effectivePaymentMethod = authoritativeTotal <= 0 ? 'free' : (data.paymentMethod || 'cod');
    const effectiveStatus = authoritativeTotal <= 0 || effectivePaymentMethod === 'cod' ? 'new' : 'pending_payment';

    // Determine the next sequential order number for this store
    const storeOrderCount = await prisma.order.count({
      where: { storeId: effectiveStoreId }
    });
    const sequentialOrderNumber = `#${1000 + storeOrderCount + 1}`;

    // Resolve or link Customer in CRM
    let linkedCustomerId = data.customerId || null;
    if (!linkedCustomerId && effectiveStoreId && (data.customerPhone || data.customerEmail)) {
      const cleanPhone = data.customerPhone ? data.customerPhone.replace(/[^0-9]/g, '') : '';
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          storeId: effectiveStoreId,
          OR: [
            ...(cleanPhone ? [{ phone: cleanPhone }, { phone: data.customerPhone }] : []),
            ...(data.customerEmail ? [{ email: data.customerEmail }] : [])
          ]
        }
      });
      if (existingCustomer) {
        linkedCustomerId = existingCustomer.id;
      }
    }

    // 1. Create the order with server-computed amounts
    const order = await prisma.order.create({
      data: {
        id: data.id,
        orderNumber: sequentialOrderNumber,
        storeId: effectiveStoreId,
        customerId: linkedCustomerId,
        customerName: data.customerName || 'عميل المتجر',
        customerPhone: data.customerPhone || 'غير مسجل',
        city: data.city,
        address: data.address,
        deliveryType: data.deliveryType,
        items: JSON.stringify(sanitizedItems),
        subtotal: authoritativeSubtotal,
        shippingCost: authoritativeShipping,
        discount: authoritativeDiscount,
        total: authoritativeTotal,
        currency: orderCurrency,
        paymentMethod: effectivePaymentMethod,
        paymentProofUrl: authoritativeTotal <= 0 ? undefined : data.paymentProofUrl,
        paymentProofStatus: authoritativeTotal <= 0 ? undefined : (data.paymentProofStatus || 'unverified'),
        status: effectiveStatus,
        notes: data.notes,
      }
    });

    if (validCouponId) {
      await prisma.coupon.update({
        where: { id: validCouponId },
        data: { usageCount: { increment: 1 } }
      }).catch(() => {});
    }

    // Update Customer CRM statistics in database
    if (linkedCustomerId) {
      await prisma.customer.update({
        where: { id: linkedCustomerId },
        data: {
          ordersCount: { increment: 1 },
          totalSpent: { increment: authoritativeTotal },
          lastLoginAt: new Date()
        }
      }).catch(err => console.error('Failed to update customer CRM stats:', err));
    }

    // 2. Decrement stock & increment sales count safely for each item
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (!item?.productId) continue;
        const qty = Math.max(1, Number(item.quantity) || 1);
        const prodExists = await prisma.product.findUnique({ where: { id: item.productId }, select: { id: true, stock: true } });
        if (prodExists) {
          await prisma.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: Math.min(qty, Math.max(0, prodExists.stock)) },
              salesCount: { increment: qty }
            }
          });
        }

        if (item.variantId) {
          const variantExists = await prisma.productVariant.findUnique({ where: { id: item.variantId }, select: { id: true, stock: true } });
          if (variantExists) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: { decrement: Math.min(qty, Math.max(0, variantExists.stock)) }
              }
            });
          }
        }
      }
    }

    // 3. Send email alert to store owner if email configured
    if (store && store.email) {
      sendEmail({
        to: store.email,
        subject: `🛒 طلب جديد في متجرك (${sequentialOrderNumber}) بقيمة ${data.total} ${data.currency}`,
        html: EmailTemplates.MerchantNewOrder(
          store.name,
          sequentialOrderNumber,
          data.customerName || 'عميل المتجر',
          data.total,
          data.currency,
          `/merchant/${store.slug}/orders`
        )
      }).catch(err => console.error('Failed to send merchant order alert email:', err));
    }

      // 4. Mark Abandoned Cart as recovered (if any)
    if (data.customerPhone && effectiveStoreId) {
      await prisma.abandonedCart.updateMany({
        where: {
          storeId: effectiveStoreId,
          customerPhone: data.customerPhone,
          recovered: false
        },
        data: {
          recovered: true
        }
      });
    }

    invalidateCachedProducts(effectiveStoreId);

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
      invalidateCachedProducts(order.storeId);

      // Decrement customer stats if cancelled
      if (order.customerId) {
        await prisma.customer.update({
          where: { id: order.customerId },
          data: {
            ordersCount: { decrement: 1 },
            totalSpent: { decrement: order.total }
          }
        }).catch(() => {});
      }
    } else if (order.status === 'cancelled' && status !== 'cancelled' && order.customerId) {
      // Re-increment customer stats if un-cancelled
      await prisma.customer.update({
        where: { id: order.customerId },
        data: {
          ordersCount: { increment: 1 },
          totalSpent: { increment: order.total }
        }
      }).catch(() => {});
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
    await requireStoreOwner(storeId);
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

    // Enrich any order items missing digitalFileUrl using the store's live catalog
    // so older free/digital orders automatically display newly attached files.
    const parsedLists = orders.map((o) => {
      try {
        return typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch {
        return [];
      }
    });
    const missingProdIds = Array.from(
      new Set(
        parsedLists
          .flat()
          .filter((it: any) => it?.productId && !it?.digitalFileUrl)
          .map((it: any) => String(it.productId))
      )
    );

    if (missingProdIds.length === 0) {
      return orders;
    }

    const liveProducts = await prisma.product.findMany({
      where: { storeId, id: { in: missingProdIds } },
      select: { id: true, tags: true },
    });
    const metaByProdId = new Map(
      liveProducts.map((p) => [p.id, extractDigitalMetaFromTags(p.tags)])
    );

    return orders.map((o, idx) => {
      const items = parsedLists[idx];
      let changed = false;
      const enriched = items.map((it: any) => {
        if (!it?.digitalFileUrl && it?.productId) {
          const meta = metaByProdId.get(it.productId);
          if (meta?.digitalFileUrl) {
            changed = true;
            return {
              ...it,
              digitalFileUrl: meta.digitalFileUrl,
              digitalFileName: meta.digitalFileName || it.digitalFileName || '',
              digitalFileAccess: meta.digitalFileAccess || it.digitalFileAccess || 'instant',
            };
          }
        }
        return it;
      });
      if (!changed) return o;
      return {
        ...o,
        items: typeof o.items === 'string' ? JSON.stringify(enriched) : enriched,
      };
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return [];
  }
}
export async function getAbandonedCartsAction(storeId: string) {
  try {
    await requireStoreOwner(storeId);
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
    const existing = await prisma.abandonedCart.findUnique({ where: { id: cartId }, select: { storeId: true } });
    if (!existing) return { success: false, error: 'Cart not found' };
    await requireStoreOwner(existing.storeId);
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

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return { success: false, error: 'يرجى تحديد منتج واحد على الأقل للاسترجاع' };
    }

    let refundAmount = 0;
    const orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
    
    data.items.forEach(retItem => {
      const targetId = retItem.productId || retItem.item?.productId || retItem.item?.id || retItem.id;
      const origItem = orderItems.find((i: any) =>
        (targetId && (i.productId === targetId || i.id === targetId)) ||
        (retItem.productName && i.productName === retItem.productName)
      );
      if (origItem) {
        const retQty = Math.min(Math.max(1, Number(origItem.quantity) || 1), Math.max(1, Number(retItem.quantity) || 1));
        refundAmount += (Number(origItem.price) || 0) * retQty;
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
