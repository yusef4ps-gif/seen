const fs = require('fs');
let content = fs.readFileSync('app/actions/auth.ts', 'utf8');

const newActions = `
// --- SUPER ADMIN OTP LOGIC ---
const adminOtpStore = new Map<string, { code: string; expiresAt: number }>();

export async function sendSuperAdminOtpAction(email: string) {
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins
    
    adminOtpStore.set(email, { code, expiresAt });
    
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
  const stored = adminOtpStore.get(email);
  if (!stored) return { success: false, error: 'انتهت صلاحية الرمز أو لم يتم طلبه.' };
  
  if (Date.now() > stored.expiresAt) {
    adminOtpStore.delete(email);
    return { success: false, error: 'انتهت صلاحية الرمز.' };
  }
  
  if (stored.code !== code) {
    return { success: false, error: 'رمز التحقق غير صحيح.' };
  }
  
  adminOtpStore.delete(email);
  return { success: true };
}
// -----------------------------
`;

fs.writeFileSync('app/actions/auth.ts', content + '\n\n' + newActions);
console.log('Appended actions');
