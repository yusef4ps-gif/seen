'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function bulkCreateProductsAction(storeId: string, products: any[]) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });
    
    if (!store) throw new Error('Store not found');
    
    const existingProducts = await prisma.product.findMany({
      where: { storeId }
    });
    
    let processedCount = 0;
    
    await prisma.$transaction(async (tx) => {
      for (const p of products) {
        const productName = p.name || 'منتج بدون اسم';
        const existing = existingProducts.find(ep => ep.name === productName);
        
        const price = parseFloat(p.price) || 0;
        const comparePrice = p.comparePrice ? parseFloat(p.comparePrice) : null;
        const stock = parseInt(p.stock) || 0;
        
        if (existing) {
          await tx.product.update({
            where: { id: existing.id },
            data: {
              price: price,
              ...(comparePrice !== null && { comparePrice }),
              stock: existing.stock + stock,
            }
          });
        } else {
          await tx.product.create({
             data: {
              storeId,
              name: productName,
              description: p.description || '',
              category: p.category || 'غير مصنف',
              price: price,
              comparePrice: comparePrice,
              baseCurrency: store.baseCurrency || 'SAR',
              images: JSON.stringify(p.images && p.images.length ? p.images : []),
              stock: stock,
              lowStockAlert: 5,
              isAvailable: true,
              isFeatured: false,
              tags: JSON.stringify(p.tags || []),
             }
          });
        }
        processedCount++;
      }
    });
    
    revalidatePath(`/merchant/[slug]/products`);
    
    return { success: true, count: processedCount };
  } catch (error) {
    console.error('Error in bulkCreateProductsAction:', error);
    return { success: false, error: 'Failed to import products' };
  }
}
