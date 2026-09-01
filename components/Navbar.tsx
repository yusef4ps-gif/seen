'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, Menu, X, ShieldCheck, Palette, 
  User, ArrowLeft, ArrowUpRight, LogIn, ChevronDown, 
  Building2, ShoppingBag, LogOut 
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import { authEngine } from '@/lib/auth-engine';
import { User as AuthUser } from '@/lib/types';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    // Read session on mount
    const user = authEngine.getCurrentUser();
    setCurrentUser(user);
    setIsAuthLoaded(true);
  }, []);

  const handleLogout = () => {
    authEngine.logout();
    setCurrentUser(null);
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-50 w-full pt-2 sm:pt-3 px-3 sm:px-6 transition-all duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="relative flex items-center justify-between h-16 sm:h-18 px-4 sm:px-6 rounded-3xl bg-white/80 dark:bg-slateDark-900/80 backdrop-blur-xl border border-brand-500/20 shadow-lg shadow-brand-950/5 dark:shadow-black/40 transition-all">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-6">
            <BrandLogo size="md" />

            {/* Desktop Nav Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link 
                href="/" 
                className="px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-300 rounded-full transition-colors"
              >
                الرئيسية
              </Link>
              <Link 
                href="/#pricing" 
                className="px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-300 rounded-full transition-colors"
              >
                الباقات
              </Link>
              <Link 
                href="/#quiz" 
                className="px-3.5 py-2 text-xs sm:text-sm font-bold text-accent hover:text-accent-600 rounded-full transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>مرشد الباقات</span>
              </Link>
              <Link 
                href="/create-store" 
                className="px-3.5 py-2 text-xs sm:text-sm font-bold text-[#14b8a6] hover:text-[#0f2b48] dark:hover:text-[#5eead4] rounded-full transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#14b8a6]" />
                <span>إنشاء متجر</span>
              </Link>
              <Link 
                href="/#compare" 
                className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 rounded-full transition-colors"
              >
                المقارنة
              </Link>
            </nav>
          </div>

          {/* Action Area with Dynamic Role-Based Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* If Logged In as SUPER_ADMIN */}
            {currentUser?.role === 'SUPER_ADMIN' && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-black text-white bg-gradient-to-r from-red-600 to-brand-600 rounded-full shadow-md shadow-red-500/20 hover:scale-105 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>👑 الإدارة العليا</span>
              </Link>
            )}

            {/* If Logged In as STORE_OWNER or STORE_STAFF */}
            {(currentUser?.role === 'STORE_OWNER' || currentUser?.role === 'STORE_STAFF') && (
              <Link
                href={currentUser.storeSlug ? `/merchant/${currentUser.storeSlug}` : '/create-store'}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 rounded-full hover:bg-brand-100 transition-all"
              >
                <Building2 className="w-3.5 h-3.5 text-brand-600" />
                <span>لوحة متجري 🏪</span>
              </Link>
            )}

            {/* If Logged In as CUSTOMER */}
            {currentUser?.role === 'CUSTOMER' && (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 rounded-full hover:bg-purple-100 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />
                <span>حسابي وطلباتي 🛍️</span>
              </Link>
            )}

            {/* Profile Link or Login Link */}
            {currentUser ? (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 hover:bg-brand-50/70 dark:hover:bg-slate-800 rounded-full transition-all"
                title="الملف الشخصي"
              >
                <User className="w-4 h-4 text-brand-600" />
                <span className="hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 hover:bg-brand-50/70 dark:hover:bg-slate-800 rounded-full transition-all"
              >
                <LogIn className="w-4 h-4 text-brand-600" />
                <span>تسجيل الدخول</span>
              </Link>
            )}

            {/* Create Store CTA Button */}
            <Link
              href="/create-store"
              className="relative inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#0f2b48] via-[#144b7a] to-[#14b8a6] hover:from-[#143d67] hover:to-[#0d9488] rounded-full shadow-md shadow-[#0f2b48]/20 active:scale-95 transition-all group"
            >
              <Sparkles className="w-4 h-4 text-[#2dd4bf] transition-transform group-hover:rotate-12" />
              <span>أنشئ متجرك 🚀</span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-2xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="القائمة"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-brand-600" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-2 p-4 rounded-3xl bg-white/95 dark:bg-slateDark-900/95 backdrop-blur-2xl border border-brand-500/20 shadow-2xl space-y-3 animate-slide-up text-right">
            
            {/* User Profile Header in Mobile Menu */}
            {currentUser && (
              <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</div>
                  <div className="text-[10px] text-brand-600 font-medium">{currentUser.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950 text-red-600 text-[10px] font-bold"
                >
                  خروج
                </button>
              </div>
            )}

            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-2xl text-xs font-bold hover:bg-brand-50 dark:hover:bg-slate-800"
            >
              الرئيسية
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-2xl text-xs font-bold hover:bg-brand-50 dark:hover:bg-slate-800"
            >
              الباقات والأسعار
            </Link>
            <Link
              href="/#quiz"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-2xl text-xs font-bold text-accent hover:bg-accent-50/50"
            >
              ✨ مرشد الباقات الذكي (Quiz)
            </Link>

            <Link
              href="/create-store"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-2xl text-xs font-bold bg-brand-50 dark:bg-brand-950 text-brand-600"
            >
              🚀 معالج إنشاء متجر جديد
            </Link>

            {/* Smart Role Mobile Links */}
            {currentUser?.role === 'SUPER_ADMIN' && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-3 rounded-2xl text-xs font-bold bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-200"
              >
                👑 بوابة الإدارة العليا (Super Admin)
              </Link>
            )}

            {(currentUser?.role === 'STORE_OWNER' || currentUser?.role === 'STORE_STAFF') && (
              <Link
                href={currentUser.storeSlug ? `/merchant/${currentUser.storeSlug}` : '/create-store'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-3 rounded-2xl text-xs font-bold bg-brand-50 text-brand-600"
              >
                🏪 لوحة تحكم متجري
              </Link>
            )}

            {!currentUser ? (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-3 rounded-2xl text-xs font-bold hover:bg-brand-50"
              >
                🔑 بوابة تسجيل الدخول
              </Link>
            ) : (
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block p-3 rounded-2xl text-xs font-bold hover:bg-brand-50"
              >
                👤 حسابي وإعداداتي
              </Link>
            )}

          </div>
        )}

      </div>
    </header>
  );
}
