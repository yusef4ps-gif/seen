'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth, requireStoreOwner, requireSuperAdmin } from '@/app/actions/auth';
import { sendEmail, EmailTemplates } from '@/lib/notification-engine';

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
    await requireAuth();
    const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const existing = await prisma.store.findUnique({ where: { slug: cleanSlug } });
    const finalSlug = existing ? `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}` : cleanSlug;

    const newStore = await prisma.store.create({
      data: {
        slug: finalSlug,
        name: data.name,
        description: data.description || `المتجر الإلكتروني الرسمي لـ ${data.name}. تسوق أفضل المنتجات بأفضل الأسعار.`,
        category: data.category || 'عام',
        logo: data.logo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&auto=format&fit=crop&q=80',
        banner: data.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
        primaryColor: data.primaryColor || '#0f2b48',
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

    revalidatePath('/admin');
    revalidatePath('/');
    
    // Send Welcome Email
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
    const store = await prisma.store.findUnique({
      where: { slug }
    });

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
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting store:', error);
    return { success: false, error: error.message };
  }
}

export async function updateStoreAction(storeId: string, data: any) {
  try {
    await requireStoreOwner(storeId);
    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data,
    });
    revalidatePath('/admin');
    return { success: true, store: updatedStore };
  } catch (error: any) {
    console.error('Error updating store:', error);
    return { success: false, error: error.message };
  }
}
