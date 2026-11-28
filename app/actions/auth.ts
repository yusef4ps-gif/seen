'use server';

import { cookies, headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage, sendEmail, EmailTemplates } from '@/lib/notification-engine';
import { getIpLocation } from '@/lib/geo';
import {
  signSessionToken,
  verifySessionToken,
  createOtpChallengeToken,
  verifyOtpChallengeToken,
} from '@/lib/session';
import { isIpBlockedCached, invalidateBlockedIpCache } from '@/lib/server-cache';

const REG_OTP_COOKIE = 'seen_reg_otp';

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

async function verifyAndUpgradePassword(user: { id: string; password: string }, candidate: string): Promise<boolean> {
  if (!user.password) return false;
  if (user.password.startsWith('$2')) {
    return bcrypt.compare(candidate, user.password);
  }
  if (user.password !== candidate) return false;
  // Transparently upgrade legacy plaintext password to bcrypt hash on successful login
  try {
    const hashed = await hashPassword(candidate);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  } catch (err) {
    console.warn('Password upgrade skipped:', err);
  }
  return true;
}

export async function issueMerchantSessionCookies(userId: string, role: string, storeId?: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const kind = role === 'SUPER_ADMIN' ? 'admin' : 'merchant';
  const signedToken = await signSessionToken({ userId, role, storeId, kind });

  const options = {
    httpOnly: true,
    path: '/',
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  };

  cookies().set('seen_session_token', signedToken, options);
  cookies().set('seen_session_user_id', userId, options);
  cookies().set('seen_session_role', role, options);
  if (storeId) {
    cookies().set('seen_session_store_id', storeId, options);
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

export async function checkAuthStatusAction() {
  try {
    const auth = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true, phone: true, role: true, status: true, avatarUrl: true },
    });
    if (!user || user.status === 'suspended') {
      await clearAuthCookieAction();
      return { isAuthenticated: false };
    }
    return {
      isAuthenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl || undefined,
        storeId: auth.storeId,
      },
    };
  } catch {
    return { isAuthenticated: false };
  }
}

// Authentication Utility for Server Actions
export async function requireAuth() {
  const token = cookies().get('seen_session_token')?.value;
  if (!token) {
    throw new Error('Unauthorized');
  }

  const payload = await verifySessionToken(token);
  if (!payload || (payload.kind !== 'merchant' && payload.kind !== 'admin')) {
    throw new Error('Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, status: true },
  });

  if (!user || user.status === 'suspended') {
    throw new Error('Unauthorized');
  }

  return {
    userId: user.id,
    role: user.role,
    storeId: payload.storeId,
  };
}

export async function requireStoreOwner(targetStoreId: string) {
  const { userId, role } = await requireAuth();

  if (role === 'SUPER_ADMIN') return true;

  const store = await prisma.store.findFirst({
    where: { OR: [{ id: targetStoreId }, { slug: targetStoreId }] },
    select: { id: true, ownerId: true },
  });

  if (!store || store.ownerId !== userId) {
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
    const cleanIdentifier = phoneOrEmail.trim().toLowerCase();
    const rawIdentifier = phoneOrEmail.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { email: rawIdentifier },
          { phone: rawIdentifier },
        ],
      },
      include: {
        stores: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return { success: false, error: 'الحساب غير مسجل.', isEmailValid: false };
    }

    if (user.status === 'suspended') {
      return { success: false, error: 'هذا الحساب معلق حالياً من قبل الإدارة.', isEmailValid: true };
    }

    const pwdOk = await verifyAndUpgradePassword(user, password);
    if (!pwdOk) {
      return { success: false, error: 'كلمة المرور غير صحيحة.', isEmailValid: true };
    }

    if (user.role !== 'STORE_OWNER' && user.role !== 'SUPER_ADMIN' && user.role !== 'STORE_STAFF') {
      return { success: false, error: 'هذا الحساب غير مصرح له بالدخول كتاجر.' };
    }

    const stores = user.stores.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      logo: s.logo,
      category: s.category,
    }));

    const storeId = stores[0]?.id;
    const slug = stores[0]?.slug;

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      success: true,
      userId: user.id,
      role: user.role,
      storeId,
      slug,
      stores,
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    console.error('Error in loginMerchantAction:', error);
    return { success: false, error: 'حدث خطأ في النظام، يرجى المحاولة لاحقاً.' };
  }
}

export async function getUserStoresAction() {
  try {
    const { userId } = await requireAuth();
    const stores = await prisma.store.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        name: true,
        logo: true,
        category: true,
      },
    });
    return { success: true, stores };
  } catch {
    return { success: false, stores: [] };
  }
}

