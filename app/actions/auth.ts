'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { sendWhatsAppMessage, sendEmail, EmailTemplates } from '@/lib/notification-engine';

export async function setAuthCookieAction(token: string, userId: string, role: string, storeId?: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const options = { 
    httpOnly: true, 
    path: '/', 
    secure: isProd,
    sameSite: 'lax' as const,
    maxAge: 10 * 365 * 24 * 60 * 60 // 10 years (effectively forever)
  };
  
  cookies().set('seen_session_token', token, options);
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
  const userId = cookies().get('seen_session_user_id')?.value;
  if (!userId) return { isAuthenticated: false };
  
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // Clear invalid cookies
      cookies().delete('seen_session_token');
      cookies().delete('seen_session_user_id');
      cookies().delete('seen_session_role');
      cookies().delete('seen_session_store_id');
      return { isAuthenticated: false };
    }
    return { isAuthenticated: true, user: { id: user.id, role: user.role } };
  } catch (error) {
    return { isAuthenticated: false };
  }
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
      slug,
      email: user.email,
      name: user.name
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

    // We removed automatic store creation.
    // The user will be redirected to the /create-store onboarding page.

    return { 
      success: true, 
      userId: newUser.id, 
      role: newUser.role, 
      storeId: null,
      slug: null
    };

  } catch (error) {
    console.error('Error in registerMerchantAction:', error);
    return { success: false, error: 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة لاحقاً.' };
  }
}

export async function sendLoginVerificationCodeAction(email: string, name: string) {
  try {
    // Generate a 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Send email using Resend
    const result = await sendEmail({
      to: email,
      subject: 'كود تسجيل الدخول الخاص بك من منصة سِين',
      html: EmailTemplates.VerificationCode(name, code)
    });

    if (!result.success && !result.simulated) {
      return { success: false, error: 'فشل إرسال كود التحقق. يرجى التأكد من أن البريد الإلكتروني يعمل.' };
    }

    return { success: true, code };
  } catch (error) {
    return { success: false, error: 'حدث خطأ غير متوقع، حاول لاحقاً.' };
  }
}

import { getIpLocation } from '@/lib/geo';
import { headers } from 'next/headers';

export async function verifyAdminIPAction() {
  const headersList = headers();
  let ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown';
  if (ipAddress.includes(',')) ipAddress = ipAddress.split(',')[0].trim();
  
  const blocked = await prisma.blockedIP.findUnique({ where: { ipAddress } });
  if (blocked) {
    return { blocked: true, reason: blocked.reason, ipAddress };
  }
  return { blocked: false, ipAddress };
}

export async function logAdminLoginAttemptAction(username: string, success: boolean, ipAddress: string) {
  const location = await getIpLocation(ipAddress);
  
  // Log the attempt
  await prisma.systemLog.create({
    data: {
      action: success ? 'ADMIN_LOGIN_SUCCESS' : 'ADMIN_LOGIN_FAILED',
      details: JSON.stringify({ username, ipAddress, location }),
      ipAddress
    }
  });

  // If failed, check for rate limiting
  if (!success) {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    const failedCount = await prisma.systemLog.count({
      where: {
        ipAddress,
        action: 'ADMIN_LOGIN_FAILED',
        createdAt: {
          gte: fifteenMinsAgo
        }
      }
    });

    // Block if 5 or more failed attempts
    if (failedCount >= 5) {
      // Check if already blocked to prevent duplicate inserts
      const existingBlock = await prisma.blockedIP.findUnique({ where: { ipAddress } });
      
      if (!existingBlock) {
        const reason = 'حظر تلقائي: 5 محاولات تسجيل دخول فاشلة متتالية';
        
        await prisma.blockedIP.create({
          data: {
            ipAddress,
            reason
          }
        });

        await prisma.systemLog.create({
          data: {
            action: 'AUTO_BLOCK_IP',
            details: JSON.stringify({ message: reason, ipAddress, location }),
            ipAddress
          }
        });
      }
    }
  }
}

export async function verifyTurnstileTokenAction(token: string, ipAddress: string) {
  try {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.warn('TURNSTILE_SECRET_KEY is not configured');
      return { success: true }; // Allow login if not configured properly in dev
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'غير مصرح.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    
    await prisma.user.update({
      where: { email },
      data: { otpCode: code, otpExpiry: expiresAt }
    });
    
    const emailResult = await sendEmail({
      to: email,
      subject: 'رمز التحقق للدخول إلى منصة سِين',
      html: EmailTemplates.AdminOtp(code)
    });
    
    if (!emailResult.success) {
      throw new Error('فشل إرسال البريد الإلكتروني عبر خدمة الإرسال.');
    }
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل في إرسال الرمز' };
  }
}

