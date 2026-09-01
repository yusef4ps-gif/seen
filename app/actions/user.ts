'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getUserAction(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function updateUserAction(id: string, data: any) {
  try {
    // Check if user exists first
    const existing = await prisma.user.findUnique({ where: { id } });
    let updatedUser;
    
    if (existing) {
      updatedUser = await prisma.user.update({
        where: { id },
        data,
      });
    } else {
      // Create it from local storage data if it didn't exist in cloud yet
      updatedUser = await prisma.user.create({
        data: {
          id,
          name: data.name || 'User',
          email: data.email || `${id}@seen.store`,
          phone: data.phone || '',
          password: data.password || '1234',
          role: data.role || 'SUPER_ADMIN',
          avatarUrl: data.avatarUrl,
        }
      });
    }
    
    revalidatePath('/admin');
    revalidatePath('/profile');
    
    return { success: true, user: updatedUser };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
}

export async function loginAction(email: string) {
  try {
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    });
    
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
      return { success: true, user };
    }
    
    return { success: false, error: 'User not found' };
  } catch (error: any) {
    console.error('Error logging in:', error);
    return { success: false, error: error.message };
  }
}
