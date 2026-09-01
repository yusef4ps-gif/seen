import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/broadcasts - Fetch all active broadcasts
export async function GET() {
  try {
    const broadcasts = await prisma.systemBroadcast.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(broadcasts);
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    return NextResponse.json({ error: 'Failed to fetch broadcasts' }, { status: 500 });
  }
}

// POST /api/admin/broadcasts - Create new system broadcast
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, message, type } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const newBroadcast = await prisma.systemBroadcast.create({
      data: {
        title,
        message,
        type: type || 'info',
        isActive: true,
      },
    });

    return NextResponse.json(newBroadcast);
  } catch (error) {
    console.error('Error creating broadcast:', error);
    return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
  }
}

// DELETE /api/admin/broadcasts?id=... - Delete a broadcast
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id parameter is required' }, { status: 400 });
    }

    await prisma.systemBroadcast.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    return NextResponse.json({ error: 'Failed to delete broadcast' }, { status: 500 });
  }
}
