'use client';

import React, { useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { resetCustomerPasswordAction } from '@/app/actions/customer-auth';

function ResetPasswordForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirm) {
      setError('كلمة المرور غير متطابقة');
      return;
    }
    setLoading(true);
    const res = await resetCustomerPasswordAction(slug, email, token, password);
    setLoading(false);
    if (res.success) {
      setDone(true);
    } else {
      setError(res.error || 'فشل إعادة تعيين كلمة المرور');
    }
  };

  if (done) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h1 className="text-lg font-black text-slate-900 dark:text-white">تم تحديث كلمة المرور بنجاح</h1>
        <p className="text-xs text-slate-500">يمكنك الآن تسجيل الدخول إلى المتجر بكلمة المرور الجديدة.</p>
        <Link
          href={`/store/${slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold"
        >
          <span>العودة إلى المتجر</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center space-y-1">
        <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-black text-slate-900 dark:text-white">إعادة تعيين كلمة المرور</h1>
        <p className="text-xs text-slate-500">{email || 'أدخل كلمة المرور الجديدة لحسابك'}</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الجديدة</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">تأكيد كلمة المرور</label>
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !token || !email}
        className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs disabled:opacity-50"
      >
        {loading ? 'جاري التحديث...' : 'حفظ كلمة المرور الجديدة'}
      </button>
    </form>
  );
}

export default function CustomerResetPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <Suspense fallback={<div className="text-center text-xs text-slate-500">جاري التحميل...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
