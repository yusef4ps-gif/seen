import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireStoreOwner } from '@/app/actions/auth';
import { getCurrentCustomerAction } from '@/app/actions/customer-auth';

// GET /api/orders/[id] - Protected: owner, admin, or matching customer/phone
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const phoneParam = searchParams.get('phone');

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    let authorized = false;
    try {
      await requireStoreOwner(order.storeId);
      authorized = true;
    } catch {}

    if (!authorized) {
      const customer = await getCurrentCustomerAction();
      if (customer && order.customerId && customer.customerId === order.customerId) {
        authorized = true;
      } else if (phoneParam && order.customerPhone) {
        const cleanQuery = phoneParam.replace(/[^0-9]/g, '');
        const cleanOrderPhone = order.customerPhone.replace(/[^0-9]/g, '');
        if (cleanQuery.length >= 6 && cleanOrderPhone.endsWith(cleanQuery)) {
          authorized = true;
        }
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

// PATCH /api/orders/[id] - Update status or verify payment proof (Store Owner / Super Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    try {
      await requireAuth();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = params;
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    try {
      await requireStoreOwner(existing.storeId);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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
