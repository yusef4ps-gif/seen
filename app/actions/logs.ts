'use server';

import prisma from '@/lib/prisma';
import { headers } from 'next/headers';
import { getIpLocation } from '@/lib/geo';
import { requireSuperAdmin } from '@/app/actions/auth';
import { invalidateBlockedIpCache } from '@/lib/server-cache';

/**
 * Log a system action
 */
export async function logSystemAction(action: string, details: any, userId?: string) {
  try {
    const headersList = headers();
    let ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'Unknown';
    if (ipAddress.includes(',')) {
        ipAddress = ipAddress.split(',')[0].trim();
    }
    
    const location = await getIpLocation(ipAddress);
    const enrichedDetails = typeof details === 'object' ? { ...details, location } : { text: details, location };

    await prisma.systemLog.create({
      data: {
        action,
        details: JSON.stringify(enrichedDetails),
        ipAddress,
        userId
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to log system action:', error);
    return { success: false, error: 'Failed to log action' };
  }
}

/**
 * Get system logs
 */
import { unstable_noStore as noStore } from 'next/cache';

export async function getSystemLogsAction() {
  noStore();
  try {
    await requireSuperAdmin();
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to recent 100 for performance
    });
    return { success: true, data: logs };
  } catch (error) {
    console.error('Failed to fetch system logs:', error);
    return { success: false, error: 'Failed to fetch logs' };
  }
}

/**
 * Get blocked IPs
 */
export async function getBlockedIPsAction() {
  noStore();
  try {
    await requireSuperAdmin();
    const blocked = await prisma.blockedIP.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: blocked };
  } catch (error) {
    console.error('Failed to fetch blocked IPs:', error);
    return { success: false, error: 'Failed to fetch blocked IPs' };
  }
}

/**
 * Block an IP address
 */
export async function blockIPAction(ipAddress: string, reason: string) {
  try {
    await requireSuperAdmin();
    // Log the action first
    await logSystemAction('BLOCK_IP', { ipAddress, reason });

    const existing = await prisma.blockedIP.findUnique({
      where: { ipAddress }
    });

    if (existing) {
      return { success: false, error: 'هذا العنوان محظور مسبقاً' };
    }

    await prisma.blockedIP.create({
      data: {
        ipAddress,
        reason
      }
    });
    invalidateBlockedIpCache(ipAddress);

    return { success: true };
  } catch (error) {
    console.error('Failed to block IP:', error);
    return { success: false, error: 'حدث خطأ أثناء الحظر' };
  }
}

/**
 * Unblock an IP address
 */
export async function unblockIPAction(id: string) {
  try {
    await requireSuperAdmin();
    const blockedIP = await prisma.blockedIP.findUnique({ where: { id } });
    if (blockedIP) {
        await logSystemAction('UNBLOCK_IP', { ipAddress: blockedIP.ipAddress });
    }

    await prisma.blockedIP.delete({
      where: { id }
    });
    if (blockedIP?.ipAddress) {
      invalidateBlockedIpCache(blockedIP.ipAddress);
    }
    return { success: true };
  } catch (error) {
    console.error('Failed to unblock IP:', error);
    return { success: false, error: 'حدث خطأ أثناء إلغاء الحظر' };
  }
}
