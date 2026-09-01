import { Store, Product, Order, SubscriptionPlan, PlatformStats, SystemBroadcast, OrderStatus, SubscriptionPlanTier } from './types';
import { INITIAL_STORES, INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_PLANS, INITIAL_PLATFORM_STATS, INITIAL_BROADCASTS } from './initial-data';
import { authEngine } from './auth-engine';

const STORAGE_KEYS = {
  STORES: 'seen_clean_stores_v3',
  PRODUCTS: 'seen_clean_products_v3',
  ORDERS: 'seen_clean_orders_v3',
  PLANS: 'seen_clean_plans_v3',
  STATS: 'seen_clean_stats_v3',
  BROADCASTS: 'seen_clean_broadcasts_v3',
};

class StoreEngine {
  private isClient: boolean;
  private stores: Store[] = INITIAL_STORES;
  private products: Product[] = INITIAL_PRODUCTS;
  private orders: Order[] = INITIAL_ORDERS;
  private plans: SubscriptionPlan[] = INITIAL_PLANS;
  private stats: PlatformStats = INITIAL_PLATFORM_STATS;
  private broadcasts: SystemBroadcast[] = INITIAL_BROADCASTS;

  constructor() {
    this.isClient = typeof window !== 'undefined';
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (!this.isClient) return;

    try {
      const storedStores = localStorage.getItem(STORAGE_KEYS.STORES);
      if (storedStores) this.stores = JSON.parse(storedStores);
      else this.saveToStorage(STORAGE_KEYS.STORES, this.stores);

      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProducts) this.products = JSON.parse(storedProducts);
      else this.saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);

      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (storedOrders) this.orders = JSON.parse(storedOrders);
      else this.saveToStorage(STORAGE_KEYS.ORDERS, this.orders);

      const storedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (storedPlans) this.plans = JSON.parse(storedPlans);
      else this.saveToStorage(STORAGE_KEYS.PLANS, this.plans);

