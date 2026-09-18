import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/actions/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (auth.role !== 'SUPER_ADMIN') {
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
