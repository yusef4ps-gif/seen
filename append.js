const fs = require('fs');
const newActions = `

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
`;
fs.appendFileSync('app/actions/auth.ts', newActions, 'utf8');
