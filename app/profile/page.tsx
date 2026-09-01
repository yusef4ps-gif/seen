'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User as UserIcon, ShieldCheck, Building2, KeyRound, ShoppingBag, 
  Mail, Phone, Lock, LogOut, CheckCircle2, ArrowLeft, Store as StoreIcon, 
  ExternalLink, Clock, ShieldAlert, Sparkles
} from 'lucide-react';
import { authEngine, INITIAL_USERS } from '@/lib/auth-engine';
import { User, AuthSession } from '@/lib/types';

export default function UnifiedProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Edit State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const s = authEngine.getCurrentSession();
    if (s) {
      setSession(s);
      setCurrentUser(s.user);
      setName(s.user.name);
      setPhone(s.user.phone);
      setEmail(s.user.email);
    } else {
      // Default to the first seed user if none active for demo convenience
      const fallback = INITIAL_USERS[0];
      setCurrentUser(fallback);
      setName(fallback.name);
      setPhone(fallback.phone);
      setEmail(fallback.email);
    }
  }, []);

  if (!currentUser) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: Partial<User> = { name, phone, email };
    if (newPassword) updates.password = newPassword;

    const updated = authEngine.updateUser(currentUser.id, updates);
    if (updated) {
      setCurrentUser(updated);
      setSuccessMessage('تم حفظ التعديلات بنجاح ✓');
      setTimeout(() => setSuccessMessage(''), 3000);
      setNewPassword('');
    }
  };

  const handleLogout = () => {
    authEngine.logout();
    router.push('/login');
  };

  const isSuper = currentUser.role === 'SUPER_ADMIN';
  const isOwner = currentUser.role === 'STORE_OWNER';
  const isStaff = currentUser.role === 'STORE_STAFF';
  const isCust = currentUser.role === 'CUSTOMER';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slateDark-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-8 flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
            <StoreIcon className="w-4 h-4" />
          </div>
          <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
            مَزن <span className="text-[10px] text-brand-600 font-bold">الملف الشخصي</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            الرئيسية
          </Link>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </header>

      {/* Main Profile Grid */}
      <main className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-right flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-right">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
              alt={currentUser.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-lg bg-slate-100"
            />
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {currentUser.name}
                </h1>
                
                {isSuper && (
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold text-[10px] border border-brand-200">
                    👑 مدير عام
                  </span>
                )}
                {isOwner && (
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-bold text-[10px] border border-teal-200">
                    💼 مالك متجر
                  </span>
                )}
                {isStaff && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] border border-amber-200">
                    🛠️ {currentUser.staffTitle || 'موظف متجر'}
                  </span>
                )}
                {isCust && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px] border border-purple-200">
                    🛍️ عميل مشتري
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-500 flex flex-wrap items-center justify-center sm:justify-start gap-3 font-mono">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {currentUser.email}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {currentUser.phone}</span>
              </div>

              {currentUser.storeName && (
                <div className="text-xs font-bold text-brand-600 flex items-center justify-center sm:justify-start gap-1 pt-1">
                  <StoreIcon className="w-3.5 h-3.5" />
                  <span>المتجر المرتبط: {currentUser.storeName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Hub Navigation Link */}
          <div className="shrink-0">
            {isSuper && (
              <Link
                href="/admin"
                className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/25 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>فتح لوحة الإدارة العليا 👑</span>
              </Link>
            )}
            {(isOwner || isStaff) && currentUser.storeSlug && (
              <Link
                href={`/merchant/${currentUser.storeSlug}`}
                className="px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/25 flex items-center gap-1.5"
              >
                <Building2 className="w-4 h-4" />
                <span>فتح لوحة تحكم المتجر 💼</span>
              </Link>
            )}
            {isCust && currentUser.storeSlug && (
              <Link
                href={`/store/${currentUser.storeSlug}`}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>تصفح المتجر والمشتريات 🛍️</span>
              </Link>
            )}
          </div>

        </div>

        {/* Edit Details & Security */}
        <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm text-right space-y-6">
          
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              تعديل البيانات الشخصية والأمان
            </h3>
            <p className="text-xs text-slate-500">تحديث بيانات الاتصال وتغيير كلمة المرور الخاصة بحسابك</p>
          </div>

          {successMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الهاتف / الواتساب:</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">تغيير كلمة المرور (اختياري):</label>
                <input
                  type="password"
                  placeholder="اتركها فارغة إذا لم ترغب في التغيير"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono outline-none"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/25 transition-all"
              >
                حفظ التعديلات ✓
              </button>
            </div>

          </form>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-slate-400">
        منصة مَزن (Mazn SaaS) - الجلسة مؤمنة بنظام التشفير السحابي
      </footer>

    </div>
  );
}
