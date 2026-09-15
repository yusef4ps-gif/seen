import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminIPAction } from '@/app/actions/auth';
import { logSystemAction } from '@/app/actions/logs';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if IP is blocked
  const ipCheck = await verifyAdminIPAction();
  
  if (ipCheck.blocked) {
    await logSystemAction('ADMIN_ACCESS_BLOCKED', { message: 'محاولة وصول من عنوان محظور' });
    redirect('/admin'); // Redirect to blocked page
  } else {
    // Optionally log successful access to the dashboard.
    // To avoid spamming on every navigation, we only log the login process in auth.ts.
  }

  return (
    <>
      {children}
    </>
  );
}
