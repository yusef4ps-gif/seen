'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useMemo } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, ShoppingBag, Users, DollarSign, Package, 
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle, 
  Plus, Bot, Eye, EyeOff, Sparkles, ExternalLink, Printer, ChevronLeft, Calendar, CalendarDays
} from 'lucide-react';
import { Store, Order, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import { getStoreBySlugAction, getOrdersByStoreAction, getProductsByStoreAction } from '@/app/actions/store';

export default function MerchantOverviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isOrdersVisible, setIsOrdersVisible] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      if (!slug) return;
      const s = await getStoreBySlugAction(slug);
      if (s && isMounted) {
        setStore(s as any);
        const ords = await getOrdersByStoreAction(s.id);
        const prods = await getProductsByStoreAction(s.id);
        if (isMounted) {
          setOrders(ords as any);
          setProducts(prods as any);
        }
      }
    }
    loadDashboard();

    // Live polling for active visitors every 5 seconds
    const interval = setInterval(async () => {
      if (!slug) return;
      const s = await getStoreBySlugAction(slug);
      if (s && isMounted) {
        setStore(s as any);
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [slug]);


  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'custom' | 'all'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(o => {
      if (!o.createdAt) return true;
      const orderDate = new Date(o.createdAt);
      if (dateFilter === 'today') {
        return orderDate >= today;
      }
      if (dateFilter === 'week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return orderDate >= lastWeek;
      }
      if (dateFilter === 'custom' && dateRange.start && dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        return orderDate >= new Date(dateRange.start) && orderDate <= end;
      }
      return true;
    });
  }, [orders, dateFilter, dateRange]);

  const chartData = useMemo(() => {
    const dataByDate: Record<string, number> = {};
    filteredOrders.forEach(o => {
      if (o.status === 'cancelled') return;
      const d = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      dataByDate[d] = (dataByDate[d] || 0) + o.total;
    });
    
    return Object.entries(dataByDate)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({
        date: new Date(date).toLocaleDateString('ar-YE', { month: 'short', day: 'numeric' }),
        total
      }));
  }, [filteredOrders]);


  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const completedOrders = filteredOrders.filter((o) => o.status === 'delivered').length;
  const pendingOrders = filteredOrders.filter((o) => o.status === 'new' || o.status === 'pending_payment' || o.status === 'processing').length;
  const lowStockCount = products.filter((p) => p.stock <= (p.lowStockAlert || 5)).length;

  if (!store) return null;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
      
      {/* Welcome Banner */}
      <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-2xl font-black">أهلاً بك مجدداً، {store.name} 👋</h1>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            إليك ملخص أداء متجرك اليوم مع حركة المبيعات وتنبيهات المخزون.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Link
            href={`/merchant/${slug}/products`}
            className="flex-1 sm:flex-initial text-center px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 transition-colors shadow-sm flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة منتج جديد</span>
          </Link>
          <Link
            href={`/merchant/${slug}/ai-advisor`}
            className="flex-1 sm:flex-initial text-center px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5 text-teal-400" />
            <span>استشارة الـ AI</span>
          </Link>
        </div>
      </div>


      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slateDark-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'today' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >اليوم</button>
            <button 
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'week' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >هذا الأسبوع</button>
            <button 
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'all' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >الكل</button>
            <button 
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${dateFilter === 'custom' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            ><Calendar className="w-3 h-3"/> مخصص</button>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none font-mono" />
              <span className="text-slate-400 text-xs">إلى</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none font-mono" />
            </div>
          )}
        </div>
        
        <Link
          href={`/merchant/${slug}/orders`}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>استعراض كل الطلبات</span>
        </Link>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slateDark-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">أداء المبيعات</h3>
          <p className="text-xs text-slate-500">حركة المبيعات خلال الفترة المحددة</p>
        </div>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} ${store.baseCurrency}`, 'المبيعات']}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs mt-2">لا توجد بيانات مبيعات في هذه الفترة</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4">
        
        {/* KPI 1 */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">إجمالي المبيعات</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white truncate">
              {formatCurrency(totalRevenue || store.totalSalesGMV, store.baseCurrency)}
            </div>
            <div className="text-[9px] sm:text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" />
              <span>+18% هذا الأسبوع</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">الطلبات النشطة</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white">
              {pendingOrders} طلبات
            </div>
            <div className="text-[9px] sm:text-[10px] text-blue-600 font-bold mt-0.5">
              {completedOrders} مكتملة
            </div>
          </div>
        </div>



        {/* KPI 4 */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">تنبيهات المخزون</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white">
              {lowStockCount} أصناف منخفضة
            </div>
            <div className="text-[9px] sm:text-[10px] text-amber-600 font-bold mt-0.5">
              تحتاج إعادة توريد
            </div>
          </div>
        </div>

      </div>

      {/* Orders List Table (Responsive with smooth horizontal scroll) */}
      <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white">
              أحدث طلبات المتجر
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500">متابعة فورية للمدفوعات وحالات الشحن</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsOrdersVisible(!isOrdersVisible)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors"
              title={isOrdersVisible ? "إخفاء الطلبات" : "إظهار الطلبات"}
            >
              {isOrdersVisible ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">إخفاء</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">إظهار</span>
                </>
              )}
            </button>
            <Link
              href={`/merchant/${slug}/orders`}
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>كل الطلبات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {isOrdersVisible && (
          <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 sm:p-4">رقم الطلب</th>
                <th className="p-3 sm:p-4">العميل</th>
                <th className="p-3 sm:p-4">المبلغ</th>
                <th className="p-3 sm:p-4">طريقة الدفع</th>
                <th className="p-3 sm:p-4">الحالة</th>
                <th className="p-3 sm:p-4 text-left">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.slice(0, 5).map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3 sm:p-4 font-mono font-bold text-brand-600">
                    {ord.orderNumber}
                  </td>
                  <td className="p-3 sm:p-4">
                    <div className="font-bold text-slate-900 dark:text-white">{ord.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{ord.customerPhone}</div>
                  </td>
                  <td className="p-3 sm:p-4 font-bold text-slate-900 dark:text-white">
                    {formatCurrency(ord.total, ord.currency)}
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                      {ord.paymentMethod.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      ord.status === 'delivered' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : ord.status === 'pending_payment'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-left">
                    <Link
                      href={`/merchant/${slug}/orders`}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-colors"
                    >
                      معاينة
                    </Link>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
