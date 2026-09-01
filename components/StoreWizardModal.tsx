'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store as StoreIcon, Sparkles, CheckCircle2, ArrowLeft, Loader2, X, Building2, Phone, Globe } from 'lucide-react';
import { storeEngine } from '../lib/store-engine';
import { CurrencyCode } from '../lib/types';

interface StoreWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreWizardModal: React.FC<StoreWizardModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'loading' | 'success'>('form');
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('أزياء وموضة');
  const [city, setCity] = useState('عدن');
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('SAR');
  const [createdSlug, setCreatedSlug] = useState('');

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStoreName(val);
    // Auto generate clean slug
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!storeSlug || storeSlug === generated.slice(0, -1)) {
      setStoreSlug(generated || 'my-store');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !phone) return;

    setStep('loading');

    setTimeout(() => {
      try {
        const finalSlug = storeSlug || `store-${Math.floor(100 + Math.random() * 900)}`;
        const newStore = storeEngine.createStore({
          name: storeName,
          slug: finalSlug,
          phone,
          category,
          city,
          baseCurrency,
        });

        setCreatedSlug(newStore.slug);
        setStep('success');
      } catch (err) {
        console.error(err);
        setStep('form');
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'form' && (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 mb-3 shadow-inner">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                أنشئ متجرك الإلكتروني في دقيقة
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                سيتم تجهيز متجرك ولوحة التحكم والمنتجات التجريبية آلياً
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Store Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم المتجر أو البراند <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: أزياء الملكة، صيدلية النور، إلكترونيات عدن"
                    value={storeName}
                    onChange={handleNameChange}
                    className="w-full pr-10 pl-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Slug / Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رابط المتجر بالإنجليزية (Slug)
                </label>
                <div className="relative flex items-center" dir="ltr">
                  <span className="px-3 py-2.5 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 border border-r-0 border-slate-200 dark:border-slate-700 rounded-l-xl">
                    mazn.app/store/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="my-store"
                    value={storeSlug}
                    onChange={(e) => setStoreSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="w-full px-3 py-2.5 text-sm rounded-r-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Phone & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    رقم الواتساب / الهاتف <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      placeholder="770 000 000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pr-10 pl-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    المدينة / المحافظة
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  >
                    <option value="عدن">عدن</option>
                    <option value="صنعاء">صنعاء</option>
                    <option value="المكلا / حضرموت">المكلا / حضرموت</option>
                    <option value="تعز">تعز</option>
                    <option value="مأرب">مأرب</option>
                    <option value="الحديدة">الحديدة</option>
                    <option value="إب">إب</option>
                  </select>
                </div>
              </div>

              {/* Category & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نوع النشاط التجاري
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  >
                    <option value="أزياء وموضة">أزياء وموضة وعبايات</option>
                    <option value="إلكترونيات وهواتف">إلكترونيات وهواتف</option>
                    <option value="عطور وبخور">عطور وبخور وتجميل</option>
                    <option value="أغذية ومطاعم">أغذية وبن ومكسرات</option>
                    <option value="هدايا وإكسسوارات">هدايا وإكسسوارات</option>
                    <option value="متجر عام">متجر تجزئة عام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    العملة الأساسية لتسعير المنتجات
                  </label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  >
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                    <option value="YER_ADEN">ريال يمني - عدن (YER)</option>
                    <option value="YER_SANAA">ريال يمني - صنعاء (YER)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0f2b48] via-[#144b7a] to-[#14b8a6] hover:from-[#143d67] hover:to-[#0d9488] shadow-lg shadow-[#0f2b48]/20 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>إنشاء وتجهيز المتجر فوراً</span>
              </button>

            </form>
          </div>
        )}

        {step === 'loading' && (
          <div className="p-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto" />
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              جاري تجهيز متجرك الإلكتروني...
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              نقوم بإعداد لوحة التحكم، تهيئة المتجر، وإضافة منتجات تجريبية جاهزة للبدء.
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="p-6 sm:p-8 text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                مبروك! تم إنشاء متجرك بنجاح 🎉
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                متجرك جاهز للعمل واستقبال الطلبات فوراً
              </p>
            </div>

            {/* Quick Action Links */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-right space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">رابط متجر العملاء:</span>
                <span className="font-mono text-brand-600 font-bold" dir="ltr">/store/{createdSlug}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">لوحة تحكم التاجر:</span>
                <span className="font-mono text-brand-600 font-bold" dir="ltr">/merchant/{createdSlug}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  onClose();
                  router.push(`/merchant/${createdSlug}`);
                }}
                className="py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-brand-600 hover:bg-brand-700 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-brand-600/20"
              >
                <span>الدخول للوحة التحكم</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  router.push(`/store/${createdSlug}`);
                }}
                className="py-2.5 px-4 rounded-xl font-bold text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5"
              >
                <span>معاينة متجر العميل</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
