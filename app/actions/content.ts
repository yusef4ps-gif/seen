'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/app/actions/auth';

// In-Memory Content Cache
let cachedSiteContent: { data: any; expires: number } | null = null;

// Fetch all site content
export async function getSiteContentAction() {
  const now = Date.now();
  if (cachedSiteContent && cachedSiteContent.expires > now) {
    return cachedSiteContent.data;
  }

  try {
    const items = await prisma.siteContent.findMany();
    // Convert array to key-value object for easy lookup in frontend
    const dictionary: Record<string, string> = {};
    items.forEach((item) => {
      dictionary[item.key] = item.value;
    });
    const result = { success: true, dictionary, items };
    cachedSiteContent = { data: result, expires: now + 60_000 };
    return result;
  } catch (error: any) {
    console.error('Error fetching site content:', error);
    return { success: false, error: error.message };
  }
}

// Update multiple site content items at once
export async function updateSiteContentAction(
  updates: { key: string; value: string; group?: string; label?: string }[]
) {
  cachedSiteContent = null;
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
