'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireStoreOwner, requireSuperAdmin } from '@/app/actions/auth';
import { sendEmail, EmailTemplates } from '@/lib/notification-engine';
import { INITIAL_PLANS } from '@/lib/initial-data';
import { SubscriptionPlan } from '@/lib/types';

// Re-export the initial default JSON from storeEngine logic to use when creating a new store
const DEFAULT_CUSTOM_RATES = JSON.stringify({
  YER_ADEN: 1910,
  YER_SANAA: 535,
  SAR: 3.75,
  USD: 1,
});

const DEFAULT_PAYMENT_ACCOUNTS = JSON.stringify([
  {
    id: `pay-${Date.now()}-qutaibi`,
    type: 'qutaibi',
    name: 'بنك القطيبي الإسلامي - حساب رسمي / القطيبي باي',
    accountNumber: '1249827361',
    accountName: 'حساب المتجر',
    instructions: 'التحويل المباشر عبر تطبيق بنك القطيبي أو خدمة القطيبي باي وإرفاق صورة الإشعار.',
    isActive: true,
  },
  {
    id: `pay-${Date.now()}-1`,
    type: 'cod',
    name: 'الدفع عند الاستلام (COD)',
    accountNumber: '',
    accountName: '',
    instructions: 'الدفع نقداً للمندوب عند وصول الطلب.',
    isActive: true,
  },
  {
    id: `pay-${Date.now()}-2`,
    type: 'kuraimi',
    name: 'الكريمي - خدمة حاسب',
    accountNumber: '3000000000',
    accountName: 'حساب المتجر',
    instructions: 'التحويل لحساب الكريمي وإرفاق الإشعار.',
    isActive: true,
  },
]);

const DEFAULT_SHIPPING_METHODS = JSON.stringify([
  {
    id: `ship-${Date.now()}-1`,
    name: 'توصيل محلي سريع',
    cost: 3000,
    currency: 'YER_ADEN',
    estimatedDelivery: 'خلال 24 ساعة',
    isActive: true,
  },
  {
    id: `ship-${Date.now()}-2`,
    name: 'استلام من المحل',
    cost: 0,
    currency: 'YER_ADEN',
    estimatedDelivery: 'فوري',
    isPickup: true,
    isActive: true,
  },
]);

