import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/stores - Fetch all stores
export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { products: true, orders: true },
        },
      },
    });

    const parsedStores = stores.map((s) => ({
      ...s,
      customRates: JSON.parse(s.customRates || '{}'),
      paymentAccounts: JSON.parse(s.paymentAccounts || '[]'),
      shippingMethods: JSON.parse(s.shippingMethods || '[]'),
    }));

    return NextResponse.json(parsedStores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

// POST /api/stores - Create new store with automatic seed products
export async function POST(req: Request) {
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
        name,
        slug: finalSlug,
        phone,
        category: category || 'عام',
        city: city || 'عدن',
        baseCurrency: baseCurrency || 'SAR',
        description: `المتجر الإلكتروني الرسمي لـ ${name}. تسوق أفضل المنتجات بأفضل الأسعار.`,
        logo: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
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
        planTier: 'starter',
        planStatus: 'active',
        activeVisitorsNow: Math.floor(Math.random() * 10) + 3,
        products: {
          create: [
            {
              name: 'منتج تجريبي مميز #1',
              description: 'هذا منتج تجريبي تم إنشاؤه تلقائياً لمتجرك الجديد. يمكنك تعديله أو حذفه بسهولة من لوحة التحكم.',
              category: 'المنتجات المميزة',
              price: 50,
              comparePrice: 70,
              baseCurrency: baseCurrency || 'SAR',
              images: JSON.stringify(['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800']),
              stock: 25,
              lowStockAlert: 5,
              isAvailable: true,
              isFeatured: true,
              tags: JSON.stringify(['عرض_خاص', 'جديد']),
            },
          ],
        },
      },
    });

    return NextResponse.json({
      ...newStore,
      customRates: JSON.parse(newStore.customRates),
      paymentAccounts: JSON.parse(newStore.paymentAccounts),
      shippingMethods: JSON.parse(newStore.shippingMethods),
    });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}
