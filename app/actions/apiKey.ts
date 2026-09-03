'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function getApiKeysAction(storeId: string) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { apiKeys: true }
    });
    
    if (!store) return [];
    
    try {
      return JSON.parse(store.apiKeys);
    } catch (e) {
      return [];
    }
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return [];
  }
}

export async function generateApiKeyAction(storeId: string, label: string = 'Default Key') {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { apiKeys: true }
    });
    
    if (!store) throw new Error('Store not found');
    
    let keys = [];
    try {
      keys = JSON.parse(store.apiKeys);
    } catch (e) {
      keys = [];
    }
    
    // Generate secure key
    const newKeyStr = 'sk_live_' + crypto.randomBytes(16).toString('hex');
    
    const newKeyObj = {
      id: crypto.randomUUID(),
      key: newKeyStr,
      label,
      createdAt: new Date().toISOString()
    };
    
    keys.push(newKeyObj);
    
    await prisma.store.update({
      where: { id: storeId },
      data: { apiKeys: JSON.stringify(keys) }
    });
    
    revalidatePath(`/merchant/[slug]/settings`);
    return newKeyObj;
  } catch (error) {
    console.error('Error generating API key:', error);
    throw new Error('Failed to generate API key');
  }
}

export async function deleteApiKeyAction(storeId: string, keyId: string) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { apiKeys: true }
    });
    
    if (!store) throw new Error('Store not found');
    
    let keys = [];
    try {
      keys = JSON.parse(store.apiKeys);
    } catch (e) {
      keys = [];
    }
    
    keys = keys.filter((k: any) => k.id !== keyId);
    
    await prisma.store.update({
      where: { id: storeId },
      data: { apiKeys: JSON.stringify(keys) }
    });
    
    revalidatePath(`/merchant/[slug]/settings`);
    return true;
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw new Error('Failed to delete API key');
  }
}
