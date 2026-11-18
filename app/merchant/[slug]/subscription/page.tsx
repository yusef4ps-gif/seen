'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getStoreBySlugAction, requestPlanUpgradeAction } from '@/app/actions/store';
import { ShieldCheck, Zap, Crown, CheckCircle2, Rocket, CalendarDays, ArrowUpRight, X, CreditCard, Send, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [store, setStore] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Plan Upgrade Request State
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<any | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [transferRef, setTransferRef] = useState('');
  const [senderName, setSenderName] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [upgradeNotes, setUpgradeNotes] = useState('');
  const [isSubmittingUpgrade, setIsSubmittingUpgrade] = useState(false);

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

  // Calculate days left for trial (guarantee 14 days for trial/new accounts)
  const now = new Date();
  let endDate = store.planEndDate ? new Date(store.planEndDate) : (store.trialEndsAt ? new Date(store.trialEndsAt) : null);
  if (!endDate || isNaN(endDate.getTime())) {
    const start = store.createdAt ? new Date(store.createdAt) : new Date();
    endDate = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
  }
  const diffTime = endDate.getTime() - now.getTime();
  const remaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const maxTrialDays = 14;
  
  const isExpired = store.planStatus === 'expired' || (remaining <= 0 && store.planStatus !== 'active' && store.planStatus !== 'trial' && store.planStatus !== 'pending_approval');

  const parsedThemeConfig = React.useMemo(() => {
    if (!store?.themeConfig) return {};
    try {
      return typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : store.themeConfig;
    } catch {
      return {};
    }
  }, [store?.themeConfig]);

  const pendingUpgrade = parsedThemeConfig.pendingPlanUpgrade;

  const handleSubmitUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUpgradePlan) return;

    if (!transferRef.trim()) {
      toast.error('يرجى كتابة رقم الحوالة أو رقم العملية');
      return;
    }

    setIsSubmittingUpgrade(true);
    const res = await requestPlanUpgradeAction({
      storeId: store.id,
      planTier: selectedUpgradePlan.id,
      billingCycle,
      transferRef,
      senderName,
      proofUrl,
      notes: upgradeNotes,
    });
    setIsSubmittingUpgrade(false);

    if (res.success) {
      toast.success('تم إرسال طلب الترقية وإشعار السداد بنجاح! 🎉 جاري المراجعة والتفعيل.');
      setSelectedUpgradePlan(null);
      const updated = await getStoreBySlugAction(slug);
      if (updated) setStore(updated);
    } else {
      toast.error(res.error || 'فشل إرسال طلب الترقية');
    }
  };

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

      {/* Pending Upgrade Alert */}
      {pendingUpgrade && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-bold flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-right shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
            <span>
              طلب ترقية باقتك إلى <strong>({pendingUpgrade.planTier.toUpperCase()})</strong> قيد التدقيق المالي ومراجعة إشعار التحويل من قبل إدارة منصة سِين. سيتم التفعيل والموافقة فور التحقق.
            </span>
          </div>
          {pendingUpgrade.transferRef && (
            <span className="px-3 py-1 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs shrink-0 font-mono">
              رقم الحوالة: #{pendingUpgrade.transferRef}
            </span>
          )}
        </div>
      )}

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
                  {store.planStatus === 'active' ? 'الباقة الاحترافية' : 'الباقة التجريبية المجانية (14 يوماً)'}
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
                  : `أنت الآن تستمتع بمزايا التجربة المجانية الكاملة لمنصة سِين (متبقي ${remaining} يوماً).`}
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
                onClick={() => setSelectedUpgradePlan(plan)}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                  plan.recommended
                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md hover:shadow-lg'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>ترقية الباقة الآن</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Upgrade & Payment Modal */}
      {selectedUpgradePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div 
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-right shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">سداد الرسوم والترقية</span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  ترقية المتجر إلى {selectedUpgradePlan.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedUpgradePlan(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUpgrade} className="space-y-5">
              {/* Plan Pricing & Cycle Choice */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">قيمة الاشتراك:</span>
                  <span className="text-xl font-black text-brand-600 dark:text-brand-400">
                    {billingCycle === 'monthly' ? selectedUpgradePlan.price : `${parseFloat(selectedUpgradePlan.price) * 10}$`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      billingCycle === 'monthly'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    اشتراك شهري ({selectedUpgradePlan.price})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      billingCycle === 'yearly'
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    اشتراك سنوي (خصم شهرين 🎁)
                  </button>
                </div>
              </div>

              {/* Official SEEN Platform Bank Accounts */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  الحسابات البنكية الرسمية لإدارة منصة سِين للتحويل:
                </label>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">بنك القطيبي الإسلامي</span>
                      <span className="text-slate-400 text-[10px]">باسم: شركة سِين للحلول الرقمية</span>
                    </div>
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400" dir="ltr">1249827361</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">بنك الكريمي (حاسب)</span>
                      <span className="text-slate-400 text-[10px]">باسم: سِين للتقنية والتجارة</span>
                    </div>
                    <span className="font-mono font-bold text-teal-600 dark:text-teal-400" dir="ltr">3001248950</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">الشبكة الموحدة للحوالات</span>
                      <span className="text-slate-400 text-[10px]">المستلم: إدارة منصة سِين - عدن</span>
                    </div>
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300" dir="ltr">774448016</span>
                  </div>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    رقم الحوالة أو العملية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transferRef}
                    onChange={(e) => setTransferRef(e.target.value)}
                    placeholder="مثال: 94827103"
                    dir="ltr"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    اسم المحول / صاحب الحساب
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="الاسم الثلاثي للمحول"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  رابط صورة إشعار التحويل (أو رفعه)
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://... رابط صورة الإشعار"
                  dir="ltr"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={upgradeNotes}
                  onChange={(e) => setUpgradeNotes(e.target.value)}
                  placeholder="أي تفاصيل خاصة بتسديد الاشتراك..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingUpgrade}
                  className="w-full py-3.5 px-6 rounded-2xl bg-brand-600 hover:bg-brand-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingUpgrade ? 'جاري إرسال الطلب...' : 'إرسال إشعار السداد وطلب تفعيل الباقة 🚀'}</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  سيتم إشعار إدارة منصة سِين مباشرة لمراجعة التحويل واعتماد الترقية فوراً
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}
