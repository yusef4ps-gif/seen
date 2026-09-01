import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products - Get products (optional filter by storeId)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    const products = await prisma.product.findMany({
      where: storeId ? { storeId } : undefined,
      include: { variants: true },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = products.map((p) => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
      tags: JSON.parse(p.tags || '[]'),
      variants: p.variants.map((v) => ({
        ...v,
        attributes: JSON.parse(v.attributes || '{}'),
      })),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - Create a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeId, name, description, category, price, comparePrice, baseCurrency, images, stock, lowStockAlert, isFeatured, variants, tags } = body;

    if (!storeId || !name || price === undefined) {
      return NextResponse.json({ error: 'storeId, name, and price are required' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        storeId,
        name,
        description: description || '',
        category: category || 'عام',
        price: parseFloat(price) || 0,
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        baseCurrency: baseCurrency || 'SAR',
        images: JSON.stringify(images || []),
        stock: parseInt(stock) || 0,
        lowStockAlert: parseInt(lowStockAlert) || 5,
        isFeatured: !!isFeatured,
        tags: JSON.stringify(tags || []),
        variants: variants && variants.length > 0 ? {
          create: variants.map((v: any) => ({
            name: v.name,
            attributes: JSON.stringify(v.attributes || {}),
            priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : null,
            stock: parseInt(v.stock) || 0,
            sku: v.sku || '',
          })),
        } : undefined,
      },
      include: { variants: true },
    });

    return NextResponse.json({
      ...newProduct,
      images: JSON.parse(newProduct.images),
      tags: JSON.parse(newProduct.tags),
      variants: newProduct.variants.map((v) => ({
        ...v,
        attributes: JSON.parse(v.attributes || '{}'),
      })),
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
