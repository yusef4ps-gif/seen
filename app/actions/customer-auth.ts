'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { sendEmail, sendWhatsAppMessage, EmailTemplates } from '@/lib/notification-engine';

const googleClient = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

const CUSTOMER_SESSION_COOKIE = 'seen_customer_session';

export async function registerCustomerAction(storeId: string, name: string, email: string, phone: string, password?: string) {
  try {
    // Basic validation
    if (!name || (!email && !phone)) {
      return { success: false, error: 'الاسم ورقم الهاتف أو الإيميل مطلوبة' };
    }

    // Check if customer already exists for this store
    if (email) {
      const existingEmail = await prisma.customer.findUnique({
        where: { storeId_email: { storeId, email } }
      });
      if (existingEmail) return { success: false, error: 'هذا الإيميل مسجل مسبقاً في هذا المتجر' };
    }

    if (phone) {
      const existingPhone = await prisma.customer.findUnique({
        where: { storeId_phone: { storeId, phone } }
      });
      if (existingPhone) return { success: false, error: 'رقم الهاتف مسجل مسبقاً في هذا المتجر' };
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const newCustomer = await prisma.customer.create({
      data: {
        storeId,
        name,
        email: email || null,
        phone: phone || null,
        password: hashedPassword,
        authProvider: password ? 'credentials' : 'google'
      }
    });

    // Create session
    const sessionData = {
      customerId: newCustomer.id,
      storeId: newCustomer.storeId,
      name: newCustomer.name,
      email: newCustomer.email
    };
    
    return { success: true, customer: sessionData };
  } catch (error: any) {
    console.error('Customer Registration Error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع أثناء التسجيل' };
  }
}

export async function loginCustomerAction(storeId: string, emailOrPhone: string, password?: string) {
  try {
    if (!emailOrPhone) {
      return { success: false, error: 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف' };
    }

    // Find customer by email or phone for this store
    const customer = await prisma.customer.findFirst({
      where: {
        storeId,
        OR: [
          { email: emailOrPhone },
          { phone: emailOrPhone }
        ]
      }
    });

    if (!customer) {
      return { success: false, error: 'الحساب غير موجود في هذا المتجر' };
    }

    if (customer.password && password) {
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return { success: false, error: 'كلمة المرور غير صحيحة' };
      }
    } else if (!customer.password && password) {
       return { success: false, error: 'هذا الحساب مسجل باستخدام جوجل' };
    }

    // Update last login
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() }
    });

    // Create session
    const sessionData = {
      customerId: customer.id,
      storeId: customer.storeId,
      name: customer.name,
      email: customer.email
    };
    
    return { success: true, customer: sessionData };
  } catch (error: any) {
    console.error('Customer Login Error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع أثناء تسجيل الدخول' };
  }
}

export async function logoutCustomerAction() {
  cookies().delete(CUSTOMER_SESSION_COOKIE);
  return { success: true };
}

export async function getCurrentCustomerAction() {
  try {
    const session = cookies().get(CUSTOMER_SESSION_COOKIE)?.value;
    if (!session) return null;
    return JSON.parse(session);
  } catch (e) {
    return null;
  }
}




export async function changeCustomerPasswordAction(oldPassword, newPassword) {
  try {
    const sessionStr = cookies().get(CUSTOMER_SESSION_COOKIE)?.value;
    if (!sessionStr) return { success: false, error: 'غير مسجل الدخول' };
    const session = JSON.parse(sessionStr);
    
    const customer = await prisma.customer.findUnique({ where: { id: session.customerId } });
    if (!customer) return { success: false, error: 'العميل غير موجود' };
    if (!customer.password) return { success: false, error: 'هذا الحساب مسجل عبر جوجل، لا يمكن تغيير كلمة المرور' };

    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.customer.update({
      where: { id: customer.id },
      data: { password: hashed }
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteCustomerAccountAction() {
  try {
    const sessionStr = cookies().get(CUSTOMER_SESSION_COOKIE)?.value;
    if (!sessionStr) return { success: false, error: 'غير مسجل الدخول' };
    const session = JSON.parse(sessionStr);

    await prisma.customer.delete({ where: { id: session.customerId } });
    cookies().delete(CUSTOMER_SESSION_COOKIE);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function customerForgotPasswordAction(storeId: string, email: string) {
  try {
    const customer = await prisma.customer.findUnique({ where: { storeId_email: { storeId, email } } });
    if (!customer) return { success: false, error: 'البريد الإلكتروني غير مسجل' };
    if (!customer.password) return { success: false, error: 'هذا الحساب مسجل عبر جوجل' };

    const token = Math.random().toString(36).substring(2, 15);
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.customer.update({
      where: { id: customer.id },
      data: { resetToken: token, resetTokenExpiry: expiry }
    });

    // Send email using our existing system
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/store/${store?.slug}/reset-password?token=${token}&email=${email}`;
    
    await sendEmail({
      to: email,
      subject: `إعادة تعيين كلمة المرور - متجر ${store?.name}`,
      html: `
        <div dir='rtl' style='font-family: Arial; padding: 20px;'>
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك في متجر ${store?.name}.</p>
          <p>اضغط على الرابط التالي لإنشاء كلمة مرور جديدة:</p>
          <a href='${resetLink}' style='background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;'>تعيين كلمة المرور</a>
          <p style='margin-top: 20px; color: #666; font-size: 12px;'>هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
        </div>
      `
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


export async function sendCustomerVerificationCodeAction(emailOrPhone: string, name: string) {
  try {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    if (emailOrPhone.includes('@')) {
      const result = await sendEmail({
        to: emailOrPhone,
        subject: 'كود التحقق الخاص بك من منصة سِين',
        html: EmailTemplates.VerificationCode(name, code)
      });
      if (!result.success && !result.simulated) {
        return { success: false, error: 'فشل إرسال كود التحقق للبريد الإلكتروني.' };
      }
    } else {
      const result = await sendWhatsAppMessage({
        to: emailOrPhone,
        message: `مرحباً ${name}،\nكود التحقق الخاص بك هو: *${code}*\nلا تشارك هذا الكود مع أحد.`
      });
      if (!result.success && !result.simulated) {
        return { success: false, error: 'فشل إرسال كود التحقق لرقم الهاتف.' };
      }
    }
    
    return { success: true, code };
  } catch (error) {
    console.error('Error sending customer verification code:', error);
    return { success: false, error: 'حدث خطأ في النظام، يرجى المحاولة لاحقاً.' };
  }
}

export async function setCustomerAuthCookieAction(sessionData: any) {
  const CUSTOMER_SESSION_COOKIE = 'seen_customer_session';
  cookies().set(CUSTOMER_SESSION_COOKIE, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  });
  return { success: true };
}