export async function verifySuperAdminOtpAction(email: string, code: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== 'SUPER_ADMIN') {
    return { success: false, error: 'غير مصرح.' };
  }
  
  if (!user.otpCode || !user.otpExpiry) {
    return { success: false, error: 'لم يتم طلب رمز تحقق.' };
  }
  
  if (new Date() > user.otpExpiry) {
    await prisma.user.update({ where: { email }, data: { otpCode: null, otpExpiry: null } });
    return { success: false, error: 'انتهت صلاحية الرمز.' };
  }
  
  if (user.otpCode !== code) {
    return { success: false, error: 'رمز التحقق غير صحيح.' };
  }
  
  await prisma.user.update({ where: { email }, data: { otpCode: null, otpExpiry: null } });
  return { success: true };
}
// -----------------------------


export async function updateMerchantCredentialsAction(userId: string, email: string, password?: string) {
  try {
    const auth = await requireAuth();
    if (auth.userId !== userId && auth.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'غير مصرح لك بتعديل هذا الحساب' };
    }
    
    // Check if new email is taken
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) {
      return { success: false, error: 'البريد الإلكتروني مستخدم لحساب آخر' };
    }

    const data: any = { email };
    if (password && password.trim() !== '') {
      data.password = password;
    }

    await prisma.user.update({
      where: { id: userId },
      data
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
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { success: false, error: 'المستخدم غير موجود.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    
    await prisma.user.update({
      where: { email },
      data: { otpCode: code, otpExpiry: expiresAt }
    });
    
    const emailResult = await sendEmail({
      to: email,
      subject: 'رمز التحقق للدخول إلى منصة سِين',
      html: EmailTemplates.VerificationCode(user.name, code)
    });
    
    if (!emailResult.success) {
      throw new Error('فشل إرسال البريد الإلكتروني عبر خدمة الإرسال.');
    }
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل في إرسال الرمز' };
  }
}

export async function verifyMerchantOtpAction(email: string, code: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }
    
    if (!user.otpCode || user.otpCode !== code) {
      return { success: false, error: 'رمز التحقق غير صحيح' };
    }
    
    if (user.otpExpiry && new Date() > user.otpExpiry) {
      return { success: false, error: 'رمز التحقق منتهي الصلاحية' };
    }
    
    // Clear OTP after successful verification
    await prisma.user.update({
      where: { email },
      data: { otpCode: null, otpExpiry: null, lastLoginAt: new Date() }
    });
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'حدث خطأ غير متوقع.' };
  }
}

export async function loginAdminAction(email: string, password: string) {
  try {
    const cleanEmail = email.trim().toLowerCase();
    
    // Seed default admins if no SUPER_ADMIN exists
    const superAdminsCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
    if (superAdminsCount === 0) {
      await prisma.user.createMany({
        data: [
          {
            id: 'usr-admin-yousef',
            name: 'يوسف يعقوب',
            email: 'yusef4ps@gmail.com',
            phone: '777000111',
            password: '1234',
            role: 'SUPER_ADMIN',
            status: 'active',
          },
          {
            id: 'usr-admin-abbas',
            name: 'عباس الأغبر',
            email: 'abbas@seen.store',
            phone: '777000222',
            password: '1234',
            role: 'SUPER_ADMIN',
            status: 'active',
          }
        ],
        skipDuplicates: true
      });
    }

    const user = await prisma.user.findFirst({
      where: { 
        email: cleanEmail,
        role: 'SUPER_ADMIN'
      }
    });

    if (!user) {
      return { success: false, error: 'غير مصرح بالدخول. يرجى التأكد من الصلاحيات.' };
    }
    if (user.status === 'suspended') {
      return { success: false, error: 'هذا الحساب معلق حالياً من قبل الإدارة.' };
    }
    if (user.password !== password) {
      return { success: false, error: 'كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.' };
    }

    return { success: true, userId: user.id, role: user.role };
  } catch (err: any) {
    return { success: false, error: 'حدث خطأ غير متوقع' };
  }
}

export async function createSuperAdminAction(data: { name: string; phone: string; email: string; password: string }) {
  try {
    const auth = await requireAuth();
    if (auth.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'غير مصرح.' };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return { success: false, error: 'البريد الإلكتروني مسجل بالفعل' };
    }

    await prisma.user.create({
      data: {
        name: data.name,
        email: cleanEmail,
        phone: data.phone,
        password: data.password,
        role: 'SUPER_ADMIN',
        status: 'active',
      }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: 'حدث خطأ أثناء إضافة المدير الجديد' };
  }
}

