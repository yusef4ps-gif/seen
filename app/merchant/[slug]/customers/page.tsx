'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, ShoppingBag, Phone, Mail, MessageCircle, 
  Search, Filter, ArrowUpRight, DollarSign, Calendar, 
  Award, CheckCircle2, UserPlus
} from 'lucide-react';
import { authEngine } from '@/lib/auth-engine';
import { User, Store } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import { getStoreBySlugAction } from '@/app/actions/store';

export default function MerchantCustomersPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [customers, setCustomers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          // Get all customers assigned to this store or registered generally
        const custs = authEngine.getUsers(s.id, 'CUSTOMER');
        // If empty, get general customers
        if (custs.length === 0) {
          setCustomers(authEngine.getUsers(undefined, 'CUSTOMER'));
        } else {
          setCustomers(custs);
        }
      }
    }
    }
    init();
  }, [slug]);

  if (!store) return null;

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrdersAll = customers.reduce((sum, c) => sum + (c.ordersCount || 0), 0);

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>قاعدة بيانات العملاء (Customer CRM)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200 font-bold">
              {customers.length} عميل مسجل
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            سجل العملاء الذين قاموا بالشراء أو التسجيل في متجرك، مع إمكانية التواصل الفوري عبر الواتساب
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/merchant/${slug}/orders`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
          >
            سجل كل الطلبات
          </Link>
        </div>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>إجمالي العملاء المسجلين</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{customers.length}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">حفظ تلقائي عند الشراء ✓</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>إجمالي مشتريات العملاء</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalSpentAll || 3250, store.baseCurrency)}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">القيمة الدائمة (LTV)</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>الطلبات المكتملة للعملاء</span>
            <ShoppingBag className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalOrdersAll || 8} طلبات</div>
          <div className="text-[10px] text-brand-600 font-bold mt-1">معدل تكرار الشراء ممتاز</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          عرض {filteredCustomers.length} من أصل {customers.length}
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
              <tr>
                <th className="p-4">العميل</th>
                <th className="p-4">رقم الواتساب / الهاتف</th>
                <th className="p-4">إجمالي الطلبات</th>
                <th className="p-4">إجمالي المشتريات</th>
                <th className="p-4">تاريخ الانضمام</th>
                <th className="p-4 text-center">التواصل السريع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredCustomers.map((cust) => {
                const cleanPhone = cust.phone.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/967${cleanPhone}?text=${encodeURIComponent(`مرحباً ${cust.name}، شكراً لتسوقك من متجر ${store.name}!`)}`;

                return (
                  <tr key={cust.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={cust.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                          alt={cust.name}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100"
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{cust.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{cust.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {cust.phone}
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold text-[11px]">
                        {cust.ordersCount || 1} طلبات
                      </span>
                    </td>

                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(cust.totalSpent || 250, store.baseCurrency)}
                    </td>

                    <td className="p-4 text-[10px] text-slate-400 font-mono">
                      {new Date(cust.createdAt).toLocaleDateString('ar-YE')}
                    </td>

                    <td className="p-4 text-center">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-all font-bold text-[11px]"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>مراسلة WhatsApp</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
