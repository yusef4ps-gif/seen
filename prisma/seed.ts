import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding for SEEN Platform (منصة سِين)...');

  // 1. Clean existing records
  await prisma.systemBroadcast.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.productVariant.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.abandonedCart.deleteMany({});
  await prisma.store.deleteMany({});

  // 2. Create Initial Stores
  const adenBoutique = await prisma.store.create({
    data: {
      id: 'store-1',
      slug: 'aden-boutique',
      name: 'عدن بوتيك للأزياء الفاخرة',
      description: 'أرقى الأزياء النسائية والرجالية والعبايات العصرية في عدن وكافة المحافظات مع شحن فوري سريع.',
      category: 'أزياء وموضة',
      logo: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      primaryColor: '#0d9488',
      phone: '+967 771 234 567',
      whatsapp: '967771234567',
      email: 'contact@aden-boutique.com',
      city: 'عدن',
      address: 'كريتر - شارع أروى بجانب البنك الأهلي',
      baseCurrency: 'SAR',
      customRates: JSON.stringify({
        YER_ADEN: 1910,
        YER_SANAA: 535,
        SAR: 3.75,
        USD: 1,
      }),
      paymentAccounts: JSON.stringify([
        {
          id: 'pay-1',
          type: 'kuraimi',
          name: 'الكريمي - خدمة حاسب / حساب مميز',
          accountNumber: '3029182746',
          accountName: 'متجر عدن بوتيك الرسمي',
          instructions: 'يرجى كتابة رقم الطلب في خانة الملاحظات أثناء التحويل وإرفاق صورة الإشعار هنا.',
          isActive: true,
        },
        {
          id: 'pay-2',
          type: 'jawali',
          name: 'محفظة جوالي (بنك اليمن والكويت)',
          accountNumber: '771234567',
          accountName: 'عدن بوتيك',
          instructions: 'التحويل المباشر إلى رقم المحفظة.',
          isActive: true,
        },
        {
          id: 'pay-3',
          type: 'cod',
          name: 'الدفع نقداً عند الاستلام',
          accountNumber: '',
          accountName: '',
          instructions: 'الدفع للمندوب عند استلام ومعاينة الطلب.',
          isActive: true,
        },
      ]),
      shippingMethods: JSON.stringify([
        {
          id: 'ship-1',
          name: 'توصيل محلي سريع (داخل عدن)',
          cost: 3000,
          currency: 'YER_ADEN',
          estimatedDelivery: 'خلال 2 - 4 ساعات فقط',
          isActive: true,
        },
        {
          id: 'ship-2',
          name: 'شحن لكافة المحافظات اليمنية',
          cost: 7000,
          currency: 'YER_ADEN',
          estimatedDelivery: 'خلال 24 - 48 ساعة عبر النجم/المحيط',
          isActive: true,
        },
        {
          id: 'ship-3',
          name: 'الاستلام مباشرة من الفرع (كريتر)',
          cost: 0,
          currency: 'YER_ADEN',
          estimatedDelivery: 'متاح فوراً خلال أوقات الدوام',
          isPickup: true,
          isActive: true,
        },
      ]),
      planTier: 'pro',
      planStatus: 'active',
      activeVisitorsNow: 14,
      totalSalesGMV: 48500,
    },
  });

  const sanaaTech = await prisma.store.create({
    data: {
      id: 'store-2',
      slug: 'sanaa-tech',
      name: 'صنعاء تك للإلكترونيات والأجهزة الذكية',
      description: 'أحدث الهواتف الذكية، ملحقات أبل وسامسونج، ولابتوبات بضمان رسمي وأسعار منافسة.',
      category: 'إلكترونيات وهواتف',
      logo: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
      primaryColor: '#2563eb',
      phone: '+967 777 888 999',
      whatsapp: '967777888999',
      email: 'info@sanaa-tech.ye',
      city: 'صنعاء',
      address: 'شارع حدة - أمام الكميم سنتر',
      baseCurrency: 'USD',
      customRates: JSON.stringify({
        YER_ADEN: 1910,
        YER_SANAA: 535,
        SAR: 3.75,
        USD: 1,
      }),
      paymentAccounts: JSON.stringify([
        {
          id: 'pay-4',
          type: 'onecash',
          name: 'محفظة ون كاش OneCash',
          accountNumber: '967777888999',
          accountName: 'مؤسسة صنعاء تك للتجارة',
          instructions: 'الدفع برقم الهاتف عبر تطبيق ون كاش.',
          isActive: true,
        },
        {
          id: 'pay-5',
          type: 'cod',
          name: 'الدفع عند الاستلام',
          accountNumber: '',
          accountName: '',
          instructions: 'متاح للطلبات داخل أمانة العاصمة صنعاء.',
          isActive: true,
        },
      ]),
      shippingMethods: JSON.stringify([
        {
          id: 'ship-4',
          name: 'توصيل مندوب سريع (صنعاء)',
          cost: 2000,
          currency: 'YER_SANAA',
          estimatedDelivery: 'خلال ساعتين',
          isActive: true,
        },
      ]),
      planTier: 'starter',
      planStatus: 'active',
      activeVisitorsNow: 8,
      totalSalesGMV: 31200,
    },
  });

  // 3. Create Products for Aden Boutique
  const prod1 = await prisma.product.create({
    data: {
      id: 'prod-1',
      storeId: adenBoutique.id,
      name: 'فستان حرير ملكي بتطريز يدوي فاخر',
      description: 'فستان مصمم من الحرير الطبيعي مع تطريز خيوط حريرية ولمسات تراثية راقية، مناسب للمناسبات الفاخرة والأعراس.',
      category: 'فساتين وسهرات',
      price: 180,
      comparePrice: 220,
      baseCurrency: 'SAR',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
      ]),
      stock: 14,
      lowStockAlert: 3,
      isAvailable: true,
      isFeatured: true,
      viewsCount: 412,
      salesCount: 28,
      tags: JSON.stringify(['أزياء', 'فساتين', 'سهرات', 'حرير']),
      variants: {
        create: [
          { id: 'var-1', name: 'زمردي - M', attributes: JSON.stringify({ color: 'زمردي', size: 'M' }), stock: 6 },
          { id: 'var-2', name: 'زمردي - L', attributes: JSON.stringify({ color: 'زمردي', size: 'L' }), stock: 4 },
          { id: 'var-3', name: 'عنابي - M', attributes: JSON.stringify({ color: 'عنابي', size: 'M' }), stock: 4 },
        ],
      },
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      id: 'prod-2',
      storeId: adenBoutique.id,
      name: 'عباية كلوش كريب ملكي مع طرحة ليزر مطرزة',
      description: 'عباية عملية وفخمة بقصة كلوش انسيابية مريحة ومقاومة للتجعد، تأتي مع طرحة ليزر بتطريز ناعم على الأطراف.',
      category: 'عبايات',
      price: 120,
      comparePrice: 150,
      baseCurrency: 'SAR',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
      ]),
      stock: 22,
      lowStockAlert: 5,
      isAvailable: true,
      isFeatured: true,
      viewsCount: 650,
      salesCount: 45,
      tags: JSON.stringify(['عبايات', 'كريب', 'يومي']),
      variants: {
        create: [
          { id: 'var-4', name: 'مقاس 54', attributes: JSON.stringify({ size: '54' }), stock: 8 },
          { id: 'var-5', name: 'مقاس 56', attributes: JSON.stringify({ size: '56' }), stock: 10 },
          { id: 'var-6', name: 'مقاس 58', attributes: JSON.stringify({ size: '58' }), stock: 4 },
        ],
      },
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      id: 'prod-3',
      storeId: adenBoutique.id,
      name: 'حقيبة يد جلد إيطالي فاخر مع حزام كتف مذهب',
      description: 'حقيبة راقية من الجلد الإيطالي الطبيعي المقاوم للخدوش مع إكسسوارات مذهبة غير قابلة لتغير اللون.',
      category: 'حقائب وإكسسوارات',
      price: 95,
      comparePrice: 130,
      baseCurrency: 'SAR',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
      ]),
      stock: 3,
      lowStockAlert: 5,
      isAvailable: true,
      isFeatured: true,
      viewsCount: 320,
      salesCount: 19,
      tags: JSON.stringify(['حقائب', 'جلد', 'إكسسوارات']),
    },
  });

  // 4. Create Initial Orders
  await prisma.order.create({
    data: {
      id: 'ord-101',
      orderNumber: 'ORD-8921',
      storeId: adenBoutique.id,
      customerName: 'فاطمة محمد ناصر',
      customerPhone: '+967 773 112 233',
      city: 'عدن',
      address: 'المعلا - الشارع الرئيسي عمارة البريد شقة 4',
      deliveryType: 'delivery',
      items: JSON.stringify([
        {
          productId: prod1.id,
          productName: prod1.name,
          productImage: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800',
          variantId: 'var-1',
          variantName: 'زمردي - M',
          price: 180,
          quantity: 1,
          total: 180,
        },
      ]),
      subtotal: 180,
      shippingCost: 0,
      discount: 0,
      total: 180,
      currency: 'SAR',
      paymentMethod: 'kuraimi',
      paymentProofUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
      paymentProofStatus: 'verified',
      status: 'processing',
      notes: 'يرجى التوصيل بعد العصر.',
    },
  });

  // 5. Create System Broadcasts
  await prisma.systemBroadcast.create({
    data: {
      id: 'bc-1',
      title: 'تحديث جديد: ربط قاعدة البيانات الحقيقية ومحرك Prisma ORM 🚀',
      message: 'تم تفعيل الحفظ الدائم وعزل البيانات لكافة المتاجر والطلبات بنجاح على الخادم.',
      type: 'success',
      isActive: true,
    },
  });

  console.log('✅ Database seeded successfully with multi-tenant stores and products!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
