'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentCustomerAction } from './customer-auth';

// --- Customer Actions ---

/**
 * Submit a new review for a store
 */
export async function submitStoreReviewAction(storeId: string, rating: number, content: string) {
  try {
    const customer = await getCurrentCustomerAction();
    if (!customer) {
      return { success: false, error: 'يجب تسجيل الدخول لإضافة تقييم' };
    }

    const review = await prisma.storeReview.create({
      data: {
        storeId,
        customerId: customer.customerId,
        rating,
        content,
        status: 'pending' // default status
      }
    });

    return { success: true, data: review };
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return { success: false, error: 'حدث خطأ أثناء إضافة التقييم' };
  }
}

/**
 * Get published reviews for storefront
 */
export async function getPublishedReviewsAction(storeId: string) {
  try {
    const reviews = await prisma.storeReview.findMany({
      where: {
        storeId,
        status: 'published'
      },
      include: {
        customer: {
          select: {
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // limit to 20 for storefront
    });

    return { success: true, data: reviews };
  } catch (error) {
    console.error('Error fetching published reviews:', error);
    return { success: false, data: [] };
  }
}

// --- Merchant Actions ---

/**
 * Get all reviews for merchant dashboard
 */
export async function getStoreReviewsForMerchantAction(storeId: string) {
  try {
    const reviews = await prisma.storeReview.findMany({
      where: {
        storeId
      },
      include: {
        customer: {
          select: {
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return { success: true, data: reviews };
  } catch (error) {
    console.error('Error fetching store reviews:', error);
    return { success: false, data: [] };
  }
}

/**
 * Update review status
 */
export async function updateReviewStatusAction(reviewId: string, storeId: string, status: 'pending' | 'published' | 'hidden') {
  try {
    await prisma.storeReview.update({
      where: { id: reviewId },
      data: { status }
    });

    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { slug: true } });
    if (store) {
      revalidatePath(`/store/${store.slug}`, 'page');
      revalidatePath(`/merchant/${store.slug}/reviews`, 'page');
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating review status:', error);
    return { success: false, error: 'حدث خطأ أثناء تحديث الحالة' };
  }
}

/**
 * Delete a review
 */
export async function deleteReviewAction(reviewId: string, storeId: string) {
  try {
    await prisma.storeReview.delete({
      where: { id: reviewId }
    });

    const store = await prisma.store.findUnique({ where: { id: storeId }, select: { slug: true } });
    if (store) {
      revalidatePath(`/store/${store.slug}`, 'page');
      revalidatePath(`/merchant/${store.slug}/reviews`, 'page');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting review:', error);
    return { success: false, error: 'حدث خطأ أثناء الحذف' };
  }
}
