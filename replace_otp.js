const fs = require('fs');
let content = fs.readFileSync('app/actions/auth.ts', 'utf8');

// Replace the memory map implementation with Prisma implementation
const regex = /\/\/ --- SUPER ADMIN OTP LOGIC ---[\s\S]*?\/\/ -----------------------------/m;

const newPrismaLogic = `
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
    
    await sendEmail(
      email,
      'رمز التحقق للدخول إلى منصة سِين',
      EmailTemplates.AdminOtp(code)
    );
    
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
`;

content = content.replace(regex, newPrismaLogic.trim());
fs.writeFileSync('app/actions/auth.ts', content);
console.log('Replaced with Prisma logic');