export async function switchStoreAction(storeId: string) {
  try {
    const { userId, role } = await requireAuth();
    const store = await prisma.store.findFirst({
      where: role === 'SUPER_ADMIN' ? { id: storeId } : { id: storeId, ownerId: userId },
    });
    if (!store) return { success: false, error: 'المتجر غير موجود أو غير مصرح به' };
    await issueMerchantSessionCookies(userId, role, store.id);
    return { success: true, slug: store.slug, storeId: store.id };
  } catch {
    return { success: false, error: 'تعذر تبديل المتجر' };
  }
}

export async function sendVerificationCodeAction(email: string, name: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً.' };
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const challengeToken = await createOtpChallengeToken(cleanEmail, code, 600);

    cookies().set(REG_OTP_COOKIE, challengeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
    });

    const result = await sendEmail({
      to: cleanEmail,
      subject: 'كود التحقق الخاص بك من منصة سِين',
      html: EmailTemplates.VerificationCode(name, code),
    });

    if (!result.success && !result.simulated) {
      return { success: false, error: 'فشل إرسال كود التحقق. يرجى التأكد من صحة البريد الإلكتروني.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in sendVerificationCodeAction:', error);
    return { success: false, error: 'حدث خطأ في النظام، يرجى المحاولة لاحقاً.' };
  }
}

export async function registerMerchantAction(data: {
  name: string;
  phone: string;
  email: string;
  password: string;
  country: string;
  city: string;
  otpCode?: string;
}) {
  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();

    if (!data.otpCode) {
      return { success: false, error: 'يرجى إدخال كود التحقق.' };
    }
    const challengeToken = cookies().get(REG_OTP_COOKIE)?.value;
    const otpOk = await verifyOtpChallengeToken(challengeToken, cleanEmail, data.otpCode);
    if (!otpOk) {
      return { success: false, error: 'كود التحقق غير صحيح أو منتهي الصلاحية.' };
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { email: cleanEmail }],
      },
    });

    if (existingUser) {
      if (existingUser.phone === cleanPhone) return { success: false, error: 'رقم الهاتف مسجل مسبقاً.' };
      if (existingUser.email === cleanEmail) return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً.' };
    }

    const hashedPassword = await hashPassword(data.password);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
        role: 'STORE_OWNER',
        status: 'active',
      },
    });

    cookies().delete(REG_OTP_COOKIE);
    await issueMerchantSessionCookies(newUser.id, newUser.role);

    return {
      success: true,
      userId: newUser.id,
      role: newUser.role,
      storeId: null,
      slug: null,
    };
  } catch (error) {
    console.error('Error in registerMerchantAction:', error);
    return { success: false, error: 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة لاحقاً.' };
  }
}

export async function sendLoginVerificationCodeAction(email: string, name: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { email: email.trim() }] },
    });
    if (!user) {
      return { success: false, error: 'الحساب غير موجود.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: code, otpExpiry: expiresAt },
    });

    const result = await sendEmail({
      to: user.email,
      subject: 'كود تسجيل الدخول الخاص بك من منصة سِين',
      html: EmailTemplates.VerificationCode(name || user.name, code),
    });

    if (!result.success && !result.simulated) {
      return { success: false, error: 'فشل إرسال كود التحقق. يرجى التأكد من أن البريد الإلكتروني يعمل.' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'حدث خطأ غير متوقع، حاول لاحقاً.' };
  }
}

