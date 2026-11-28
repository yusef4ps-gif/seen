import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/app/actions/auth';
import { invalidateStoreCache } from '@/app/actions/store';

// GET /api/stores - Fetch public storefront directory metadata (never expose apiKeys)
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        customDomain: true,
        name: true,
        description: true,
        category: true,
        logo: true,
        banner: true,
        primaryColor: true,
        phone: true,
        whatsapp: true,
        city: true,
        baseCurrency: true,
        customRates: true,
        planTier: true,
        planStatus: true,
        activeVisitorsNow: true,
        createdAt: true,
        _count: {
          select: { products: true },
        },
      },
    });

    const parsedStores = stores.map((s) => ({
      ...s,
      customRates: JSON.parse(s.customRates || '{}'),
    }));

    return NextResponse.json(parsedStores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

// POST /api/stores - Create new store (Authenticated users only)
export async function POST(req: Request) {
  let auth;
  try {
    auth = await requireAuth();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, phone, category, city, baseCurrency } = body;

    if (!name || !slug || !phone) {
      return NextResponse.json({ error: 'Name, slug, and phone are required' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const existing = await prisma.store.findUnique({ where: { slug: cleanSlug } });
    const finalSlug = existing ? `${cleanSlug}-${Math.floor(100 + Math.random() * 900)}` : cleanSlug;

    const newStore = await prisma.store.create({
      data: {
        ownerId: auth.userId,
        name,
        slug: finalSlug,
        phone,
        category: category || 'عام',
        city: city || 'عدن',
        baseCurrency: baseCurrency || 'SAR',
        description: `المتجر الإلكتروني الرسمي لـ ${name}. تسوق أفضل المنتجات بأفضل الأسعار.`,
        logo: body.logo || '',
        banner: body.banner || '',
        primaryColor: '#0d9488',
        whatsapp: phone.replace(/[^0-9]/g, ''),
        customRates: JSON.stringify({
          YER_ADEN: 1910,
          YER_SANAA: 535,
          SAR: 3.75,
          USD: 1,
        }),
        paymentAccounts: JSON.stringify([
          {
            id: `pay-${Date.now()}-1`,
            type: 'cod',
            name: 'الدفع عند الاستلام (COD)',
            accountNumber: '',
            accountName: '',
            instructions: 'الدفع نقداً للمندوب عند وصول الطلب.',
            isActive: true,
          },
          {
            id: `pay-${Date.now()}-2`,
            type: 'kuraimi',
            name: 'الكريمي - خدمة حاسب',
            accountNumber: '3000000000',
            accountName: name,
            instructions: 'التحويل لحساب الكريمي وإرفاق الإشعار.',
            isActive: true,
          },
        ]),
        shippingMethods: JSON.stringify([
          {
            id: `ship-${Date.now()}-1`,
            name: 'توصيل محلي سريع',
            cost: 3000,
            currency: 'YER_ADEN',
            estimatedDelivery: 'خلال 24 ساعة',
            isActive: true,
          },
          {
            id: `ship-${Date.now()}-2`,
            name: 'استلام من المحل',
            cost: 0,
            currency: 'YER_ADEN',
            estimatedDelivery: 'فوري',
            isPickup: true,
            isActive: true,
          },
        ]),
        planTier: 'free',
        planStatus: 'trial',
        activeVisitorsNow: 1,
      },
    });

    await invalidateStoreCache();

    return NextResponse.json({
      ...newStore,
      apiKeys: undefined,
      customRates: JSON.parse(newStore.customRates),
      paymentAccounts: JSON.parse(newStore.paymentAccounts),
      shippingMethods: JSON.parse(newStore.shippingMethods),
    });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}
