export interface StoreOfferItem {
  id: string;
  title: string;
  type: 'percentage' | 'fixed' | 'bundle';
  discountValue: number;
  discountStr?: string;
  scopeType: 'all' | 'specific' | 'exclude';
  productIds: string[];
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
}

export function isStoreOfferCurrentlyActive(offer: StoreOfferItem, now: Date = new Date()): boolean {
  if (!offer || !offer.isActive) return false;
  if (offer.startDate) {
    const start = new Date(offer.startDate);
    if (!Number.isNaN(start.getTime()) && start > now) {
      return false;
    }
  }
  if (offer.endDate) {
    const raw = String(offer.endDate).trim();
    // Date-only values (YYYY-MM-DD) stay active through the end of that calendar day
    const end = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T23:59:59.999`) : new Date(raw);
    if (!Number.isNaN(end.getTime()) && end < now) {
      return false;
    }
  }
  return true;
}

export function doesOfferApplyToProduct(offer: StoreOfferItem, productId: string): boolean {
  if (!offer || !productId) return false;
  if (offer.scopeType === 'all') return true;
  const ids = Array.isArray(offer.productIds) ? offer.productIds : [];
  if (offer.scopeType === 'specific') return ids.includes(productId);
  if (offer.scopeType === 'exclude') return !ids.includes(productId);
  return true;
}

export function resolveStorefrontOffersData(
  store: any,
  products: any[],
  now: Date = new Date()
): {
  sidebarEnabled: boolean;
  activeOffers: StoreOfferItem[];
  discountedProducts: any[];
  shouldShowSidebar: boolean;
} {
  let config: any = {};
  if (store?.themeConfig) {
    if (typeof store.themeConfig === 'string') {
      try {
        config = JSON.parse(store.themeConfig);
      } catch {
        config = {};
      }
    } else if (typeof store.themeConfig === 'object') {
      config = store.themeConfig;
    }
  }

  const sidebarEnabled = config?.offersSidebarEnabled !== false;
  const rawOffers: StoreOfferItem[] = Array.isArray(config?.offers) ? config.offers : [];
  const activeOffers = rawOffers.filter((offer) => isStoreOfferCurrentlyActive(offer, now));
  const discountedProducts = (Array.isArray(products) ? products : []).filter(
    (p) => Number(p?.comparePrice) > Number(p?.price) && Number(p?.comparePrice) > 0
  );

  const shouldShowSidebar =
    sidebarEnabled && (activeOffers.length > 0 || discountedProducts.length > 0);

  return {
    sidebarEnabled,
    activeOffers,
    discountedProducts,
    shouldShowSidebar,
  };
}
