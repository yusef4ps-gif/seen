import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      images: JSON.parse(product.images || '[]'),
      tags: JSON.parse(product.tags || '[]'),
      variants: product.variants.map((v) => ({
        ...v,
        attributes: JSON.parse(v.attributes || '{}'),
      })),
    });
  } catch (error) {
    console.error('Error fetching product by id:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

// PATCH /api/products/[id] - Update product
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    const dataToUpdate: any = {};
    if (body.name !== undefined) dataToUpdate.name = body.name;
    if (body.description !== undefined) dataToUpdate.description = body.description;
    if (body.category !== undefined) dataToUpdate.category = body.category;
    if (body.price !== undefined) dataToUpdate.price = parseFloat(body.price);
    if (body.comparePrice !== undefined) dataToUpdate.comparePrice = body.comparePrice ? parseFloat(body.comparePrice) : null;
    if (body.stock !== undefined) dataToUpdate.stock = parseInt(body.stock);
    if (body.lowStockAlert !== undefined) dataToUpdate.lowStockAlert = parseInt(body.lowStockAlert);
    if (body.isAvailable !== undefined) dataToUpdate.isAvailable = body.isAvailable;
    if (body.isFeatured !== undefined) dataToUpdate.isFeatured = body.isFeatured;
    if (body.salesCount !== undefined) dataToUpdate.salesCount = body.salesCount;
    if (body.viewsCount !== undefined) dataToUpdate.viewsCount = body.viewsCount;

    if (body.images !== undefined) {
      dataToUpdate.images = typeof body.images === 'string' ? body.images : JSON.stringify(body.images);
    }
    if (body.tags !== undefined) {
      dataToUpdate.tags = typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
      include: { variants: true },
    });

    return NextResponse.json({
      ...updated,
      images: JSON.parse(updated.images || '[]'),
      tags: JSON.parse(updated.tags || '[]'),
      variants: updated.variants.map((v) => ({
        ...v,
        attributes: JSON.parse(v.attributes || '{}'),
      })),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
