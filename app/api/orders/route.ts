import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders - Get orders (optional filter by storeId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    const orders = await prisma.order.findMany({
      where: storeId ? { storeId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    const parsed = orders.map((o) => ({
      ...o,
      items: JSON.parse(o.items || '[]'),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders - Create new order & deduct stock
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      storeId, customerName, customerPhone, city, address, 
      deliveryType, items, subtotal, shippingCost, discount, 
      total, currency, paymentMethod, paymentProofUrl, notes 
    } = body;

    if (!storeId || !customerName || !customerPhone || !items) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        storeId,
        customerName,
        customerPhone,
        city: city || 'عدن',
        address: address || '',
        deliveryType: deliveryType || 'delivery',
        items: typeof items === 'string' ? items : JSON.stringify(items),
        subtotal: parseFloat(subtotal) || 0,
        shippingCost: parseFloat(shippingCost) || 0,
        discount: parseFloat(discount) || 0,
        total: parseFloat(total) || 0,
        currency: currency || 'SAR',
        paymentMethod: paymentMethod || 'cod',
        paymentProofUrl: paymentProofUrl || '',
        paymentProofStatus: paymentProofUrl ? 'unverified' : 'verified',
        status: paymentMethod === 'cod' ? 'new' : 'pending_payment',
        notes: notes || '',
      },
    });

    // Update store total GMV
    await prisma.store.update({
      where: { id: storeId },
      data: {
        totalSalesGMV: { increment: parseFloat(total) || 0 },
      },
    });

    // Deduct stock for items
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
    for (const it of parsedItems) {
      try {
        await prisma.product.update({
          where: { id: it.productId },
          data: {
            stock: { decrement: it.quantity || 1 },
            salesCount: { increment: it.quantity || 1 },
          },
        });
      } catch (err) {
        console.warn(`Could not update stock for product ${it.productId}:`, err);
      }
    }

    return NextResponse.json({
      ...newOrder,
      items: JSON.parse(newOrder.items),
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
