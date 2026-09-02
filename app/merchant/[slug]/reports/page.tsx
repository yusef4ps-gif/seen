'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, BarChart2, PieChart, Download, Calendar, TrendingUp, Package, ArrowDownUp, AlertTriangle } from 'lucide-react';
import { getStoreBySlugAction, getProductsByStoreAction } from '@/app/actions/store';
import { Store, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';

export default function MerchantReportsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  const [reportTab, setReportTab] = useState<'all' | 'best-seller' | 'profitable' | 'least-sold' | 'low-stock'>('best-seller');

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          const prods = await getProductsByStoreAction(s.id);
          setProducts(prods as any);
        }
      }
    }
    init();
  }, [slug]);

  if (!store) return null;

  // Filter and sort products based on tab
  let displayProducts = [...products];
  
  if (reportTab === 'best-seller') {
    displayProducts.sort((a, b) => b.salesCount - a.salesCount);
  } else if (reportTab === 'profitable') {
    displayProducts.sort((a, b) => (b.price * b.salesCount) - (a.price * a.salesCount));
  } else if (reportTab === 'least-sold') {
    displayProducts.sort((a, b) => a.salesCount - b.salesCount);
  } else if (reportTab === 'low-stock') {
    displayProducts = displayProducts.filter(p => p.stock <= p.lowStockAlert);
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-brand-600" />
            <span>التقارير والمبيعات التفصيلية</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            تحليل شامل لأداء متجرك، الأرباح، المنتجات الأكثر مبيعاً
          </p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slateDark-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 px-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">من:</span>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none dark:text-white"
            />
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">إلى:</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent text-xs font-bold outline-none dark:text-white"
            />
          </div>
          <button className="px-3 py-1.5 ml-1 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 font-bold rounded-xl text-xs transition-colors">
            تطبيق
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المبيعات', value: formatCurrency(124500, store.baseCurrency), trend: '+15%' },
          { label: 'صافي الإيرادات', value: formatCurrency(38200, store.baseCurrency), trend: '+8%' },
          { label: 'متوسط قيمة الطلب', value: formatCurrency(450, store.baseCurrency), trend: '+2%' },
          { label: 'الطلبات المكتملة', value: '342 طلب', trend: '+12%' },
        ].map((kpi, idx) => (
          <div key={idx} className="p-4 bg-white dark:bg-slateDark-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="text-[11px] text-slate-500 font-bold mb-1">{kpi.label}</div>
            <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{kpi.value}</div>
            <div className="text-[10px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {kpi.trend} بالفترة المحددة
            </div>
          </div>
        ))}
      </div>

      {/* Product Reports */}
      <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <span>تقارير أداء المنتجات</span>
          </h3>
          
          <div className="flex overflow-x-auto pb-2 sm:pb-0 hide-scrollbar gap-2">
            <button 
              onClick={() => setReportTab('all')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-colors ${reportTab === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
            >
              الكل
            </button>
            <button 
              onClick={() => setReportTab('best-seller')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-colors ${reportTab === 'best-seller' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
            >
              الأكثر مبيعاً
            </button>
            <button 
              onClick={() => setReportTab('profitable')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-colors ${reportTab === 'profitable' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
            >
              الأكثر إيراداً
            </button>
            <button 
              onClick={() => setReportTab('least-sold')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-colors ${reportTab === 'least-sold' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
            >
              الأقل مبيعاً
            </button>
            <button 
              onClick={() => setReportTab('low-stock')}
              className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${reportTab === 'low-stock' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>قاربت على النفاذ</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 font-bold">المنتج</th>
                <th className="p-4 font-bold">المخزون الحالي</th>
                <th className="p-4 font-bold">المبيعات (الكمية)</th>
                <th className="p-4 font-bold">السعر</th>
                <th className="p-4 font-bold">إجمالي الإيرادات</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
              {displayProducts.map((p) => {
                const revenue = p.price * p.salesCount;
                const isLowStock = p.stock <= p.lowStockAlert;
                
                return (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{p.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{p.category}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-bold ${isLowStock ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-slate-100 text-slate-700 dark:bg-slate-800'}`}>
                        {p.stock}
                        {isLowStock && <AlertTriangle className="w-3 h-3" />}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                      {p.salesCount} مرة
                    </td>
                    <td className="p-4 text-slate-500">
                      {formatCurrency(p.price, store.baseCurrency)}
                    </td>
                    <td className="p-4 font-black text-brand-600 dark:text-brand-400">
                      {formatCurrency(revenue, store.baseCurrency)}
                    </td>
                  </tr>
                );
              })}
              
              {displayProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                    لا توجد منتجات تطابق هذا التصنيف حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
