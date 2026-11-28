'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users, ShoppingBag, MessageCircle, Search, DollarSign,
  Send, X, Clock, CheckCircle2, MessageSquare, Calendar, RefreshCw, UserCheck
} from 'lucide-react';
import { formatCurrency } from '@/lib/currency-engine';
import { useStoreData } from '@/lib/swr-hooks';
import { getStoreCustomersAction } from '@/app/actions/store';
import {
  getMerchantCustomerThreadAction,
  sendMessageToCustomerAction,
  CustomerThreadMessage,
} from '@/app/actions/customer-messages';
import { formatWhatsAppUrl } from '@/components/WhatsAppSupportButton';
import toast from 'react-hot-toast';

function formatRelativeTime(value?: string | Date | null): { dateLabel: string; relativeLabel: string } {
  if (!value) return { dateLabel: '—', relativeLabel: 'لا يوجد نشاط' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { dateLabel: '—', relativeLabel: '—' };

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  let relativeLabel = '';
  if (diffMins < 2) relativeLabel = 'الآن';
  else if (diffMins < 60) relativeLabel = `منذ ${diffMins} دقيقة`;
  else if (diffHours < 24) relativeLabel = `منذ ${diffHours} ساعة`;
  else if (diffDays === 1) relativeLabel = 'منذ يوم واحد';
  else if (diffDays < 30) relativeLabel = `منذ ${diffDays} يوم`;
  else relativeLabel = `منذ ${Math.floor(diffDays / 30)} شهر`;

  const dateLabel = date.toLocaleString('ar-YE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return { dateLabel, relativeLabel };
}

export default function MerchantCustomersPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { store } = useStoreData(slug);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'buyers' | 'messaged'>('all');

  // In-Platform Chat Modal State
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [threadMessages, setThreadMessages] = useState<CustomerThreadMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  const isServiceStore = useMemo(() => {
    if (!store?.themeConfig) return false;
    try {
      const cfg = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig as any) : store.themeConfig;
      return cfg?.storeType === 'SERVICE' || cfg?.presetId === 'service-expert' || (store as any)?.storeType === 'SERVICE';
    } catch {
      return false;
    }
  }, [store]);

  const fetchCustomers = async () => {
    if (!store) return;
    setIsLoading(true);
    const res = await getStoreCustomersAction(store.id);
    if (res.success && res.customers) {
      setCustomers(res.customers);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (store) {
      fetchCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  const handleOpenChat = async (cust: any) => {
    if (!store) return;
    setActiveCustomer(cust);
    setLoadingThread(true);
    setThreadMessages([]);
    setReplyText('');
    const res = await getMerchantCustomerThreadAction(store.id, cust.id);
    if (res.success) {
      setThreadMessages(res.messages || []);
      setCustomers((prev) =>
        prev.map((c) => (c.id === cust.id ? { ...c, unreadFromCustomer: 0 } : c))
      );
    } else if (res.error) {
      toast.error(res.error);
    }
    setLoadingThread(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store || !activeCustomer || !replyText.trim() || sendingMsg) return;
    setSendingMsg(true);
    const res = await sendMessageToCustomerAction(store.id, activeCustomer.id, replyText);
    setSendingMsg(false);
    if (res.success && res.messages) {
      setThreadMessages(res.messages);
      const last = res.messages[res.messages.length - 1];
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === activeCustomer.id
            ? {
                ...c,
                messagesCount: res.messages!.length,
                unreadFromCustomer: 0,
                lastMessageAt: last?.createdAt,
                lastMessagePreview: last?.text?.slice(0, 80),
              }
            : c
        )
      );
      setReplyText('');
      toast.success('تم إرسال الرسالة للعميل داخل المنصة ✓');
    } else {
      toast.error(res.error || 'تعذر إرسال الرسالة');
    }
  };

  if (!store) return null;

  const filteredCustomers = customers.filter((c) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (statusFilter === 'active') return Boolean(c.isActive);
    if (statusFilter === 'buyers') return (c.ordersCount || 0) > 0;
    if (statusFilter === 'messaged') return (c.messagesCount || 0) > 0 || (c.unreadFromCustomer || 0) > 0;
    return true;
  });

  const activeCustomersCount = customers.filter((c) => c.isActive).length;
  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalOrdersAll = customers.reduce((sum, c) => sum + (c.ordersCount || 0), 0);
  const totalUnreadMessages = customers.reduce((sum, c) => sum + (c.unreadFromCustomer || 0), 0);

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
            <span>{isServiceStore ? 'سجل المستفيدين والعملاء (Client CRM)' : 'قاعدة بيانات العملاء (Customer CRM)'}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200 font-bold">
              {customers.length} حساب
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isServiceStore
              ? 'متابعة حالة الحسابات النشطة وآخر زيارة وآخر طلب خدمة، مع المراسلة الفورية داخل المنصة أو عبر الواتساب'
              : 'متابعة حالة الحسابات النشطة وآخر زيارة وآخر عملية شراء، مع المراسلة الفورية داخل المنصة أو عبر الواتساب'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCustomers}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
          <Link
            href={`/merchant/${slug}/orders`}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
          >
            {isServiceStore ? 'سجل الحجوزات والطلبات' : 'سجل كل الطلبات'}
          </Link>
        </div>
      </div>

      {/* CRM Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{isServiceStore ? 'إجمالي المستفيدين' : 'إجمالي العملاء'}</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{customers.length}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-1">{activeCustomersCount} حساب نشط ✓</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>الحسابات النشطة</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{activeCustomersCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">نشاط زيارة أو طلب خلال 30 يوماً</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{isServiceStore ? 'إجمالي قيمة الخدمات' : 'إجمالي مبيعات العملاء'}</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalSpentAll || 0, store.baseCurrency)}
          </div>
          <div className="text-[10px] text-purple-600 font-bold mt-1">{totalOrdersAll} {isServiceStore ? 'حجز وطلب' : 'طلب'}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>رسائل العملاء بالمنصة</span>
            <MessageSquare className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalUnreadMessages}</div>
          <div className="text-[10px] text-sky-600 font-bold mt-1">
            {totalUnreadMessages > 0 ? 'رسائل جديدة بانتظار ردك' : 'لا توجد رسائل غير مقروءة'}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="ابحث بالاسم أو الهاتف أو البريد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'active', label: 'نشطون' },
            { id: 'buyers', label: isServiceStore ? 'طلبوا خدمة' : 'مشترون' },
            { id: 'messaged', label: 'محادثات' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                statusFilter === tab.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
              <tr>
                <th className="p-4">العميل وحالة الحساب</th>
                <th className="p-4">التواصل</th>
                <th className="p-4">آخر زيارة / دخول</th>
                <th className="p-4">{isServiceStore ? 'آخر طلب خدمة' : 'آخر عملية شراء'}</th>
                <th className="p-4">{isServiceStore ? 'الحجوزات والمبلغ' : 'الطلبات والمبيعات'}</th>
                <th className="p-4 text-center">مراسلة العميل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    {isLoading ? 'جاري تحميل سجل العملاء...' : 'لا توجد حسابات عملاء مطابقة للبحث أو التصفية.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');
                  const hasValidPhone = cleanPhone.length >= 7;
                  const waUrl = hasValidPhone
                    ? formatWhatsAppUrl(
                        cust.phone,
                        store.name,
                        `مرحباً ${cust.name}، معك ${store.name}. كيف نقدر نخدمك اليوم؟`
                      )
                    : null;

                  const visitInfo = formatRelativeTime(cust.lastLoginAt || cust.createdAt);
                  const orderInfo = formatRelativeTime(cust.lastOrderAt);
                  const isGuest = cust.authProvider === 'guest';

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {cust.avatarUrl ? (
                            <img
                              src={cust.avatarUrl}
                              alt={cust.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center justify-center font-black text-sm shrink-0">
                              {cust.name?.charAt(0) || 'ع'}
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 dark:text-white">{cust.name}</span>
                              {cust.isActive ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  نشط
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold">
                                  غير نشط مؤخراً
                                </span>
                              )}
                              {isGuest ? (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[9px] font-bold">
                                  زائر
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 text-[9px] font-bold">
                                  {cust.authProvider === 'google' ? 'Google' : 'حساب مسجل'}
                                </span>
                              )}
                            </div>
                            {cust.email && <div className="text-[10px] text-slate-400 font-mono">{cust.email}</div>}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">
                        {hasValidPhone ? cust.phone : <span className="text-slate-400 text-[11px] font-sans">بدون هاتف</span>}
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                            <Clock className="w-3 h-3 text-sky-500 shrink-0" />
                            <span>{visitInfo.relativeLabel}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{visitInfo.dateLabel}</div>
                        </div>
                      </td>

                      <td className="p-4">
                        {cust.lastOrderAt ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold text-[11px]">
                              <Calendar className="w-3 h-3 text-purple-500 shrink-0" />
                              <span>{orderInfo.relativeLabel}</span>
                              {cust.lastOrderNumber && (
                                <span className="text-[10px] text-purple-600 font-mono">
                                  ({cust.lastOrderNumber.startsWith('#') ? cust.lastOrderNumber : `#${cust.lastOrderNumber}`})
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{orderInfo.dateLabel}</div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {isServiceStore ? 'لم يطلب خدمة بعد' : 'لم يشترِ بعد'}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px]">
                            {cust.ordersCount || 0} {isServiceStore ? 'حجز/طلب' : 'طلبات'}
                          </span>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                            {formatCurrency(cust.totalSpent || 0, store.baseCurrency)}
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenChat(cust)}
                            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white border border-brand-200 transition-all font-bold text-[11px]"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>داخل المنصة</span>
                            {(cust.unreadFromCustomer || 0) > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                                {cust.unreadFromCustomer}
                              </span>
                            )}
                          </button>

                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-all font-bold text-[11px]"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>واتساب</span>
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-bold">
                              واتساب غير متاح
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-Platform Customer Messaging Drawer / Modal */}
      {activeCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActiveCustomer(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-black">
                  {activeCustomer.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <div className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <span>مراسلة {activeCustomer.name}</span>
                    {activeCustomer.isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                        نشط
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    تصل الرسالة مباشرة داخل حساب العميل في المنصة
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCustomer(null)}
                aria-label="إغلاق"
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/40 dark:bg-slate-950/30 min-h-[240px]">
              {loadingThread ? (
                <div className="py-12 text-center text-xs text-slate-400 font-bold">جاري تحميل المحادثة...</div>
              ) : threadMessages.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">لا توجد رسائل سابقة مع هذا العميل بعد</p>
                  <p className="text-[11px] text-slate-400">ابدأ بإرسال رسالة ترحيبية أو متابعة لخدماته داخل المنصة.</p>
                </div>
              ) : (
                threadMessages.map((msg) => {
                  const isMerchant = msg.sender === 'merchant';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMerchant ? 'items-start' : 'items-end'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                          isMerchant
                            ? 'bg-brand-600 text-white rounded-tr-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-sm'
                        }`}
                      >
                        <div className={`text-[10px] font-bold mb-1 ${isMerchant ? 'text-white/80' : 'text-slate-400'}`}>
                          {isMerchant ? `${store.name} (أنت)` : activeCustomer.name}
                        </div>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 px-1 font-mono">
                        {new Date(msg.createdAt).toLocaleString('ar-YE', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slateDark-900 space-y-3">
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`اكتب رسالتك إلى ${activeCustomer.name} داخل المنصة...`}
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !replyText.trim()}
                  className="px-4 py-2 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 self-end h-10 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingMsg ? 'إرسال...' : 'إرسال'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
