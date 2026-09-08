'use server';

import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

const CUSTOMER_SESSION_COOKIE = 'seen_customer_session';

export async function registerCustomerAction(storeId: string, name: string, email: string, phone: string, password?: string) {
  try {
    // Basic validation
    if (!name || (!email && !phone)) {
      return { success: false, error: 'ط§ظ„ط§ط³ظ… ظˆط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ط£ظˆ ط§ظ„ط¥ظٹظ…ظٹظ„ ظ…ط·ظ„ظˆط¨ط©' };
    }

    // Check if customer already exists for this store
    if (email) {
      const existingEmail = await prisma.customer.findUnique({
        where: { storeId_email: { storeId, email } }
      });
      if (existingEmail) return { success: false, error: 'ظ‡ط°ط§ ط§ظ„ط¥ظٹظ…ظٹظ„ ظ…ط³ط¬ظ„ ظ…ط³ط¨ظ‚ط§ظ‹ ظپظٹ ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±' };
    }

    if (phone) {
      const existingPhone = await prisma.customer.findUnique({
        where: { storeId_phone: { storeId, phone } }
      });
      if (existingPhone) return { success: false, error: 'ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ظ…ط³ط¬ظ„ ظ…ط³ط¨ظ‚ط§ظ‹ ظپظٹ ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±' };
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
    
    cookies().set(CUSTOMER_SESSION_COOKIE, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return { success: true, customer: sessionData };
  } catch (error: any) {
    console.error('Customer Registration Error:', error);
    return { success: false, error: 'ط­ط¯ط« ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹ ط£ط«ظ†ط§ط، ط§ظ„طھط³ط¬ظٹظ„' };
  }
}

export async function loginCustomerAction(storeId: string, emailOrPhone: string, password?: string) {
  try {
    if (!emailOrPhone) {
      return { success: false, error: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ط£ظˆ ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ' };
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
      return { success: false, error: 'ط§ظ„ط­ط³ط§ط¨ ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ظپظٹ ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±' };
    }

    if (customer.password && password) {
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return { success: false, error: 'ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط؛ظٹط± طµط­ظٹط­ط©' };
      }
    } else if (!customer.password && password) {
       return { success: false, error: 'ظ‡ط°ط§ ط§ظ„ط­ط³ط§ط¨ ظ…ط³ط¬ظ„ ط¨ط§ط³طھط®ط¯ط§ظ… ط¬ظˆط¬ظ„' };
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
    
    cookies().set(CUSTOMER_SESSION_COOKIE, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return { success: true, customer: sessionData };
  } catch (error: any) {
    console.error('Customer Login Error:', error);
    return { success: false, error: 'ط­ط¯ط« ط®ط·ط£ ط؛ظٹط± ظ…طھظˆظ‚ط¹ ط£ط«ظ†ط§ط، طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„' };
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

export async function verifyGoogleTokenAndLoginCustomer(storeId: string, token: string) {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return { success: false, error: 'طھط¹ط°ط± ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط­ط³ط§ط¨ ظ…ظ† ط¬ظˆط¬ظ„' };
    }

    const email = payload.email;
    const name = payload.name || 'ط¹ظ…ظٹظ„';
    
    // Check if customer exists
    let customer = await prisma.customer.findUnique({
      where: { storeId_email: { storeId, email } }
    });

    if (!customer) {
      // Register new customer
      customer = await prisma.customer.create({
        data: {
          storeId,
          name,
          email,
          authProvider: 'google',
        }
      });
    } else {
      // Update last login
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { lastLoginAt: new Date() }
      });
    }

    // Create session
    const sessionData = {
      customerId: customer.id,
      storeId: customer.storeId,
      name: customer.name,
      email: customer.email
    };
    
    cookies().set(CUSTOMER_SESSION_COOKIE, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return { success: true, customer: sessionData };
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    return { success: false, error: 'ظپط´ظ„ ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط­ط³ط§ط¨ ط¬ظˆط¬ظ„' };
  }
}

import { sendEmail } from '@/lib/notification-engine';
import { EmailTemplates } from '@/lib/email-templates';

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

