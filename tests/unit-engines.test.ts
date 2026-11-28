import test from 'node:test';
import assert from 'node:assert/strict';
import { convertCurrency, formatCurrency } from '../lib/currency-engine';
import { calculateInventoryOverview } from '../lib/inventory-engine';
import { isAiAllowedForStore } from '../lib/ai-access';
import { getSubscriptionExpiryInfo } from '../lib/store-helpers';
import {
  isStoreOfferCurrentlyActive,
  doesOfferApplyToProduct,
  resolveStorefrontOffersData,
  StoreOfferItem,
} from '../lib/offers-utils';
import {
  signSessionToken,
  verifySessionToken,
  createOtpChallengeToken,
  verifyOtpChallengeToken,
} from '../lib/session';
import {
  CURATED_COLOR_PALETTES,
  applySmartBackgroundChange,
  isDarkColor,
  resolveStorePalette,
  toSafeColorInputHex,
} from '../lib/theme-colors';
import {
  getCachedStore,
  setCachedStore,
  invalidateCachedStore,
  getCachedProducts,
  setCachedProducts,
  invalidateCachedProducts,
  getCachedReviews,
  setCachedReviews,
  invalidateCachedReviews,
  isIpBlockedCached,
  invalidateBlockedIpCache,
} from '../lib/server-cache';

test('currency-engine: same currency identity returns exact amount', () => {
  assert.equal(convertCurrency(150, 'SAR', 'SAR'), 150);
  assert.equal(convertCurrency(99.5, 'USD', 'USD'), 99.5);
});

test('currency-engine: nested custom rates convert forward and reverse accurately', () => {
  const customRates = {
    SAR: { YER_ADEN: 500, USD: 0.27 },
    USD: { YER_ADEN: 1900, SAR: 3.75 },
  };
  assert.equal(convertCurrency(10, 'SAR', 'YER_ADEN', customRates), 5000);
  assert.equal(convertCurrency(5000, 'YER_ADEN', 'SAR', customRates), 10);
});

test('currency-engine: formatCurrency formats numbers and handles fallback symbol cleanly', () => {
  assert.equal(formatCurrency(100, 'SAR'), '100.00 ر.س');
  assert.equal(formatCurrency(2500, 'YER_ADEN'), '2,500.00 ر.ي (عدن)');
  assert.equal(formatCurrency(50, 'undefined'), '50.00 ر.ي');
});

test('inventory-engine: calculateInventoryOverview aggregates variants and low/out stock counts', () => {
  const now = new Date().toISOString();
  const overview = calculateInventoryOverview([
    {
      id: 'p1', storeId: 's1', name: 'A', description: '', category: 'c', price: 100,
      baseCurrency: 'SAR', images: [], stock: 50, lowStockAlert: 5, isAvailable: true,
      variants: [
        { id: 'v1', name: 'Red', attributes: {}, stock: 2 },
        { id: 'v2', name: 'Blue', attributes: {}, stock: 2 },
      ],
      viewsCount: 150, salesCount: 2, tags: [], createdAt: now, updatedAt: now,
    },
    {
      id: 'p2', storeId: 's1', name: 'B', description: '', category: 'c', price: 50,
      baseCurrency: 'SAR', images: [], stock: 0, lowStockAlert: 5, isAvailable: true,
      variants: [], viewsCount: 10, salesCount: 25, tags: [], createdAt: now, updatedAt: now,
    },
  ]);

  assert.equal(overview.totalProducts, 2);
  assert.equal(overview.totalUnitsInStock, 4);
  assert.equal(overview.totalStockValueUSD, 400);
  assert.equal(overview.lowStockItemsCount, 1);
  assert.equal(overview.outOfStockItemsCount, 1);
  assert.equal(overview.fastMovingCount, 1);
  assert.equal(overview.slowMovingCount, 1);
});

test('ai-access: respects global toggle, store overrides, and subscription plan features', () => {
  const baseStore: any = {
    id: 's1',
    planTier: 'pro',
    themeConfig: {},
    storeServices: {},
  };
  const proPlans: any[] = [
    { id: 'free', features: ['dashboard', 'products'] },
    { id: 'pro', features: ['dashboard', 'ai_advisor'] },
  ];

  assert.equal(isAiAllowedForStore(baseStore, proPlans, 'true'), true);
  assert.equal(isAiAllowedForStore(baseStore, proPlans, 'false'), false);
  assert.equal(
    isAiAllowedForStore({ ...baseStore, themeConfig: JSON.stringify({ hideAi: true }) }, proPlans, 'true'),
    false
  );
  assert.equal(
    isAiAllowedForStore({ ...baseStore, storeServices: JSON.stringify({ aiAdvisor: false }) }, proPlans, 'true'),
    false
  );
  assert.equal(
    isAiAllowedForStore({ ...baseStore, planTier: 'free' }, proPlans, 'true'),
    false
  );
});