export async function createStoreAction(data: any) {
  try {
    let ownerId: string | null = null;
    
    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'اسم المتجر حقل إلزامي مطلوب.' };
    }

    if (!data.phone || !data.phone.trim()) {
      return { success: false, error: 'رقم الهاتف / الواتساب مطلوب لاستقبال الطلبات.' };
    }

    if (!data.email || !data.email.trim() || !data.email.includes('@')) {
      return { success: false, error: 'يرجى إدخال بريد إلكتروني صالح ورسمي.' };
    }

    if (!data.password || data.password.trim().length < 4) {
      return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 4 خانات لحماية المتجر.' };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      ownerId = existingUser.id;
    } else {
      const newUser = await prisma.user.create({
        data: {
          email: cleanEmail,
          phone: data.phone.trim(),
          password: data.password.trim(),
          name: 'إدارة ' + data.name.trim(),
          role: 'STORE_OWNER',
          status: 'active'
        }
      });
      ownerId = newUser.id;
    }

    if (!ownerId) {
      return { success: false, error: 'تعذر إنشاء الحساب.' };
    }

    const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const existing = await prisma.store.findUnique({ where: { slug: cleanSlug } });
    const finalSlug = existing ? `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}` : cleanSlug;

    const newStore = await prisma.store.create({
      data: {
        ownerId: ownerId,
        slug: finalSlug,
        name: data.name,
        description: data.description || (data.themeConfig?.storeType === 'SERVICE' 
          ? `البروفايل المهني الرسمي لـ ${data.name}. استشارات وخدمات مهنية متخصصة بأعلى معايير الدقة والسرية.`
          : `المتجر الإلكتروني الرسمي لـ ${data.name}. تسوق أفضل المنتجات بأفضل الأسعار.`),
        category: data.category || (data.themeConfig?.storeType === 'SERVICE' ? 'محاماة واستشارات قانونية' : 'عام'),
        logo: data.logo || (data.themeConfig?.storeType === 'SERVICE' 
          ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&auto=format&fit=crop&q=80'),
        banner: data.banner || (data.themeConfig?.storeType === 'SERVICE'
          ? 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80'),
        primaryColor: data.primaryColor || (data.themeConfig?.storeType === 'SERVICE' ? '#0d9488' : '#0f2b48'),
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone.replace(/[^0-9]/g, ''),
        email: data.email || `contact@${finalSlug}.com`,
        city: data.city || 'عدن',
        address: data.address || 'اليمن',
        baseCurrency: data.baseCurrency || 'SAR',
        customRates: DEFAULT_CUSTOM_RATES,
        paymentAccounts: DEFAULT_PAYMENT_ACCOUNTS,
        shippingMethods: DEFAULT_SHIPPING_METHODS,
        planTier: 'free',
        planStatus: 'trial',
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        activeVisitorsNow: 1,
        totalSalesGMV: 0,
        themeConfig: data.themeConfig ? JSON.stringify(data.themeConfig) : "{}",
        storeServices: data.storeServices ? JSON.stringify(data.storeServices) : "[]",
      },
    });

    const parsedStore = {
      ...newStore,
      themeConfig: newStore.themeConfig ? JSON.parse(newStore.themeConfig) : null,
      storeServices: newStore.storeServices ? JSON.parse(newStore.storeServices) : [],
      customRates: newStore.customRates ? JSON.parse(newStore.customRates) : null,
      paymentAccounts: newStore.paymentAccounts ? JSON.parse(newStore.paymentAccounts) : [],
      shippingMethods: newStore.shippingMethods ? JSON.parse(newStore.shippingMethods) : [],
    };

    revalidatePath('/seenayhq7x');
    revalidatePath('/');
    
    try {
      if (newStore.email) {
        const dashboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/merchant/${newStore.slug}`;
        const storeLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/store/${newStore.slug}`;
        
        await sendEmail({
          to: newStore.email,
          subject: `🚀 تم تجهيز متجرك (${newStore.name}) بنجاح!`,
          html: EmailTemplates.WelcomeMerchant(
            data.name || 'عزيزي التاجر', // Could use user name if available
            newStore.name,
            storeLink,
            dashboardLink
          )
        });
      }
    } catch (emailErr) {
      console.error('Failed to send welcome email:', emailErr);
    }
    
    // Update the auth cookie with the new storeId
    const { cookies } = await import('next/headers');
    const isProd = process.env.NODE_ENV === 'production';
    cookies().set('seen_session_store_id', newStore.id, {
      httpOnly: true, 
      path: '/', 
      secure: isProd,
      sameSite: 'lax' as const,
      maxAge: 10 * 365 * 24 * 60 * 60 // 10 years
    });

    return { success: true, store: parsedStore };
  } catch (error: any) {
    console.error('Error creating store in Prisma:', error);
    return { success: false, error: error.message };
  }
}

export async function getStoresAction() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Parse JSON fields to match the expected frontend Store type
    return stores.map(store => ({
      ...store,
      themeConfig: store.themeConfig ? JSON.parse(store.themeConfig) : null,
      storeServices: store.storeServices ? JSON.parse(store.storeServices) : [],
      customRates: store.customRates ? JSON.parse(store.customRates) : null,
      paymentAccounts: store.paymentAccounts ? JSON.parse(store.paymentAccounts) : [],
      shippingMethods: store.shippingMethods ? JSON.parse(store.shippingMethods) : [],
    }));
  } catch (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
}

