'use server';

import prisma from '@/lib/prisma';
import { requireStoreOwner } from '@/app/actions/auth';
import { getCurrentCustomerAction } from '@/app/actions/customer-auth';

export interface CustomerThreadMessage {
  id: string;
  sender: 'merchant' | 'customer';
  senderName: string;
  text: string;
  createdAt: string;
  readByCustomer?: boolean;
  readByMerchant?: boolean;
}

const MSG_GROUP = 'customer_messages';
const MAX_MESSAGES_PER_THREAD = 100;

function makeThreadKey(storeId: string, customerId: string) {
  return `cust_msg_${storeId}_${customerId}`;
}

function parseThread(raw?: string | null): CustomerThreadMessage[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getMerchantCustomerThreadAction(storeId: string, customerId: string) {
  try {
    await requireStoreOwner(storeId);
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, storeId },
      select: { id: true, name: true },
    });
    if (!customer) {
      return { success: false, error: 'العميل غير موجود في هذا المتجر', messages: [] as CustomerThreadMessage[] };
    }

    const key = makeThreadKey(storeId, customerId);
    const row = await prisma.siteContent.findUnique({ where: { key } });
    const messages = parseThread(row?.value);

    const hasUnread = messages.some((m) => m.sender === 'customer' && !m.readByMerchant);
    if (hasUnread && row) {
      const updated = messages.map((m) =>
        m.sender === 'customer' ? { ...m, readByMerchant: true } : m
      );
      await prisma.siteContent.update({
        where: { key },
        data: { value: JSON.stringify(updated) },
      });
      return { success: true, messages: updated };
    }

    return { success: true, messages };
  } catch (err: any) {
    console.error('Error reading merchant customer thread:', err);
    return { success: false, error: err?.message || 'تعذر جلب المحادثة', messages: [] as CustomerThreadMessage[] };
  }
}

export async function sendMessageToCustomerAction(storeId: string, customerId: string, text: string) {
  try {
    await requireStoreOwner(storeId);
    const cleanText = (text || '').trim();
    if (!cleanText) {
      return { success: false, error: 'يرجى كتابة نص الرسالة أولاً' };
    }
    if (cleanText.length > 2000) {
      return { success: false, error: 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف)' };
    }

    const [store, customer] = await Promise.all([
      prisma.store.findUnique({ where: { id: storeId }, select: { id: true, name: true } }),
      prisma.customer.findFirst({ where: { id: customerId, storeId }, select: { id: true, name: true } }),
    ]);
    if (!store || !customer) {
      return { success: false, error: 'تعذر التحقق من المتجر أو العميل' };
    }

    const key = makeThreadKey(storeId, customerId);
    const existing = await prisma.siteContent.findUnique({ where: { key } });
    const messages = parseThread(existing?.value).map((m) =>
      m.sender === 'customer' ? { ...m, readByMerchant: true } : m
    );

    const nextMsg: CustomerThreadMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sender: 'merchant',
      senderName: store.name,
      text: cleanText,
      createdAt: new Date().toISOString(),
      readByCustomer: false,
      readByMerchant: true,
    };

    const nextMessages = [...messages, nextMsg].slice(-MAX_MESSAGES_PER_THREAD);

    await prisma.siteContent.upsert({
      where: { key },
      update: { value: JSON.stringify(nextMessages), group: MSG_GROUP, label: storeId },
      create: { key, value: JSON.stringify(nextMessages), group: MSG_GROUP, label: storeId },
    });

    return { success: true, messages: nextMessages };
  } catch (err: any) {
    console.error('Error sending message to customer:', err);
    return { success: false, error: err?.message || 'فشل إرسال الرسالة' };
  }
}

export async function getMyCustomerMessagesAction(storeId: string) {
  try {
    const session = await getCurrentCustomerAction();
    if (!session || session.storeId !== storeId) {
      return { success: false, error: 'غير مسجل الدخول', messages: [] as CustomerThreadMessage[], unreadCount: 0 };
    }

    const key = makeThreadKey(storeId, session.customerId);
    const row = await prisma.siteContent.findUnique({ where: { key } });
    const messages = parseThread(row?.value);
    const unreadCount = messages.filter((m) => m.sender === 'merchant' && !m.readByCustomer).length;

    return { success: true, messages, unreadCount };
  } catch (err: any) {
    return { success: false, error: err?.message || 'تعذر جلب الرسائل', messages: [] as CustomerThreadMessage[], unreadCount: 0 };
  }
}

export async function markCustomerMessagesReadAction(storeId: string) {
  try {
    const session = await getCurrentCustomerAction();
    if (!session || session.storeId !== storeId) return { success: false };

    const key = makeThreadKey(storeId, session.customerId);
    const row = await prisma.siteContent.findUnique({ where: { key } });
    if (!row) return { success: true };

    const messages = parseThread(row.value);
    const hasUnread = messages.some((m) => m.sender === 'merchant' && !m.readByCustomer);
    if (!hasUnread) return { success: true };

    const updated = messages.map((m) =>
      m.sender === 'merchant' ? { ...m, readByCustomer: true } : m
    );
    await prisma.siteContent.update({
      where: { key },
      data: { value: JSON.stringify(updated) },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function sendCustomerReplyAction(storeId: string, text: string) {
  try {
    const session = await getCurrentCustomerAction();
    if (!session || session.storeId !== storeId) {
      return { success: false, error: 'يرجى تسجيل الدخول أولاً' };
    }
    const cleanText = (text || '').trim();
    if (!cleanText) {
      return { success: false, error: 'يرجى كتابة نص الرسالة' };
    }
    if (cleanText.length > 2000) {
      return { success: false, error: 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف)' };
    }

    const key = makeThreadKey(storeId, session.customerId);
    const existing = await prisma.siteContent.findUnique({ where: { key } });
    const messages = parseThread(existing?.value).map((m) =>
      m.sender === 'merchant' ? { ...m, readByCustomer: true } : m
    );

    const nextMsg: CustomerThreadMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      sender: 'customer',
      senderName: session.name || 'عميل',
      text: cleanText,
      createdAt: new Date().toISOString(),
      readByCustomer: true,
      readByMerchant: false,
    };

    const nextMessages = [...messages, nextMsg].slice(-MAX_MESSAGES_PER_THREAD);

    await prisma.siteContent.upsert({
      where: { key },
      update: { value: JSON.stringify(nextMessages), group: MSG_GROUP, label: storeId },
      create: { key, value: JSON.stringify(nextMessages), group: MSG_GROUP, label: storeId },
    });

    return { success: true, messages: nextMessages };
  } catch (err: any) {
    console.error('Error sending customer reply:', err);
    return { success: false, error: err?.message || 'تعذر إرسال الرد' };
  }
}
