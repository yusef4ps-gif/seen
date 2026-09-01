export type CurrencyCode = 'YER_ADEN' | 'YER_SANAA' | 'SAR' | 'USD';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  rateToUSD: number; // Conversion baseline
}

export type OrderStatus = 
  | 'pending_payment' // بانتظار تأكيد التحويل
  | 'new'             // طلب جديد
  | 'processing'      // قيد التجهيز
  | 'shipped'         // تم الشحن والتوصيل
  | 'delivered'       // تم التسليم بنجاح
  | 'cancelled';      // ملغي

export type PaymentMethodType = 
  | 'cod'             // الدفع عند الاستلام
  | 'kuraimi'         // حساب الكريمي / خدمة حاسب
  | 'jawali'          // محفظة جوالي
  | 'onecash'         // محفظة ون كاش
  | 'floosak'         // محفظة فلوسك
  | 'alamqi'          // العمقي للصرافة
  | 'qutaibi'         // بنك القطيبي
  | 'bank_transfer';  // تحويل بنكي عام

export interface PaymentAccountConfig {
  id: string;
  type: PaymentMethodType;
  name: string;
  accountNumber: string;
  accountName: string;
  instructions?: string;
  isActive: boolean;
  qrCodeUrl?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  cost: number;
  currency: CurrencyCode;
  estimatedDelivery: string;
  isPickup?: boolean;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "أزرق - L"
  attributes: {
    color?: string;
    size?: string;
    material?: string;
  };
  priceOverride?: number;
  stock: number;
  sku?: string;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  category: string;
  price: number; // in store base currency
  comparePrice?: number;
  baseCurrency: CurrencyCode;
  images: string[];
  stock: number;
  lowStockAlert: number;
  isAvailable: boolean;
  isFeatured?: boolean;
  variants: ProductVariant[];
  viewsCount: number;
  salesCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "ORD-9824"
  storeId: string;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  deliveryType: 'delivery' | 'pickup';
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  currency: CurrencyCode;
  paymentMethod: PaymentMethodType;
  paymentProofUrl?: string; // Receipt screenshot
  paymentProofStatus?: 'unverified' | 'verified' | 'rejected';
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AbandonedCart {
  id: string;
  storeId: string;
  customerName?: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  currency: CurrencyCode;
  abandonedAt: string;
  recoverySentAt?: string;
  recovered: boolean;
}

export type SubscriptionPlanTier = 'free' | 'starter' | 'pro' | 'vip';

export interface SubscriptionPlan {
  id: SubscriptionPlanTier;
  name: string;
  nameAr: string;
  priceMonthlyUSD: number;
  priceYearlyUSD: number;
  commissionRate: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  customDomainSupport: boolean;
  aiFeatures: boolean;
  posSupport: boolean;
  whatsappAutomation: boolean;
  prioritySupport: boolean;
  badge?: string;
}

// Visual Theme Builder & Customizer Types
export type ThemeSectionType = 
  | 'announcement_bar'
  | 'hero_slider'
  | 'features_strip'
  | 'featured_categories'
  | 'products_grid'
  | 'promo_banner'
  | 'testimonials'
  | 'newsletter';

export interface ThemeSection {
  id: string;
  type: ThemeSectionType;
  title: string;
  subtitle?: string;
  isVisible: boolean;
  order: number;
  settings: {
    bannerImageUrl?: string;
    bannerTitle?: string;
    bannerSubtitle?: string;
    ctaText?: string;
    discountCode?: string;
    backgroundColor?: string;
    textColor?: string;
    itemsCount?: number;
  };
}

export interface ThemeConfig {
  presetId: 'fashion-luxury' | 'tech-modern' | 'yemen-roastery' | 'minimal-clean';
  colors: {
    primary: string;       // Primary brand button & active color
    secondary: string;     // Accent & highlight
    background: string;    // Page canvas background
    surface: string;       // Cards & elements surface
    textMain: string;      // Main heading color
    textMuted: string;     // Subtext color
  };
  typography: {
    fontFamily: 'Tajawal' | 'Cairo' | 'Readex Pro' | 'Almarai';
    headingWeight: 'bold' | 'black';
  };
  layout: {
    borderRadius: 'sharp' | 'curved' | 'pill'; // 4px | 16px | 9999px
    cardShadow: 'none' | 'subtle' | 'elevated';
    productCardStyle: 'classic' | 'minimal' | 'bordered';
  };
  sections: ThemeSection[];
}

export interface ThemePreset {
  id: 'fashion-luxury' | 'tech-modern' | 'yemen-roastery' | 'minimal-clean';
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  config: ThemeConfig;
}

export interface Store {
  id: string;
  slug: string; // e.g. "aden-boutique"
  name: string;
  description: string;
  category: string;
  logo: string;
  banner: string;
  primaryColor: string; // Hex e.g. #0d9488
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  address: string;
  baseCurrency: CurrencyCode;
  customRates: {
    YER_ADEN: number;
    YER_SANAA: number;
    SAR: number;
    USD: number;
  };
  paymentAccounts: PaymentAccountConfig[];
  shippingMethods: ShippingMethod[];
  planTier: SubscriptionPlanTier;
  planStatus: 'active' | 'trial' | 'expired' | 'suspended';
  trialEndsAt?: string;
  customDomain?: string;
  activeVisitorsNow: number;
  totalSalesGMV: number;
  themeConfig?: ThemeConfig;
  storeServices?: {
    delivery?: boolean;
    packaging?: boolean;
    whatsapp?: boolean;
    aiAdvisor?: boolean;
  };
  createdAt: string;
}

export interface PlatformStats {
  totalGMV_USD: number;
  totalStoresCount: number;
  activeStoresCount: number;
  totalOrdersCount: number;
  totalRevenue_USD: number;
  activeVisitorsOnline: number;
}

export interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  createdAt: string;
  isActive: boolean;
}

// --- AUTHENTICATION & MULTI-TIER RBAC TYPES ---
export type UserRole = 'SUPER_ADMIN' | 'STORE_OWNER' | 'STORE_STAFF' | 'CUSTOMER';

export type StaffPermission = 
  | 'manage_products'
  | 'manage_inventory'
  | 'manage_orders'
  | 'manage_customers'
  | 'manage_marketing'
  | 'view_analytics'
  | 'manage_settings'
  | 'manage_theme';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string; // Hashed/stored for demo authentication
  role: UserRole;
  storeId?: string; // Linked store ID if owner/staff
  storeSlug?: string;
  storeName?: string;
  staffTitle?: string; // e.g. "مدير العمليات", "أمين المخزون", "مسؤول التوصيل"
  permissions?: StaffPermission[];
  status: 'active' | 'suspended';
  avatarUrl?: string;
  totalSpent?: number; // For customer CRM
  ordersCount?: number; // For customer CRM
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

