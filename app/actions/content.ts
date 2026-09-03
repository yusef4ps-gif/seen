'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/app/actions/auth';

// Fetch all site content
export async function getSiteContentAction() {
  try {
    const items = await prisma.siteContent.findMany();
    // Convert array to key-value object for easy lookup in frontend
    const dictionary: Record<string, string> = {};
    items.forEach((item) => {
      dictionary[item.key] = item.value;
    });
    return { success: true, dictionary, items };
  } catch (error: any) {
    console.error('Error fetching site content:', error);
    return { success: false, error: error.message };
  }
}

// Update multiple site content items at once
export async function updateSiteContentAction(
  updates: { key: string; value: string; group?: string; label?: string }[]
) {
  try {
    await requireSuperAdmin();
    for (const item of updates) {
      await prisma.siteContent.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: {
          key: item.key,
          value: item.value,
          group: item.group || 'general',
          label: item.label || item.key,
        },
      });
    }
    
    // Revalidate the home page to apply changes immediately
    revalidatePath('/');
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating site content:', error);
    return { success: false, error: error.message };
  }
}
