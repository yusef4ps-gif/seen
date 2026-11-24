'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Lock, Mail, Phone, User as UserIcon, CheckCircle2, 
  AlertCircle, Eye, EyeOff, ArrowRight, ShieldCheck, MapPin, Globe2
} from 'lucide-react';
import {
  loginMerchantAction,
  registerMerchantAction,
  sendVerificationCodeAction,
  sendLoginVerificationCodeAction,
  completeMerchantOtpLoginAction,
  switchStoreAction,
  sendMerchantPasswordResetOtpAction,
  resetMerchantPasswordWithOtpAction,
} from '@/app/actions/auth';
import BrandLogo from '@/components/BrandLogo';

declare global {
  interface Window {
    google: any;
  }
}

const COUNTRIES = [
  { 
    name: 'اليمن', 
    cities: ['صنعاء', 'عدن', 'تعز', 'حضرموت', 'إب', 'الحديدة', 'مأرب', 'شبوة', 'المهرة', 'أبين', 'الضالع', 'لحج'] 
  },
  { 
    name: 'السعودية', 
    cities: ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'تبوك', 'أبها', 'جازان', 'نجران', 'القصيم', 'حائل'] 
  },
  { 
    name: 'الإمارات', 
    cities: ['أبوظبي', 'دبي', 'الشارقة', 'عجمان', 'رأس الخيمة', 'الفجيرة', 'أم القيوين', 'العين'] 
  },
  { 
    name: 'الكويت', 
    cities: ['الكويت', 'الأحمدي', 'حولي', 'الفروانية', 'الجهراء', 'مبارك الكبير'] 
  },
  { 
    name: 'قطر', 
    cities: ['الدوحة', 'الريان', 'الوكرة', 'الخور', 'أم صلال', 'الشمال'] 
  },
  { 
    name: 'البحرين', 
    cities: ['المنامة', 'المحرق', 'الرفاع', 'مدينة حمد', 'مدينة عيسى', 'البديع'] 
  },
  { 
    name: 'عُمان', 
    cities: ['مسقط', 'صلالة', 'صحار', 'نزوى', 'صور', 'الرستاق', 'البريمي'] 
  },
  { 
    name: 'أمريكا', 
    cities: ['نيويورك', 'واشنطن', 'لوس أنجلوس', 'شيكاغو', 'هيوستن', 'ميامي', 'سان فرانسيسكو', 'سياتل'] 
  }
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Customer register form state
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCountry, setRegCountry] = useState('اليمن');
  const [regCity, setRegCity] = useState('صنعاء');

  // Verification step state
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resetMode, setResetMode] = useState<'none' | 'otp'>('none');
  const [resetNewPassword, setResetNewPassword] = useState('');

  // Processing state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Pending login data for 2FA
  const [pendingLoginData, setPendingLoginData] = useState<any>(null);

  // Multi-store selection state for merchants with multiple stores
  const [multipleStores, setMultipleStores] = useState<any[] | null>(null);

  // Handle direct store choice
  const handleSelectStore = async (st: any) => {
    setIsLoading(true);
    setErrorMessage('');
    const sw = await switchStoreAction(st.id);
    if (!sw.success) {
      setIsLoading(false);
      setErrorMessage(sw.error || 'تعذر فتح المتجر.');
      return;
    }
    setSuccessMessage(`مرحباً بك! جاري الدخول إلى لوحة ${st.name}...`);
    setTimeout(() => {
      if (redirectParam) {
        router.push(redirectParam);
      } else {
        router.push(`/merchant/${st.slug}`);
      }
    }, 400);
  };

  // Submit Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (resetMode === 'otp') {
      setIsLoading(true);
      const resetRes = await resetMerchantPasswordWithOtpAction(loginIdentifier, verificationCode, resetNewPassword);
      setIsLoading(false);
      if (!resetRes.success) {
        setErrorMessage(resetRes.error || 'تعذر إعادة تعيين كلمة المرور.');
        return;
      }
      setResetMode('none');
      setVerificationCode('');
      setResetNewPassword('');
      setLoginPassword('');
      setSuccessMessage('تم تحديث كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
      return;
    }
    
    if (!verificationStep) {
      setIsLoading(true);
      const result = await loginMerchantAction(loginIdentifier, loginPassword);
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
        if ((result as any).isEmailValid) {
          setLoginAttempts(prev => prev + 1);
        }
        return;
      }
      
      // Send OTP to email (stored hashed/DB-backed server-side)
      setIsLoading(true);
      const otpRes = await sendLoginVerificationCodeAction(result.email!, result.name!);
      setIsLoading(false);

      if (!otpRes.success) {
        setErrorMessage(otpRes.error || 'فشل إرسال كود التحقق إلى بريدك الإلكتروني.');
        return;
      }

      setPendingLoginData(result);
      setVerificationStep(true);
      setSuccessMessage('تم التحقق من الحساب بنجاح. تم إرسال كود الدخول إلى بريدك الإلكتروني.');
      return;
    }

    // Server-side OTP verification + signed cookie issuance
    setIsLoading(true);
    const otpComplete = await completeMerchantOtpLoginAction(loginIdentifier, verificationCode);
    setIsLoading(false);

    if (!otpComplete.success) {
      setErrorMessage(otpComplete.error || 'كود التحقق خطأ.');
      return;
    }

    // Check if merchant owns multiple stores
    if (otpComplete.stores && otpComplete.stores.length > 1) {
      setVerificationStep(false);
      setMultipleStores(otpComplete.stores);
      setSuccessMessage('تم التحقق بنجاح! يرجى اختيار المتجر للمتابعة.');
      return;
    }

    setSuccessMessage('تم تسجيل الدخول بنجاح! جاري التوجيه...');
    const chosenSlug = otpComplete.slug;
    setTimeout(() => {
      if (redirectParam) {
          router.push(redirectParam);
      } else if (chosenSlug) {
          router.push(`/merchant/${chosenSlug}`);
      } else if (otpComplete.role === 'STORE_OWNER') {
          router.push('/create-store');
      } else {
          router.push('/profile');
      }
    }, 500);
  };

  // Submit Merchant Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!verificationStep) {
      if (!regName || !regPhone || !regPassword || !regEmail) {
        setErrorMessage('يرجى تعبئة جميع الحقول المطلوبة (الاسم، كلمة المرور، الواتساب، البريد الإلكتروني).');
        return;
      }
      
      setIsLoading(true);
      const res = await sendVerificationCodeAction(regEmail, regName);
      setIsLoading(false);

      if (!res.success) {
        setErrorMessage(res.error || 'فشل إرسال كود التحقق. تأكد من صحة البريد الإلكتروني.');
        return;
      }

      setVerificationStep(true);
      setSuccessMessage('تم إرسال كود التحقق إلى بريدك الإلكتروني بنجاح، يرجى إدخاله أدناه.');
      return;
    }

    setIsLoading(true);

    const result = await registerMerchantAction({
      name: regName,
      phone: regPhone,
      email: regEmail,
      password: regPassword,
      country: regCountry,
      city: regCity,
      otpCode: verificationCode,
    });

    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'حدث خطأ أثناء إنشاء الحساب.');
    } else {
      setSuccessMessage('تم إنشاء حسابك ومتجرك بنجاح! جاري توجيهك...');
      setTimeout(() => {
        if (redirectParam) {
           router.push(redirectParam);
         } else if ((result as any).slug) {
           router.push(`/merchant/${(result as any).slug}`);
        } else if ((result as any).role === 'STORE_OWNER') {
           router.push('/create-store');
        } else {
           router.push('/profile');
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060f1b] text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      
      {/* 🌌 Space Nebula Canvas */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[10%] -left-[10%] w-[50vw] h-[50vh] min-w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,0.15)_0%,transparent_70%)] animate-nebula-a" />
        <div className="absolute bottom-[5%] -right-[5%] w-[50vw] h-[50vh] min-w-[400px] rounded-full bg-[radial-gradient(closest-side,rgba(15,43,72,0.22)_0%,transparent_65%)] animate-nebula-b" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full p-4 sm:p-6 flex items-center justify-between">
        <BrandLogo size="md" />
        <Link 
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-[#0f2b48] shadow-xs transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة للرئيسية</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-8">
        
        {/* Card Frame */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-2xl text-right space-y-5">
          

          {/* MULTI-STORE SELECTOR (Shown when user account owns multiple stores) */}
          {multipleStores && multipleStores.length > 1 ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center space-y-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-1.5 shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  اختر المتجر أو البروفايل
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  تم العثور على <span className="font-bold text-teal-600 dark:text-teal-400 font-mono">{multipleStores.length}</span> متاجر مسجلة بهذا الحساب. اختر المتجر الذي ترغب بإدارته:
                </p>
              </div>

              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-0.5">
                {multipleStores.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => !isLoading && handleSelectStore(st)}
                    className="group cursor-pointer p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-md transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {st.logo ? (
                        <img 
                          src={st.logo} 
                          alt={st.name} 
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0" 
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {st.name?.slice(0, 2) || 'متجر'}
                        </div>
                      )}
                      <div className="min-w-0 text-right">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {st.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          {st.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium truncate">
                              {st.category}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                            /{st.slug}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectStore(st);
                      }}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>دخول</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMultipleStores(null);
                    setVerificationStep(false);
                    setVerificationCode('');
                    setPendingLoginData(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors"
                >
                  ← العودة وتسجيل الدخول بحساب آخر
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Mode Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`py-2.5 rounded-xl transition-all ${
                    authMode === 'login'
                      ? 'bg-[#0f2b48] text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setErrorMessage(''); setSuccessMessage(''); }}
                  className={`py-2.5 rounded-xl transition-all ${
                    authMode === 'register'
                      ? 'bg-[#0f2b48] text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  حساب عميل جديد
                </button>
              </div>

          {/* Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* VERIFICATION STEP FOR BOTH */}
          {verificationStep ? (
            <form onSubmit={authMode === 'login' ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-center">
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">الرجاء إدخال كود التحقق</p>
                <p className="text-[11px] text-slate-500">تم إرسال كود من 4 أرقام إلى بريدك الإلكتروني.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  كود التحقق <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="1234"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#14b8a6] text-center tracking-[0.5em] font-mono"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setVerificationStep(false); setVerificationCode(''); }}
                  className="w-1/3 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all flex items-center justify-center"
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  disabled={isLoading || verificationCode.length < 4}
                  className="w-2/3 py-3.5 rounded-2xl bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs font-bold shadow-lg shadow-[#14b8a6]/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'جاري التحقق...' : 'تأكيد الدخول'}</span>
                </button>
              </div>
            </form>
          ) : authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  البريد الإلكتروني أو رقم الهاتف:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="name@example.com أو 777000111"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  كلمة المرور:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pr-10 pl-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#14b8a6] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0f2b48] via-[#144b7a] to-[#14b8a6] hover:from-[#143d67] hover:to-[#0d9488] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#0f2b48]/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'جاري التحقق...' : 'تسجيل الدخول 🚀'}</span>
              </button>

              {resetMode === 'none' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!loginIdentifier.trim()) {
                        setErrorMessage('يرجى كتابة بريدك الإلكتروني أولاً.');
                        return;
                      }
                      setErrorMessage('');
                      setIsLoading(true);
                      const r = await sendMerchantPasswordResetOtpAction(loginIdentifier);
                      setIsLoading(false);
                      if (r.success) {
                        setResetMode('otp');
                        setSuccessMessage('تم إرسال رمز استعادة كلمة المرور إلى بريدك الإلكتروني.');
                      } else {
                        setErrorMessage(r.error || 'تعذر إرسال رمز الاستعادة.');
                      }
                    }}
                    className="w-full text-center text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                  >
                    هل نسيت كلمة المرور؟ (استعادة عبر البريد)
                  </button>
                </div>
              )}

              {resetMode === 'otp' && (
                <div className="p-4 rounded-2xl bg-brand-50/70 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 space-y-3">
                  <div className="text-xs font-bold text-brand-700 dark:text-brand-300">تعيين كلمة مرور جديدة:</div>
                  <input
                    type="text"
                    required
                    placeholder="أدخل رمز الاستعادة المرسل لبريدك"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-center"
                  />
                  <input
                    type="password"
                    required
                    minLength={4}
                    placeholder="كلمة المرور الجديدة"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setResetMode('none')}
                      className="flex-1 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-2 text-xs font-bold rounded-xl bg-brand-600 text-white"
                    >
                      حفظ كلمة المرور
                    </button>
                  </div>
                </div>
              )}

            </form>
          ) : (
            
            /* 2. CUSTOMER REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="مثال: يوسف أحمد"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      كلمة المرور <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pr-10 pl-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#14b8a6] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      رقم الواتساب <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="tel"
                        required
                        placeholder="مثال: 775555123"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      البريد الإلكتروني <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        الدولة
                      </label>
                      <div className="relative">
                        <Globe2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                        <select
                          value={regCountry}
                          onChange={(e) => {
                            setRegCountry(e.target.value);
                            const countryObj = COUNTRIES.find(c => c.name === e.target.value);
                            if (countryObj) setRegCity(countryObj.cities[0]);
                          }}
                          className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none"
                        >
                          {COUNTRIES.map(c => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                        المدينة
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                        <select
                          value={regCity}
                          onChange={(e) => setRegCity(e.target.value)}
                          className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none"
                        >
                          {COUNTRIES.find(c => c.name === regCountry)?.cities.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-[#0f2b48] hover:bg-[#143d67] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#0f2b48]/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{isLoading ? 'جاري الإرسال...' : 'إنشاء حساب العميل ✨'}</span>
                  </button>
            </form>
          )}
          </>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-400">
        <div>منصة سِين (SEEN SaaS) • للتجارة الإلكترونية المتكاملة 🌟</div>
      </footer>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-sm font-bold">
        جاري تحميل بوابة الدخول...
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
