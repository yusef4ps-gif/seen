'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Package, User, LogOut, CheckCircle2, ShoppingBag, 
  Settings, Lock, Trash2, Eye, Briefcase, CalendarCheck, Sparkles, Download, FileText 
} from 'lucide-react';
import { getCurrentCustomerAction, logoutCustomerAction, changeCustomerPasswordAction, deleteCustomerAccountAction } from '@/app/actions/customer-auth';
import { getStoreBySlugAction } from '@/app/actions/store';
import { getCustomerOrdersAction } from '@/app/actions/order';
import { formatCurrency, convertCurrency, DEFAULT_CURRENCIES } from '@/lib/currency-engine';

export default function CustomerAccountPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  const tabParam = searchParams.get('tab');
  const initialTab: 'orders' | 'library' | 'settings' = 
    tabParam === 'settings' ? 'settings' : tabParam === 'library' ? 'library' : 'orders';

  const [store, setStore] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'library' | 'settings'>(initialTab);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    async function loadData() {
      const s = await getStoreBySlugAction(slug);
      if (!s) {
        router.push('/');
        return;
      }
      setStore(s);

      const cust = await getCurrentCustomerAction();
      if (!cust || cust.storeId !== s.id) {
        // Not logged in or logged into a different store
        router.push(`/store/${slug}`);
        return;
      }
      setCustomer(cust);

      // Load orders
      const ords = await getCustomerOrdersAction(s.id, cust.customerId, 'id', cust.phone || undefined);
      setOrders(ords || []);

      setLoading(false);
    }
    loadData();
  }, [slug, router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'settings') setActiveTab('settings');
    else if (tab === 'library') setActiveTab('library');
    else if (tab === 'orders' || tab === 'purchases') setActiveTab('orders');
  }, [searchParams]);

  const handleLogout = async () => {
    await logoutCustomerAction();
    window.location.href = `/store/${slug}`;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPassError('كلمات المرور الجديدة غير متطابقة');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsChangingPass(true);
    const res = await changeCustomerPasswordAction(oldPassword, newPassword);
    setIsChangingPass(false);

    if (res.success) {
      setPassSuccess('تم تغيير كلمة المرور بنجاح');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPassError(res.error || 'حدث خطأ غير متوقع');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('هل أنت متأكد من حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      const res = await deleteCustomerAccountAction();
      if (res.success) {
        router.push(`/store/${slug}`);
      } else {
        alert(res.error);
      }
    }
  };

  const isServiceStore = (() => {
    if (!store?.themeConfig) return false;
    try {
      const cfg = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : store.themeConfig;
      return cfg?.storeType === 'SERVICE' || cfg?.presetId === 'service-expert';
    } catch {
      return false;
    }
  })();

  // Extract all purchased items across orders for the Library tab
  const purchasedItems = React.useMemo(() => {
    const list: any[] = [];
    (orders || []).forEach((o) => {
      let orderItems: any[] = [];
      try {
        orderItems = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch {
        orderItems = [];
      }

      orderItems.forEach((it: any, idx: number) => {
        const isFree = Number(o.total) === 0 || Number(it.price) === 0;
        const canDownload = Boolean(
          it.digitalFileUrl &&
          (isFree || it.digitalFileAccess === 'instant' || o.status === 'delivered' || o.status === 'processing' || o.paymentProofStatus === 'verified')
        );

        list.push({
          uniqueId: `${o.id}-${idx}`,
          orderId: o.id,
          orderNumber: o.orderNumber,
          orderDate: o.createdAt,
          orderStatus: o.status,
          name: it.productName || it.name || (isServiceStore ? 'خدمة واستشارة' : 'منتج رقمي'),
          image: it.productImage || it.image,
          price: Number(it.price) || 0,
          quantity: it.quantity || 1,
          variantName: it.variantName,
          isFree,
          digitalFileUrl: it.digitalFileUrl,
          digitalFileName: it.digitalFileName,
          canDownload,
        });
      });
    });
    return list;
  }, [orders, isServiceStore]);

  if (loading || !store || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slateDark-950">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCurrency = typeof window !== 'undefined' ? (localStorage.getItem('preferred_currency') || store.baseCurrency) : store.baseCurrency;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 font-sans text-slate-900 dark:text-slate-100 pb-20">
      
      {/* Header */}
      <header className="bg-white dark:bg-slateDark-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base">حسابي</h1>
              <p className="text-xs text-slate-500">{store.name}</p>
            </div>
          </div>

          <Link href={`/store/${slug}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <span>العودة {isServiceStore ? 'للبروفايل' : 'للمتجر'}</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-slateDark-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-2xl font-black shadow-lg">
              {customer.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-black">{customer.name}</h2>
              <p className="text-sm text-slate-500 mt-1" dir="ltr">{customer.phone || customer.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            تسجيل خروج
          </button>
        </div>

        {/* 3 Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-2 overflow-x-auto scrollbar-none">
          {/* Tab 1: Orders / Bookings */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'orders' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isServiceStore ? <Briefcase className="w-4 h-4 text-teal-600" /> : <ShoppingBag className="w-4 h-4" />}
            <span>{isServiceStore ? 'سجل الحجوزات والطلبات 📋' : 'سجل طلباتي'}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              {orders.length}
            </span>
          </button>

          {/* Tab 2: My Products & Services Library */}
          <button
            onClick={() => setActiveTab('library')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'library' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>منتجاتي وخدماتي 📦</span>
            {purchasedItems.length > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800">
                {purchasedItems.length}
              </span>
            )}
          </button>

          {/* Tab 3: Account Settings */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'settings' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات الحساب</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-slateDark-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          
          {/* TAB 1: ORDERS & BOOKINGS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-lg">
                    {isServiceStore ? 'سجل الخدمات والاستشارات المحجوزة 📅' : 'سجل طلباتي'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    متابعة حالة الحجوزات والطلبات وتفاصيل الفواتير
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {orders.length} {isServiceStore ? 'خدمة مسجلة' : 'طلب'}
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                  {isServiceStore ? (
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20 text-teal-600" />
                  ) : (
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  )}
                  <p className="font-bold">
                    {isServiceStore ? 'لا توجد خدمات أو استشارات محجوزة حالياً' : 'لا توجد طلبات سابقة'}
                  </p>
                  <p className="text-xs mt-1">
                    {isServiceStore ? 'لم تقم بحجز أو طلب أي خدمة مهنية من هذه المنصة بعد.' : 'لم تقم بإجراء أي طلب من هذا المتجر بعد.'}
                  </p>
                  <Link 
                    href={`/store/${slug}`} 
                    className="inline-block mt-4 text-brand-600 font-bold text-sm hover:underline"
                  >
                    {isServiceStore ? 'استعراض الخدمات المتاحة ←' : 'تصفح المنتجات ←'}
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orders.map((o) => {
                    const tConverted = convertCurrency(o.total, store.baseCurrency, activeCurrency);
                    
                    const statusLabel = (() => {
                      if (o.status === 'delivered') return isServiceStore ? 'مكتملة ومسلّمة ✅' : 'مكتمل';
                      if (o.status === 'shipped') return isServiceStore ? 'قيد التنفيذ والمتابعة ⚡' : 'مشحون';
                      if (o.status === 'processing') return isServiceStore ? 'قيد المراجعة والتأكيد ⏳' : 'قيد المعالجة';
                      return isServiceStore ? 'طلب جديد قيد التدقيق 📋' : 'قيد الانتظار';
                    })();

                    const statusColor = (() => {
                      if (o.status === 'delivered') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800';
                      if (o.status === 'shipped') return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
                      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800';
                    })();

                    let orderItems: any[] = [];
                    try {
                      orderItems = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
                    } catch {
                      orderItems = [];
                    }

                    const downloadableItem = orderItems.find((it: any) => {
                      const isFree = Number(o.total) === 0 || Number(it.price) === 0;
                      return Boolean(
                        it.digitalFileUrl &&
                        (isFree || it.digitalFileAccess === 'instant' || o.status === 'delivered' || o.status === 'processing' || o.paymentProofStatus === 'verified')
                      );
                    });

                    return (
                      <div key={o.id} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4 bg-white dark:bg-slate-850 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                        
                        {/* Header: Order Number & Status */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                              {isServiceStore && <Briefcase className="w-3.5 h-3.5 text-teal-600" />}
                              <span>{isServiceStore ? 'حجز خدمة رقم' : 'طلب رقم'} #{o.orderNumber}</span>
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(o.createdAt).toLocaleDateString('ar-EG')}</p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Items Preview List: Prominently showing the Service/Product name and thumbnail */}
                        <div className="space-y-2 py-1">
                          {orderItems.length > 0 ? (
                            orderItems.map((it: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                                {it.productImage || it.image ? (
                                  <img 
                                    src={it.productImage || it.image} 
                                    alt="" 
                                    className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs" 
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-900">
                                    {isServiceStore ? <Briefcase className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                    {it.productName || it.name || (isServiceStore ? 'جلسة استشارية متخصصة' : 'منتج')}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                                    {it.variantName && (
                                      <span className="bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-700 dark:text-slate-300">
                                        {it.variantName}
                                      </span>
                                    )}
                                    {it.quantity > 1 && (
                                      <span className="text-[11px] text-slate-500">العدد: {it.quantity}</span>
                                    )}
                                    {it.digitalFileUrl && (
                                      <span className="text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1 text-[10px]">
                                        <FileText className="w-3 h-3" />
                                        ملف رقمي مرفق 📎
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-2 text-xs text-slate-400">
                              {isServiceStore ? 'استشارة وخدمات مهنية' : 'منتجات المتجر'}
                            </div>
                          )}
                        </div>

                        {/* Footer: Price & Actions */}
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 block">إجمالي الرسوم:</span>
                            <p className="font-black text-brand-600 text-sm">
                              {Number(o.total) === 0 ? 'مجاناً 🎁' : formatCurrency(tConverted, activeCurrency)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {downloadableItem && (
                              <a
                                href={downloadableItem.digitalFileUrl}
                                download={downloadableItem.digitalFileName || 'ملف_الخدمة.pdf'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                                title="تحميل المستند المرفق مباشرة"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">تحميل الملف</span>
                              </a>
                            )}
                            <Link 
                              href={`/store/${slug}/track/${o.id}`} 
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isServiceStore ? 'تفاصيل الخدمة' : 'عرض الفاتورة'}</span>
                            </Link>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY DIGITAL PRODUCTS & SERVICES LIBRARY */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>مكتبة خدماتي والملفات الرقمية 📦</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    جميع الخدمات والاستشارات المكتسبة والملفات الرقمية (PDF / حقائب تدريبية) المتاحة للتحميل والوصول المباشر.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {purchasedItems.length} عنصر
                </span>
              </div>

              {purchasedItems.length === 0 ? (
                <div className="text-center py-16 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-500" />
                  <p className="font-bold text-base text-slate-700 dark:text-slate-300">
                    مكتبتك الرقمية فارغة حالياً
                  </p>
                  <p className="text-xs mt-1 max-w-sm mx-auto text-slate-500">
                    عند حجز أي خدمة أو الحصول على منتجات رقمية (سواء مجانية أو مدفوعة)، ستظهر هنا مباشرة مع روابط التحميل السريعة.
                  </p>
                  <Link 
                    href={`/store/${slug}`} 
                    className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    <span>استكشاف الخدمات والمنتجات المتاحة ←</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {purchasedItems.map((item) => (
                    <div 
                      key={item.uniqueId} 
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-850 shadow-xs flex flex-col justify-between gap-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="space-y-3">
                        {/* Top: Image & Title */}
                        <div className="flex items-start gap-3">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs" 
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500/10 to-brand-500/10 text-teal-600 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-800/50">
                              <Sparkles className="w-7 h-7" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-400 font-bold">
                                طلب #{item.orderNumber}
                              </span>
                              {item.isFree ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                  مجاناً 🎁
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                                  {formatCurrency(convertCurrency(item.price, store.baseCurrency, activeCurrency), activeCurrency)}
                                </span>
                              )}
                            </div>
                            <h4 className="font-black text-sm text-slate-900 dark:text-white mt-1 line-clamp-2">
                              {item.name}
                            </h4>
                            {item.variantName && (
                              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                                {item.variantName}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-400 mt-1">
                              {new Date(item.orderDate).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                        </div>

                        {/* Digital Attachment Card if exists */}
                        {item.digitalFileUrl && (
                          <div className="p-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200/70 dark:border-teal-800/70 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {item.digitalFileName || 'ملف رقمي مرفق (PDF / حقيبة تدريبية)'}
                                </span>
                              </div>
                            </div>

                            {item.canDownload ? (
                              <a
                                href={item.digitalFileUrl}
                                download={item.digitalFileName || 'ملف_الخدمة.pdf'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-2.5 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>تحميل الملف الآن (PDF) 📥</span>
                              </a>
                            ) : (
                              <div className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 font-medium">
                                <Lock className="w-3.5 h-3.5 shrink-0" />
                                <span>بانتظار تأكيد التحويل المالي لتفعيل رابط التحميل المباشر</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Footer Link to Track Order */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">
                          حالة الحجز: {item.orderStatus === 'delivered' ? 'مكتمل ✅' : 'قيد التنفيذ ⏳'}
                        </span>
                        <Link 
                          href={`/store/${slug}/track/${item.orderId}`}
                          className="text-brand-600 dark:text-brand-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <span>تفاصيل الحجز والفاتورة</span>
                          <Eye className="w-3 h-3" />
                        </Link>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-8">
              
              {/* Change Password */}
              <div>
                <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand-600" />
                  تغيير كلمة المرور
                </h3>
                <p className="text-xs text-slate-500 mb-6">قم بتحديث كلمة المرور الخاصة بحسابك في هذا المتجر لحماية بياناتك.</p>
                
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  {passError && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{passError}</div>}
                  {passSuccess && <div className="p-3 bg-green-50 text-green-600 text-xs font-bold rounded-xl">{passSuccess}</div>}
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الحالية</label>
                    <input 
                      type="password" 
                      required
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    disabled={isChangingPass}
                    type="submit" 
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
                  >
                    {isChangingPass ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                  </button>
                </form>
              </div>

              {/* Delete Account */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-black text-lg mb-2 text-red-600 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  حذف الحساب
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-md">عند حذف حسابك، سيتم مسح بيانات تسجيل الدخول ولن تتمكن من تتبع طلباتك السابقة من خلال لوحة التحكم.</p>
                <button 
                  onClick={handleDeleteAccount}
                  className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm rounded-xl transition-all"
                >
                  حذف الحساب نهائياً
                </button>
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}
