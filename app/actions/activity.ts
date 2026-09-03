'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireStoreOwner, requireAuth } from '@/app/actions/auth';

export async function logActivityAction(data: {
  storeId: string;
  userName: string;
  action: string;
  entity: string;
  details: string;
  device: string;
}) {
  try {
    await requireStoreOwner(data.storeId);
    const activity = await prisma.activityLog.create({
      data: {
        storeId: data.storeId,
        userName: data.userName,
        action: data.action,
        entity: data.entity,
        details: data.details,
        device: data.device,
      },
    });
    
    // We can't revalidate by store slug easily here since we only have ID, 
    // but typically layout path is /merchant/[slug]
    
    return { success: true, activity };
  } catch (error: any) {
    console.error('Error logging activity:', error);
    return { success: false, error: error.message };
  }
}

export async function getStoreActivitiesAction(storeId: string) {
  try {
    await requireStoreOwner(storeId);
    const activities = await prisma.activityLog.findMany({
      where: { storeId },
      orderBy: { createdAt: 'desc' },
      take: 200, // Fetch the latest 200 logs
    });
    return activities;
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}