export async function completeMerchantOtpLoginAction(phoneOrEmail: string, code: string, selectedStoreId?: string) {
  try {
    const cleanIdentifier = phoneOrEmail.trim().toLowerCase();
    const rawIdentifier = phoneOrEmail.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: cleanIdentifier },
          { email: rawIdentifier },
          { phone: rawIdentifier },
        ],
      },
      include: {
        stores: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود.' };
    }

    if (user.status === 'suspended') {
      return { success: false, error: 'هذا الحساب معلق حالياً من قبل الإدارة.' };
    }

    if (!user.otpCode || user.otpCode !== code.trim()) {
      return { success: false, error: 'كود التحقق خطأ.' };
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return { success: false, error: 'انتهت صلاحية كود التحقق.' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiry: null, lastLoginAt: new Date() },
    });

    const stores = user.stores.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      logo: s.logo,
      category: s.category,
    }));

    const chosenStore = selectedStoreId
      ? stores.find((s) => s.id === selectedStoreId) || stores[0]
      : stores[0];

    await issueMerchantSessionCookies(user.id, user.role, chosenStore?.id);

    return {
      success: true,
      userId: user.id,
      role: user.role,
      storeId: chosenStore?.id,
      slug: chosenStore?.slug,
      stores,
    };
  } catch (error) {
    console.error('completeMerchantOtpLoginAction error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}

export async function sendMerchantPasswordResetOtpAction(phoneOrEmail: string) {
  try {
    const clean = phoneOrEmail.trim().toLowerCase();
    const raw = phoneOrEmail.trim();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: clean }, { email: raw }, { phone: raw }] },
    });
    if (!user || !user.email) {
      return { success: false, error: 'لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: code, otpExpiry: expiresAt },
    });

    const emailRes = await sendEmail({
      to: user.email,
      subject: 'إعادة تعيين كلمة المرور - منصة سِين',
      html: EmailTemplates.VerificationCode(user.name, code),
    });

    if (!emailRes.success && !emailRes.simulated) {
      return { success: false, error: 'تعذر إرسال رمز الاستعادة إلى بريدك الإلكتروني.' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}

export async function resetMerchantPasswordWithOtpAction(phoneOrEmail: string, code: string, newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 4 أحرف.' };
    }
    const clean = phoneOrEmail.trim().toLowerCase();
    const raw = phoneOrEmail.trim();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: clean }, { email: raw }, { phone: raw }] },
    });
    if (!user || !user.otpCode || user.otpCode !== code.trim()) {
      return { success: false, error: 'رمز التحقق غير صحيح.' };
    }
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return { success: false, error: 'انتهت صلاحية الرمز.' };
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, otpCode: null, otpExpiry: null },
    });

    return { success: true };
  } catch {
    return { success: false, error: 'تعذر تحديث كلمة المرور.' };
  }
}

export async function verifyAdminIPAction() {
  const headersList = headers();
  let ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown';
  if (ipAddress.includes(',')) ipAddress = ipAddress.split(',')[0].trim();

  const blocked = await isIpBlockedCached(ipAddress, (ip) =>
    prisma.blockedIP.findUnique({ where: { ipAddress: ip }, select: { reason: true } })
  );
  if (blocked.blocked) {
    return { blocked: true, reason: blocked.reason, ipAddress };
  }
  return { blocked: false, ipAddress };
}

export async function logAdminLoginAttemptAction(username: string, success: boolean, ipAddress: string) {
  const location = await getIpLocation(ipAddress);

  await prisma.systemLog.create({
    data: {
      action: success ? 'ADMIN_LOGIN_SUCCESS' : 'ADMIN_LOGIN_FAILED',
      details: JSON.stringify({ username, ipAddress, location }),
      ipAddress,
    },
  });

  if (!success) {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    const failedCount = await prisma.systemLog.count({
      where: {
        ipAddress,
        action: 'ADMIN_LOGIN_FAILED',
        createdAt: { gte: fifteenMinsAgo },
      },
    });

    if (failedCount >= 5) {
      const existingBlock = await prisma.blockedIP.findUnique({ where: { ipAddress } });

      if (!existingBlock) {
        const reason = 'حظر تلقائي: 5 محاولات تسجيل دخول فاشلة متتالية';

        await prisma.blockedIP.create({
          data: { ipAddress, reason },
        });
        invalidateBlockedIpCache(ipAddress);

        await prisma.systemLog.create({
          data: {
            action: 'AUTO_BLOCK_IP',
            details: JSON.stringify({ message: reason, ipAddress, location }),
            ipAddress,
          },
        });
      }
    }
  }
}

export async function verifyTurnstileTokenAction(token: string, ipAddress: string) {
  try {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    const isLocal =
      ipAddress === '::1' ||
      ipAddress === '127.0.0.1' ||
      ipAddress === 'localhost' ||
      ipAddress.startsWith('192.168.') ||
      ipAddress === 'merchant-login';
    if (!secretKey || isLocal) {
      return { success: true };
    }
    if (!token) {
      return { success: false };
    }

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', ipAddress);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return { success: data.success, data };
  } catch (error) {
    console.error('Turnstile verification failed', error);
    return { success: false };
  }
}

// --- SUPER ADMIN OTP LOGIC ---
export async function sendSuperAdminOtpAction(email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user || user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'غير مصرح.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { email: cleanEmail },
      data: { otpCode: code, otpExpiry: expiresAt },
    });

    const emailResult = await sendEmail({
      to: cleanEmail,
      subject: 'رمز التحقق للدخول إلى منصة سِين',
      html: EmailTemplates.AdminOtp(code),
    });

    if (!emailResult.success && !emailResult.simulated) {
      throw new Error('فشل إرسال البريد الإلكتروني عبر خدمة الإرسال.');
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل في إرسال الرمز' };
  }
}

