'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getStoreBySlugAction } from '@/app/actions/store';
import { ShieldCheck, Zap, Crown, CheckCircle2, Rocket, CalendarDays, ArrowUpRight } from 'lucide-react';

export default function SubscriptionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [store, setStore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStore() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        setStore(s);
      }
      setIsLoading(false);
    }
    fetchStore();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 md:p-10 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold">جاري تحميل بيانات الاشتراك...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex-1 p-6 md:p-10 flex items-center justify-center">
        <p className="text-slate-500 font-bold">المتجر غير موجود.</p>
      </div>
    );
  }

  // Calculate days left for trial (assuming 14 days)
  const createdAt = new Date(store.createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - createdAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const maxTrialDays = 14;
  const remaining = Math.max(0, maxTrialDays - diffDays);
  
  const isExpired = store.planStatus === 'expired' || (store.planStatus === 'trial' && remaining <= 0);

  const plans = [
    {
      id: 'basic',
      name: 'الباقة الأساسية',
      price: '19$',
      period: 'شهرياً',
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      color: 'blue',
      features: [
        'منتجات لا محدودة',
        'ربط دومين مخصص',
        'دعم فني عبر البريد',
        'قوالب المتاجر الأساسية',
        'بدون عمولة مبيعات',
      ],
      recommended: false,
    },
    {
      id: 'pro',
      name: 'الباقة الاحترافية',
      price: '39$',
      period: 'شهرياً',
      icon: <Rocket className="w-6 h-6 text-brand-500" />,
      color: 'brand',
      features: [
        'كل مزايا الباقة الأساسية',
        'مستشار الذكاء الاصطناعي',
        'دعم فني أولوية (واتساب)',
        'تخصيص القوالب بالكامل',
        'تصدير التقارير المتقدمة',
        'إدارة فريق العمل (حتى 5)',
      ],
      recommended: true,
    },
    {
      id: 'vip',
      name: 'الباقة اللامحدودة (VIP)',
      price: '99$',
      period: 'شهرياً',
      icon: <Crown className="w-6 h-6 text-amber-500" />,
      color: 'amber',
      features: [
        'كل مزايا الباقة الاحترافية',
        'فريق عمل لا محدود',
        'مدير حساب مخصص',
        'تصميم قالب خاص لمتجرك',
        'ربط متقدم مع أنظمة الـ ERP',
      ],
      recommended: false,
    }
  ];

  return (
    <div className="flex-1 p-6 md:p-10 lg:p-12 max-w-7xl mx-auto w-full">
      
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">إدارة الباقة والاشتراكات</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          تحكم في اشتراك متجرك، وقم بترقية باقتك للوصول إلى أدوات الذكاء الاصطناعي والمزايا المتقدمة.
        </p>
      </div>

      {/* Current Plan Overview */}
      <div className={`p-8 rounded-3xl border mb-12 shadow-sm relative overflow-hidden ${
        isExpired 
          ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900' 
          : 'bg-white dark:bg-slateDark-900 border-slate-200 dark:border-slate-800'
      }`}>
        
        {/* Background Accent */}
        <div className={`absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none rounded-full blur-3xl ${
          isExpired ? 'bg-rose-500' : 'bg-brand-500'
        } -translate-y-1/2 translate-x-1/3`} />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
              isExpired ? 'bg-rose-100 text-rose-600' : 'bg-brand-50 text-brand-600 dark:bg-brand-950/50'
            }`}>
              <ShieldCheck className="w-8 h-8" />
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  {store.planStatus === 'trial' ? 'الباقة التجريبية' : store.planStatus === 'active' ? 'الباقة الاحترافية' : 'باقة منتهية'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isExpired 
                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {isExpired ? 'منتهية' : 'نشطة'}
                </span>
              </div>
              <p className="text-slate-500 text-sm font-medium">
                {isExpired 
                  ? 'لقد انتهت صلاحية باقتك، يرجى الترقية لتتمكن من استقبال الطلبات.'
                  : 'أنت الآن تستمتع بمزايا التجربة المجانية لمنصة سِين.'}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slateDark-950 px-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 min-w-[240px]">
            <div className="flex justify-between items-center text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
              <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" /> الأيام المتبقية</span>
              <span className={`text-lg font-black ${isExpired ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {remaining} يوم
              </span>
            </div>
            
            {store.planStatus === 'trial' && (
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mt-3">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    remaining <= 3 ? 'bg-rose-500' : 'bg-brand-500'
                  }`}
                  style={{ width: `${(remaining / maxTrialDays) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-10">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-500" />
          اختر الباقة المناسبة لطموحك
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`relative flex flex-col p-6 rounded-3xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slateDark-900 ${
                plan.recommended 
                  ? 'border-brand-500 shadow-brand-500/10 shadow-lg' 
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-500 text-white text-xs font-black px-4 py-1 rounded-full shadow-sm">
                  الأكثر طلباً
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  plan.color === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' :
                  plan.color === 'brand' ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30' :
                  'bg-amber-50 text-amber-600 dark:bg-amber-900/30'
                }`}>
                  {plan.icon}
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">{plan.name}</h4>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-slate-500 font-medium pb-1">/ {plan.period}</span>
                </div>
              </div>

              <div className="flex-1 mb-8">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 ${
                        plan.recommended ? 'text-brand-500' : 'text-slate-400'
                      }`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => alert('سيتم ربط بوابات الدفع لاحقاً. هذه الباقات استعراضية حالياً.')}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  plan.recommended
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                اختيار الباقة
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