export async function getPlatformStatsAction() {
  try {
    const stores = await prisma.store.findMany({
      select: {
        totalSalesGMV: true,
        activeVisitorsNow: true,
        planStatus: true,
      }
    });

    const ordersCount = await prisma.order.count();

    const totalGMV = stores.reduce((sum, s) => sum + (s.totalSalesGMV || 0), 0);
    const activeVisitors = stores.reduce((sum, s) => sum + (s.activeVisitorsNow || 0), 0);
    const activeStores = stores.filter((s) => s.planStatus === 'active' || s.planStatus === 'trial').length;

    return {
      totalGMV_USD: Math.round(totalGMV),
      totalStoresCount: stores.length,
      activeStoresCount: activeStores,
      totalOrdersCount: ordersCount,
      totalRevenue_USD: 0,
      activeVisitorsOnline: activeVisitors,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalGMV_USD: 0,
      totalStoresCount: 0,
      activeStoresCount: 0,
      totalOrdersCount: 0,
      totalRevenue_USD: 0,
      activeVisitorsOnline: 0,
    };
  }
}

export async function getStoreBySlugAction(slug: string) {
  try {
    const isDomain = slug.includes('.');
    let store = null;
    if (isDomain) {
      store = await prisma.store.findUnique({
        where: { customDomain: slug }
      });
    }

    if (!store) {
      store = await prisma.store.findFirst({
        where: {
          OR: [
            { slug: slug },
            { id: slug }
          ]
        }
      });
    }

    if (!store) return null;

    return {
      ...store,
      themeConfig: store.themeConfig ? JSON.parse(store.themeConfig) : null,
      storeServices: store.storeServices ? JSON.parse(store.storeServices) : [],
      customRates: store.customRates ? JSON.parse(store.customRates) : null,
      paymentAccounts: store.paymentAccounts ? JSON.parse(store.paymentAccounts) : [],
      shippingMethods: store.shippingMethods ? JSON.parse(store.shippingMethods) : [],
    };
  } catch (error) {
    console.error('Error fetching store by slug:', error);
    return null;
  }
}

