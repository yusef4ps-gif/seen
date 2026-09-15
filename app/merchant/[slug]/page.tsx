'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useMemo } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, ShoppingBag, Users, DollarSign, Package, 
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle, 
  Plus, Bot, Eye, EyeOff, Sparkles, ExternalLink, Printer, ChevronLeft, Calendar, CalendarDays,
  ShoppingCart, RefreshCcw
} from 'lucide-react';
import { Store, Order, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import ActiveVisitorsCounter from '@/components/ActiveVisitorsCounter';
import { useStoreData, useStoreOrders, useStoreProducts } from '@/lib/swr-hooks';

export default function MerchantOverviewPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { store } = useStoreData(slug);
  const { orders = [] } = useStoreOrders(store?.id);
  const { products = [] } = useStoreProducts(store?.id);
  const [isOrdersVisible, setIsOrdersVisible] = useState(true);

  const [dateFilter, setDateFilter] = useState('this_month');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const startOfWeek = new Date(startOfToday.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    return orders.filter(o => {
      if (!o.createdAt) return true;
      const orderDate = new Date(o.createdAt);
      if (dateFilter === 'today') return orderDate >= startOfToday;
      if (dateFilter === 'yesterday') return orderDate >= startOfYesterday && orderDate < startOfToday;
      if (dateFilter === 'this_week') return orderDate >= startOfWeek;
      if (dateFilter === 'this_month') return orderDate >= startOfMonth;
      if (dateFilter === 'this_year') return orderDate >= startOfYear;
      if (dateFilter === 'custom' && dateRange.start && dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        return orderDate >= new Date(dateRange.start) && orderDate <= end;
      }
      if (dateFilter === 'custom') return true; // If custom but no range set yet
      return true; // 'all'
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


  const totalRevenue = useMemo(() => filteredOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0), [filteredOrders]);
  const completedOrders = useMemo(() => filteredOrders.filter((o) => o.status === 'delivered').length, [filteredOrders]);
  const pendingOrders = useMemo(() => filteredOrders.filter((o) => o.status === 'new' || o.status === 'pending_payment' || o.status === 'processing').length, [filteredOrders]);
  const lowStockCount = useMemo(() => products.filter((p) => p.stock <= (p.lowStockAlert || 5)).length, [products]);

  if (!store) return null;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto w-full">
      
      {/* New Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            مساء الخير يا {store.name} <span className="animate-wave inline-block origin-bottom-right">👋</span>
          </h2>
          <p className="text-slate-500 mt-2 font-medium">فيما يلي نظرة عامة على أداء متجرك اليوم</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <Calendar className="w-5 h-5 text-slate-400" />
            <select 
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer pr-1 pl-4"
            >
              <option value="today">اليوم</option>
              <option value="yesterday">أمس</option>
              <option value="this_week">هذا الأسبوع</option>
              <option value="this_month">هذا الشهر</option>
              <option value="this_year">هذه السنة</option>
              <option value="custom">مخصص</option>
              <option value="all">كل الوقت</option>
            </select>
          </div>
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} className="px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none font-mono" />
              <span className="text-slate-400 text-xs font-medium">إلى</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} className="px-2 py-1 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none font-mono" />
            </div>
          )}
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Card 1: Net Revenue */}
        <Link href={`/merchant/${slug}/reports`} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm text-right flex flex-col justify-between group h-48 relative overflow-hidden transition-transform active:scale-[0.98]">
          <div className="flex justify-between items-start w-full relative z-10">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-lg">صافي الإيرادات</span>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{formatCurrency(totalRevenue, store.baseCurrency)}</h3>
            <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-500">
              <span>155.5% ⬆</span>
              <span className="text-slate-400 font-medium">النمو الشهري</span>
            </div>
          </div>
        </Link>

        {/* Card 2: Total Customers */}
        <Link href={`/merchant/${slug}/customers`} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm text-right flex flex-col justify-between group h-48 relative overflow-hidden transition-transform active:scale-[0.98]">
          <div className="flex justify-between items-start w-full relative z-10">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-lg">إجمالي العملاء</span>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{new Set(filteredOrders.map(o => o.customerId)).size}</h3>
            <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-500">
              <span>100.0% ⬆</span>
              <span className="text-slate-400 font-medium">النمو الشهري</span>
            </div>
          </div>
        </Link>

        {/* Card 3: Total Orders */}
        <Link href={`/merchant/${slug}/orders`} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm text-right flex flex-col justify-between group h-48 relative overflow-hidden transition-transform active:scale-[0.98]">
          <div className="flex justify-between items-start w-full relative z-10">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-lg">إجمالي الطلبات</span>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{filteredOrders.length}</h3>
            <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-emerald-500">
              <span>100.0% ⬆</span>
              <span className="text-slate-400 font-medium">النمو الشهري</span>
            </div>
          </div>
        </Link>

        {/* Card 4: Returns */}
        <Link href={`/merchant/${slug}/returns`} className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] shadow-sm text-right flex flex-col justify-between group h-48 relative overflow-hidden transition-transform active:scale-[0.98]">
          <div className="flex justify-between items-start w-full relative z-10">
            <span className="font-bold text-slate-700 dark:text-slate-300 text-lg">المرتجعات</span>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-500">
              <RefreshCcw className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{filteredOrders.filter(o => ['returned', 'partially_returned'].includes(o.status as string)).length}</h3>
            <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-red-500">
              <span>12.5% ⬇</span>
              <span className="text-slate-400 font-medium">النمو الشهري</span>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Visitors */}
        <ActiveVisitorsCounter storeId={store.slug} />
        
        {/* Low Stock Alert */}
        <Link href={`/merchant/${slug}/inventory`} className="p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:border-amber-300 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {lowStockCount} أصناف منخفضة
            </h3>
            <p className="text-xs text-amber-600 font-bold mt-1">
              تحتاج إعادة توريد (تنبيه المخزون)
            </p>
          </div>
        </Link>
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
                      {{
                        new: 'جديد',
                        pending_payment: 'بانتظار الدفع',
                        processing: 'قيد التجهيز',
                        ready: 'جاهز للاستلام',
                        out_for_delivery: 'في الطريق',
                        delivered: 'مكتمل',
                        cancelled: 'ملغي',
                        returned: 'مسترجع',
                      }[ord.status as string] || ord.status}
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
