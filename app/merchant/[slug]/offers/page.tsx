'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Tag, Plus, Trash2, Zap, Gift, Check, X, Layers, Clock, 
  Sparkles, Filter, AlertCircle, Calendar, CheckCircle2, Ban, Eye, EyeOff
} from 'lucide-react';
import { getStoreBySlugAction, getProductsByStoreAction } from '@/app/actions/store';
import { 
  getStoreOffersAction, createStoreOfferAction, deleteStoreOfferAction, 
  toggleStoreOfferAction, StoreOffer 
} from '@/app/actions/offers';
import { Store } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import toast from 'react-hot-toast';

export default function MerchantOffersPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [offers, setOffers] = useState<StoreOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed' | 'bundle'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [discountStr, setDiscountStr] = useState('');
  const [scopeType, setScopeType] = useState<'all' | 'specific' | 'exclude'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Dropdown & Search state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    async function init() {
      if (slug) {
        setIsLoading(true);
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          const [fetchedOffers, prods] = await Promise.all([
            getStoreOffersAction(s.id),
            getProductsByStoreAction(s.id)
          ]);
          setOffers(fetchedOffers);
          setStoreProducts(prods);
        }
        setIsLoading(false);
      }
    }
    init();
  }, [slug]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;

    if (!title.trim()) {
      toast.error('يرجى كتابة عنوان العرض');
      return;
    }

    if (scopeType !== 'all' && selectedProductIds.length === 0) {
      toast.error(scopeType === 'specific' ? 'يرجى تحديد الخدمات المشمولة بالعرض' : 'يرجى تحديد الخدمات المستبعدة');
      return;
    }

    setIsSubmitting(true);
    const res = await createStoreOfferAction({
      storeId: store.id,
      title,
      type,
      discountValue: Number(discountValue) || 0,
      discountStr: discountStr || (type === 'percentage' ? `خصم ${discountValue}%` : `خصم ${discountValue}`),
      scopeType,
      productIds: selectedProductIds,
      startDate: startDate || null,
      endDate: endDate || null
    });
    setIsSubmitting(false);

    if (res.success && res.offer) {
      toast.success('تمت إضافة العرض الترويجي بنجاح! 🎉');
      setOffers([res.offer, ...offers]);
      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setType('percentage');
      setDiscountValue('');
      setDiscountStr('');
      setScopeType('all');
      setSelectedProductIds([]);
      setStartDate('');
      setEndDate('');
      setIsDropdownOpen(false);
    } else {
      toast.error(res.error || 'فشل حفظ العرض');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!store) return;
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;

    const res = await deleteStoreOfferAction(store.id, id);
    if (res.success) {
      toast.success('تم حذف العرض بنجاح');
      setOffers(offers.filter(o => o.id !== id));
    } else {
      toast.error(res.error || 'فشل حذف العرض');
    }
  };

  const handleToggleOffer = async (id: string) => {
    if (!store) return;
    const res = await toggleStoreOfferAction(store.id, id);
    if (res.success) {
      setOffers(offers.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o));
      toast.success('تم تحديث حالة تفعيل العرض');
    } else {
      toast.error(res.error || 'فشل تحديث الحالة');
    }
  };

  const getOfferTimingStatus = (offer: StoreOffer) => {
    if (!offer.isActive) return { label: 'معطل', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    const now = new Date();
    if (offer.startDate && new Date(offer.startDate) > now) {
      return { label: 'مجدول ⏳', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    if (offer.endDate && new Date(offer.endDate) < now) {
      return { label: 'منتهي الصلاحية ⛔', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    }
    return { label: 'نشط الآن 🟢', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  };

  if (!store && isLoading) {
    return (
      <div className="flex-1 p-10 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-600 mb-2"></div>
      </div>
    );
  }

  if (!store) return null;

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-600" />
            <span>العروض والخصومات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            أنشئ عروض ترويجية لخدمات واستشارات محددة، أو لكافة الخدمات مع إمكانية استبعاد ما تريده
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-brand-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء عرض جديد 🎁</span>
        </button>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {offers.map((offer) => {
          const timing = getOfferTimingStatus(offer);
          return (
            <div 
              key={offer.id} 
              className={`flex flex-col sm:flex-row gap-4 p-5 bg-white dark:bg-slateDark-900 rounded-3xl border transition-all relative overflow-hidden group shadow-sm ${
                offer.isActive ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-300 opacity-75'
              }`}
            >
              {/* Type Accent Icon */}
              <div className={`w-full sm:w-28 h-28 rounded-2xl flex flex-col items-center justify-center shrink-0 border ${
                offer.type === 'percentage' 
                  ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-200 dark:border-amber-800' 
                  : offer.type === 'bundle'
                  ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 border-purple-200 dark:border-purple-800'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800'
              }`}>
                {offer.type === 'percentage' ? <Zap className="w-8 h-8 mb-1" /> : <Gift className="w-8 h-8 mb-1" />}
                <span className="text-[10px] font-bold">
                  {offer.type === 'percentage' ? 'خصم مئوي %' : offer.type === 'bundle' ? 'باقة / حزمة' : 'مبلغ مباشر'}
                </span>
              </div>

              {/* Offer Details */}
              <div className="flex-1 flex flex-col justify-between py-1 text-right">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">{offer.title}</h3>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border shrink-0 ${timing.color}`}>
                      {timing.label}
                    </span>
                  </div>

                  <div className="inline-block px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-black text-xs">
                    {offer.discountStr}
                  </div>

                  {/* Scope Badge */}
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 pt-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>النطاق:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {offer.scopeType === 'all' 
                        ? 'كافة الخدمات والمنتجات' 
                        : offer.scopeType === 'specific'
                        ? `مشمول على (${offer.productIds.length}) خدمات محددة`
                        : `كافة الخدمات (باستثناء ${offer.productIds.length} خدمات)`}
                    </span>
                  </div>

                  {/* Date limits */}
                  {(offer.startDate || offer.endDate) && (
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>
                        {offer.startDate ? `من: ${new Date(offer.startDate).toLocaleDateString('en-GB')}` : ''}
                        {offer.endDate ? ` إلى: ${new Date(offer.endDate).toLocaleDateString('en-GB')}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleToggleOffer(offer.id)}
                    className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-colors ${
                      offer.isActive
                        ? 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200'
                        : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    {offer.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{offer.isActive ? 'إيقاف مؤقت' : 'تفعيل العرض'}</span>
                  </button>

                  <button 
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {offers.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
              <Gift className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">لا توجد عروض ترويجية نشطة حالياً</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              أنشئ عروضك الخاصة لتطبيق خصومات على خدمات محددة أو استبعاد خدمات أخرى لزيادة الحجوزات والمبيعات.
            </p>
          </div>
        )}
      </div>

      {/* Create Offer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col my-auto text-right">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-brand-600" />
                <h3 className="font-black text-slate-900 dark:text-white">إنشاء عرض أو خصم ترويجي جديد</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateOffer} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان / اسم العرض <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500" 
                  placeholder="مثال: خصم 25% على استشارات دراسة الجدوى"
                />
              </div>

              {/* Type and Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">نوع الخصم</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value as any)} 
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ مالي ثابت</option>
                    <option value="bundle">باقة / حزمة خاصة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {type === 'percentage' ? 'نسبة الخصم (%)' : 'قيمة الخصم'} <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={discountValue} 
                    onChange={e => setDiscountValue(e.target.value)} 
                    placeholder={type === 'percentage' ? '20' : '50'} 
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono" 
                  />
                </div>
              </div>

              {/* Custom Display Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  نص شارة العرض للعميل (اختياري)
                </label>
                <input 
                  type="text" 
                  value={discountStr} 
                  onChange={e => setDiscountStr(e.target.value)} 
                  placeholder={type === 'percentage' ? `خصم ${discountValue || '20'}%` : 'عرض حصري'} 
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none" 
                />
              </div>

              {/* SCOPE SELECTION (All vs Specific vs Exclude) */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  نطاق تطبيق العرض والخدمات المستهدفة:
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`cursor-pointer p-3 rounded-2xl border flex flex-col justify-between gap-1 transition-all ${
                    scopeType === 'all'
                      ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/20 text-brand-900 dark:text-brand-200 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">الكل (كافة الخدمات)</span>
                      <input
                        type="radio"
                        name="offerScope"
                        checked={scopeType === 'all'}
                        onChange={() => { setScopeType('all'); setSelectedProductIds([]); setIsDropdownOpen(false); }}
                        className="accent-brand-600"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">يشمل جميع الخدمات والمنتجات</span>
                  </label>

                  <label className={`cursor-pointer p-3 rounded-2xl border flex flex-col justify-between gap-1 transition-all ${
                    scopeType === 'specific'
                      ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/20 text-brand-900 dark:text-brand-200 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">خدمات محددة</span>
                      <input
                        type="radio"
                        name="offerScope"
                        checked={scopeType === 'specific'}
                        onChange={() => { setScopeType('specific'); setIsDropdownOpen(true); }}
                        className="accent-brand-600"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">تطبيق العرض على خدمات معينة</span>
                  </label>

                  <label className={`cursor-pointer p-3 rounded-2xl border flex flex-col justify-between gap-1 transition-all ${
                    scopeType === 'exclude'
                      ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/20 text-brand-900 dark:text-brand-200 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">استبعاد خدمات</span>
                      <input
                        type="radio"
                        name="offerScope"
                        checked={scopeType === 'exclude'}
                        onChange={() => { setScopeType('exclude'); setIsDropdownOpen(true); }}
                        className="accent-brand-600"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">يشمل الكل عدا المستبعدة</span>
                  </label>
                </div>

                {/* Collapsible Dropdown for selecting specific or excluded services */}
                {scopeType !== 'all' && (
                  <div className="space-y-2 pt-1 animate-fadeIn">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {scopeType === 'specific' ? 'اختر الخدمات المشمولة بالعرض:' : 'اختر الخدمات المستبعدة من العرض:'}
                    </label>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full p-3 rounded-2xl border text-right flex items-center justify-between text-xs font-bold transition-all shadow-xs ${
                          selectedProductIds.length > 0
                            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/20 text-brand-900 dark:text-brand-200'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Layers className="w-4 h-4 text-brand-600 shrink-0" />
                          <span className="truncate">
                            {selectedProductIds.length === 0
                              ? (scopeType === 'specific' ? 'اضغط لاختيار الخدمات المشمولة...' : 'اضغط لاختيار الخدمات المستبعدة...')
                              : (scopeType === 'specific'
                                ? `تم اختيار (${selectedProductIds.length}) خدمات مشمولة ✓`
                                : `تم اختيار (${selectedProductIds.length}) خدمات مستبعدة 🚫`)}
                          </span>
                        </div>
                        <span className="text-[11px] text-brand-600 dark:text-brand-400 font-bold shrink-0 flex items-center gap-1">
                          {isDropdownOpen ? 'إغلاق القائمة ▲' : 'فتح القائمة ▼'}
                        </span>
                      </button>

                      {/* Dropdown Box */}
                      {isDropdownOpen && (
                        <div className="mt-2 p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-brand-200 dark:border-brand-800 shadow-2xl space-y-3 z-30 animate-fadeIn">
                          {/* Search */}
                          <input
                            type="text"
                            placeholder="ابحث باسم الخدمة أو الاستشارة..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none text-right"
                          />

                          {/* Quick buttons */}
                          <div className="flex items-center justify-between text-[11px] font-bold px-1 border-b border-slate-100 dark:border-slate-800 pb-2">
                            <button
                              type="button"
                              onClick={() => setSelectedProductIds(storeProducts.map(p => p.id))}
                              className="text-brand-600 hover:underline"
                            >
                              تحديد كافة الخدمات ({storeProducts.length})
                            </button>
                            {selectedProductIds.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedProductIds([])}
                                className="text-rose-500 hover:underline"
                              >
                                إلغاء التحديد ({selectedProductIds.length})
                              </button>
                            )}
                          </div>

                          {/* Product items */}
                          <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                            {storeProducts.length === 0 ? (
                              <div className="text-xs text-slate-400 text-center py-3">لا توجد خدمات مضافة بالمتجر بعد</div>
                            ) : (
                              storeProducts
                                .filter(p => !productSearch.trim() || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                                .map((p) => {
                                  const isChecked = selectedProductIds.includes(p.id);
                                  return (
                                    <label
                                      key={p.id}
                                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                                        isChecked
                                          ? 'bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-950 dark:text-brand-200 font-bold'
                                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 truncate">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedProductIds([...selectedProductIds, p.id]);
                                            } else {
                                              setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                                            }
                                          }}
                                          className="accent-brand-600 rounded shrink-0"
                                        />
                                        <span className="truncate">{p.name}</span>
                                      </div>
                                      <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
                                        {formatCurrency(p.price, store.baseCurrency)}
                                      </span>
                                    </label>
                                  );
                                })
                            )}
                          </div>

                          {/* Done Button */}
                          <button
                            type="button"
                            onClick={() => setIsDropdownOpen(false)}
                            className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تم الاختيار ✓ (إغلاق القائمة والعودة للنموذج)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Start & End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">تاريخ البداية (اختياري)</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">تاريخ النهاية (اختياري)</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none" 
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 flex items-center gap-3">
                <button 
                  disabled={isSubmitting} 
                  type="submit" 
                  className="flex-1 py-3 px-5 rounded-2xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'جاري الحفظ...' : 'حفظ وتفعيل العرض 🚀'}</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
