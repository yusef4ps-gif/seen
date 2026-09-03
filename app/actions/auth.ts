'use server';

import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

export async function setAuthCookieAction(token: string, userId: string, role: string, storeId?: string) {
  cookies().set('seen_session_token', token, { httpOnly: true, path: '/' });
  cookies().set('seen_session_user_id', userId, { httpOnly: true, path: '/' });
  cookies().set('seen_session_role', role, { httpOnly: true, path: '/' });
  if (storeId) {
    cookies().set('seen_session_store_id', storeId, { httpOnly: true, path: '/' });
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
