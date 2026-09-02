'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Boxes, AlertTriangle, TrendingUp, PackageCheck, 
  Save, RefreshCw, Layers, CheckCircle2, ArrowUpDown, Sparkles
} from 'lucide-react';
import { Store, Product } from '@/lib/types';
import { calculateInventoryOverview, InventoryOverview } from '@/lib/inventory-engine';
import { formatCurrency } from '@/lib/currency-engine';
import { getStoreBySlugAction, getProductsByStoreAction } from '@/app/actions/store';
import { updateProductAction } from '@/app/actions/product';

export default function MerchantInventoryPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [overview, setOverview] = useState<InventoryOverview | null>(null);
  const [editingStock, setEditingStock] = useState<Record<string, { stock: number; price: number }>>({});
  const [isSaved, setIsSaved] = useState(false);

  const loadData = async () => {
    if (slug) {
      const s = await getStoreBySlugAction(slug);
      if (s) {
        setStore(s as any);
        const prods = await getProductsByStoreAction(s.id);
        setProducts(prods as any);
        setOverview(calculateInventoryOverview(prods as any));

        const initialMap: Record<string, { stock: number; price: number }> = {};
        prods.forEach((p: any) => {
          initialMap[p.id] = { stock: p.stock, price: p.price };
        });
        setEditingStock(initialMap);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  const handleStockChange = (productId: string, newStock: number) => {
    setEditingStock((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], stock: newStock },
    }));
    setIsSaved(false);
  };

  const handlePriceChange = (productId: string, newPrice: number) => {
    setEditingStock((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], price: newPrice },
    }));
    setIsSaved(false);
  };

  const handleSaveBulkChanges = async () => {
    if (!store) return;
    
    // Save all changes concurrently
    const promises = Object.keys(editingStock).map(async (productId) => {
      const { stock, price } = editingStock[productId];
      const prod = products.find(p => p.id === productId);
      if (prod && (prod.stock !== stock || prod.price !== price)) {
        await updateProductAction(productId, {
          name: prod.name,
          category: prod.category,
          stock,
          price,
          lowStockAlert: prod.lowStockAlert,
          isFeatured: prod.isFeatured,
        });
      }
    });

    await Promise.all(promises);
    await loadData();

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  if (!store) return null;

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-brand-600" />
            <span>ذكاء المخزون والتقييم المالي المتقدم</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            مراقبة صحة المستودع، القيمة المالية للبضاعة، ومحرر الكميات والأسعار السريع
          </p>
        </div>

        <button
          onClick={handleSaveBulkChanges}
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/25 flex items-center justify-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>{isSaved ? 'تم حفظ التعديلات بنجاح ✓' : 'حفظ التعديلات الجماعية'}</span>
        </button>
      </div>

      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Stock Valuation */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">القيمة المالية الإجمالية للبضاعة</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(overview?.totalStockValueUSD || 0, store.baseCurrency)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-2 font-semibold">
            قيمة المخزون بسعر البيع الحالي
          </div>
        </div>

        {/* Total Units */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">إجمالي القطع المتوفرة</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {overview?.totalUnitsInStock || 0} <span className="text-xs font-normal text-slate-400">قطعة</span>
          </div>
          <div className="text-[11px] text-brand-600 mt-2 font-semibold">
            عبر {overview?.totalProducts || 0} صنف رئيسي
          </div>
        </div>

        {/* Low & Out of stock */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">تنبيهات انخفاض المخزون</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {overview?.lowStockItemsCount || 0} <span className="text-xs font-normal text-slate-400">تحتاج توريد</span>
          </div>
          <div className="text-[11px] text-red-500 mt-2 font-semibold">
            {overview?.outOfStockItemsCount || 0} صنف نفد بالكامل (0)
          </div>
        </div>

        {/* Fast moving items */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">المنتجات الأكثر طلباً وسرعة</div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
            {overview?.fastMovingCount || 0} <span className="text-xs font-normal text-slate-400">أصناف سريعة</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            تحقق معدل دوران عالي في المتجر
          </div>
        </div>

      </div>

      {/* Bulk Quick Editor Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              محرر المخزون والأسعار السريع (Bulk Quick-Editor)
            </h3>
            <p className="text-xs text-slate-500">
              عدّل الأسعار والكميات مباشرة في الجدول واضغط "حفظ التعديلات" لحفظ كافة المنتجات دفعة واحدة.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">الصنف</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4 w-36">السعر ({store.baseCurrency})</th>
                <th className="py-3 px-4 w-36">المخزون المتوفر</th>
                <th className="py-3 px-4">الحالة والتنبيه</th>
                <th className="py-3 px-4">إجمالي قيمة الصنف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {products.map((prod) => {
                const currentStock = editingStock[prod.id]?.stock ?? prod.stock;
                const currentPrice = editingStock[prod.id]?.price ?? prod.price;
                const isLow = currentStock <= (prod.lowStockAlert || 5);
                const isOut = currentStock === 0;

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <img 
                        src={prod.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'} 
                        alt={prod.name} 
                        className="w-8 h-8 rounded-lg object-cover bg-slate-100" 
                      />
                      <span>{prod.name}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {prod.category}
                    </td>

                    {/* Editable Price */}
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min={1}
                        value={currentPrice}
                        onChange={(e) => handlePriceChange(prod.id, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 text-xs text-center font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-brand-500"
                      />
                    </td>

                    {/* Editable Stock */}
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min={0}
                        value={currentStock}
                        onChange={(e) => handleStockChange(prod.id, parseInt(e.target.value) || 0)}
                        className={`w-20 px-2 py-1.5 text-xs text-center font-bold rounded-lg border focus:ring-1 focus:ring-brand-500 ${
                          isOut
                            ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300'
                            : isLow
                            ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-50 text-slate-900 border-slate-200 dark:bg-slate-800 dark:text-white'
                        }`}
                      />
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isOut ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                        isLow ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      }`}>
                        {isOut ? 'نفد المخزون' : isLow ? 'تنبيه: وشك على النفاد' : 'متوفر ومستقر'}
                      </span>
                    </td>

                    {/* Total item asset valuation */}
                    <td className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(currentStock * currentPrice, store.baseCurrency)}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
