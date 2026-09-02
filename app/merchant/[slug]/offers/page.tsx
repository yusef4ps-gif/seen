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

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) setStore(s as any);
      }
    }
    init();
  }, [slug]);

  if (!store) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
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
        <button className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-brand-500/20">
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
                <button className="text-[11px] font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
