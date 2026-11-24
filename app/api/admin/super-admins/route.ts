import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    try {
      await requireSuperAdmin();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const admins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
