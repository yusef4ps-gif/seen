import { Store, SubscriptionPlan } from '@/lib/types';
import { storeEngine } from '@/lib/store-engine';

/**
 * Determines whether AI generation features (buttons, assistants) should be visible and accessible
 * for a specific store.
 * 
 * Supports:
 * 1. Master global platform toggle (siteTexts.ai_enabled !== 'false')
 * 2. Subscription package features (plan.features includes 'ai_advisor')
 * 3. Store-level settings (themeConfig.hideAi, storeServices.aiAdvisor)
 */
export function isAiAllowedForStore(
  store: Store | null,
  plans?: SubscriptionPlan[],
  globalAiEnabled?: string | boolean | null
): boolean {
  // 1. Global Platform Toggle
  if (globalAiEnabled === 'false' || globalAiEnabled === false) {
    return false;
  }

  if (!store) return false;

  // 2. Store themeConfig setting (manual hide)
  if (store.themeConfig) {
    try {
      const cfg = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : store.themeConfig;
      if (cfg && cfg.hideAi === true) {
        return false;
      }
    } catch {}
  }

  // 3. Store services setting
  if ((store as any).storeServices) {
    try {
      const svcs = typeof (store as any).storeServices === 'string' ? JSON.parse((store as any).storeServices) : (store as any).storeServices;
      if (svcs && svcs.aiAdvisor === false) {
        return false;
      }
    } catch {}
  }

  // 4. Subscription Plan Features (ميزات الباقة المحددة من الإدارة العامة)
  const allPlans = (plans && plans.length > 0) ? plans : storeEngine.getPlans();
  const plan = allPlans.find(p => p.id?.toLowerCase() === store.planTier?.toLowerCase()) ||
               storeEngine.getPlans().find(p => p.id?.toLowerCase() === store.planTier?.toLowerCase());
               
  if (plan) {
    if (Array.isArray(plan.features)) {
      return plan.features.includes('ai_advisor');
    }
    if (typeof plan.aiFeatures === 'boolean') {
      return plan.aiFeatures;
    }
    return false;
  }

  return false;
}

export function isAiPlanAllowedForStore(
  store: Store | null,
  plans?: SubscriptionPlan[],
  globalAiEnabled?: string | boolean | null
): boolean {
  return isAiAllowedForStore(store, plans, globalAiEnabled);
}
