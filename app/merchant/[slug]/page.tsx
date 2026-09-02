'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  TrendingUp, ShoppingBag, Users, DollarSign, Package, 
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle, 
  Plus, Bot, Eye, Sparkles, ExternalLink, Printer, ChevronLeft
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

  if (!store) return null;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0);
  const completedOrders = orders.filter((o) => o.status === 'delivered').length;
  const pendingOrders = orders.filter((o) => o.status === 'new' || o.status === 'pending_payment' || o.status === 'processing').length;
  const lowStockCount = products.filter((p) => p.stock <= (p.lowStockAlert || 5)).length;

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

      {/* KPI Cards Grid (2 cols on Mobile, 4 on Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
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

        {/* KPI 3 */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">الزوار المتصلون الآن</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{store.activeVisitorsNow} متسوق</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">يتصفحون المتجر</div>
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
          <Link
            href={`/merchant/${slug}/orders`}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>كل الطلبات</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

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
              {orders.map((ord) => (
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

      </div>

    </div>
  );
}
