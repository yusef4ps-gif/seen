'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CreditCard, DollarSign, CheckCircle2, Clock, AlertCircle, 
  Search, Filter, Download, Eye, ExternalLink, Printer, 
  ArrowUpRight, RefreshCw, FileText, X, Check, ArrowLeft,
  Briefcase, ShoppingCart
} from 'lucide-react';
import { useStoreData, useStoreOrders } from '@/lib/swr-hooks';
import { formatCurrency, convertCurrency } from '@/lib/currency-engine';
import { updateOrderStatusAction } from '@/app/actions/order';
import toast from 'react-hot-toast';

export default function MerchantPaymentsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { store } = useStoreData(slug);
  const { orders = [], mutate } = useStoreOrders(store?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const isServiceStore = useMemo(() => {
    if (!store?.themeConfig) return false;
    try {
      const cfg = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : store.themeConfig;
      return cfg?.storeType === 'SERVICE' || cfg?.presetId === 'service-expert';
    } catch {
      return false;
    }
  }, [store?.themeConfig]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch = 
        (o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.customerName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (o.customerPhone?.includes(searchTerm));

      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'confirmed' && (o.status === 'delivered' || o.status === 'processing' || o.status === 'ready')) ||
        (statusFilter === 'pending' && (o.status === 'pending_payment' || o.status === 'new')) ||
        (statusFilter === 'cancelled' && (o.status === 'cancelled' || o.status === 'returned'));

      const matchesMethod = 
        methodFilter === 'all' ||
        o.paymentMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [orders, searchTerm, statusFilter, methodFilter]);

  // Financial Metrics
  const metrics = useMemo(() => {
    const totalCollected = orders
      .filter(o => o.status !== 'cancelled' && o.status !== 'returned')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const pendingAmount = orders
      .filter(o => o.status === 'pending_payment' || o.status === 'new')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const confirmedCount = orders.filter(o => o.status === 'delivered' || o.status === 'processing' || o.status === 'ready').length;
    const pendingCount = orders.filter(o => o.status === 'pending_payment' || o.status === 'new').length;
    const avgInvoice = orders.length > 0 ? totalCollected / orders.length : 0;

    return { totalCollected, pendingAmount, confirmedCount, pendingCount, avgInvoice };
  }, [orders]);

  const handleConfirmPayment = async (orderId: string) => {
    setIsUpdating(orderId);
    try {
      const res = await updateOrderStatusAction(orderId, 'processing');
      if (res.success) {
        toast.success('تم اعتماد وتأكيد استلام الدفعة بنجاح! ✅');
        if (mutate) mutate();
      } else {
        toast.error(res.error || 'فشل تحديث حالة الدفع');
      }
    } catch {
      toast.error('حدث خطأ أثناء اعتماد الدفعة');
    } finally {
      setIsUpdating(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('لا توجد بيانات لتصديرها');
      return;
    }

    const headers = ['رقم الطلب', 'العميل', 'الهاتف', 'المبلغ', 'العملة', 'وسيلة الدفع', 'الحالة', 'التاريخ'];
    const rows = filteredOrders.map(o => [
      `"${o.orderNumber}"`,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      o.total,
      `"${o.currency || store?.baseCurrency}"`,
      `"${o.paymentMethod}"`,
      `"${o.status}"`,
      `"${new Date(o.createdAt).toLocaleDateString('ar-YE')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `seen-payments-${slug}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تصدير كشف المدفوعات بنجاح! 📥');
  };

  if (!store) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full text-right pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 text-xs font-bold mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>السجل المالي والتحصيلات</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            المدفوعات والفواتير المالية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة كافة التحصيلات، إشعارات التحويل البنكي، واعتماد الدفعات والفواتير لـ {store.name}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center gap-2 shadow-xs active:scale-95"
          >
            <Download className="w-4 h-4 text-brand-600" />
            <span>تصدير كشف المدفوعات (CSV)</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Collected */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي المدفوعات المستلمة</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(metrics.totalCollected, store.baseCurrency)}
          </h3>
          <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <span>{metrics.confirmedCount} دفعة مكتملة ومعتمدة</span>
          </p>
        </div>

        {/* Metric 2: Pending Amount */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">مدفوعات بانتظار التحقق</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(metrics.pendingAmount, store.baseCurrency)}
          </h3>
          <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
            <span>{metrics.pendingCount} طلب بانتظار فحص الإشعار</span>
          </p>
        </div>

        {/* Metric 3: Total Invoices */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">عدد الفواتير الصادرة</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {orders.length}
          </h3>
          <p className="text-[11px] font-bold text-slate-400">
            كافة الطلبات والحجوزات المسجلة
          </p>
        </div>

        {/* Metric 4: Average Invoice Value */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">متوسط قيمة المعاملة</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {formatCurrency(metrics.avgInvoice, store.baseCurrency)}
          </h3>
          <p className="text-[11px] font-bold text-slate-400">
            لكل عملية شراء / حجز خدمة
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم الفاتورة، اسم المستفيد، أو رقم الهاتف..."
              className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="all">كافة الحالات</option>
              <option value="confirmed">معتمد ومؤكد ✅</option>
              <option value="pending">بانتظار التحقق ⏳</option>
              <option value="cancelled">ملغي / مسترجع ↩️</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="all">كافة طرق الدفع</option>
              <option value="qutaibi">بنك القطيبي الإسلامي</option>
              <option value="kuraimi">الكريمي (حاسب)</option>
              <option value="jawali">الشبكة الموحدة</option>
              <option value="cod">الدفع عند الاستلام</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              سجل المعاملات والمدفوعات
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              عرض {filteredOrders.length} معاملة مسجلة
            </p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">
              لا توجد مدفوعات مطابقة للشروط
            </h4>
            <p className="text-xs text-slate-400">
              جرب تغيير معايير البحث أو تصفية الحالات
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">رقم الفاتورة / الطلب</th>
                  <th className="p-4">{isServiceStore ? 'المستفيد' : 'العميل'}</th>
                  <th className="p-4">المبلغ والرسوم</th>
                  <th className="p-4">وسيلة الدفع</th>
                  <th className="p-4">إشعار التحويل</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredOrders.map((ord) => {
                  const isConfirmed = ord.status === 'delivered' || ord.status === 'processing' || ord.status === 'ready';
                  const isPending = ord.status === 'pending_payment' || ord.status === 'new';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Order Number */}
                      <td className="p-4 font-mono font-bold text-brand-600">
                        #{ord.orderNumber}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(ord.createdAt).toLocaleDateString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{ord.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono" dir="ltr">{ord.customerPhone}</div>
                      </td>

                      {/* Total */}
                      <td className="p-4">
                        <div className="font-black text-slate-900 dark:text-white text-sm">
                          {formatCurrency(ord.total, ord.currency || store.baseCurrency)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {isServiceStore ? 'رسوم الخدمة' : 'قيمة الطلب'}
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {ord.paymentMethod === 'qutaibi' && 'بنك القطيبي'}
                          {ord.paymentMethod === 'kuraimi' && 'الكريمي (حاسب)'}
                          {ord.paymentMethod === 'jawali' && 'الشبكة الموحدة'}
                          {ord.paymentMethod === 'cod' && 'الدفع عند الاستلام'}
                          {!['qutaibi', 'kuraimi', 'jawali', 'cod'].includes(ord.paymentMethod) && (ord.paymentMethod || 'تحويل مباشر')}
                        </span>
                      </td>

                      {/* Payment Proof */}
                      <td className="p-4">
                        {ord.paymentProofUrl ? (
                          <button
                            onClick={() => setSelectedProofUrl(ord.paymentProofUrl)}
                            className="px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 text-[11px] font-bold hover:bg-teal-100 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة الإشعار</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">لا يوجد مرفق</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isConfirmed 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800'
                        }`}>
                          {isConfirmed ? 'معتمد ومؤكد ✅' : isPending ? 'بانتظار التحقق ⏳' : 'ملغي / مسترجع ↩️'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <button
                              onClick={() => handleConfirmPayment(ord.id)}
                              disabled={isUpdating === ord.id}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1"
                              title="اعتماد استلام المبلغ"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>اعتماد الدفع</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedInvoiceOrder(ord)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                            title="عرض الفاتورة الرسمية"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <Link
                            href={`/merchant/${slug}/orders`}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                            title="تفاصيل الطلب الكاملة"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal 1: Payment Proof Image Viewer */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full text-right space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-600" />
                <span>إشعار التحويل البنكي المرفق من العميل</span>
              </h4>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-[70vh] overflow-auto flex items-center justify-center">
              <img
                src={selectedProofUrl}
                alt="إشعار التحويل"
                className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={selectedProofUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
              >
                فتح الصورة الأصلية ↗
              </a>
              <button
                onClick={() => setSelectedProofUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Official Invoice Printable View */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full text-right space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">فاتورة رسمية</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  فاتورة رقم #{selectedInvoiceOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  تاريخ الإصدار: {new Date(selectedInvoiceOrder.createdAt).toLocaleDateString('ar-YE')}
                </p>
              </div>

              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Merchant & Customer Info */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs">
              <div>
                <span className="text-slate-400 block font-bold mb-1">الجهة المصدرة:</span>
                <p className="font-black text-slate-900 dark:text-white">{store.name}</p>
                <p className="text-slate-500">{store.city} - {store.category}</p>
                <p className="text-slate-500 font-mono" dir="ltr">{store.phone}</p>
              </div>

              <div>
                <span className="text-slate-400 block font-bold mb-1">بيانات المستفيد:</span>
                <p className="font-black text-slate-900 dark:text-white">{selectedInvoiceOrder.customerName}</p>
                <p className="text-slate-500 font-mono" dir="ltr">{selectedInvoiceOrder.customerPhone}</p>
                <p className="text-slate-500">{selectedInvoiceOrder.city || 'الخدمات الإلكترونية'}</p>
              </div>
            </div>

            {/* Items Breakdown */}
            <div className="space-y-2">
              <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">تفاصيل المعاملة:</h5>
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">البند / الخدمة</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(() => {
                      let items = [];
                      try {
                        items = typeof selectedInvoiceOrder.items === 'string' 
                          ? JSON.parse(selectedInvoiceOrder.items) 
                          : selectedInvoiceOrder.items || [];
                      } catch {
                        items = [];
                      }

                      if (items.length === 0) {
                        return (
                          <tr>
                            <td className="p-3 font-bold">{isServiceStore ? 'خدمة واستشارة مهنية' : 'طلب منتجات'}</td>
                            <td className="p-3 text-center">1</td>
                            <td className="p-3 text-left font-black">{formatCurrency(selectedInvoiceOrder.total, selectedInvoiceOrder.currency || store.baseCurrency)}</td>
                          </tr>
                        );
                      }

                      return items.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-3 font-bold">{item.productName || item.name || 'خدمة'}</td>
                          <td className="p-3 text-center">{item.quantity || 1}</td>
                          <td className="p-3 text-left font-black">{formatCurrency((item.price || 0) * (item.quantity || 1), selectedInvoiceOrder.currency || store.baseCurrency)}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Footer */}
            <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
              <span className="font-black text-sm text-slate-900 dark:text-white">المبلغ الإجمالي المدفوع:</span>
              <span className="text-xl font-black text-brand-600 dark:text-brand-400">
                {formatCurrency(selectedInvoiceOrder.total, selectedInvoiceOrder.currency || store.baseCurrency)}
              </span>
            </div>

            {/* Print and Close Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة 🖨️</span>
              </button>
              <button
                onClick={() => setSelectedInvoiceOrder(null)}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
