'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Lock, User as UserIcon, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { authEngine } from '@/lib/auth-engine';
import { setAuthCookieAction } from '@/app/actions/auth';
import BrandLogo from '@/components/BrandLogo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('yousef');
  const [password, setPassword] = useState('1234');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(async () => {
      const result = authEngine.login(username, password);
      setIsLoading(false);

      if (!result.success || result.session?.user.role !== 'SUPER_ADMIN') {
        setErrorMessage(result.error || 'غير مصرح بالدخول. يرجى التأكد من الصلاحيات.');
      } else {
        setSuccessMessage('تم تسجيل الدخول بنجاح! جاري توجيهك للوحة التحكم...');
        if (result.session) {
          await setAuthCookieAction(result.session.token, result.session.user.id, result.session.user.role, result.session.user.storeId);
        }
        setTimeout(() => {
          router.push('/admin');
        }, 500);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden">
      
      {/* Background Ambience */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40 dark:opacity-20">
        <div className="absolute top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,0.12)_0%,transparent_70%)] animate-pulse" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(15,43,72,0.15)_0%,transparent_70%)]" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 max-w-6xl mx-auto w-full p-4 sm:p-6 flex items-center justify-between">
        <BrandLogo size="md" href="/" />
        <Link 
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>الواجهة الرئيسية</span>
        </Link>
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
              بوابة تسجيل دخول إدارة المنصة
            </h2>
            <p className="text-xs text-slate-500">
              مخصصة لمالكي ومديري منصة سِين التنفيذيين
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
          <form onSubmit={handleAdminLogin} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 mb-1.5">
                اسم المستخدم (Username):
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="yousef أو abbas"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  placeholder="••••"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-black shadow-lg shadow-brand-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>دخول لوحة التحكم المركزية 🛡️</span>
              )}
            </button>

          </form>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-500">
        منصة سِين (SEEN SaaS) • نظام الإدارة المركزي المشفر
      </footer>

    </div>
  );
}
