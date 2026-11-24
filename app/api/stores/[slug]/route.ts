import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireStoreOwner } from '@/app/actions/auth';
import { invalidateStoreCache } from '@/app/actions/store';

// GET /api/stores/[slug] - Public storefront data (strips apiKeys & private customer orders)
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
      },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const { apiKeys: _omitApiKeys, ...safeStore } = store;

    return NextResponse.json({
      ...safeStore,
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
    });
  } catch (error) {
    console.error('Error fetching store by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}

// PATCH /api/stores/[slug] - Protected: Store Owner or Super Admin only
export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    let auth;
    try {
      auth = await requireAuth();
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { slug } = params;
    const existingStore = await prisma.store.findFirst({
      where: { OR: [{ slug }, { id: slug }] },
      select: { id: true, slug: true },
    });

    if (!existingStore) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    try {
      await requireStoreOwner(existingStore.id);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

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

    // Only Super Admin may elevate planTier / planStatus / totalSalesGMV
    if (auth.role === 'SUPER_ADMIN') {
      if (body.planTier !== undefined) dataToUpdate.planTier = body.planTier;
      if (body.planStatus !== undefined) dataToUpdate.planStatus = body.planStatus;
      if (body.totalSalesGMV !== undefined) dataToUpdate.totalSalesGMV = body.totalSalesGMV;
    }

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
      where: { id: existingStore.id },
      data: dataToUpdate,
    });

    await invalidateStoreCache(existingStore.slug);
    await invalidateStoreCache(existingStore.id);

    const { apiKeys: _omitApiKeys, ...safeUpdated } = updated;

    return NextResponse.json({
      ...safeUpdated,
      customRates: JSON.parse(updated.customRates || '{}'),
      paymentAccounts: JSON.parse(updated.paymentAccounts || '[]'),
      shippingMethods: JSON.parse(updated.shippingMethods || '[]'),
    });
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}
