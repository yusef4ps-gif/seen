'use server';

import { prisma } from '@/lib/prisma';

export async function createProductAction(data: any) {
  try {
    const product = await prisma.product.create({
      data: {
        id: data.id,
        storeId: data.storeId,
        name: data.name,
        description: data.description,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        stock: data.stock,
        lowStockAlert: data.lowStockAlert,
        images: JSON.stringify(data.images || []),
        category: data.category,
        tags: JSON.stringify(data.tags || []),
        isFeatured: data.isFeatured,
        status: data.status,
      }
    });
    return { success: true, product };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error };
  }
}

export async function updateProductAction(id: string, data: any) {
  try {
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        stock: data.stock,
        lowStockAlert: data.lowStockAlert,
        images: JSON.stringify(data.images || []),
        category: data.category,
        tags: JSON.stringify(data.tags || []),
        isFeatured: data.isFeatured,
        status: data.status,
      }
    });
    return { success: true, product };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await prisma.product.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error };
  }
}
