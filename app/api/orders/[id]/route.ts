import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...order,
      items: JSON.parse(order.items || '[]'),
    });
  } catch (error) {
    console.error('Error fetching order by id:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

// PATCH /api/orders/[id] - Update status or verify payment proof
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.status !== undefined) dataToUpdate.status = body.status;
    if (body.paymentProofStatus !== undefined) {
      dataToUpdate.paymentProofStatus = body.paymentProofStatus;
      if (body.paymentProofStatus === 'verified') {
        dataToUpdate.status = 'processing';
      }
    }
    if (body.notes !== undefined) dataToUpdate.notes = body.notes;

    const updated = await prisma.order.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      ...updated,
      items: JSON.parse(updated.items || '[]'),
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
