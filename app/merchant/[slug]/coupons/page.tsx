'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Ticket, Plus, Tag, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { getStoreBySlugAction } from '@/app/actions/store';
import { Store } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';

export default function MerchantCouponsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [coupons, setCoupons] = useState([
    { id: '1', code: 'WELCOME10', discount: 10, type: 'percentage', usageCount: 45, maxUses: 100, expiry: '2027-12-31' },
    { id: '2', code: 'FREE_SHIP', discount: 0, type: 'shipping', usageCount: 12, maxUses: 50, expiry: '2026-12-31' },
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
            <Ticket className="w-6 h-6 text-brand-600" />
            <span>كوبونات التخفيض</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            أنشئ أكواد الخصم لعملائك لزيادة الولاء والمبيعات
          </p>
        </div>
        <button className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>كوبون جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.id} className="p-5 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-brand-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-widest">{c.code}</h3>
                <p className="text-xs text-brand-600 font-bold mt-1">
                  {c.type === 'percentage' ? `خصم ${c.discount}%` : c.type === 'fixed' ? `خصم ${formatCurrency(c.discount, store.baseCurrency)}` : 'شحن مجاني'}
                </p>
              </div>
              <button className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> الاستخدامات:</span>
                <span className="font-bold text-slate-900 dark:text-white">{c.usageCount} / {c.maxUses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ينتهي في:</span>
                <span className="font-bold text-slate-900 dark:text-white" dir="ltr">{c.expiry}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