test('store-helpers: getSubscriptionExpiryInfo returns accurate states for suspended, expired, expiring_soon, trial, active', () => {
  const dayMs = 24 * 60 * 60 * 1000;
  assert.equal(getSubscriptionExpiryInfo({ planStatus: 'suspended' }).type, 'suspended');
  assert.equal(
    getSubscriptionExpiryInfo({ planStatus: 'expired', planEndDate: new Date(Date.now() - dayMs) }).type,
    'expired'
  );
  assert.equal(
    getSubscriptionExpiryInfo({ planStatus: 'active', planEndDate: new Date(Date.now() + 3 * dayMs) }).type,
    'expiring_soon'
  );
  assert.equal(
    getSubscriptionExpiryInfo({ planStatus: 'trial', planEndDate: new Date(Date.now() + 10 * dayMs) }).type,
    'trial'
  );
  assert.equal(
    getSubscriptionExpiryInfo({ planStatus: 'active', planEndDate: new Date(Date.now() + 30 * dayMs) }).type,
    'active'
  );
});

test('session: HMAC-SHA256 tokens verify cleanly and reject tampering or expiration', async () => {
  const token = await signSessionToken({
    userId: 'user-1',
    role: 'STORE_OWNER',
    storeId: 'store-1',
    kind: 'merchant',
  });
  const verified = await verifySessionToken(token);
  assert.ok(verified);
  assert.equal(verified.userId, 'user-1');
  assert.equal(verified.role, 'STORE_OWNER');
  assert.equal(verified.storeId, 'store-1');

  // Tamper payload character
  const [p, s] = token.split('.');
  const tampered = `${p.slice(0, -1)}${p.endsWith('A') ? 'B' : 'A'}.${s}`;
  assert.equal(await verifySessionToken(tampered), null);

  // Expired token
  const expired = await signSessionToken({ userId: 'u', role: 'STORE_OWNER', kind: 'merchant' }, -10);
  assert.equal(await verifySessionToken(expired), null);

  // OTP challenge verification
  const otpToken = await createOtpChallengeToken('User@Example.com', '4829', 600);
  assert.equal(await verifyOtpChallengeToken(otpToken, 'user@example.com', '4829'), true);
  assert.equal(await verifyOtpChallengeToken(otpToken, 'user@example.com', '0000'), false);
  assert.equal(await verifyOtpChallengeToken(otpToken, 'other@example.com', '4829'), false);
});

test('offers-utils: shows sidebar only when active offers or discounted products exist and sidebar is enabled', () => {
  const now = new Date('2026-11-28T12:00:00Z');
  const activeOffer: StoreOfferItem = {
    id: 'o1',
    title: 'عرض اليوم الوطني',
    type: 'percentage',
    discountValue: 25,
    discountStr: 'خصم 25%',
    scopeType: 'specific',
    productIds: ['p1'],
    startDate: '2026-11-20',
    endDate: '2026-11-30',
    isActive: true,
    createdAt: '2026-11-20T00:00:00Z',
  };
  const pausedOffer: StoreOfferItem = { ...activeOffer, id: 'o2', isActive: false };
  const expiredOffer: StoreOfferItem = { ...activeOffer, id: 'o3', endDate: '2026-11-25' };

  assert.equal(isStoreOfferCurrentlyActive(activeOffer, now), true);
  assert.equal(isStoreOfferCurrentlyActive(pausedOffer, now), false);
  assert.equal(isStoreOfferCurrentlyActive(expiredOffer, now), false);

  assert.equal(doesOfferApplyToProduct(activeOffer, 'p1'), true);
  assert.equal(doesOfferApplyToProduct(activeOffer, 'p2'), false);

  // Hidden when zero active offers & zero discounted products
  const emptyResult = resolveStorefrontOffersData(
    { themeConfig: JSON.stringify({ offersSidebarEnabled: true, offers: [pausedOffer, expiredOffer] }) },
    [{ id: 'p1', price: 100 }],
    now
  );
  assert.equal(emptyResult.shouldShowSidebar, false);

  // Visible when an active offer exists
  const activeResult = resolveStorefrontOffersData(
    { themeConfig: JSON.stringify({ offersSidebarEnabled: true, offers: [activeOffer] }) },
    [{ id: 'p1', price: 100 }],
    now
  );
  assert.equal(activeResult.shouldShowSidebar, true);
  assert.equal(activeResult.activeOffers.length, 1);

  // Hidden when merchant manually disabled sidebar even with active offer
  const manuallyDisabled = resolveStorefrontOffersData(
    { themeConfig: JSON.stringify({ offersSidebarEnabled: false, offers: [activeOffer] }) },
    [{ id: 'p1', price: 100 }],
    now
  );
  assert.equal(manuallyDisabled.shouldShowSidebar, false);

  // Visible automatically when product has comparePrice > price
  const discountedProductResult = resolveStorefrontOffersData(
    { themeConfig: JSON.stringify({ offersSidebarEnabled: true, offers: [] }) },
    [{ id: 'p1', price: 80, comparePrice: 120 }],
    now
  );
  assert.equal(discountedProductResult.shouldShowSidebar, true);
  assert.equal(discountedProductResult.discountedProducts.length, 1);
});

