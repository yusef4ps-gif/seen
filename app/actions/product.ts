'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireStoreOwner, requireAuth } from '@/app/actions/auth';

export async function createProductAction(data: any) {
  try {
    await requireAuth();
    await requireStoreOwner(data.storeId);

    const product = await prisma.product.create({
      data: {
        id: data.id,
        storeId: data.storeId,
        name: data.name,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice || data.compareAtPrice,
        stock: data.stock,
        lowStockAlert: data.lowStockAlert,
        images: JSON.stringify(data.images || []),
        category: data.category,
        tags: JSON.stringify(data.tags || []),
        isFeatured: data.isFeatured,
        variants: {
          create: data.variants ? data.variants.map((v: any) => ({
            name: v.name,
            attributes: JSON.stringify(v.attributes || {}),
            priceOverride: v.priceOverride,
            stock: v.stock,
            sku: v.sku
          })) : []
        }
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
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) throw new Error("Product not found");
    
    await requireStoreOwner(existingProduct.storeId);

    // First, delete existing variants to replace them with the new ones
    if (data.variants) {
      await prisma.productVariant.deleteMany({
        where: { productId: id }
      });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.comparePrice !== undefined || data.compareAtPrice !== undefined) {
      updateData.comparePrice = data.comparePrice || data.compareAtPrice;
    }
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.lowStockAlert !== undefined) updateData.lowStockAlert = data.lowStockAlert;
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

    if (data.variants) {
      updateData.variants = {
        create: data.variants.map((v: any) => ({
          name: v.name,
          attributes: JSON.stringify(v.attributes || {}),
          priceOverride: v.priceOverride,
          stock: v.stock,
          sku: v.sku
        }))
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });
    
    // Revalidate paths so the UI reflects changes
    revalidatePath(`/merchant/[slug]/inventory`, 'page');
    revalidatePath(`/merchant/[slug]/products`, 'page');
    revalidatePath(`/store/[slug]`, 'page');
    return { success: true, product };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) throw new Error("Product not found");
    
    await requireStoreOwner(existingProduct.storeId);

    await prisma.product.delete({
      where: { id }
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error };
  }
}
