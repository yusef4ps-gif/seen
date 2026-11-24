import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminIPAction, checkAuthStatusAction } from '@/app/actions/auth';
import { logSystemAction } from '@/app/actions/logs';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ipCheck = await verifyAdminIPAction();

  if (ipCheck.blocked) {
    await logSystemAction('ADMIN_ACCESS_BLOCKED', { message: 'محاولة وصول من عنوان محظور' });
    redirect('/seenaylogin7x');
  }

  const authStatus = await checkAuthStatusAction();
  if (!authStatus.isAuthenticated || authStatus.user?.role !== 'SUPER_ADMIN') {
    redirect('/seenaylogin7x');
  }

  return <>{children}</>;
}