export async function getProductsByStoreAction(storeId: string) {
  try {
    const products = await prisma.product.findMany({
      where: { storeId },
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });
    return products.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
      tags: p.tags ? JSON.parse(p.tags) : [],
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getOrdersByStoreAction(storeId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return orders.map(o => ({
      ...o,
      items: o.items ? JSON.parse(o.items) : [],
    }));
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function deleteStoreAction(storeId: string) {
  try {
    await requireSuperAdmin();
    await prisma.store.delete({
      where: { id: storeId }
    });
    revalidatePath('/seenayhq7x');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting store:', error);
    return { success: false, error: error.message };
  }
}

import { convertCurrency } from '@/lib/currency-engine';

export async function updateStoreAction(storeId: string, data: any) {
  try {
    await requireStoreOwner(storeId);
    
    const currentStore = await prisma.store.findUnique({ where: { id: storeId } });
    if (!currentStore) throw new Error('Store not found');

    if (data.baseCurrency && data.baseCurrency !== currentStore.baseCurrency) {
      const products = await prisma.product.findMany({
        where: { storeId },
        include: { variants: true }
      });

      const updateOperations = products.map((product) => {
        const newPrice = convertCurrency(product.price, currentStore.baseCurrency as any, data.baseCurrency as any, currentStore.customRates);
        const newComparePrice = product.comparePrice ? convertCurrency(product.comparePrice, currentStore.baseCurrency as any, data.baseCurrency as any, currentStore.customRates) : null;
        
        return prisma.product.update({
          where: { id: product.id },
          data: {
            price: newPrice,
            comparePrice: newComparePrice,
            baseCurrency: data.baseCurrency,
            variants: product.variants.length > 0 ? {
              update: product.variants.map((v) => ({
                where: { id: v.id },
                data: {
                  priceOverride: v.priceOverride ? convertCurrency(v.priceOverride, currentStore.baseCurrency as any, data.baseCurrency as any, currentStore.customRates) : null
                }
              }))
            } : undefined
          }
        });
      });

      // Execute all updates in a single transaction to prevent timeouts
      if (updateOperations.length > 0) {
        await prisma.$transaction(updateOperations);
      }
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data,
    });
    revalidatePath('/seenayhq7x');
    revalidatePath(`/merchant/${updatedStore.slug}`, 'layout');
    revalidatePath(`/store/${updatedStore.slug}`, 'page');
    return { success: true, store: updatedStore };
  } catch (error: any) {
    console.error('Error updating store:', error);
    return { success: false, error: error.message };
  }
}

export async function getStoreCustomersAction(storeId: string) {
  try {
    // 1. Fetch all registered customers for this store
    const customers = await prisma.customer.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Fetch all orders for this store to aggregate accurate totals
    const allStoreOrders = await prisma.order.findMany({
      where: { storeId },
      select: {
        id: true,
        customerId: true,
        customerName: true,
        customerPhone: true,
        total: true,
        status: true,
        createdAt: true
      }
    });

    // 3. Match and calculate live accurate stats for each customer
    const customersWithLiveStats = await Promise.all(
      customers.map(async (cust) => {
        const cleanCustPhone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';

        const matchedOrders = allStoreOrders.filter(o => {
          if (o.customerId && o.customerId === cust.id) return true;
          if (cleanCustPhone && o.customerPhone) {
            const cleanOrderPhone = o.customerPhone.replace(/[^0-9]/g, '');
            if (
              cleanOrderPhone === cleanCustPhone ||
              cleanOrderPhone.endsWith(cleanCustPhone) ||
              cleanCustPhone.endsWith(cleanOrderPhone)
            ) {
              return true;
            }
          }
          return false;
        });

        const validOrders = matchedOrders.filter(o => o.status !== 'cancelled');
        const computedCount = validOrders.length;
        const computedTotal = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        // Sync with database if different so DB remains accurate
        if (cust.ordersCount !== computedCount || Math.abs(cust.totalSpent - computedTotal) > 0.01) {
          prisma.customer.update({
            where: { id: cust.id },
            data: {
              ordersCount: computedCount,
              totalSpent: computedTotal
            }
          }).catch(err => console.error('Failed to sync customer stats:', err));
        }

        // Link unlinked orders in database to this customer
        const unlinkedOrderIds = matchedOrders.filter(o => !o.customerId).map(o => o.id);
        if (unlinkedOrderIds.length > 0) {
          prisma.order.updateMany({
            where: { id: { in: unlinkedOrderIds } },
            data: { customerId: cust.id }
          }).catch(err => console.error('Failed to link orders to customer:', err));
        }

        return {
          ...cust,
          ordersCount: computedCount,
          totalSpent: computedTotal
        };
      })
    );

    // 4. Find guest orders whose phone is not in the registered customer list
    const existingPhones = new Set(
      customers
        .map(c => c.phone ? c.phone.replace(/[^0-9]/g, '') : '')
        .filter(Boolean)
    );

    const guestOrdersByPhone = new Map<string, typeof allStoreOrders>();
    for (const order of allStoreOrders) {
      if (!order.customerId) {
        const cleanPhone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : '';
        if (cleanPhone && !existingPhones.has(cleanPhone)) {
          if (!guestOrdersByPhone.has(cleanPhone)) {
            guestOrdersByPhone.set(cleanPhone, []);
          }
          guestOrdersByPhone.get(cleanPhone)!.push(order);
        }
      }
    }

    const guestCustomers: any[] = [];
    for (const [cleanPhone, gOrders] of guestOrdersByPhone.entries()) {
      const validOrders = gOrders.filter(o => o.status !== 'cancelled');
      const gTotal = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      const latestOrder = gOrders[0];

      try {
        const createdGuest = await prisma.customer.create({
          data: {
            storeId,
            name: latestOrder.customerName || 'عميل المتجر',
            phone: latestOrder.customerPhone,
            ordersCount: validOrders.length,
            totalSpent: gTotal,
            authProvider: 'guest'
          }
        });
        await prisma.order.updateMany({
          where: { id: { in: gOrders.map(o => o.id) } },
          data: { customerId: createdGuest.id }
        });
        guestCustomers.push(createdGuest);
      } catch {
        guestCustomers.push({
          id: `guest_${cleanPhone}`,
          storeId,
          name: latestOrder.customerName || 'عميل المتجر',
          phone: latestOrder.customerPhone,
          email: '',
          ordersCount: validOrders.length,
          totalSpent: gTotal,
          createdAt: latestOrder.createdAt,
          authProvider: 'guest'
        });
      }
    }

    const allResultCustomers = [...customersWithLiveStats, ...guestCustomers];
    return { success: true, customers: allResultCustomers };
  } catch (error: any) {
    console.error('Error fetching store customers:', error);
    return { success: false, error: 'حدث خطأ أثناء جلب العملاء' };
  }
}

export async function approveStoreRequestAction(storeId: string) {
  try {
    await requireSuperAdmin();

    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        planStatus: 'trial',
        planStartDate: new Date(),
        planEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      },
      include: { owner: true }
    });

    revalidatePath('/seenayhq7x');
    revalidatePath('/seenayhq7x/requests');

    return { success: true, store };
  } catch (error: any) {
    console.error('Error approving store:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectStoreRequestAction(storeId: string) {
  try {
    await requireSuperAdmin();

    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        planStatus: 'rejected',
        planEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days until deletion
      },
    });

    revalidatePath('/seenayhq7x');
    revalidatePath('/seenayhq7x/requests');

    return { success: true, store };
  } catch (error: any) {
    console.error('Error rejecting store:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleStoreStatusAction(storeId: string, newStatus: string) {
  try {
    const store = await prisma.store.findFirst({
      where: {
        OR: [
          { id: storeId },
          { slug: storeId }
        ]
      }
    });

    if (!store) {
      throw new Error(`لم يتم العثور على المتجر: ${storeId}`);
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: { planStatus: newStatus }
    });

    revalidatePath('/seenayhq7x');
    revalidatePath(`/merchant/${updated.slug}`, 'layout');
    revalidatePath(`/store/${updated.slug}`, 'page');

    return { success: true, store: updated };
  } catch (error: any) {
    console.error('Error toggling store status:', error);
    return { success: false, error: error.message };
  }
}

