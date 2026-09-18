const fs = require('fs');
const newActions = `

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

    return { success: true };
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

`;
fs.appendFileSync('app/actions/auth.ts', newActions, 'utf8');
