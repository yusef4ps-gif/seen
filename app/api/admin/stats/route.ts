import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/app/actions/auth';

// GET /api/admin/stats - Central Super Admin Aggregated Metrics
export async function GET() {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const stores = await prisma.store.findMany({
      select: {
        totalSalesGMV: true,
        activeVisitorsNow: true,
        planStatus: true,
      },
    });
    const totalOrders = await prisma.order.count();

    const totalGMV = stores.reduce((sum, s) => sum + (s.totalSalesGMV || 0), 0);
    const activeVisitors = stores.reduce((sum, s) => sum + (s.activeVisitorsNow || 0), 0);
    const activeStores = stores.filter((s) => s.planStatus === 'active').length;

    return NextResponse.json({
      totalGMV_USD: Math.round(totalGMV),
      totalStoresCount: stores.length,
      activeStoresCount: activeStores,
      totalOrdersCount: totalOrders,
      totalRevenue_USD: 0,
      activeVisitorsOnline: activeVisitors,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
