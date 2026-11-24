import test from 'node:test';
import assert from 'node:assert/strict';
import { convertCurrency, formatCurrency } from '../lib/currency-engine';
import { calculateInventoryOverview } from '../lib/inventory-engine';
import { isAiAllowedForStore } from '../lib/ai-access';
import { getSubscriptionExpiryInfo } from '../lib/store-helpers';
import {
  signSessionToken,
  verifySessionToken,
  createOtpChallengeToken,
  verifyOtpChallengeToken,
} from '../lib/session';

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
