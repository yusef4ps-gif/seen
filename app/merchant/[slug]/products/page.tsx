'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Package, Plus, Search, Filter, Edit, Trash2, Sparkles, 
  Bot, Image as ImageIcon, AlertTriangle, Check, X, Layers, Eye, DollarSign
} from 'lucide-react';
import { formatCurrency, convertCurrency } from '@/lib/currency-engine';
import { Store, Product, ProductVariant } from '@/lib/types';
import { generateAIProductDescription } from '@/lib/ai-generator';
import ImageUploader from '@/components/ImageUploader';
import { getStoreBySlugAction, getProductsByStoreAction } from '@/app/actions/store';
import { createProductAction, updateProductAction, deleteProductAction } from '@/app/actions/product';

export default function MerchantProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('فساتين وسهرات');
  const [price, setPrice] = useState<number>(50);
  const [comparePrice, setComparePrice] = useState<number | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState<number>(20);
  const [lowStockAlert, setLowStockAlert] = useState<number>(5);
  const [isFeatured, setIsFeatured] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // AI loading state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const loadProducts = async (storeId: string) => {
    const prods = await getProductsByStoreAction(storeId);
    setProducts(prods as any);
  };

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          await loadProducts(s.id);
        }
      }
    }
    init();

    if (searchParams.get('action') === 'new') {
      handleOpenNewModal();
    }
  }, [slug, searchParams]);

  const refreshProducts = async () => {
    if (store) {
      await loadProducts(store.id);
    }
  };

  const handleOpenNewModal = () => {
    setEditingProductId(null);
    setName('');
    setDescription('');
    setCategory('أزياء وموضة');
    setPrice(50);
    setComparePrice(undefined);
    setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80');
    setStock(20);
    setLowStockAlert(5);
    setIsFeatured(false);
    setVariants([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProductId(prod.id);
    setName(prod.name);
    setDescription(prod.description);
    setCategory(prod.category);
    setPrice(prod.price);
    setComparePrice(prod.comparePrice);
    setImageUrl(prod.images[0] || '');
    setStock(prod.stock);
    setLowStockAlert(prod.lowStockAlert);
    setIsFeatured(!!prod.isFeatured);
    setVariants(prod.variants || []);
    setIsModalOpen(true);
  };

  const handleGenerateAI = () => {
    if (!name) {
      alert('يرجى كتابة اسم المنتج أولاً ليقوم الذكاء الاصطناعي بصياغة الوصف المناسب.');
      return;
    }
    setIsGeneratingAI(true);
    setTimeout(() => {
      const result = generateAIProductDescription({
        productName: name,
        category,
      });
      setDescription(result.description);
      setIsGeneratingAI(false);
    }, 600);
  };

  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      name: 'متغير جديد (مثال: أحمر - L)',
      attributes: { color: 'افتراضي', size: 'M' },
      stock: 5,
    };
    setVariants([...variants, newVar]);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !name || price <= 0) return;

    if (editingProductId) {
      await updateProductAction(editingProductId, {
        name,
        description,
        category,
        price,
        compareAtPrice: comparePrice || undefined,
        images: [imageUrl],
        stock,
        lowStockAlert,
        isFeatured,
        status: 'active',
        tags: [category],
        variants, // Ensure variants are passed
      });
    } else {
      await createProductAction({
        id: `prod_${Date.now()}`,
        storeId: store.id,
        name,
        description,
        category,
        price,
        compareAtPrice: comparePrice || undefined,
        images: [imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
        stock,
        lowStockAlert,
        isFeatured,
        status: 'active',
        tags: [category],
        variants, // Ensure variants are passed
      });
    }

    setIsModalOpen(false);
    await refreshProducts();
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      await deleteProductAction(productId);
      await refreshProducts();
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            إدارة المنتجات والتصنيفات
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            إضافة وتعديل المنتجات، خيارات الألوان والمقاسات، وتوليد الأوصاف بالذكاء الاصطناعي
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/25 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة منتج جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث بالاسم أو التصنيف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          >
            <option value="all">كافة التصنيفات ({products.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">المنتج والتفاصيل</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">السعر الأساسي</th>
                <th className="py-3 px-4">المعادل بالريال اليمني</th>
                <th className="py-3 px-4">المخزون</th>
                <th className="py-3 px-4">المبيعات</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((prod) => {
                const isLow = prod.stock <= (prod.lowStockAlert || 5);
                const isOut = prod.stock === 0;
                // Calculate converted price in YER Aden
                const priceInYER = convertCurrency(prod.price, prod.baseCurrency, 'YER_ADEN', store?.customRates);

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    
                    {/* Image & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={prod.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'} 
                          alt={prod.name} 
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100" 
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{prod.name}</span>
                            {prod.isFeatured && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-bold">
                                مميز
                              </span>
                            )}
                          </div>
                          {prod.variants && prod.variants.length > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {prod.variants.length} خيارات (ألوان/مقاسات)
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                        {prod.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(prod.price, prod.baseCurrency)}
                      {prod.comparePrice && (
                        <span className="block text-[10px] line-through text-slate-400 font-normal">
                          {formatCurrency(prod.comparePrice, prod.baseCurrency)}
                        </span>
                      )}
                    </td>

                    {/* Converted in YER */}
                    <td className="py-3.5 px-4 text-brand-600 dark:text-brand-400 font-bold">
                      {formatCurrency(priceInYER, 'YER_ADEN')}
                    </td>

                    {/* Stock Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isOut ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                        isLow ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      }`}>
                        {isOut ? 'نفد المخزون' : isLow ? `منخفض (${prod.stock})` : `${prod.stock} قطعة`}
                      </span>
                    </td>

                    {/* Sales count */}
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {prod.salesCount || 0} طلب
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                          title="تعديل المنتج"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-600 text-slate-400 transition-colors"
                          title="حذف المنتج"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-600" />
                <span>{editingProductId ? 'تعديل المنتج' : 'إضافة منتج جديد'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم المنتج <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فستان حرير ملكي بتطريز يدوي"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Description & AI Generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    وصف المنتج التسويقي
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-1 shadow-xs transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAI ? 'جاري التوليد...' : 'توليد الوصف بالذكاء الاصطناعي ✨'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="اكتب وصفاً جذاباً أو اضغط زر التوليد بالذكاء الاصطناعي..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Category, Base Price, Compare Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    التصنيف
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: فساتين، هواتف، عطور"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    السعر ({store?.baseCurrency}) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    السعر قبل الخصم (اختياري)
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 70"
                    value={comparePrice || ''}
                    onChange={(e) => setComparePrice(parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Currency Preview Badge */}
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 flex items-center justify-between text-xs text-brand-700 dark:text-brand-300">
                <span className="font-medium">معاينة السعر في متجر العميل:</span>
                <span className="font-bold">
                  {formatCurrency(price, store?.baseCurrency || 'SAR')} = {formatCurrency(convertCurrency(price, store?.baseCurrency || 'SAR', 'YER_ADEN', store?.customRates), 'YER_ADEN')}
                </span>
              </div>

              {/* Image Uploader Component (Drag & Drop + Local File + WebP + URL) */}
              <ImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                label="صورة المنتج الرئيسية (سحب وإفلات أو اختيار من الجهاز)"
              />

              {/* Stock and Alert Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    الكمية المتوفرة في المخزون
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    تنبيه انخفاض المخزون عند
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={lowStockAlert}
                    onChange={(e) => setLowStockAlert(parseInt(e.target.value) || 5)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* Variants Matrix Section */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      خيارات المنتج والمتغيرات (المقاسات والألوان)
                    </h4>
                    <p className="text-[11px] text-slate-500">إضافة كميات وسعر منفصل لكل مقاس أو لون</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة خيار</span>
                  </button>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {variants.map((v, idx) => (
                      <div key={v.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="اسم الخيار (مثال: أزرق - XL)"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].name = e.target.value;
                            setVariants(updated);
                          }}
                          className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        />
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-[10px] text-slate-400">الكمية:</span>
                          <input
                            type="number"
                            min={0}
                            value={v.stock}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].stock = parseInt(e.target.value) || 0;
                              setVariants(updated);
                            }}
                            className="w-12 px-1.5 py-1 text-xs text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/25"
                >
                  {editingProductId ? 'حفظ التعديلات' : 'إضافة المنتج فوراً'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
