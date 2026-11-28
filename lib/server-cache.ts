interface CacheEntry<T> {
  data: T;
  expires: number;
}

interface SeenServerCacheRegistry {
  stores: Map<string, CacheEntry<any>>;
  products: Map<string, CacheEntry<any[]>>;
  reviews: Map<string, CacheEntry<any[]>>;
  blockedIps: Map<string, CacheEntry<{ blocked: boolean; reason?: string }>>;
  plans: CacheEntry<any[]> | null;
}

const globalForCache = globalThis as unknown as {
  __seenServerCache?: SeenServerCacheRegistry;
};

function getRegistry(): SeenServerCacheRegistry {
  if (!globalForCache.__seenServerCache) {
    globalForCache.__seenServerCache = {
      stores: new Map(),
      products: new Map(),
      reviews: new Map(),
      blockedIps: new Map(),
      plans: null,
    };
  }
  return globalForCache.__seenServerCache;
}

function pruneIfOversized(map: Map<string, any>, maxEntries: number): void {
  if (map.size <= maxEntries) return;
  const now = Date.now();
  for (const [k, v] of Array.from(map.entries())) {
    if (!v || v.expires <= now) {
      map.delete(k);
    }
  }
  while (map.size > maxEntries) {
    const firstKey = map.keys().next().value;
    if (!firstKey) break;
    map.delete(firstKey);
  }
}

export function getCachedStore(key: string): any | null {
  const entry = getRegistry().stores.get(key);
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  if (entry) getRegistry().stores.delete(key);
  return null;
}

export function setCachedStore(keys: Array<string | undefined | null>, data: any, ttlMs = 60_000): void {
  const reg = getRegistry();
  pruneIfOversized(reg.stores, 1000);
  const expires = Date.now() + ttlMs;
  for (const k of keys) {
    if (k && typeof k === 'string') {
      reg.stores.set(k, { data, expires });
    }
  }
}

export function invalidateCachedStore(slugOrId?: string | null): void {
  const reg = getRegistry();
  if (!slugOrId) {
    reg.stores.clear();
    return;
  }
  const existing = reg.stores.get(slugOrId);
  reg.stores.delete(slugOrId);
  // Also purge sibling keys (id, slug, customDomain) pointing to the same store record
  const storeObj = existing?.data;
  if (storeObj) {
    if (storeObj.id) reg.stores.delete(storeObj.id);
    if (storeObj.slug) reg.stores.delete(storeObj.slug);
    if (storeObj.customDomain) reg.stores.delete(storeObj.customDomain);
  }
  for (const [k, entry] of Array.from(reg.stores.entries())) {
    const d = entry?.data;
    if (d && (d.id === slugOrId || d.slug === slugOrId || d.customDomain === slugOrId)) {
      reg.stores.delete(k);
    }
  }
}

export function getCachedProducts(storeId: string): any[] | null {
  const entry = getRegistry().products.get(storeId);
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  if (entry) getRegistry().products.delete(storeId);
  return null;
}

export function setCachedProducts(storeId: string, products: any[], ttlMs = 60_000): void {
  const reg = getRegistry();
  pruneIfOversized(reg.products, 500);
  reg.products.set(storeId, { data: products, expires: Date.now() + ttlMs });
}

export function invalidateCachedProducts(storeId?: string | null): void {
  const reg = getRegistry();
  if (!storeId) {
    reg.products.clear();
    return;
  }
  reg.products.delete(storeId);
}

export function getCachedReviews(storeId: string): any[] | null {
  const entry = getRegistry().reviews.get(storeId);
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  if (entry) getRegistry().reviews.delete(storeId);
  return null;
}

export function setCachedReviews(storeId: string, reviews: any[], ttlMs = 60_000): void {
  const reg = getRegistry();
  pruneIfOversized(reg.reviews, 500);
  reg.reviews.set(storeId, { data: reviews, expires: Date.now() + ttlMs });
}

export function invalidateCachedReviews(storeId?: string | null): void {
  const reg = getRegistry();
  if (!storeId) {
    reg.reviews.clear();
    return;
  }
  reg.reviews.delete(storeId);
}

export function getCachedPlans(): any[] | null {
  const entry = getRegistry().plans;
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  return null;
}

export function setCachedPlans(plans: any[], ttlMs = 120_000): void {
  getRegistry().plans = { data: plans, expires: Date.now() + ttlMs };
}

export function invalidateCachedPlans(): void {
  getRegistry().plans = null;
}

export async function isIpBlockedCached(
  ipAddress: string,
  lookupFn: (ip: string) => Promise<{ reason?: string | null } | null>,
  ttlMs = 60_000
): Promise<{ blocked: boolean; reason?: string }> {
  const reg = getRegistry();
  const cached = reg.blockedIps.get(ipAddress);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  const found = await lookupFn(ipAddress);
  const result = found ? { blocked: true, reason: found.reason ?? undefined } : { blocked: false };
  pruneIfOversized(reg.blockedIps, 2000);
  reg.blockedIps.set(ipAddress, { data: result, expires: Date.now() + ttlMs });
  return result;
}

export function invalidateBlockedIpCache(ipAddress?: string | null): void {
  const reg = getRegistry();
  if (!ipAddress) {
    reg.blockedIps.clear();
    return;
  }
  reg.blockedIps.delete(ipAddress);
}
