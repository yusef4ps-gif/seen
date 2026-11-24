'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireStoreOwner } from '@/app/actions/auth';
import { invalidateStoreCache } from '@/app/actions/store';

export interface StoreOffer {
  id: string;
  title: string;
  type: 'percentage' | 'fixed' | 'bundle';
  discountValue: number;
  discountStr?: string;
  scopeType: 'all' | 'specific' | 'exclude'; // الكل، خدمات محددة، أو استبعاد خدمات محددة
  productIds: string[]; // المعرفات إما كمشمولة أو مستبعدة
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;
}

export async function getStoreOffersAction(storeId: string): Promise<StoreOffer[]> {
  try {
    await requireStoreOwner(storeId);
    const store = await prisma.store.findFirst({
      where: { OR: [{ id: storeId }, { slug: storeId }] },
      select: { themeConfig: true }
    });

    if (!store?.themeConfig) return [];
    
    let config: any = {};
    try {
      config = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : store.themeConfig;
    } catch {
      return [];
    }

    const offers: StoreOffer[] = Array.isArray(config.offers) ? config.offers : [];
    
    // Sort desc by creation
    return offers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching offers:', error);
    return [];
  }
}

export async function createStoreOfferAction(data: {
  storeId: string;
  title: string;
  type: 'percentage' | 'fixed' | 'bundle';
  discountValue: number;
  discountStr?: string;
  scopeType: 'all' | 'specific' | 'exclude';
  productIds: string[];
  startDate?: string | null;
  endDate?: string | null;
}) {
  try {
    await requireStoreOwner(data.storeId);
    const store = await prisma.store.findFirst({
      where: { OR: [{ id: data.storeId }, { slug: data.storeId }] }
    });

    if (!store) {
      return { success: false, error: 'المتجر غير موجود' };
    }

    let config: any = {};
    try {
      config = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : (store.themeConfig || {});
    } catch {
      config = {};
    }

    const currentOffers: StoreOffer[] = Array.isArray(config.offers) ? config.offers : [];

    const newOffer: StoreOffer = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: data.title.trim(),
      type: data.type,
      discountValue: Number(data.discountValue) || 0,
      discountStr: data.discountStr?.trim() || (data.type === 'percentage' ? `خصم ${data.discountValue}%` : `خصم بقيمة ${data.discountValue}`),
      scopeType: data.scopeType,
      productIds: Array.isArray(data.productIds) ? data.productIds : [],
      startDate: data.startDate || null,
      endDate: data.endDate || null,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    config.offers = [newOffer, ...currentOffers];

    await prisma.store.update({
      where: { id: store.id },
      data: {
        themeConfig: JSON.stringify(config)
      }
    });

    await invalidateStoreCache(store.slug);
    await invalidateStoreCache(store.id);
    try {
      revalidatePath(`/merchant/${store.slug}/offers`, 'page');
      revalidatePath(`/store/${store.slug}`, 'page');
    } catch (e) {}

    return { success: true, offer: newOffer };
  } catch (error: any) {
    console.error('Error creating offer:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء حفظ العرض' };
  }
}

export async function deleteStoreOfferAction(storeId: string, offerId: string) {
  try {
    await requireStoreOwner(storeId);
    const store = await prisma.store.findFirst({
      where: { OR: [{ id: storeId }, { slug: storeId }] }
    });

    if (!store) {
      return { success: false, error: 'المتجر غير موجود' };
    }

    let config: any = {};
    try {
      config = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : (store.themeConfig || {});
    } catch {
      config = {};
    }

    const currentOffers: StoreOffer[] = Array.isArray(config.offers) ? config.offers : [];
    config.offers = currentOffers.filter(o => o.id !== offerId);

    await prisma.store.update({
      where: { id: store.id },
      data: {
        themeConfig: JSON.stringify(config)
      }
    });

    await invalidateStoreCache(store.slug);
    await invalidateStoreCache(store.id);
    try {
      revalidatePath(`/merchant/${store.slug}/offers`, 'page');
      revalidatePath(`/store/${store.slug}`, 'page');
    } catch (e) {}

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء حذف العرض' };
  }
}

export async function toggleStoreOfferAction(storeId: string, offerId: string) {
  try {
    await requireStoreOwner(storeId);
    const store = await prisma.store.findFirst({
      where: { OR: [{ id: storeId }, { slug: storeId }] }
    });

    if (!store) {
      return { success: false, error: 'المتجر غير موجود' };
    }

    let config: any = {};
    try {
      config = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : (store.themeConfig || {});
    } catch {
      config = {};
    }

    const currentOffers: StoreOffer[] = Array.isArray(config.offers) ? config.offers : [];
    config.offers = currentOffers.map(o => o.id === offerId ? { ...o, isActive: !o.isActive } : o);

    await prisma.store.update({
      where: { id: store.id },
      data: {
        themeConfig: JSON.stringify(config)
      }
    });

    await invalidateStoreCache(store.slug);
    await invalidateStoreCache(store.id);
    try {
      revalidatePath(`/merchant/${store.slug}/offers`, 'page');
      revalidatePath(`/store/${store.slug}`, 'page');
    } catch (e) {}

    return { success: true };
  } catch (error: any) {
    console.error('Error toggling offer:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء تحديث حالة العرض' };
  }
}
