'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/app/actions/auth';

export async function getUserAction(id: string) {
  try {
    const { userId, role } = await requireAuth();
    if (userId !== id && role !== 'SUPER_ADMIN') {
      throw new Error('Forbidden');
    }
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        staffTitle: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function updateUserAction(id: string, data: any) {
  try {
    const { userId, role } = await requireAuth();
    if (userId !== id && role !== 'SUPER_ADMIN') {
      throw new Error('Forbidden');
    }

    const safeUpdateData: Record<string, any> = {};
    if (typeof data?.name === 'string') safeUpdateData.name = data.name.trim();
    if (typeof data?.email === 'string') safeUpdateData.email = data.email.trim().toLowerCase();
    if (typeof data?.phone === 'string') safeUpdateData.phone = data.phone.trim();
    if (typeof data?.avatarUrl === 'string' || data?.avatarUrl === null) safeUpdateData.avatarUrl = data.avatarUrl;
    if (typeof data?.password === 'string' && data.password.trim()) {
      safeUpdateData.password = await bcrypt.hash(data.password.trim(), 10);
    }
    if (role === 'SUPER_ADMIN') {
      if (typeof data?.status === 'string') safeUpdateData.status = data.status;
      if (typeof data?.staffTitle === 'string') safeUpdateData.staffTitle = data.staffTitle;
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: 'User not found' };
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: safeUpdateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      },
    });

    revalidatePath('/seenayhq7x');
    revalidatePath('/profile');

    return { success: true, user: updatedUser };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
}

export async function loginAction(_email: string) {
  return { success: false, error: 'Passwordless login has been disabled for security.' };
}
