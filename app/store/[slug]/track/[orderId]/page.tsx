'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, Clock, MessageSquare, ArrowLeft,
  Receipt, CreditCard, MapPin, Phone, Package
} from 'lucide-react';
import { Store, Order } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import { getOrderByIdAction, customerConfirmDeliveryAction } from '@/app/actions/order';
import { getStoreBySlugAction } from '@/app/actions/store';

export default function OrderTrackingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const orderId = params.orderId as string;

  const [store, setStore] = useState<Store | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    async function loadOrder() {
      if (slug && orderId) {
        try {
          const s = await getStoreBySlugAction(slug);
          if (s) {
            setStore(s as any);
            const ord = await getOrderByIdAction(orderId);
            if (ord) setOrder(ord as any);
          }
        } catch (error) {
          console.error("Error loading order tracking info:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    loadOrder();

    intervalId = setInterval(() => {
      loadOrder();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [slug, orderId]);

  const handleConfirmDelivery = async () => {
    if (!order) return;
    if (confirm('هل أنت متأكد من استلامك للطلب بالكامل؟')) {
      const res = await customerConfirmDeliveryAction(order.id);
      if (res.success) {
        setOrder(res.order as any);
      } else {
        alert(res.error || 'حدث خطأ أثناء التأكيد');
      }
    }
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-slate-50 dark:bg-slateDark-950 text-slate-900 dark:text-white">
        <div className="space-y-4">
          <Clock className="w-12 h-12 text-slate-400 mx-auto animate-spin" />
          <h2 className="text-xl font-bold">جاري تحميل الفاتورة وبيانات الطلب...</h2>
        </div>
      </div>
    );
  }

  if (!store || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slateDark-950 text-slate-900 dark:text-white">
        <Package className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold mb-2">عفواً، لم نتمكن من العثور على الطلب</h2>
        <p className="text-sm text-slate-500 mb-6">قد يكون رقم الطلب غير صحيح أو تم حذفه.</p>
        <Link href={`/store/${slug}`} className="px-6 py-3 bg-brand-600 hover:bg-brand-700 transition-colors text-white rounded-xl font-bold text-sm">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  // Define steps
  const steps = [
    { id: 'pending_payment', label: 'تم استلام الطلب', desc: 'تم تسجيل طلبك بنجاح في النظام' },
    { id: 'processing', label: 'قيد التجهيز والتغليف', desc: 'يقوم المتجر بتجهيز منتجاتك بعناية' },
    { id: 'shipped', label: 'جاري التوصيل والشحن', desc: 'تم تسليم الطلب لمندوب التوصيل' },
    { id: 'delivered', label: 'تم التسليم بنجاح', desc: 'تم استلام الطلب من قبل العميل' },
  ];

  const getStepStatus = (stepId: string) => {
    const statusOrder = ['pending_payment', 'new', 'processing', 'shipped', 'delivered'];
    const currentIdx = statusOrder.indexOf(order.status);
    const stepIdx = statusOrder.indexOf(stepId);
    if (order.status === 'delivered') return 'completed';
    if (currentIdx >= stepIdx) return 'completed';
    return 'upcoming';
  };

  const isBankTransfer = !order.paymentMethod.includes('عند الاستلام') && !order.paymentMethod.includes('COD');

  // Parse items safely
  let itemsList: any[] = [];
  try {
    itemsList = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  } catch(e) {}

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-16">
      
      {/* Header */}
      <header className="bg-white dark:bg-slateDark-900 border-b border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href={`/store/${slug}`} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>العودة لمتجر {store.name}</span>
          </Link>

          <div className="flex items-center gap-2">
            {store.logo && <img src={store.logo} alt={store.name} className="w-8 h-8 rounded-xl object-cover bg-white border border-slate-100" />}
            <span className="font-bold text-xs">{store.name}</span>
          </div>
        </div>
      </header>

      {/* Main Track & Invoice Container */}
      <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        
        {/* Top Success Banner */}
        <div className="p-6 mb-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            شكراً لك، تم الطلب بنجاح!
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
            لقد استلمنا طلبك وهو الآن قيد المتابعة. يمكنك حفظ هذه الصفحة أو الرجوع إليها لاحقاً عبر حسابك لمتابعة حالة الفاتورة.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Right Side: Tracker and Payment Instructions */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Payment Instructions (If Bank Transfer) */}
            {isBankTransfer && (order.status === 'pending_payment' || order.status === 'new') && (
              <div className="p-6 rounded-3xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 text-brand-700 dark:text-brand-300 font-bold border-b border-brand-200/50 pb-3">
                  <CreditCard className="w-5 h-5" />
                  <h3>إرشادات الدفع: ({order.paymentMethod})</h3>
                </div>
                <div className="text-sm text-brand-800 dark:text-brand-200 space-y-2 leading-relaxed">
                  <p>الرجاء تحويل المبلغ الإجمالي المستحق، ثم إرسال صورة إيصال التحويل عبر الواتساب لتأكيد الطلب وتسريع عملية التجهيز.</p>
                </div>
                <div className="pt-2">
                  <a
                    href={`https://wa.me/${store.whatsapp || store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً متجر ${store.name}، قمت بتحويل مبلغ الطلب رقم ${order.orderNumber}، وهذا إيصال الدفع:`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-6 py-3 rounded-2xl font-bold text-sm bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/20 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>إرسال إيصال التحويل عبر WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* Live Timeline Tracker */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                حالة الطلب اللحظية
              </h3>

              <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:right-5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {steps.map((step, idx) => {
                  const status = getStepStatus(step.id);
                  const isCompleted = status === 'completed';

                  return (
                    <div key={step.id} className="relative flex items-start gap-5 pr-2">
                      
                      {/* Icon Node */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 z-10 transition-colors ${
                        isCompleted
                          ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>

                      {/* Text */}
                      <div className="flex-1 pt-1">
                        <h4 className={`text-sm font-bold ${isCompleted ? 'text-slate-900 dark:text-white font-black' : 'text-slate-400'}`}>
                          {step.label}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {step.desc}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Customer Action: Confirm Delivery */}
            {order.status === 'shipped' && (
              <div className="p-6 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center space-y-3 shadow-sm">
                <h3 className="font-bold text-amber-900 dark:text-amber-100">هل استلمت شحنتك؟</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  الرجاء تأكيد الاستلام بعد التأكد من سلامة المنتجات.
                </p>
                <button
                  onClick={handleConfirmDelivery}
                  className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-all shadow-md"
                >
                  تأكيد استلام الطلب
                </button>
              </div>
            )}
            
          </div>

          {/* Left Side: Invoice Design */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm relative">
              
              {/* Invoice Header */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold mb-1">
                    <Receipt className="w-5 h-5" />
                    <h2 className="text-sm">تفاصيل الفاتورة</h2>
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-white dir-ltr text-right">
                    {order.orderNumber}
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[11px] text-slate-500 mb-1">تاريخ الطلب</div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300" dir="ltr">
                    {new Date(order.createdAt).toLocaleDateString('en-GB')}
                  </div>
                </div>
              </div>

              {/* Invoice Customer Info */}
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700/50 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">المستلم</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{order.customerName}</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400 dir-ltr text-right">{order.customerPhone}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">عنوان التوصيل</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{order.city}</div>
                    <div className="text-xs font-medium text-slate-600 dark:text-slate-400">{order.address}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">طريقة الدفع</div>
                    <div className="text-sm font-bold text-brand-600 dark:text-brand-400">{order.paymentMethod}</div>
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
                <h3 className="text-[11px] font-bold text-slate-400 mb-4 uppercase tracking-wider">المنتجات</h3>
                <div className="space-y-4">
                  {itemsList.map((it: any, idx: number) => (
                    <div key={idx} className="flex gap-3">
                      <img src={it.productImage} alt={it.productName} className="w-14 h-14 rounded-xl object-cover border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" />
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 leading-tight pl-2">
                            {it.productName}
                          </div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                            {formatCurrency(it.total, order.currency)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          {it.variantName && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{it.variantName}</span>}
                          <span className="text-[11px] font-medium text-slate-500">الكمية: {it.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="p-6 bg-slate-50 dark:bg-slate-800/30 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">المجموع الفرعي:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-brand-600 dark:text-brand-400">
                    <span>الخصم:</span>
                    <span className="font-bold">- {formatCurrency(order.discount, order.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">رسوم التوصيل:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(order.shippingCost, order.currency)}</span>
                </div>
                
                {/* Dashed Separator */}
                <div className="my-5 border-t-2 border-dashed border-slate-200 dark:border-slate-700 relative">
                  <div className="absolute -left-8 -top-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-slateDark-950"></div>
                  <div className="absolute -right-8 -top-3 w-6 h-6 rounded-full bg-slate-50 dark:bg-slateDark-950"></div>
                </div>

                <div className="flex justify-between items-center text-lg font-black text-emerald-600 dark:text-emerald-400 pt-1">
                  <span>الإجمالي المستحق:</span>
                  <span>{formatCurrency(order.total, order.currency)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}
