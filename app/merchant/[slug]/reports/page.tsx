'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, BarChart2, PieChart, Download, Calendar, TrendingUp, Package, ArrowDownUp, AlertTriangle } from 'lucide-react';
import { getStoreBySlugAction, getProductsByStoreAction, getOrdersByStoreAction } from '@/app/actions/store';
import { Store, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';

export default function MerchantReportsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
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
          const ords = await getOrdersByStoreAction(s.id);
          setOrders(ords);
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

  // Dynamic Calculations
  const totalSalesVolume = products.reduce((sum, p) => sum + (p.price * p.salesCount), 0);
  const netRevenue = totalSalesVolume * 0.75; // Assuming 25% cost/fees
  const totalOrdersCount = orders.length > 0 ? orders.filter(o => o.status === 'delivered' || o.status === 'processing').length : Math.floor(products.reduce((sum, p) => sum + p.salesCount, 0) / 2);
  const avgOrderValue = totalOrdersCount > 0 ? totalSalesVolume / totalOrdersCount : 0;

  // Dynamic Categories for Pie Chart
  const categorySales: Record<string, number> = {};
  products.forEach(p => {
    if (!categorySales[p.category]) categorySales[p.category] = 0;
    categorySales[p.category] += (p.price * p.salesCount);
  });
  
  const sortedCategories = Object.entries(categorySales).sort((a, b) => b[1] - a[1]);
  const totalCatSales = sortedCategories.reduce((sum, [_, val]) => sum + val, 0);
  
  const topCategories = sortedCategories.slice(0, 3).map(([name, val], idx) => {
    const colors = ['bg-brand-500', 'bg-purple-500', 'bg-amber-500'];
    return { name, color: colors[idx], perc: totalCatSales > 0 ? Math.round((val / totalCatSales) * 100) + '%' : '0%' };
  });
  
  const otherSales = sortedCategories.slice(3).reduce((sum, [_, val]) => sum + val, 0);
  if (otherSales > 0) {
    topCategories.push({ name: 'أخرى', color: 'bg-slate-300', perc: Math.round((otherSales / totalCatSales) * 100) + '%' });
  }

  let currentPercentage = 0;
  const gradientStops = topCategories.map((c) => {
    const hexColor = c.color === 'bg-brand-500' ? '#14b8a6' :
                     c.color === 'bg-purple-500' ? '#a855f7' :
                     c.color === 'bg-amber-500' ? '#f59e0b' : '#cbd5e1';
    
    const numPerc = parseInt(c.perc.replace('%', ''));
    const start = currentPercentage;
    const end = currentPercentage + numPerc;
    currentPercentage = end;
    
    return `${hexColor} ${start}% ${end}%`;
  }).join(', ');
  
  const conicGradientStr = `conic-gradient(${gradientStops || '#cbd5e1 0% 100%'})`;

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
          { label: 'إجمالي المبيعات', value: formatCurrency(totalSalesVolume, store.baseCurrency), trend: '+15%' },
          { label: 'صافي الإيرادات (تقديري)', value: formatCurrency(netRevenue, store.baseCurrency), trend: '+8%' },
          { label: 'متوسط قيمة الطلب', value: formatCurrency(avgOrderValue, store.baseCurrency), trend: '+2%' },
          { label: 'الطلبات المكتملة', value: `${totalOrdersCount} طلب`, trend: '+12%' },
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

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Bar Chart */}
        <div className="p-5 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <BarChart2 className="w-5 h-5 text-brand-600" />
              <span>المبيعات (آخر 7 أيام)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">مقارنة حجم المبيعات اليومية</p>
          </div>
          
          <div className="flex items-end justify-between h-40 gap-2 mt-auto">
            {[45, 60, 30, 80, 55, 90, 75].map((val, i) => (
              <div key={i} className="flex flex-col items-center w-full group">
                <div className="w-full relative bg-brand-100 dark:bg-brand-900/30 rounded-t-md flex items-end justify-center group-hover:bg-brand-200 transition-colors" style={{ height: '140px' }}>
                  <div className="w-full bg-brand-500 rounded-t-md transition-all" style={{ height: `${val}%` }}></div>
                  <span className="absolute -top-6 text-[10px] font-bold text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">{val}k</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 font-mono">{['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="p-5 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <PieChart className="w-5 h-5 text-purple-600" />
              <span>مبيعات التصنيفات</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">توزيع مبيعات المنتجات حسب التصنيف</p>
          </div>
          
          <div className="flex items-center justify-center h-40 mt-auto">
            <div className="relative w-32 h-32 rounded-full conic-gradient-chart shadow-inner flex items-center justify-center">
              <div className="w-20 h-20 bg-white dark:bg-slateDark-900 rounded-full shadow-sm flex items-center justify-center flex-col">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">100%</span>
              </div>
            </div>
            
            <div className="mr-8 space-y-3 flex-1">
              {topCategories.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${c.color}`}></span>
                  <span className="text-xs text-slate-600 dark:text-slate-300">{c.name}</span>
                  <span className="text-[10px] font-bold text-slate-400 mr-auto">{c.perc}</span>
                </div>
              ))}
            </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `.conic-gradient-chart { background: ${conicGradientStr}; }`}} />
        </div>
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