      const storedBroadcasts = localStorage.getItem(STORAGE_KEYS.BROADCASTS);
      if (storedBroadcasts) this.broadcasts = JSON.parse(storedBroadcasts);
      else this.saveToStorage(STORAGE_KEYS.BROADCASTS, this.broadcasts);
    } catch (e) {
      console.error('Error loading store state from localStorage:', e);
    }
  }

  private saveToStorage(key: string, data: any) {
    if (!this.isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Error saving ${key} to localStorage:`, e);
    }
  }

  // --- STORES ---
  public getStores(): Store[] {
    this.loadFromStorage();
    return this.stores;
  }

  public getStoreBySlug(slug: string): Store | undefined {
    this.loadFromStorage();
    return this.stores.find((s) => s.slug === slug || s.id === slug);
  }

  public createStore(data: Partial<Store> & { name: string; slug: string; phone: string }): Store {
    this.loadFromStorage();
    
    // Check if slug exists
    const cleanSlug = data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const existing = this.stores.find((s) => s.slug === cleanSlug);
    const finalSlug = existing ? `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}` : cleanSlug;

    const newStore: Store = {
      id: `store-${Date.now()}`,
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
      customRates: {
        YER_ADEN: 1910,
        YER_SANAA: 535,
        SAR: 3.75,
        USD: 1,
      },
      paymentAccounts: data.paymentAccounts || [
        {
          id: `pay-${Date.now()}-qutaibi`,
          type: 'qutaibi',
          name: 'بنك القطيبي الإسلامي - حساب رسمي / القطيبي باي',
          accountNumber: '1249827361',
          accountName: data.name,
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
          accountName: data.name,
          instructions: 'التحويل لحساب الكريمي وإرفاق الإشعار.',
          isActive: true,
        },
      ],
      shippingMethods: [
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
      ],
      planTier: 'free',
      planStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      activeVisitorsNow: 1,
      totalSalesGMV: 0,
      themeConfig: data.themeConfig,
      storeServices: data.storeServices,
      createdAt: new Date().toISOString(),
    };

    this.stores = [newStore, ...this.stores];
    this.saveToStorage(STORAGE_KEYS.STORES, this.stores);

    return newStore;
  }

  public updateStore(id: string, updates: Partial<Store>): Store | undefined {
    this.loadFromStorage();
    const idx = this.stores.findIndex((s) => s.id === id || s.slug === id);
    if (idx === -1) return undefined;

    this.stores[idx] = { ...this.stores[idx], ...updates };
    this.saveToStorage(STORAGE_KEYS.STORES, this.stores);
    return this.stores[idx];
  }

  public deleteStore(id: string) {
    this.loadFromStorage();
    this.stores = this.stores.filter((s) => s.id !== id && s.slug !== id);
    this.products = this.products.filter((p) => p.storeId !== id);
    this.orders = this.orders.filter((o) => o.storeId !== id);
    this.saveToStorage(STORAGE_KEYS.STORES, this.stores);
    this.saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    this.saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
  }

  // --- PRODUCTS ---
  public getProducts(storeId?: string): Product[] {
    this.loadFromStorage();
    if (storeId) {
      return this.products.filter((p) => p.storeId === storeId);
    }
    return this.products;
  }

  public getProductById(id: string): Product | undefined {
    this.loadFromStorage();
    return this.products.find((p) => p.id === id);
  }

  public createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'salesCount'>): Product {
    this.loadFromStorage();
    const newProduct: Product = {
      ...data,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      viewsCount: 0,
      salesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products = [newProduct, ...this.products];
    this.saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>): Product | undefined {
    this.loadFromStorage();
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;

    this.products[idx] = {
      ...this.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
    return this.products[idx];
  }

  public deleteProduct(id: string) {
    this.loadFromStorage();
    this.products = this.products.filter((p) => p.id !== id);
    this.saveToStorage(STORAGE_KEYS.PRODUCTS, this.products);
  }

  // --- ORDERS ---
  public getOrders(storeId?: string): Order[] {
    this.loadFromStorage();
    if (storeId) {
      return this.orders.filter((o) => o.storeId === storeId);
    }
    return this.orders;
  }

  public getOrderById(id: string): Order | undefined {
    this.loadFromStorage();
    return this.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  public createOrder(data: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
    this.loadFromStorage();
    const orderCount = this.orders.length + 1;
    const orderNumber = `ORD-${1000 + orderCount}`;

    const newOrder: Order = {
      ...data,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders = [newOrder, ...this.orders];
    this.saveToStorage(STORAGE_KEYS.ORDERS, this.orders);

    // Update store sales GMV
    const store = this.getStoreBySlug(data.storeId);
    if (store) {
      this.updateStore(store.id, {
        totalSalesGMV: (store.totalSalesGMV || 0) + data.total,
      });
    }

    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus, paymentProofStatus?: 'unverified' | 'verified' | 'rejected'): Order | undefined {
    this.loadFromStorage();
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return undefined;

    this.orders[idx].status = status;
    if (paymentProofStatus) {
      this.orders[idx].paymentProofStatus = paymentProofStatus;
    }
    this.orders[idx].updatedAt = new Date().toISOString();

    this.saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
    return this.orders[idx];
  }

  // --- PLANS ---
  public getPlans(): SubscriptionPlan[] {
    this.loadFromStorage();
    return this.plans;
  }

  public updatePlan(planId: SubscriptionPlanTier, updates: Partial<SubscriptionPlan>): SubscriptionPlan | undefined {
    this.loadFromStorage();
    const idx = this.plans.findIndex((p) => p.id === planId);
    if (idx === -1) return undefined;

    this.plans[idx] = { ...this.plans[idx], ...updates };
    this.saveToStorage(STORAGE_KEYS.PLANS, this.plans);
    return this.plans[idx];
  }

  public getPlatformStats(): PlatformStats {
    this.loadFromStorage();
    const stores = this.stores;
    const orders = this.orders;

    const totalGMV = stores.reduce((sum, s) => sum + (s.totalSalesGMV || 0), 0);
    const activeVisitors = stores.reduce((sum, s) => sum + (s.activeVisitorsNow || 0), 0);
    const activeStores = stores.filter((s) => s.planStatus === 'active' || s.planStatus === 'trial').length;

    return {
      totalGMV_USD: Math.round(totalGMV),
      totalStoresCount: stores.length,
      activeStoresCount: activeStores,
      totalOrdersCount: orders.length,
      totalRevenue_USD: 0,
      activeVisitorsOnline: activeVisitors,
    };
  }

  public getBroadcasts(): SystemBroadcast[] {
    this.loadFromStorage();
    return this.broadcasts;
  }

  public addBroadcast(data: Omit<SystemBroadcast, 'id' | 'createdAt' | 'isActive'>): SystemBroadcast {
    this.loadFromStorage();
    const newBc: SystemBroadcast = {
      ...data,
      id: `bc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    this.broadcasts = [newBc, ...this.broadcasts];
    this.saveToStorage(STORAGE_KEYS.BROADCASTS, this.broadcasts);
    return newBc;
  }

  public deleteBroadcast(id: string) {
    this.loadFromStorage();
    this.broadcasts = this.broadcasts.filter((b) => b.id !== id);
    this.saveToStorage(STORAGE_KEYS.BROADCASTS, this.broadcasts);
  }

  // Alias for createProduct used by products page
  public addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'salesCount'>): Product {
    return this.createProduct(data);
  }

  // Verify payment proof for an order
  public verifyPaymentProof(orderId: string, status: 'verified' | 'rejected'): Order | undefined {
    this.loadFromStorage();
    const idx = this.orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return undefined;

    this.orders[idx].paymentProofStatus = status;
    if (status === 'verified') {
      this.orders[idx].status = 'processing';
    }
    this.orders[idx].updatedAt = new Date().toISOString();
    this.saveToStorage(STORAGE_KEYS.ORDERS, this.orders);
    return this.orders[idx];
  }

  // Update store theme config
  public updateStoreTheme(storeId: string, themeConfig: any): Store | undefined {
    return this.updateStore(storeId, { themeConfig });
  }

  // Complete Clean Reset Function
  public wipeAllDataAndStartFresh() {
    if (!this.isClient) return;
    this.stores = [];
    this.products = [];
    this.orders = [];
    this.broadcasts = [];
    this.saveToStorage(STORAGE_KEYS.STORES, []);
    this.saveToStorage(STORAGE_KEYS.PRODUCTS, []);
    this.saveToStorage(STORAGE_KEYS.ORDERS, []);
    this.saveToStorage(STORAGE_KEYS.BROADCASTS, []);
  }
}

export const storeEngine = new StoreEngine();
