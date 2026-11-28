import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStoreOwner, requireSuperAdmin } from '@/app/actions/auth';
import { convertCurrency } from '@/lib/currency-engine';
import { CurrencyCode } from '@/lib/types';
import { extractDigitalMetaFromTags } from '@/lib/digital-assets';

// GET /api/orders - Protected: requires Super Admin or Store Owner
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    try {
      if (storeId) {
        await requireStoreOwner(storeId);
      } else {
        await requireSuperAdmin();
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

// POST /api/orders - Create new order with server-side price recalculation & stock deduction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      storeId, customerName, customerPhone, city, address,
      deliveryType, items, currency, paymentMethod, paymentProofUrl, notes, couponCode
    } = body;

    if (!storeId || !customerName || !customerPhone || !items) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 });
    }

    const store = await prisma.store.findFirst({
      where: { OR: [{ id: storeId }, { slug: storeId }] },
    });
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    if (store.planStatus === 'suspended') {
      return NextResponse.json({ error: 'Store is suspended' }, { status: 403 });
    }

    const parsedItems: any[] = typeof items === 'string' ? JSON.parse(items) : items;
    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return NextResponse.json({ error: 'Order items cannot be empty' }, { status: 400 });
    }

    const orderCurrency = (currency || store.baseCurrency || 'SAR') as CurrencyCode;
    let customRates: any = {};
    try { customRates = store.customRates ? JSON.parse(store.customRates) : {}; } catch {}

    const prodIds = parsedItems.map((i) => i.productId).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: prodIds }, storeId: store.id },
      include: { variants: true },
    });
    if (dbProducts.length === 0) {
      return NextResponse.json({ error: 'No valid products found in store catalog' }, { status: 400 });
    }
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let subtotalBase = 0;
    const verifiedItems: any[] = [];
    for (const it of parsedItems) {
      const dbProd = productMap.get(it.productId);
      if (!dbProd) {
        return NextResponse.json({ error: `Product not found in store: ${it.productId}` }, { status: 400 });
      }
      const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
      const variant = it.variantId ? dbProd.variants.find((v) => v.id === it.variantId) : undefined;
      const unitBase = variant?.priceOverride ?? dbProd.price;
      const digitalMeta = extractDigitalMetaFromTags(dbProd.tags);
      subtotalBase += unitBase * qty;
      verifiedItems.push({
        productId: dbProd.id,
        productName: dbProd.name,
        variantId: variant?.id,
        variantName: variant?.name,
        price: unitBase,
        quantity: qty,
        total: unitBase * qty,
        digitalFileUrl: digitalMeta.digitalFileUrl || '',
        digitalFileName: digitalMeta.digitalFileName || '',
        digitalFileAccess: digitalMeta.digitalFileAccess || 'instant',
      });
    }

    const subtotal = convertCurrency(subtotalBase, (dbProducts[0].baseCurrency || store.baseCurrency || 'SAR') as CurrencyCode, orderCurrency, customRates);
    let shippingCost = 0;
    if (deliveryType !== 'pickup') {
      try {
        const methods = JSON.parse(store.shippingMethods || '[]');
        const activeShip = methods.find((m: any) => m.isActive && !m.isPickup);
        shippingCost = activeShip ? Number(activeShip.cost) || 0 : 0;
      } catch {}
    }

    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { storeId_code: { storeId: store.id, code: String(couponCode).toUpperCase() } },
      });
      if (coupon && coupon.isActive && (coupon.maxUses === 0 || coupon.usageCount < coupon.maxUses) && (!coupon.expiry || new Date() <= coupon.expiry)) {
        if (coupon.type === 'shipping') shippingCost = 0;
        else if (coupon.type === 'percentage') discount = Math.round(subtotal * (coupon.discount / 100) * 100) / 100;
        else if (coupon.type === 'fixed') discount = convertCurrency(coupon.discount, (store.baseCurrency || 'SAR') as CurrencyCode, orderCurrency, customRates);
      }
    }

    const total = Math.max(0, Math.round((subtotal + shippingCost - discount) * 100) / 100);
    const effectivePayment = total <= 0 ? 'free' : (paymentMethod || 'cod');
    const count = await prisma.order.count({ where: { storeId: store.id } });
    const orderNumber = `#${1000 + count + 1}`;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        storeId: store.id,
        customerName: String(customerName),
        customerPhone: String(customerPhone),
        city: city || 'عدن',
        address: address || '',
        deliveryType: deliveryType || 'delivery',
        items: JSON.stringify(verifiedItems),
        subtotal,
        shippingCost,
        discount,
        total,
        currency: orderCurrency,
        paymentMethod: effectivePayment,
        paymentProofUrl: paymentProofUrl || '',
        paymentProofStatus: 'unverified',
        status: effectivePayment === 'cod' || total <= 0 ? 'new' : 'pending_payment',
        notes: notes || '',
      },
    });

    for (const it of verifiedItems) {
      const prod = productMap.get(it.productId);
      if (prod) {
        await prisma.product.update({
          where: { id: it.productId },
          data: {
            stock: { decrement: Math.min(it.quantity, Math.max(0, prod.stock)) },
            salesCount: { increment: it.quantity },
          },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      ...newOrder,
      items: verifiedItems,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
