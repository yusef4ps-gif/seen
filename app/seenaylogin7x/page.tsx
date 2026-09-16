'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Mail, KeyRound } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { authEngine } from '@/lib/auth-engine';
import { setAuthCookieAction, verifyAdminIPAction, logAdminLoginAttemptAction, verifyTurnstileTokenAction } from '@/app/actions/auth';
import BrandLogo from '@/components/BrandLogo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Hydration-safe siteKey logic
  const [siteKey, setSiteKey] = useState<string | null>(null);

  useEffect(() => {
    // Only enable Turnstile in production to avoid localhost hostname mismatch issues
    if (process.env.NODE_ENV !== 'development' && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
      setSiteKey(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
    }
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const ipCheck = await verifyAdminIPAction();
      if (ipCheck.blocked) {
        setErrorMessage(ipCheck.reason || 'تم حظر عنوان IP الخاص بك.');
        setIsLoading(false);
        return;
      }

      if (siteKey) {
        const tsResult = await verifyTurnstileTokenAction(turnstileToken, ipCheck.ipAddress);
        if (!tsResult.success) {
          setErrorMessage('فشل التحقق الأمني. يرجى المحاولة مرة أخرى.');
          setIsLoading(false);
          return;
        }
      }

      // First check if credentials are correct without fully logging in yet
      const result = authEngine.login(email, password);
      
      const success = result.success && result.session?.user.role === 'SUPER_ADMIN';
      
      await logAdminLoginAttemptAction(email, success, ipCheck.ipAddress);

      if (!success) {
        setErrorMessage(result.error || 'غير مصرح بالدخول. يرجى التأكد من الصلاحيات.');
        setIsLoading(false);
      } else {
        // Proceed to OTP step
        setSuccessMessage('بيانات صحيحة. تم إرسال كود التحقق (OTP) إلى بريدك الإلكتروني.');
        setStep('otp');
        setIsLoading(false);
        
        // Hide success message after a few seconds
        setTimeout(() => setSuccessMessage(''), 4000);
      }
    } catch (err) {
      setErrorMessage('حدث خطأ أثناء الاتصال بالخادم.');
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    // Mock OTP verification (123456)
    if (otp !== '123456') {
      setErrorMessage('كود التحقق غير صحيح.');
      setIsLoading(false);
      return;
    }

    try {
      // Final login step
      const result = authEngine.login(email, password);
      
      if (result.success && result.session?.user.role === 'SUPER_ADMIN') {
        setSuccessMessage('تم التحقق بنجاح! جاري توجيهك للوحة التحكم...');
        await setAuthCookieAction(result.session.token, result.session.user.id, result.session.user.role, result.session.user.storeId);
        
        setTimeout(() => {
          router.push('/seenayhq7x');
        }, 500);
      } else {
        setErrorMessage('حدث خطأ أثناء إصدار الجلسة.');
        setIsLoading(false);
      }
    } catch (error) {
      setErrorMessage('حدث خطأ أثناء الاتصال بالخادم.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Ambience */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40 dark:opacity-20">
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,0.12)_0%,transparent_70%)] animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(15,43,72,0.15)_0%,transparent_70%)]" />
      </div>

      {/* Top Bar (Link to home removed for secrecy) */}
      <header className="relative z-10 max-w-6xl mx-auto w-full p-4 sm:p-6 flex items-center justify-center">
        <BrandLogo size="md" />
      </header>

      {/* Login Card */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-8">
        <div className="bg-white dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-200 dark:border-slate-800 p-7 sm:p-8 shadow-xl space-y-6 text-right">
          
          {/* Header Icon */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-50 dark:bg-[#0f2b48] border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-white shadow-sm">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              بوابة تسجيل دخول الإدارة العليا
            </h2>
            <p className="text-xs text-slate-500">
              {step === 'credentials' ? 'الرجاء إدخال البريد الإلكتروني الخاص بالمدير' : 'الرجاء إدخال كود التحقق المرسل لبريدك الإلكتروني'}
            </p>
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

          {/* Form */}
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 mb-1.5">
                  البريد الإلكتروني للإدارة (Email):
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="admin@seen.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 font-mono text-right"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 mb-1.5">
                  كلمة المرور (Password):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 font-mono text-right"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {siteKey && (
                <div className="flex justify-center">
                  <Turnstile
                    siteKey={siteKey}
                    onSuccess={(token) => setTurnstileToken(token)}
                    onError={() => setErrorMessage('خطأ في التحقق الأمني. يرجى إعادة تحميل الصفحة.')}
                    onExpire={() => setTurnstileToken('')}
                    options={{ theme: 'auto' }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || (!!siteKey && !turnstileToken)}
                className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-brand-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>متابعة 🛡️</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 mb-1.5">
                  كود التحقق (OTP):
                </label>
                <p className="text-[10px] text-brand-600 dark:text-brand-400 mb-3 font-bold">
                  تلميح: ادخل 123456 للتجربة
                </p>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base tracking-[0.5em] font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 font-mono text-center"
                    dir="ltr"
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length < 4}
                className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-brand-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>تأكيد الدخول 🔒</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setOtp('');
                  setErrorMessage('');
                }}
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                العودة
              </button>
            </form>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-500">
        منصة سِين (SEEN SaaS) • نظام الإدارة المركزي المشفر
      </footer>

    </div>
  );
}
