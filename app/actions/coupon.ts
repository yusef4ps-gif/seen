'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireStoreOwner } from '@/app/actions/auth';

export async function getCouponsAction(storeId: string) {
  try {
    await requireStoreOwner(storeId);
    const coupons = await prisma.coupon.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' }
    });
    return coupons;
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return [];
  }
}

export async function createCouponAction(data: {
  storeId: string;
  code: string;
  discount: number;
  type: string;
  maxUses: number;
  expiry?: Date | null;
  appliesTo?: string;
}) {
  try {
    await requireStoreOwner(data.storeId);
    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: {
        storeId_code: {
          storeId: data.storeId,
          code: data.code.toUpperCase()
        }
      }
    });
    if (existing) {
      return { success: false, error: 'كود الخصم مستخدم مسبقاً في هذا المتجر' };
    }

    const coupon = await prisma.coupon.create({
      data: {
        ...data,
        expiry: data.expiry ? new Date(data.expiry) : null,
        discount: Number(data.discount) || 0,
        maxUses: Number(data.maxUses) || 0,
        code: data.code.toUpperCase(),
      }
    });
    
    // Attempt to get the store slug to revalidate path
    const store = await prisma.store.findUnique({ where: { id: data.storeId } });
    if (store) {
      revalidatePath(`/merchant/${store.slug}/coupons`);
      revalidatePath(`/store/${store.slug}`);
    }
    
    return { success: true, coupon };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return { success: false, error: 'حدث خطأ أثناء إنشاء الكوبون' };
  }
}

export async function deleteCouponAction(id: string, storeId: string, slug: string) {
  try {
    await requireStoreOwner(storeId);
    await prisma.coupon.delete({
      where: {
        id,
      }
    });
    revalidatePath(`/merchant/${slug}/coupons`);
    revalidatePath(`/store/${slug}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, error: 'حدث خطأ أثناء الحذف' };
  }
}

export async function validateCouponAction(code: string, storeId: string) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: {
        storeId_code: {
          storeId,
          code: code.toUpperCase()
        }
      }
    });

    if (!coupon) return { valid: false, error: 'كود الخصم غير صحيح' };
    if (!coupon.isActive) return { valid: false, error: 'كود الخصم موقوف مؤقتاً' };
    if (coupon.maxUses > 0 && coupon.usageCount >= coupon.maxUses) return { valid: false, error: 'تم استنفاد الحد الأقصى لاستخدام الكوبون' };
    if (coupon.expiry && new Date() > coupon.expiry) return { valid: false, error: 'عذراً، كود الخصم منتهي الصلاحية' };

    return { valid: true, coupon };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, error: 'حدث خطأ أثناء التحقق' };
  }
}
