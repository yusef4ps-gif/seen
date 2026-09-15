'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  LineChart, BarChart2, PieChart, Download, Calendar, TrendingUp, Package, 
  ArrowDownUp, AlertTriangle, ArrowRight, ShoppingCart, RefreshCcw, Users
} from 'lucide-react';
import { getStoreBySlugAction, getProductsByStoreAction, getOrdersByStoreAction } from '@/app/actions/store';
import { Store, Product, Order } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';

export default function MerchantReportsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [activeView, setActiveView] = useState<'hub' | 'sales' | 'inventory' | 'returns' | 'orders'>('hub');

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'all'>('this_month');
  
  // Extra filter for sales charts
  const [salesChartType, setSalesChartType] = useState<'days' | 'months' | 'years'>('days');

  // Inventory tab filter
  const [inventoryTab, setInventoryTab] = useState<'best-seller' | 'profitable' | 'least-sold' | 'low-stock'>('best-seller');

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

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const validOrders = orders.filter(o => o.status !== 'cancelled');
  
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const startOfWeek = new Date(startOfToday.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const filteredOrders = validOrders.filter(o => {
    const orderDate = new Date(o.createdAt);
    if (dateFilter === 'today') return orderDate >= startOfToday;
    if (dateFilter === 'yesterday') return orderDate >= startOfYesterday && orderDate < startOfToday;
    if (dateFilter === 'this_week') return orderDate >= startOfWeek;
    if (dateFilter === 'this_month') return orderDate >= startOfMonth;
    if (dateFilter === 'this_year') return orderDate >= startOfYear;
    return true; // 'all'
  });

  const totalSalesVolume = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = filteredOrders.length;

  const renderHub = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sales Card */}
        <button 
          onClick={() => setActiveView('sales')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-500 dark:hover:border-brand-500 transition-colors flex items-start gap-4 text-right"
        >
          <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">تقارير المبيعات</h3>
            <p className="text-sm text-slate-500">تحليل المبيعات اليومية والشهرية والسنوية ومقارنة الأداء.</p>
          </div>
        </button>

        {/* Inventory Card */}
        <button 
          onClick={() => setActiveView('inventory')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors flex items-start gap-4 text-right"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">تقارير المخزون</h3>
            <p className="text-sm text-slate-500">حركة المنتجات، الأكثر مبيعاً، والمنتجات منخفضة المخزون.</p>
          </div>
        </button>

        {/* Returns Card */}
        <button 
          onClick={() => setActiveView('returns')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-red-500 dark:hover:border-red-500 transition-colors flex items-start gap-4 text-right"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <RefreshCcw className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">تقارير المرتجعات</h3>
            <p className="text-sm text-slate-500">إحصائيات المرتجعات وحالاتها والمنتجات الأكثر استرجاعاً.</p>
          </div>
        </button>

        {/* Orders Card */}
        <button 
          onClick={() => setActiveView('orders')}
          className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors flex items-start gap-4 text-right"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">تقارير الطلبات</h3>
            <p className="text-sm text-slate-500">معدل الطلبات وحالات التوصيل وأداء المتجر العام.</p>
          </div>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-1">إجمالي المبيعات (كل الوقت)</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(validOrders.reduce((s, o) => s + o.total, 0), store.currency)}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-1">إجمالي الطلبات (كل الوقت)</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{validOrders.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-1">إجمالي المنتجات</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{products.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-1">إجمالي العملاء</p>
          <p className="text-xl font-black text-slate-900 dark:text-white">{new Set(validOrders.map(o => o.customerId)).size}</p>
        </div>
      </div>
    </div>
  );

  const renderSalesChart = () => {
    let chartData: { label: string, total: number }[] = [];
    let maxVal = 0;

    if (salesChartType === 'days') {
      chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(startOfToday.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        return { label: d.toLocaleDateString('ar-SA', { weekday: 'long' }), total: 0, dateObj: d };
      });
      validOrders.forEach(o => {
        const d = new Date(o.createdAt);
        const diffDays = Math.floor((startOfToday.getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          chartData[6 - diffDays].total += o.total;
        }
      });
    } else if (salesChartType === 'months') {
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      chartData = monthNames.map(m => ({ label: m, total: 0 }));
      validOrders.forEach(o => {
        const d = new Date(o.createdAt);
        if (d.getFullYear() === now.getFullYear()) {
          chartData[d.getMonth()].total += o.total;
        }
      });
    } else if (salesChartType === 'years') {
      const currentYear = now.getFullYear();
      chartData = [currentYear - 2, currentYear - 1, currentYear].map(y => ({ label: y.toString(), total: 0 }));
      validOrders.forEach(o => {
        const d = new Date(o.createdAt);
        const y = d.getFullYear();
        const idx = chartData.findIndex(c => c.label === y.toString());
        if (idx !== -1) chartData[idx].total += o.total;
      });
    }

    maxVal = Math.max(...chartData.map(d => d.total));

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h3 className="font-bold text-slate-900 dark:text-white">مخطط المبيعات</h3>
          <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button 
              onClick={() => setSalesChartType('days')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${salesChartType === 'days' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              الأيام (أسبوع)
            </button>
            <button 
              onClick={() => setSalesChartType('months')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${salesChartType === 'months' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              الأشهر (السنة الحالية)
            </button>
            <button 
              onClick={() => setSalesChartType('years')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${salesChartType === 'years' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              السنوات
            </button>
          </div>
        </div>
        
        <div className="h-64 flex items-end justify-between gap-1 sm:gap-2">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-2 group relative h-full">
              <div className="w-full flex justify-center items-end h-full">
                <div 
                  className="w-full sm:w-4/5 md:w-2/3 lg:w-1/2 bg-brand-100 dark:bg-brand-900/30 rounded-t-lg transition-all duration-500 relative group-hover:bg-brand-200 dark:group-hover:bg-brand-800/50"
                  style={{ height: maxVal > 0 ? `${Math.max((d.total / maxVal) * 100, 5)}%` : '5%' }}
                >
                  {d.total > 0 && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                      {formatCurrency(d.total, store.currency)}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-[9px] sm:text-[10px] md:text-xs font-medium text-slate-500 text-center truncate px-1">
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSales = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">إجمالي المبيعات للمدة المحددة</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalSalesVolume, store.currency)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">متوسط قيمة الطلب للمدة المحددة</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalOrdersCount > 0 ? totalSalesVolume / totalOrdersCount : 0, store.currency)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mb-4">
            <PieChart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">إجمالي الطلبات للمدة المحددة</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalOrdersCount}</h3>
        </div>
      </div>
      
      {renderSalesChart()}
    </div>
  );

  const renderInventory = () => {
    const productPerformance = products.map(p => {
      let salesCount = 0;
      let revenue = 0;
      filteredOrders.forEach(o => {
        o.items?.forEach((item: any) => {
          if (item.productId === p.id) {
            salesCount += item.quantity;
            revenue += item.total;
          }
        });
      });
      return { ...p, realSalesCount: salesCount, realRevenue: revenue };
    });

    let displayProducts = [...productPerformance];
    if (inventoryTab === 'best-seller') {
      displayProducts.sort((a, b) => b.realSalesCount - a.realSalesCount);
    } else if (inventoryTab === 'profitable') {
      displayProducts.sort((a, b) => b.realRevenue - a.realRevenue);
    } else if (inventoryTab === 'least-sold') {
      displayProducts.sort((a, b) => a.realSalesCount - b.realSalesCount);
    } else if (inventoryTab === 'low-stock') {
      displayProducts = displayProducts.filter(p => p.stock <= p.lowStockAlert);
    }

    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 flex overflow-x-auto hide-scrollbar">
          <button onClick={() => setInventoryTab('best-seller')} className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${inventoryTab === 'best-seller' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>الأكثر مبيعاً بالكمية</button>
          <button onClick={() => setInventoryTab('profitable')} className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${inventoryTab === 'profitable' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>الأكثر ربحية</button>
          <button onClick={() => setInventoryTab('least-sold')} className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${inventoryTab === 'least-sold' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>الأقل مبيعاً</button>
          <button onClick={() => setInventoryTab('low-stock')} className={`px-6 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${inventoryTab === 'low-stock' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>تنبيهات المخزون</button>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[60vh] overflow-y-auto">
          {displayProducts.map(p => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-4">
                {p.images && p.images.length > 0 ? (
                  <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-slate-100 dark:border-slate-800" />
                ) : (
                  <div className="w-12 h-12 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                    <Package className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{p.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-slate-500">مخزون: {p.stock}</span>
                    <span className="text-xs text-brand-600 dark:text-brand-400 font-bold">{p.realSalesCount} مبيعة</span>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="font-black text-slate-900 dark:text-white">{formatCurrency(p.realRevenue, store.currency)}</div>
              </div>
            </div>
          ))}
          {displayProducts.length === 0 && (
            <div className="p-12 text-center text-slate-500 text-sm">
              لا توجد منتجات تطابق هذه الفلترة
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReturns = () => {
    const returnedOrders = filteredOrders.filter(o => ['returned', 'partially_returned'].includes(o.status));
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <RefreshCcw className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">الطلبات المسترجعة للمدة المحددة</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{returnedOrders.length}</h3>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">النسبة المئوية للمرتجعات</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                {totalOrdersCount > 0 ? Math.round((returnedOrders.length / totalOrdersCount) * 100) : 0}%
              </h3>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center">
          <p className="text-slate-500 text-sm">
            يمكنك إدارة المرتجعات والموافقة عليها ومعرفة تفاصيلها عبر قسم "المرتجعات" في لوحة التحكم الجانبية.
          </p>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    const statuses = {
      pending: filteredOrders.filter(o => o.status === 'pending').length,
      processing: filteredOrders.filter(o => o.status === 'processing').length,
      shipped: filteredOrders.filter(o => o.status === 'shipped').length,
      delivered: filteredOrders.filter(o => o.status === 'delivered').length,
      cancelled: filteredOrders.filter(o => o.status === 'cancelled').length, // Count cancelled from filtered
    };

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-1">قيد الانتظار</p>
          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{statuses.pending}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-1">جاري التجهيز</p>
          <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400">{statuses.processing}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-1">تم الشحن</p>
          <h3 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{statuses.shipped}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-1">مكتمل / تم التوصيل</p>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{statuses.delivered}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 mb-1">طلبات ملغاة</p>
          <h3 className="text-2xl font-black text-red-600 dark:text-red-400">{statuses.cancelled}</h3>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            {activeView !== 'hub' && (
              <button 
                onClick={() => setActiveView('hub')}
                className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="العودة لمركز التقارير"
              >
                <ArrowRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
            )}
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {activeView === 'hub' ? 'مركز التقارير والإحصائيات' :
               activeView === 'sales' ? 'تقارير المبيعات' :
               activeView === 'inventory' ? 'تقارير المخزون' :
               activeView === 'returns' ? 'تقارير المرتجعات' : 'تقارير الطلبات'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {activeView === 'hub' ? 'اختر القسم الذي تود عرض تقاريره.' : 'عرض التحليلات التفصيلية بناءً على المدة المحددة.'}
          </p>
        </div>

        {/* Global Date Filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-slate-400 mr-2 ml-1" />
          <select 
            value={dateFilter}
            onChange={(e: any) => setDateFilter(e.target.value)}
            className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none pl-4 pr-2"
          >
            <option value="today">اليوم</option>
            <option value="yesterday">أمس</option>
            <option value="this_week">هذا الأسبوع</option>
            <option value="this_month">هذا الشهر</option>
            <option value="this_year">هذه السنة</option>
            <option value="all">كل الوقت</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {activeView === 'hub' && renderHub()}
      {activeView === 'sales' && renderSales()}
      {activeView === 'inventory' && renderInventory()}
      {activeView === 'returns' && renderReturns()}
      {activeView === 'orders' && renderOrders()}

    </div>
  );
}
