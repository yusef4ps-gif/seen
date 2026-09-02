'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, BarChart2, PieChart, Download, Calendar, TrendingUp } from 'lucide-react';
import { getStoreBySlugAction } from '@/app/actions/store';
import { Store } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';

export default function MerchantReportsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);

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
            <BarChart2 className="w-6 h-6 text-brand-600" />
            <span>التقارير والمبيعات التفصيلية</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            تحليل شامل لأداء متجرك، الأرباح، المنتجات الأكثر مبيعاً
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none">
            <option>آخر 30 يوم</option>
            <option>هذا الأسبوع</option>
            <option>هذا العام</option>
          </select>
          <button className="px-3 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs flex items-center gap-2 hover:opacity-90">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تصدير PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المبيعات', value: formatCurrency(124500, store.baseCurrency), trend: '+15%' },
          { label: 'صافي الأرباح', value: formatCurrency(38200, store.baseCurrency), trend: '+8%' },
          { label: 'متوسط قيمة الطلب', value: formatCurrency(450, store.baseCurrency), trend: '+2%' },
          { label: 'معدل التحويل', value: '4.2%', trend: '+0.5%' },
        ].map((kpi, idx) => (
          <div key={idx} className="p-4 bg-white dark:bg-slateDark-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] text-slate-500 font-bold mb-1">{kpi.label}</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{kpi.value}</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {kpi.trend} مقارنة بالفترة السابقة
            </div>
          </div>
        ))}
      </div>

      {/* Chart Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-80 flex flex-col items-center justify-center text-slate-400">
          <LineChart className="w-12 h-12 mb-3 text-slate-300" />
          <span className="text-sm font-bold">رسم بياني للمبيعات (قريباً)</span>
        </div>
        <div className="p-6 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm h-80 flex flex-col items-center justify-center text-slate-400">
          <PieChart className="w-12 h-12 mb-3 text-slate-300" />
          <span className="text-sm font-bold">توزيع المبيعات (قريباً)</span>
        </div>
      </div>
    </div>
  );
}
