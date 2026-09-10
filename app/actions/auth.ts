'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage, sendEmail, EmailTemplates } from '@/lib/notification-engine';

export async function setAuthCookieAction(token: string, userId: string, role: string, storeId?: string) {
  cookies().set('seen_session_token', token, { httpOnly: true, path: '/' });
  cookies().set('seen_session_user_id', userId, { httpOnly: true, path: '/' });
  cookies().set('seen_session_role', role, { httpOnly: true, path: '/' });
  if (storeId) {
    cookies().set('seen_session_store_id', storeId, { httpOnly: true, path: '/' });
  } else {
    cookies().delete('seen_session_store_id');
  }
  return { success: true };
}

export async function clearAuthCookieAction() {
  cookies().delete('seen_session_token');
  cookies().delete('seen_session_user_id');
  cookies().delete('seen_session_role');
  cookies().delete('seen_session_store_id');
  return { success: true };
}

// Authentication Utility for Server Actions
export async function requireAuth() {
  const userId = cookies().get('seen_session_user_id')?.value;
  const role = cookies().get('seen_session_role')?.value;
  const storeId = cookies().get('seen_session_store_id')?.value;

  if (!userId) {
    // Development bypass for easy testing
    if (process.env.NODE_ENV === 'development') {
      return { userId: 'dev-user', role: 'SUPER_ADMIN', storeId: 'dev-store' };
    }
    throw new Error('Unauthorized');
  }

  return { userId, role, storeId };
}

export async function requireStoreOwner(targetStoreId: string) {
  const { userId, role, storeId } = await requireAuth();
  
  if (role === 'SUPER_ADMIN') return true;
  
  if (storeId !== targetStoreId) {
    throw new Error('Forbidden: You do not have access to this store.');
  }

  return true;
}

export async function requireSuperAdmin() {
  const { role } = await requireAuth();
  if (role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required.');
  }
  return true;
}

// ---------------------------------------------------------------------------
// Merchant Authentication Actions
// ---------------------------------------------------------------------------

export async function loginMerchantAction(phoneOrEmail: string, password: string) {
  try {
    // 1. Find the user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: phoneOrEmail },
          { phone: phoneOrEmail }
        ]
      },
      include: { stores: true }
    });

    if (!user) {
      return { success: false, error: 'الحساب غير مسجل.', isEmailValid: false };
    }

    if (user.password !== password) {
      return { success: false, error: 'كلمة المرور غير صحيحة.', isEmailValid: true };
    }

    if (user.role !== 'STORE_OWNER' && user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'هذا الحساب غير مصرح له بالدخول كتاجر.' };
    }

    const storeId = user.stores[0]?.id;
    const slug = user.stores[0]?.slug;
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return { 
      success: true, 
      userId: user.id, 
      role: user.role, 
      storeId,
      slug
    };

  } catch (error) {
    console.error('Error in loginMerchantAction:', error);
    return { success: false, error: 'حدث خطأ في النظام، يرجى المحاولة لاحقاً.' };
  }
}

export async function sendVerificationCodeAction(email: string, name: string) {
  try {
    // 1. Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email }
    });

    if (existingUser) {
      return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً.' };
    }

    // 2. Generate a 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Send email using Resend
    const result = await sendEmail({
      to: email,
      subject: 'كود التحقق الخاص بك من منصة سِين',
      html: EmailTemplates.VerificationCode(name, code)
    });

    if (!result.success && !result.simulated) {
      return { success: false, error: 'فشل إرسال كود التحقق. يرجى التأكد من صحة البريد الإلكتروني.' };
    }

    // Return code so the client can verify it
    return { success: true, code };
  } catch (error) {
    console.error('Error in sendVerificationCodeAction:', error);
    return { success: false, error: 'حدث خطأ في النظام، يرجى المحاولة لاحقاً.' };
  }
}

export async function registerMerchantAction(data: { name: string; phone: string; email: string; password: string; country: string; city: string }) {
  try {
    // 1. Check if user already exists by phone or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          { email: data.email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.phone === data.phone) return { success: false, error: 'رقم الهاتف مسجل مسبقاً.' };
      if (existingUser.email === data.email) return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً.' };
    }

    // 2. Create the User
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: 'STORE_OWNER',
        status: 'active'
      }
    });

    // 3. Create a default store for the merchant
    // slug must be unique, so we'll generate a random one based on the name or a timestamp
    const baseSlug = data.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'store';
    const slug = `${baseSlug}-${Math.random().toString(36).substr(2, 5)}`;
    const now = new Date();
    const planEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days trial
    
    const newStore = await prisma.store.create({
      data: {
        name: `متجر ${data.name}`,
        slug: slug,
        ownerId: newUser.id,
        phone: data.phone,
        city: `${data.country} - ${data.city}`, // Store country/city here to avoid DB migrations
        address: `${data.country}, ${data.city}`,
        planStartDate: now,
        planEndDate: planEndDate
      }
    });

    // 4. Send Welcome WhatsApp Message
    const trialDays = 14;
    const startDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const welcomeMessage = `أهلاً بك في منصة سِين! 🚀\nمرحباً ${data.name}،\nلقد تم إنشاء متجرك بنجاح.\n\nتاريخ الاشتراك: ${startDate}\nلديك فترة تجريبية مجانية لمدة ${trialDays} يوماً.\n\nرابط لوحة التحكم:\nhttps://seen.app/merchant/${newStore.slug}`;
    
    // Call in background
    sendWhatsAppMessage({
      to: data.phone,
      message: welcomeMessage
    });

    return { 
      success: true, 
      userId: newUser.id, 
      role: newUser.role, 
      storeId: newStore.id,
      slug: newStore.slug
    };

  } catch (error) {
    console.error('Error in registerMerchantAction:', error);
    return { success: false, error: 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة لاحقاً.' };
  }
}
