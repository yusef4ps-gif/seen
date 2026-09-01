'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, Clock, Truck, Package, MessageSquare, 
  ArrowLeft, Store as StoreIcon, ShieldCheck, Phone, MapPin
} from 'lucide-react';
import { storeEngine } from '@/lib/store-engine';
import { Store, Order } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';

export default function OrderTrackingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const orderId = params.orderId as string;

  const [store, setStore] = useState<Store | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (slug) {
      const s = storeEngine.getStoreBySlug(slug);
      if (s) {
        setStore(s);
        const ord = storeEngine.getOrderById(orderId);
        if (ord) setOrder(ord);
      }
    }
  }, [slug, orderId]);

  if (!store || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <Clock className="w-12 h-12 text-slate-400 mx-auto animate-spin" />
          <h2 className="text-xl font-bold">جاري تحميل بيانات تتبع الطلب...</h2>
        </div>
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="bg-white dark:bg-slateDark-900 border-b border-slate-200 dark:border-slate-800 py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/store/${slug}`} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600">
            <ArrowLeft className="w-4 h-4" />
            <span>العودة لمتجر {store.name}</span>
          </Link>

          <div className="flex items-center gap-2">
            <img src={store.logo} alt={store.name} className="w-8 h-8 rounded-xl object-cover bg-white" />
            <span className="font-bold text-xs">{store.name}</span>
          </div>
        </div>
      </header>

      {/* Main Track Card */}
      <main className="max-w-3xl mx-auto px-4 py-10 w-full flex-1 space-y-6">
        
        {/* Top Success Banner */}
        <div className="p-6 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/25">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            شكراً لك، طلبك رقم #{order.orderNumber} قيد المتابعة!
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            تم إرسال تفاصيل طلبك للمتجر، ويمكنك متابعة حالته اللحظية من هذه الصفحة في أي وقت.
          </p>
        </div>

        {/* Live Timeline Tracker */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            حالة الطلب اللحظية
          </h3>

          <div className="space-y-6 relative before:absolute before:top-2 before:bottom-2 before:right-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {steps.map((step, idx) => {
              const status = getStepStatus(step.id);
              const isCompleted = status === 'completed';

              return (
                <div key={step.id} className="relative flex items-start gap-4 pr-1">
                  
                  {/* Icon Node */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <h4 className={`text-xs font-bold ${isCompleted ? 'text-slate-900 dark:text-white font-black' : 'text-slate-400'}`}>
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {step.desc}
                    </p>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details & Summary */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">ملخص الطلب</h3>
          
          <div className="space-y-2">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <img src={it.productImage} alt={it.productName} className="w-10 h-10 rounded-xl object-cover bg-white" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{it.productName}</div>
                    {it.variantName && <div className="text-[10px] text-slate-400">{it.variantName}</div>}
                    <div className="text-[10px] text-slate-500">الكمية: {it.quantity}</div>
                  </div>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {formatCurrency(it.total, order.currency)}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 space-y-1 font-semibold">
            <div className="flex justify-between">
              <span className="text-slate-500">المجموع الفرعي:</span>
              <span>{formatCurrency(order.subtotal, order.currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">رسوم التوصيل:</span>
              <span>{formatCurrency(order.shippingCost, order.currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span>الإجمالي الكلي:</span>
              <span>{formatCurrency(order.total, order.currency)}</span>
            </div>
          </div>

          <div className="pt-2 text-slate-500 space-y-1 text-[11px]">
            <div>👤 <strong>المستلم:</strong> {order.customerName} ({order.customerPhone})</div>
            <div>📍 <strong>العنوان:</strong> {order.city} - {order.address}</div>
            <div>💳 <strong>طريقة الدفع:</strong> {order.paymentMethod}</div>
          </div>
        </div>

        {/* Direct Contact Merchant Button */}
        <div className="text-center pt-2">
          <a
            href={`https://wa.me/${store.whatsapp || store.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً متجر ${store.name}، أود الاستفسار عن طلبي رقم #${order.orderNumber}`)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>مراسلة المتجر عبر WhatsApp للاستفسار عن الطلب</span>
          </a>
        </div>

      </main>

    </div>
  );
}