export async function verifySuperAdminOtpAction(email: string, code: string) {
  const cleanEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
  if (!user || user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'غير مصرح.' };
  }

  if (user.status === 'suspended') {
    return { success: false, error: 'هذا الحساب معلق حالياً.' };
  }

  if (!user.otpCode || !user.otpExpiry) {
    return { success: false, error: 'لم يتم طلب رمز تحقق.' };
  }

  if (new Date() > user.otpExpiry) {
    await prisma.user.update({ where: { email: cleanEmail }, data: { otpCode: null, otpExpiry: null } });
    return { success: false, error: 'انتهت صلاحية الرمز.' };
  }

  if (user.otpCode !== code.trim()) {
    return { success: false, error: 'رمز التحقق غير صحيح.' };
  }

  await prisma.user.update({
    where: { email: cleanEmail },
    data: { otpCode: null, otpExpiry: null, lastLoginAt: new Date() },
  });

  await issueMerchantSessionCookies(user.id, user.role, undefined);
  return { success: true, userId: user.id, role: user.role };
}

export async function updateMerchantCredentialsAction(userId: string, email: string, password?: string) {
  try {
    const auth = await requireAuth();
    if (auth.userId !== userId && auth.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'غير مصرح لك بتعديل هذا الحساب' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing && existing.id !== userId) {
      return { success: false, error: 'البريد الإلكتروني مستخدم لحساب آخر' };
    }

    const data: any = { email: cleanEmail };
    if (password && password.trim() !== '') {
      data.password = await hashPassword(password.trim());
    }

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Update credentials error:', err);
    return { success: false, error: 'حدث خطأ أثناء تحديث بيانات الدخول' };
  }
}

export async function getMerchantUserAction() {
  try {
    const auth = await requireAuth();
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) return null;
    return { id: user.id, email: user.email, name: user.name };
  } catch {
    return null;
  }
}

export async function sendMerchantOtpAction(email: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { email: email.trim() }] },
    });
    if (!user) {
      return { success: false, error: 'المستخدم غير موجود.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: code, otpExpiry: expiresAt },
    });

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'رمز التحقق للدخول إلى منصة سِين',
      html: EmailTemplates.VerificationCode(user.name, code),
    });

    if (!emailResult.success && !emailResult.simulated) {
      throw new Error('فشل إرسال البريد الإلكتروني عبر خدمة الإرسال.');
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل في إرسال الرمز' };
  }
}

export async function verifyMerchantOtpAction(email: string, code: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: cleanEmail }, { email: email.trim() }] },
      include: { stores: { orderBy: { createdAt: 'desc' } } },
    });

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    if (user.status === 'suspended') {
      return { success: false, error: 'هذا الحساب معلق حالياً من قبل الإدارة' };
    }

    if (!user.otpCode || user.otpCode !== code.trim()) {
      return { success: false, error: 'رمز التحقق غير صحيح' };
    }

    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return { success: false, error: 'رمز التحقق منتهي الصلاحية' };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiry: null, lastLoginAt: new Date() },
    });

    const primaryStore = user.stores[0];
    await issueMerchantSessionCookies(user.id, user.role, primaryStore?.id);

    return {
      success: true,
      userId: user.id,
      role: user.role,
      storeId: primaryStore?.id,
      slug: primaryStore?.slug,
    };
  } catch {
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}

export async function loginAdminAction(email: string, password: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        role: 'SUPER_ADMIN',
      },
    });

    if (!user) {
      return { success: false, error: 'غير مصرح بالدخول. يرجى التأكد من الصلاحيات.' };
    }
    if (user.status === 'suspended') {
      return { success: false, error: 'هذا الحساب معلق حالياً من قبل الإدارة.' };
    }
    const pwdOk = await verifyAndUpgradePassword(user, password);
    if (!pwdOk) {
      return { success: false, error: 'كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.' };
    }

    return { success: true, userId: user.id, role: user.role };
  } catch {
    return { success: false, error: 'حدث خطأ غير متوقع' };
  }
}

export async function createSuperAdminAction(data: { name: string; phone: string; email: string; password: string }) {
  try {
    await requireSuperAdmin();

    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return { success: false, error: 'البريد الإلكتروني مسجل بالفعل' };
    }

    const hashedPassword = await hashPassword(data.password);
    await prisma.user.create({
      data: {
        name: data.name,
        email: cleanEmail,
        phone: data.phone,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        status: 'active',
      },
    });

    return { success: true };
  } catch {
    return { success: false, error: 'حدث خطأ أثناء إضافة المدير الجديد' };
  }
}
