'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Ticket, Plus, Tag, Trash2, Clock, X, CheckSquare, Square, Layers, Check } from 'lucide-react';
import { getStoreBySlugAction, getProductsByStoreAction } from '@/app/actions/store';
import { getCouponsAction, createCouponAction, deleteCouponAction } from '@/app/actions/coupon';
import { logActivityAction } from '@/app/actions/activity';
import { Store } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import { authEngine } from '@/lib/auth-engine';

export default function MerchantCouponsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState('percentage');
  const [discount, setDiscount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiry, setExpiry] = useState('');
  const [scopeType, setScopeType] = useState<'all' | 'specific'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          const [cpns, prods] = await Promise.all([
            getCouponsAction(s.id),
            getProductsByStoreAction(s.id)
          ]);
          setCoupons(cpns);
          setStoreProducts(prods);
        }
      }
    }
    init();
  }, [slug]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    setIsSubmitting(true);
    
    const appliesTo = scopeType === 'all' || selectedProductIds.length === 0
      ? 'all'
      : JSON.stringify(selectedProductIds);

    const res = await createCouponAction({
      storeId: store.id,
      code,
      type,
      discount: Number(discount) || 0,
      maxUses: maxUses ? parseInt(maxUses) : 0,
      expiry: expiry || null,
      appliesTo
    });

    if (res.success) {
      setCoupons([res.coupon, ...coupons]);
      
      logActivityAction({
        storeId: store.id,
        action: 'إضافة',
        details: `تمت إضافة كود خصم جديد: ${code}`,
        userName: authEngine.getCurrentUser()?.name || 'مجهول',
        entity: 'عروض وخصومات',
        device: window.navigator.userAgent
      });

      setIsModalOpen(false);
      // Reset form
      setCode('');
      setDiscount('');
      setMaxUses('');
      setExpiry('');
      setScopeType('all');
      setSelectedProductIds([]);
    } else {
      alert(res.error);
    }
    setIsSubmitting(false);
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!store) return;
    if (confirm('هل أنت متأكد من حذف هذا الكوبون؟')) {
      const res = await deleteCouponAction(id, store.id, slug);
      if (res.success) {
        setCoupons(coupons.filter(c => c.id !== id));
        
        logActivityAction({
          storeId: store.id,
          action: 'حذف',
          details: `تم حذف كود الخصم`,
          userName: authEngine.getCurrentUser()?.name || 'مجهول',
          entity: 'عروض وخصومات',
          device: window.navigator.userAgent
        });
      } else {
        alert(res.error);
      }
    }
  };

  if (!store) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-brand-600" />
            <span>كوبونات التخفيض</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            أنشئ أكواد الخصم لعملائك لزيادة الولاء والمبيعات
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>كوبون جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.id} className="p-5 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-2 h-full ${c.isActive ? 'bg-brand-500' : 'bg-slate-300'}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-widest">{c.code}</h3>
                <p className="text-xs text-brand-600 font-bold mt-1">
                  {c.type === 'percentage' ? `خصم ${c.discount}%` : c.type === 'fixed' ? `خصم ${formatCurrency(c.discount, store.baseCurrency)}` : 'شحن مجاني'}
                </p>
              </div>
              <button onClick={() => handleDeleteCoupon(c.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" /> نطاق الخصم:</span>
                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                  c.appliesTo === 'all' || !c.appliesTo 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' 
                    : 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                }`}>
                  {c.appliesTo === 'all' || !c.appliesTo ? 'الجميع (كافة الخدمات)' : `${(() => { try { return JSON.parse(c.appliesTo).length; } catch { return 1; } })()} خدمات محددة`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> الاستخدامات:</span>
                <span className="font-bold text-slate-900 dark:text-white">{c.usageCount} / {c.maxUses === 0 ? 'مفتوح' : c.maxUses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ينتهي في:</span>
                <span className="font-bold text-slate-900 dark:text-white" dir="ltr">
                  {c.expiry ? new Date(c.expiry).toLocaleDateString('en-GB') : 'مفتوح'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slateDark-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-slate-900 dark:text-white">إضافة كوبون خصم جديد</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="p-5 space-y-4 overflow-y-auto flex-1 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">كود الخصم</label>
                <input required type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="مثال: WEEKEND20" className="w-full px-3 py-2 text-xs rounded-xl border outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white uppercase font-black tracking-wider" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">نوع الخصم</label>
                  <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت</option>
                    <option value="shipping">شحن مجاني</option>
                  </select>
                </div>
                {type !== 'shipping' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">قيمة الخصم</label>
                    <input required type="number" step="0.01" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="10" className="w-full px-3 py-2 text-xs rounded-xl border outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                  </div>
                )}
              </div>

              {/* Scope Selection: All vs Specific Services/Products */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  نطاق تطبيق الخصم:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`cursor-pointer p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    scopeType === 'all'
                      ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}>
                    <span className="text-xs">الجميع (كافة الخدمات)</span>
                    <input
                      type="radio"
                      name="scopeType"
                      checked={scopeType === 'all'}
                      onChange={() => { setScopeType('all'); setSelectedProductIds([]); }}
                      className="accent-brand-600"
                    />
                  </label>

                  <label className={`cursor-pointer p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    scopeType === 'specific'
                      ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}>
                    <span className="text-xs">خدمات / منتجات محددة</span>
                    <input
                      type="radio"
                      name="scopeType"
                      checked={scopeType === 'specific'}
                      onChange={() => setScopeType('specific')}
                      className="accent-brand-600"
                    />
                  </label>
                </div>

                {scopeType === 'specific' && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 max-h-48 overflow-y-auto">
                    <div className="text-[11px] text-slate-500 font-bold">اختر الخدمات أو المنتجات المشمولة بالخصم:</div>
                    {storeProducts.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-2">لا توجد خدمات متاحة حالياً</div>
                    ) : (
                      storeProducts.map((p) => {
                        const isChecked = selectedProductIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition-colors ${
                              isChecked ? 'bg-white dark:bg-slate-800 border border-brand-300 shadow-xs' : 'hover:bg-white/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
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
                                className="accent-brand-600 rounded"
                              />
                              <span className="font-bold truncate max-w-[200px]">{p.name}</span>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-slate-500">
                              {formatCurrency(p.price, store.baseCurrency)}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">الحد الأقصى للاستخدام</label>
                  <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="0 للمفتوح" className="w-full px-3 py-2 text-xs rounded-xl border outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">تاريخ الانتهاء</label>
                  <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl border outline-none dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                </div>
              </div>
              <button disabled={isSubmitting} type="submit" className="w-full py-3 mt-2 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-50 shadow-md transition-all">
                {isSubmitting ? 'جاري الحفظ...' : 'إنشاء الكوبون 🏷️'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
