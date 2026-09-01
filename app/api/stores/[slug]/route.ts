import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stores/[slug] - Get store by slug or id
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const store = await prisma.store.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
      },
      include: {
        products: {
          include: { variants: true },
        },
        orders: true,
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...store,
      customRates: JSON.parse(store.customRates || '{}'),
      paymentAccounts: JSON.parse(store.paymentAccounts || '[]'),
      shippingMethods: JSON.parse(store.shippingMethods || '[]'),
      products: store.products.map((p) => ({
        ...p,
        images: JSON.parse(p.images || '[]'),
        tags: JSON.parse(p.tags || '[]'),
        variants: p.variants.map((v) => ({
          ...v,
          attributes: JSON.parse(v.attributes || '{}'),
        })),
      })),
      orders: store.orders.map((o) => ({
        ...o,
        items: JSON.parse(o.items || '[]'),
      })),
    });
  } catch (error) {
    console.error('Error fetching store by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}

// PATCH /api/stores/[slug] - Update store settings
export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.phone !== undefined) dataToUpdate.phone = body.phone;
    if (body.whatsapp !== undefined) dataToUpdate.whatsapp = body.whatsapp;
    if (body.email !== undefined) dataToUpdate.email = body.email;
    if (body.city !== undefined) dataToUpdate.city = body.city;
    if (body.address !== undefined) dataToUpdate.address = body.address;
    if (body.logo !== undefined) dataToUpdate.logo = body.logo;
    if (body.banner !== undefined) dataToUpdate.banner = body.banner;
    if (body.primaryColor !== undefined) dataToUpdate.primaryColor = body.primaryColor;
    if (body.baseCurrency !== undefined) dataToUpdate.baseCurrency = body.baseCurrency;
    if (body.planTier !== undefined) dataToUpdate.planTier = body.planTier;
    if (body.planStatus !== undefined) dataToUpdate.planStatus = body.planStatus;
    if (body.totalSalesGMV !== undefined) dataToUpdate.totalSalesGMV = body.totalSalesGMV;

    if (body.customRates !== undefined) {
      dataToUpdate.customRates = typeof body.customRates === 'string' ? body.customRates : JSON.stringify(body.customRates);
    }
    if (body.paymentAccounts !== undefined) {
      dataToUpdate.paymentAccounts = typeof body.paymentAccounts === 'string' ? body.paymentAccounts : JSON.stringify(body.paymentAccounts);
    }
    if (body.shippingMethods !== undefined) {
      dataToUpdate.shippingMethods = typeof body.shippingMethods === 'string' ? body.shippingMethods : JSON.stringify(body.shippingMethods);
    }

    const updated = await prisma.store.update({
      where: { slug },
      data: dataToUpdate,
    });

    return NextResponse.json({
      ...updated,
      customRates: JSON.parse(updated.customRates || '{}'),
      paymentAccounts: JSON.parse(updated.paymentAccounts || '[]'),
      shippingMethods: JSON.parse(updated.shippingMethods || '[]'),
    });
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}