test('theme-colors: hex normalization, dark/light smart background contrast & palette resolution', () => {
  assert.equal(toSafeColorInputHex('#0d9488'), '#0d9488');
  assert.equal(toSafeColorInputHex('fff'), '#ffffff');
  assert.equal(toSafeColorInputHex('invalid-hex', '#3b82f6'), '#3b82f6');

  // Curated Navy Executive palette matches dark navy aesthetic
  const navy = CURATED_COLOR_PALETTES.find((p) => p.id === 'navy-executive');
  assert.ok(navy);
  assert.equal(isDarkColor(navy!.colors.background), true);
  assert.equal(isDarkColor(navy!.colors.surface), true);
  assert.equal(isDarkColor(navy!.colors.textMain), false);

  // Switching background from light to dark navy automatically flips surface & text to readable dark-theme colors
  const lightStart = {
    primary: '#0d9488',
    secondary: '#0f172a',
    background: '#f8fafc',
    surface: '#ffffff',
    textMain: '#0f172a',
    textMuted: '#64748b',
  };
  const switchedToDark = applySmartBackgroundChange(lightStart, '#071326');
  assert.equal(switchedToDark.background, '#071326');
  assert.equal(isDarkColor(switchedToDark.surface), true);
  assert.equal(isDarkColor(switchedToDark.textMain), false);

  // Switching back from dark to light restores white card surface and dark text
  const switchedToLight = applySmartBackgroundChange(switchedToDark, '#f8fafc');
  assert.equal(switchedToLight.background, '#f8fafc');
  assert.equal(switchedToLight.surface, '#ffffff');
  assert.equal(switchedToLight.textMain, '#0f172a');

  // resolveStorePalette guarantees legible text even if merchant persisted only dark background over default dark text
  const legacyPartialDark = resolveStorePalette({
    primary: '#3b82f6',
    secondary: '#0d9488',
    background: '#071326',
    surface: '#0f1f3d',
    textMain: '#0f172a',
    textMuted: '#1e293b',
  });
  assert.equal(legacyPartialDark.isDark, true);
  assert.equal(legacyPartialDark.isSurfaceDark, true);
  assert.equal(isDarkColor(legacyPartialDark.textMain), false);
  assert.ok(legacyPartialDark.headerBg.startsWith('rgba('));
});

test('server-cache: caches store/products/reviews/blockedIPs and clears cleanly on invalidation', async () => {
  // Store cache keyed by slug and id + sibling invalidation
  setCachedStore(['store-slug-a', 'store-id-a'], { id: 'store-id-a', slug: 'store-slug-a', name: 'Test Store' }, 5000);
  assert.equal(getCachedStore('store-slug-a')?.name, 'Test Store');
  assert.equal(getCachedStore('store-id-a')?.name, 'Test Store');
  invalidateCachedStore('store-id-a');
  assert.equal(getCachedStore('store-slug-a'), null);
  assert.equal(getCachedStore('store-id-a'), null);

  // Products and reviews caches
  setCachedProducts('store-id-a', [{ id: 'p1', name: 'Item 1' }], 5000);
  assert.equal(getCachedProducts('store-id-a')?.length, 1);
  invalidateCachedProducts('store-id-a');
  assert.equal(getCachedProducts('store-id-a'), null);

  setCachedReviews('store-id-a', [{ id: 'r1', rating: 5 }], 5000);
  assert.equal(getCachedReviews('store-id-a')?.length, 1);
  invalidateCachedReviews('store-id-a');
  assert.equal(getCachedReviews('store-id-a'), null);

  // Blocked IP cache avoids repeated DB lookup and resets on invalidation
  let dbLookups = 0;
  const lookup = async (ip: string) => {
    dbLookups += 1;
    return ip === '1.2.3.4' ? { reason: 'abuse' } : null;
  };
  const first = await isIpBlockedCached('1.2.3.4', lookup, 5000);
  const second = await isIpBlockedCached('1.2.3.4', lookup, 5000);
  assert.equal(first.blocked, true);
  assert.equal(second.blocked, true);
  assert.equal(dbLookups, 1);

  invalidateBlockedIpCache('1.2.3.4');
  await isIpBlockedCached('1.2.3.4', lookup, 5000);
  assert.equal(dbLookups, 2);
});
