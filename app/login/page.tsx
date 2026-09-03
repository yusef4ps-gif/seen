'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Lock, Mail, Phone, User as UserIcon, CheckCircle2, 
  AlertCircle, Eye, EyeOff, ArrowRight, ShieldCheck, MapPin, Globe2
} from 'lucide-react';
import { authEngine } from '@/lib/auth-engine';
import { setAuthCookieAction } from '@/app/actions/auth';
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

  // Customer register form state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCountry, setRegCountry] = useState('اليمن');
  const [regCity, setRegCity] = useState('صنعاء');

  // Processing state
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Google Sign-In Initialization
  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID_HERE',
          callback: handleGoogleResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-button'),
          { theme: 'outline', size: 'large', text: 'continue_with', width: 300 }
        );
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleResponse = (response: any) => {
    setIsLoading(true);
    try {
      // Decode the JWT token returned by Google
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const result = authEngine.loginWithGoogle({
        name: payload.name,
        email: payload.email,
        avatarUrl: payload.picture
      });

      if (result.success) {
        setSuccessMessage('تم تسجيل الدخول عبر جوجل بنجاح!');
        if (result.session) {
          setAuthCookieAction(result.session.token, result.session.user.id, result.session.user.role, result.session.user.storeId);
        }
        setTimeout(() => {
          router.push(redirectParam || result.redirectUrl || '/profile');
        }, 500);
      }
    } catch (e) {
      setErrorMessage('فشل تسجيل الدخول عبر جوجل.');
      setIsLoading(false);
    }
  };

  // Submit Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(async () => {
      const result = authEngine.login(loginIdentifier, loginPassword);
      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.');
      } else {
        setSuccessMessage('تم تسجيل الدخول بنجاح! جاري التوجيه...');
        if (result.session) {
          await setAuthCookieAction(result.session.token, result.session.user.id, result.session.user.role, result.session.user.storeId);
        }
        setTimeout(() => {
          router.push(redirectParam || result.redirectUrl || '/profile');
        }, 500);
      }
    }, 500);
  };

  // Submit Customer Register
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!regName || !regPhone) {
      setErrorMessage('يرجى كتابة الاسم ورقم الهاتف على الأقل.');
      return;
    }

    setIsLoading(true);

    setTimeout(async () => {
      const result = authEngine.registerCustomer({
        name: regName,
        phone: regPhone,
        email: regEmail,
        password: regPassword || '1234',
      });

      setIsLoading(false);

      if (!result.success) {
        setErrorMessage(result.error || 'حدث خطأ أثناء إنشاء الحساب.');
      } else {
        setSuccessMessage('تم إنشاء حساب العميل بنجاح! جاري توجيهك...');
        if (result.session) {
          await setAuthCookieAction(result.session.token, result.session.user.id, result.session.user.role, result.session.user.storeId);
        }
        setTimeout(() => {
          router.push(redirectParam || result.redirectUrl || '/profile');
        }, 500);
      }
    }, 500);
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
          
          {/* Top Google Sign-In Highlight */}
          <div className="space-y-2 flex flex-col items-center">
            <div id="google-signin-button" className="w-full flex justify-center"></div>
            {(!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) && (
              <p className="text-[10px] text-amber-500 text-center font-bold">
                * عذراً، يجب إضافة (Google Client ID) في المتغيرات ليعمل تسجيل الدخول الفعلي.
              </p>
            )}
            <div className="relative flex items-center justify-center pt-2">
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-bold text-slate-400 shrink-0">
                أو الدخول بالبريد / الهاتف
              </span>
              <div className="border-t border-slate-200 dark:border-slate-700 w-full" />
            </div>
          </div>

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

          {/* 1. LOGIN FORM */}
          {authMode === 'login' ? (
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
                  رقم الواتساب / الهاتف <span className="text-red-500">*</span>
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
                        // Reset city to the first city of the new country
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
                <span>{isLoading ? 'جاري الإنشاء...' : 'إنشاء حساب جديد والمتابعة 🛍️'}</span>
              </button>

            </form>
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
