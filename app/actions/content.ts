'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireSuperAdmin } from '@/app/actions/auth';

const SECRET_SITE_CONTENT_KEYS = new Set(['ai_gemini_api_key', 'ai_openai_api_key']);

// In-Memory Content Cache (public-only keys, NEVER secrets)
let cachedSiteContent: { data: any; expires: number } | null = null;

// Fetch public site content (strips API keys so secrets never leak to public pages)
export async function getSiteContentAction() {
  const now = Date.now();
  if (cachedSiteContent && cachedSiteContent.expires > now) {
    return cachedSiteContent.data;
  }

  try {
    const items = await prisma.siteContent.findMany({
      where: {
        key: { notIn: Array.from(SECRET_SITE_CONTENT_KEYS) },
      },
    });
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

// Fetch full site content including AI API keys (Super Admin only)
export async function getAdminSiteContentAction() {
  try {
    await requireSuperAdmin();
    const items = await prisma.siteContent.findMany();
    const dictionary: Record<string, string> = {};
    items.forEach((item) => {
      dictionary[item.key] = item.value;
    });
    return { success: true, dictionary, items };
  } catch (error: any) {
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

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating site content:', error);
    return { success: false, error: error.message };
  }
}
