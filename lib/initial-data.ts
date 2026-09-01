import { Store, Product, Order, SubscriptionPlan, PlatformStats, SystemBroadcast } from './types';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'الفترة التجريبية المجانية (14 يوماً)',
    nameAr: 'تجربة مجانية كاملة 14 يوماً - ابدأ بدون بطاقة',
    priceMonthlyUSD: 0,
    priceYearlyUSD: 0,
    commissionRate: 0,
    maxProducts: 50,
    maxOrdersPerMonth: 100,
    customDomainSupport: true,
    aiFeatures: true,
    posSupport: true,
    whatsappAutomation: true,
    prioritySupport: true,
    badge: '14 يوماً تجربة مجانية 🎁',
    trialDays: 14,
  },
  {
    id: 'starter',
    name: 'باقة الانطلاق',
    nameAr: 'باقة الانطلاق - للتجار والمشاريع الصاعدة',
    priceMonthlyUSD: 19,
    priceYearlyUSD: 190,
    commissionRate: 1.5,
    maxProducts: 200,
    maxOrdersPerMonth: 500,
    customDomainSupport: false,
    aiFeatures: true,
    posSupport: false,
    whatsappAutomation: true,
    prioritySupport: false,
    badge: 'الأكثر شعبية للبدايات',
  },
  {
    id: 'pro',
    name: 'باقة النمو المحترف',
    nameAr: 'باقة النمو المحترف - للمتاجر النشطة والمحترفة',
    priceMonthlyUSD: 49,
    priceYearlyUSD: 490,
    commissionRate: 0.8,
    maxProducts: 2000,
    maxOrdersPerMonth: 5000,
    customDomainSupport: true,
    aiFeatures: true,
    posSupport: true,
    whatsappAutomation: true,
    prioritySupport: true,
    badge: 'الخيار الأفضل للنمو والتوسع 🔥',
  },
  {
    id: 'vip',
    name: 'باقة المؤسسات VIP',
    nameAr: 'باقة المؤسسات والبراندات الكبرى',
    priceMonthlyUSD: 119,
    priceYearlyUSD: 1190,
    commissionRate: 0,
    maxProducts: 99999,
    maxOrdersPerMonth: 99999,
    customDomainSupport: true,
    aiFeatures: true,
    posSupport: true,
    whatsappAutomation: true,
    prioritySupport: true,
    badge: 'بدون أي عمولة 0% 👑',
  },
];

// 100% Clean / Empty Default Database
export const INITIAL_STORES: Store[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_PLATFORM_STATS: PlatformStats = {
  totalGMV_USD: 0,
  totalStoresCount: 0,
  activeStoresCount: 0,
  totalOrdersCount: 0,
  totalRevenue_USD: 0,
  activeVisitorsOnline: 0,
};

export const INITIAL_BROADCASTS: SystemBroadcast[] = [];
