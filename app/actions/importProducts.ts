'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function bulkCreateProductsAction(storeId: string, products: any[]) {
  try {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });
    
    if (!store) throw new Error('Store not found');
    
    // Process products to ensure they have the required fields
    const formattedProducts = products.map((p) => {
      return {
        storeId,
        name: p.name || 'منتج بدون اسم',
        description: p.description || '',
        category: p.category || 'غير مصنف',
        price: parseFloat(p.price) || 0,
        comparePrice: p.comparePrice ? parseFloat(p.comparePrice) : null,
        baseCurrency: store.baseCurrency || 'SAR',
        images: JSON.stringify(p.images && p.images.length ? p.images : ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800']),
        stock: parseInt(p.stock) || 0,
        lowStockAlert: 5,
        isAvailable: true,
        isFeatured: false,
        status: 'active',
        tags: JSON.stringify(p.tags || []),
      };
    });

    // Use transaction for bulk creation
    const created = await prisma.$transaction(
      formattedProducts.map((prod) => prisma.product.create({ data: prod }))
    );
    
    revalidatePath(`/merchant/[slug]/products`);
    
    return { success: true, count: created.length };
  } catch (error) {
    console.error('Error in bulkCreateProductsAction:', error);
    return { success: false, error: 'Failed to import products' };
  }
}