export async function getPlansAction(): Promise<SubscriptionPlan[]> {
  try {
    const item = await prisma.siteContent.findUnique({
      where: { key: 'system_subscription_plans' }
    });
    if (item && item.value) {
      return JSON.parse(item.value);
    }
  } catch (error) {
    console.error('Error fetching plans from DB:', error);
  }
  return INITIAL_PLANS;
}

export async function updatePlansAction(plans: SubscriptionPlan[]) {
  try {
    await prisma.siteContent.upsert({
      where: { key: 'system_subscription_plans' },
      update: { value: JSON.stringify(plans) },
      create: {
        key: 'system_subscription_plans',
        value: JSON.stringify(plans),
        group: 'plans',
        label: 'باقات الاشتراك وصلاحيات المتاجر',
      }
    });

    revalidatePath('/seenayhq7x');
    revalidatePath('/', 'layout');
    revalidatePath('/merchant/[slug]', 'layout');

    return { success: true };
  } catch (error: any) {
    console.error('Error updating plans in DB:', error);
    return { success: false, error: error.message };
  }
}

export async function requestPlanUpgradeAction(data: {
  storeId: string;
  planTier: string;
  billingCycle: 'monthly' | 'yearly';
  transferRef?: string;
  senderName?: string;
  proofUrl?: string;
  notes?: string;
}) {
  try {
    const store = await prisma.store.findFirst({
      where: {
        OR: [{ id: data.storeId }, { slug: data.storeId }]
      }
    });

    if (!store) {
      return { success: false, error: 'المتجر غير موجود' };
    }

    const currentTheme = typeof store.themeConfig === 'string'
      ? (() => { try { return JSON.parse(store.themeConfig); } catch { return {}; } })()
      : (store.themeConfig || {});

    const upgradeRequest = {
      planTier: data.planTier,
      billingCycle: data.billingCycle,
      transferRef: data.transferRef || '',
      senderName: data.senderName || '',
      proofUrl: data.proofUrl || '',
      notes: data.notes || '',
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    const updatedTheme = {
      ...currentTheme,
      pendingPlanUpgrade: upgradeRequest
    };

    await prisma.store.update({
      where: { id: store.id },
      data: {
        themeConfig: JSON.stringify(updatedTheme)
      }
    });

    revalidatePath('/seenayhq7x');
    revalidatePath(`/merchant/${store.slug}/subscription`);

    return { success: true, request: upgradeRequest };
  } catch (error: any) {
    console.error('Error requesting plan upgrade:', error);
    return { success: false, error: error.message };
  }
}

export async function approvePlanUpgradeAction(data: {
  storeId: string;
  planTier: string;
  monthsDuration?: number;
  customEndDate?: string;
}) {
  try {
    const store = await prisma.store.findFirst({
      where: {
        OR: [{ id: data.storeId }, { slug: data.storeId }]
      }
    });

    if (!store) {
      return { success: false, error: 'المتجر غير موجود' };
    }

    const currentTheme = typeof store.themeConfig === 'string'
      ? (() => { try { return JSON.parse(store.themeConfig); } catch { return {}; } })()
      : (store.themeConfig || {});

    delete currentTheme.pendingPlanUpgrade;

    const startDate = new Date();
    let endDate: Date;

    if (data.customEndDate) {
      endDate = new Date(data.customEndDate);
    } else {
      const months = data.monthsDuration || 1;
      endDate = new Date(startDate.getTime() + months * 30 * 24 * 60 * 60 * 1000);
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: {
        planTier: data.planTier,
        planStatus: 'active',
        planStartDate: startDate,
        planEndDate: endDate,
        themeConfig: JSON.stringify(currentTheme)
      }
    });

    revalidatePath('/seenayhq7x');
    revalidatePath(`/merchant/${store.slug}`, 'layout');
    revalidatePath(`/merchant/${store.slug}/subscription`);
    revalidatePath(`/store/${store.slug}`, 'page');

    return { success: true, store: updated };
  } catch (error: any) {
    console.error('Error approving plan upgrade:', error);
    return { success: false, error: error.message };
  }
}

export async function updateStoreSubscriptionDatesAction(data: {
  storeId: string;
  startDate?: string;
  endDate?: string;
  planStatus?: string;
  planTier?: string;
}) {
  try {
    const store = await prisma.store.findFirst({
      where: {
        OR: [{ id: data.storeId }, { slug: data.storeId }]
      }
    });

    if (!store) {
      return { success: false, error: 'المتجر غير موجود' };
    }

    const updateData: any = {};
    if (data.startDate) updateData.planStartDate = new Date(data.startDate);
    if (data.endDate) updateData.planEndDate = new Date(data.endDate);
    if (data.planStatus) updateData.planStatus = data.planStatus;
    if (data.planTier) updateData.planTier = data.planTier;

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: updateData
    });

    revalidatePath('/seenayhq7x');
    revalidatePath(`/merchant/${store.slug}`, 'layout');
    revalidatePath(`/merchant/${store.slug}/subscription`);

    return { success: true, store: updated };
  } catch (error: any) {
    console.error('Error updating subscription dates:', error);
    return { success: false, error: error.message };
  }
}
