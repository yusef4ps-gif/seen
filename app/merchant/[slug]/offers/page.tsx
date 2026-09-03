'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Tag, Plus, Trash2, Zap, Gift, Image as ImageIcon } from 'lucide-react';
import { getStoreBySlugAction } from '@/app/actions/store';
import { Store } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';

export default function MerchantOffersPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [offers, setOffers] = useState([
    { id: '1', title: 'عروض نهاية العام', type: 'bundle', discountStr: 'اشتر 2 واحصل على 1 مجاناً', status: 'active' },
    { id: '2', title: 'خصم البلاك فرايداي', type: 'flash', discountStr: 'خصم 50% على كل شيء', status: 'scheduled' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOffer, setNewOffer] = useState({ title: '', type: 'flash', discountStr: '', status: 'active' });

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) setStore(s as any);
      }
    }
    init();
  }, [slug]);

  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOffer.title) return;
    
    setOffers([{
      id: Date.now().toString(),
      ...newOffer
    }, ...offers]);
    setIsModalOpen(false);
    setNewOffer({ title: '', type: 'flash', discountStr: '', status: 'active' });
  };

  const handleDeleteOffer = (id: string) => {
    setOffers(offers.filter(o => o.id !== id));
  };

  if (!store) return null;

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-600" />
            <span>العروض الخاصة والحزم</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            إدارة عروض الفلاش، تجميعات المنتجات (Bundles)، وخصومات الكميات
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء عرض جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {offers.map((offer) => (
          <div key={offer.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group">
            <div className="w-full sm:w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center text-slate-400 shrink-0">
              {offer.type === 'flash' ? <Zap className="w-8 h-8 text-amber-500 mb-2" /> : <Gift className="w-8 h-8 text-rose-500 mb-2" />}
              <span className="text-[10px] font-bold">{offer.type === 'flash' ? 'عروض فلاش' : 'حزمة (Bundle)'}</span>
            </div>
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{offer.title}</h3>
                  <p className="text-xs text-brand-600 font-black mt-1 bg-brand-50 dark:bg-brand-950/50 inline-block px-2 py-1 rounded-md">{offer.discountStr}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${offer.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {offer.status === 'active' ? 'نشط الآن' : 'مجدول'}
                </span>
              </div>
              <div className="flex justify-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => handleDeleteOffer(offer.id)}
                  className="text-[11px] font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </div>
          </div>
        ))}
        {offers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm font-medium">
            لا توجد عروض حالياً. انقر على "إنشاء عرض جديد" لإضافة عرض.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto pt-20">
          <div className="bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 my-auto">
            <div className="p-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">إنشاء عرض جديد</h2>
              <form onSubmit={handleAddOffer} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم العرض</label>
                  <input 
                    type="text" required 
                    value={newOffer.title} onChange={e => setNewOffer({...newOffer, title: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                    placeholder="مثال: خصم نهاية الصيف"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">نوع العرض</label>
                    <select 
                      value={newOffer.type} onChange={e => setNewOffer({...newOffer, type: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="flash">عروض فلاش (وقت محدد)</option>
                      <option value="bundle">حزمة (Bundle)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">نص العرض للعميل</label>
                    <input 
                      type="text" required 
                      value={newOffer.discountStr} onChange={e => setNewOffer({...newOffer, discountStr: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                      placeholder="مثال: خصم 20%"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black transition-colors">
                    إضافة العرض
                  </button>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition-colors">
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
