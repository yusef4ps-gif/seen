'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import BrandLogo from '@/components/BrandLogo';
import { 
  Store as StoreIcon, Sparkles, ArrowLeft, ArrowUpRight, Check, 
  ShieldCheck, Palette, ShoppingBag, TrendingUp, DollarSign, 
  Users, RefreshCw, Smartphone, Globe, CreditCard, Truck, 
  Lock, MessageCircle, Bot, Zap, Crown, Rocket, Brush, 
  Database, Code2, GraduationCap, ChevronRight, HelpCircle, 
  CheckCircle2, Building2, Package, Layers, Search, MapPin, Phone, Mail, 
  Clock, Facebook, Youtube, Instagram, Twitter, Linkedin
} from 'lucide-react';
import { storeEngine } from '@/lib/store-engine';
import { Store, SubscriptionPlan, PlatformStats } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import { getSiteContentAction } from '@/app/actions/content';
import { defaultComparisonData, ComparisonCategory } from '@/lib/data/comparison';

export default function HomePage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);

  // Active Tab inside the 3D Mockup Frame
  const [activeMockupTab, setActiveMockupTab] = useState<'dashboard' | 'products' | 'storefront' | 'theme'>('dashboard');

  // Interactive Pricing Quiz State
  const [quizStep1, setQuizStep1] = useState<'growing' | 'scale' | null>(null);
  const [quizStep2, setQuizStep2] = useState<'essentials' | 'growth' | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);



  // Dynamic Site Content
  const [content, setContent] = useState<Record<string, string>>({});

  useEffect(() => {
    setStores(storeEngine.getStores());
    setStats(storeEngine.getPlatformStats());
    
    // Fetch dynamic texts
    getSiteContentAction().then(res => {
      if (res.success && res.dictionary) {
        setContent(res.dictionary);
      }
    });
  }, []);

  const t = (key: string, fallback: string) => content[key] || fallback;

  // Derive comparison table data
  let compareData: ComparisonCategory[] = defaultComparisonData;
  if (content['comparison_table_data']) {
    try {
      compareData = JSON.parse(content['comparison_table_data']);
    } catch (e) {
      console.error('Failed to parse comparison data', e);
    }
  }

  // Compute recommended plan from quiz
  const recommendedPlan = (quizStep1 === 'scale' || quizStep2 === 'growth') 
    ? 'pro' 
    : (quizStep2 === 'essentials' && quizStep1 === 'growing') 
      ? 'starter' 
      : 'marketing';

  return (
    <div className="min-h-screen bg-[#f6fafb] dark:bg-[#0a1317] text-slate-900 dark:text-slate-100 font-sans relative overflow-x-hidden selection:bg-brand-500 selection:text-white">
      
      {/* Soft Clean Background with Animated Blobs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#f6fafb] dark:bg-[#0a1317]">
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#0f2b48 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        {/* Soft Animated Glows */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-brand-500/10 dark:bg-brand-500/15 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating Navbar */}
      <Navbar />

      <main className="relative z-10">
        
        {/* ========================================================================= */}
        {/* 🚀 1. HERO SECTION WITH 3D INTERACTIVE DASHBOARD VIEWPORT */}
        {/* ========================================================================= */}
        <section className="relative pt-10 sm:pt-16 pb-20 sm:pb-28 px-4 sm:px-6 max-w-7xl mx-auto text-center">
          
          {/* Eyebrow Floating Badge with Official 3D SEEN Emblem */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 mb-3 drop-shadow-2xl animate-float">
              <img
                src="/seen-logo-transparent.png"
                alt="شعار سِين الرسمي"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#14b8a6]/25 bg-[#14b8a6]/10 dark:bg-[#14b8a6]/15 text-[#0f2b48] dark:text-[#5eead4] text-xs font-bold shadow-sm backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-[#14b8a6] animate-spin" style={{ animationDuration: '8s' }} />
              <span>{t('hero_eyebrow', 'منصة سِين (SEEN) • متجرك بضغطة زر واحدة في اليمن')}</span>
            </div>
          </div>

          {/* Main Hero Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-[#0f2b48] dark:text-white max-w-4xl mx-auto text-balance">
            {t('hero_title_part1', 'جاهز تنظم تجارتك الإلكترونية وتبدأ')}{' '}
            <span className="relative inline-block mt-1 sm:mt-0">
              <span className="bg-gradient-to-r from-[#0f2b48] via-[#14b8a6] to-[#2dd4bf] dark:from-[#5eead4] dark:via-[#2dd4bf] dark:to-[#38bdf8] bg-clip-text text-transparent drop-shadow-sm">
                {t('hero_title_part2', 'مرحلة التوسع والنمو')}
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
            {t('hero_subtitle', 'منصة سِين (SEEN) السحابية المتكاملة تمكنك من إطلاق متجر فاخر بهوية بصرية استثنائية، وإدارة المنتجات والمخزون، مع دعم أصيل لمحفظات الدفع والشحن في عدن وصنعاء.')}
          </p>

          {/* Hero CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/create-store"
              className="px-7 py-3.5 rounded-full bg-gradient-to-r from-[#0f2b48] via-[#144b7a] to-[#14b8a6] hover:from-[#143d67] hover:to-[#0d9488] text-white text-xs sm:text-sm font-black shadow-xl shadow-[#0f2b48]/25 hover:shadow-[#0f2b48]/40 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#2dd4bf]" />
              <span>أنشئ متجرك مجاناً في دقيقة 🚀</span>
            </Link>

            <Link
              href="/create-store"
              className="px-6 py-3.5 rounded-full bg-white dark:bg-slateDark-900 hover:bg-brand-50/60 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs sm:text-sm font-bold border border-brand-500/25 shadow-md shadow-black/5 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Palette className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              <span>استوديو تخصيص القوالب التفاعلي 🎨</span>
            </Link>
          </div>

          {/* Live Ecosystem Stats Strip */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
              <span>بدون أي عمولة على مبيعاتك</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
              <span>دعم المحافظ اليمنية والكريمي</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
              <span>أتمتة الطلب عبر WhatsApp</span>
            </span>
          </div>

          {/* ========================================================================= */}
          {/* 💻 LUXURIOUS DUAL MOCKUP (DESKTOP + MOBILE) */}
          {/* ========================================================================= */}
          <div className="mt-16 sm:mt-24 max-w-6xl mx-auto relative px-4">
            
            {/* --- Desktop Mockup (Background) --- */}
            <div className="relative w-full max-w-4xl mx-auto md:ml-auto md:mr-12 rounded-2xl sm:rounded-[2rem] p-[1px] bg-gradient-to-br from-slate-300 via-slate-100 to-slate-300 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 shadow-[0_40px_100px_-20px_rgba(15,43,72,0.2)] dark:shadow-[0_40px_100px_-20px_rgba(20,184,166,0.1)] overflow-hidden z-10 animate-fade-in-up group">
              <div className="bg-white/95 dark:bg-[#071118]/95 backdrop-blur-3xl rounded-2xl sm:rounded-[2rem] w-full h-full overflow-hidden flex flex-col">
                {/* Window Header */}
                <div className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60 px-5 py-3.5 flex items-center justify-between backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/90 shadow-[0_0_8px_rgba(248,113,113,0.4)]" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.4)]" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/90 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                  </div>
                  <div className="px-6 py-1.5 rounded-full bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-700/50 text-[10px] sm:text-xs font-mono text-slate-500/80 flex items-center gap-2 shadow-inner flex-1 max-w-sm justify-center mx-4">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    seen.store/dashboard
                  </div>
                  <div className="w-16"></div>
                </div>
                
                {/* Desktop UI Content */}
                <div className="p-4 sm:p-8 bg-slate-50/30 dark:bg-transparent flex flex-col md:flex-row gap-8 min-h-[420px]">
                   {/* Sidebar Skeleton */}
                   <div className="hidden md:flex flex-col gap-4 w-48 shrink-0 border-l border-slate-200/50 dark:border-slate-800/50 pl-6">
                     <div className="h-10 rounded-xl bg-gradient-to-r from-brand-100 to-brand-50 dark:from-brand-900/40 dark:to-brand-800/20 border border-brand-200/50 dark:border-brand-800/50 w-full mb-4 shadow-sm" />
                     <div className="h-4 rounded-full bg-slate-200/70 dark:bg-slate-800/70 w-3/4" />
                     <div className="h-4 rounded-full bg-slate-200/70 dark:bg-slate-800/70 w-full" />
                     <div className="h-4 rounded-full bg-slate-200/70 dark:bg-slate-800/70 w-5/6" />
                     <div className="h-4 rounded-full bg-slate-200/70 dark:bg-slate-800/70 w-2/3" />
                   </div>
                   
                   {/* Main Content Area */}
                   <div className="flex-1 space-y-8">
                     {/* Header */}
                     <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-5">
                       <div className="text-right">
                         <div className="text-xl font-black text-slate-800 dark:text-white tracking-tight">إدارة المتجر</div>
                         <div className="text-xs text-slate-500 mt-1 font-medium">إلقاء نظرة عامة على أداء متجرك اليوم</div>
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-100 to-emerald-100 dark:from-brand-900/50 dark:to-emerald-900/50 border border-brand-200/50 dark:border-brand-800/50 flex items-center justify-center shadow-inner">
                         <StoreIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                       </div>
                     </div>

                     {/* Stats Cards */}
                     <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                       <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-md text-right group-hover:-translate-y-1 transition-transform duration-500">
                         <div className="text-xs text-slate-500 font-bold mb-3">الإيرادات الصافية</div>
                         <div className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent font-mono">1,165,896 ر.ي</div>
                         <div className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center justify-end gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md w-fit ml-auto"><ArrowUpRight className="w-3 h-3" /> +155.5%</div>
                       </div>
                       <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-md text-right group-hover:-translate-y-1 transition-transform duration-500 delay-75">
                         <div className="text-xs text-slate-500 font-bold mb-3">إجمالي العملاء</div>
                         <div className="text-2xl font-black text-slate-800 dark:text-white font-mono">26</div>
                         <div className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center justify-end gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md w-fit ml-auto"><ArrowUpRight className="w-3 h-3" /> +100.0%</div>
                       </div>
                       <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-md text-right hidden lg:block group-hover:-translate-y-1 transition-transform duration-500 delay-150">
                         <div className="text-xs text-slate-500 font-bold mb-3">الطلبات</div>
                         <div className="text-2xl font-black text-slate-800 dark:text-white font-mono">51</div>
                         <div className="text-[10px] font-bold text-emerald-500 mt-2 flex items-center justify-end gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md w-fit ml-auto"><ArrowUpRight className="w-3 h-3" /> +100.0%</div>
                       </div>
                     </div>

                     {/* Setup Progress */}
                     <div className="p-6 rounded-2xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 shadow-sm text-right relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                       <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center justify-end gap-2 mb-5 relative z-10">
                         إطلاق متجرك الإلكتروني <span className="animate-pulse">🚀</span>
                       </h4>
                       <div className="space-y-4 relative z-10">
                         {[
                           { title: 'هوية المتجر', desc: 'قم بوضع شعار متجرك، وإعداد الألوان والخطوط.' },
                           { title: 'طرق الدفع', desc: 'قم بإعداد طرق استلام المدفوعات (الكريمي، المحافظ).' },
                           { title: 'إعدادات الشحن', desc: 'قم بتهيئة خيارات الشحن والتوصيل الداخلي.' },
                         ].map((step, i) => (
                           <div key={i} className="flex items-center justify-end gap-4 group/step cursor-default">
                             <div className="text-right">
                               <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover/step:text-brand-600 dark:group-hover/step:text-brand-400 transition-colors">{step.title}</div>
                               <div className="text-[10px] text-slate-500 mt-0.5">{step.desc}</div>
                             </div>
                             <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
                               <Check className="w-3.5 h-3.5" />
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                </div>
              </div>
            </div>

            {/* --- Mobile Mockup (Foreground/Left Overlap) --- */}
            <div className="absolute top-10 lg:-left-4 xl:-left-12 left-0 w-[240px] sm:w-[280px] h-[500px] sm:h-[580px] rounded-[2.5rem] sm:rounded-[3.2rem] p-[1.5px] bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 dark:from-slate-600 dark:via-slate-800 dark:to-slate-700 shadow-[0_40px_80px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_80px_rgba(0,0,0,0.5)] z-30 hidden md:flex flex-col animate-float hover:scale-[1.02] transition-transform duration-500">
               <div className="w-full h-full bg-[#f8fafc] dark:bg-[#0a1118] rounded-[2.4rem] sm:rounded-[3.1rem] overflow-hidden relative flex flex-col border-[6px] border-slate-900 dark:border-black">
                 {/* Dynamic Island / Notch */}
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 dark:bg-black rounded-b-3xl z-40 flex justify-center items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-700 dark:bg-slate-800" />
                   <div className="w-1.5 h-1.5 rounded-full bg-slate-700 dark:bg-slate-800" />
                 </div>
                 
                 {/* Mobile Screen Content */}
                 <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pt-10 text-right bg-white dark:bg-[#0a1118]">
                   {/* Mobile Header */}
                   <div className="px-5 flex items-center justify-between mb-5">
                     <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700/50 shadow-sm">
                       <span className="text-[11px]">📞</span>
                     </div>
                     <div className="font-black text-sm text-slate-800 dark:text-white tracking-tight">متجرك</div>
                   </div>
                   
                   {/* Search Bar */}
                   <div className="px-5 mb-5">
                     <div className="w-full h-11 rounded-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-end px-4 text-xs text-slate-400 font-medium shadow-inner">
                       <span className="opacity-70">...ابحث عن منتجاتك المفضلة</span>
                     </div>
                   </div>
                   
                   {/* Banner Slider */}
                   <div className="px-5 mb-6">
                     <div className="w-full h-36 rounded-[1.25rem] bg-gradient-to-r from-emerald-600 to-teal-500 overflow-hidden relative shadow-md shadow-emerald-500/20" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400)', backgroundSize: 'cover' }}>
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                       <div className="absolute inset-0 p-4 flex flex-col justify-end items-end text-white text-right">
                         <h3 className="font-black text-lg mb-0.5 text-white drop-shadow-md">ساعات فاخرة</h3>
                         <p className="text-[10px] mb-3 text-slate-200 font-medium">دقة متناهية وفخامة تليق بمعصمك</p>
                         <button className="px-4 py-2 bg-brand-500 text-white text-[10px] font-black rounded-xl w-fit shadow-lg shadow-brand-500/30">تسوق الآن</button>
                       </div>
                     </div>
                   </div>

                   {/* Categories */}
                   <div className="px-5 mb-6 flex justify-end gap-3 overflow-x-auto">
                     {['ملابس', 'عطور', 'تجميل', 'حقائب'].reverse().map((cat, i) => (
                       <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                         <div className="w-14 h-14 rounded-[1.1rem] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center p-0.5">
                           <img src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=50" className="w-full h-full object-cover rounded-2xl" alt="" />
                         </div>
                         <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                       </div>
                     ))}
                   </div>

                   {/* Flash Sale */}
                   <div className="px-5 pb-5">
                     <div className="flex items-center justify-between mb-4 flex-row-reverse">
                       <h3 className="font-black text-sm text-slate-800 dark:text-white">عروض محدودة 🔥</h3>
                       <div className="text-red-600 dark:text-red-400 text-[10px] font-black px-2.5 py-1 bg-red-50 dark:bg-red-500/10 rounded-lg">04:18:06</div>
                     </div>
                     <div className="grid grid-cols-2 gap-3.5">
                       <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-700/50 shadow-sm relative">
                         <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md z-10 shadow-sm">خصم 20%</div>
                         <div className="w-full h-28 bg-slate-100 dark:bg-slate-700 rounded-xl mb-2.5 overflow-hidden">
                           <img src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                         </div>
                         <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mb-0.5">عطر كلاسيك</div>
                         <div className="text-brand-600 dark:text-brand-400 text-xs font-black">12,500 ر.ي</div>
                       </div>
                       <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-2.5 border border-slate-100 dark:border-slate-700/50 shadow-sm relative">
                         <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md z-10 shadow-sm">خصم 15%</div>
                         <div className="w-full h-28 bg-slate-100 dark:bg-slate-700 rounded-xl mb-2.5 overflow-hidden">
                           <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                         </div>
                         <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mb-0.5">فستان سهرة</div>
                         <div className="text-brand-600 dark:text-brand-400 text-xs font-black">45,000 ر.ي</div>
                       </div>
                     </div>
                   </div>
                 </div>
                 
                 {/* Bottom Navigation */}
                 <div className="h-16 bg-white/90 dark:bg-[#0a1118]/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-around px-2 text-[10px] text-slate-400 font-bold z-50 flex-row-reverse pb-1">
                   <div className="flex flex-col items-center gap-1 text-brand-600"><StoreIcon className="w-5 h-5" />الرئيسية</div>
                   <div className="flex flex-col items-center gap-1"><Layers className="w-5 h-5" />الأقسام</div>
                   <div className="flex flex-col items-center gap-1"><ShoppingBag className="w-5 h-5" />السلة</div>
                   <div className="flex flex-col items-center gap-1"><Users className="w-5 h-5" />حسابي</div>
                 </div>
               </div>
            </div>

            {/* Floating Badges (Premium Interactive Elements) */}
            <div className="absolute top-10 left-[28%] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-700 shadow-2xl shadow-brand-500/10 rounded-[1.25rem] p-3 items-center gap-3 z-40 animate-float hidden md:flex hover:scale-105 transition-transform duration-300 cursor-default" style={{ animationDelay: '1s' }}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-500 to-emerald-400 text-white flex items-center justify-center shrink-0 shadow-inner">
                <Package className="w-4 h-4" />
              </div>
              <div className="text-right pr-1">
                <div className="text-xs font-black text-slate-800 dark:text-white tracking-tight">طلب جديد!</div>
                <div className="text-[10px] text-slate-500 font-medium">من ليلى الحمدي - 18,500 ر.ي</div>
              </div>
            </div>

            <div className="absolute bottom-16 right-[-10px] lg:right-[-30px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white dark:border-slate-700 shadow-2xl shadow-emerald-500/10 rounded-[1.25rem] p-3 items-center gap-3 z-40 animate-float hidden md:flex hover:scale-105 transition-transform duration-300 cursor-default" style={{ animationDelay: '2s' }}>
               <div className="text-right pl-1">
                <div className="text-[10px] text-slate-500 font-medium mb-0.5">إيراد اليوم</div>
                <div className="text-sm font-black bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent font-mono tracking-tight">187,500 ر.ي</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shrink-0 shadow-inner">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

          </div>

        </section>

        {/* ========================================================================= */}
        {/* 💳 2. INTERACTIVE PRICING PLANS (التجارية - التسويقية - الاحترافية) */}
        {/* ========================================================================= */}
        <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 max-w-7xl mx-auto text-right">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 text-brand-700 dark:text-brand-300 text-xs font-bold mb-3">
              <CreditCard className="w-3.5 h-3.5 text-accent" />
              <span>{t('pricing_badge', 'خطط الأسعار الشفافة')}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('pricing_title', 'خطط مرنة مصممة خصيصاً لتناسب حجم أعمالك وتنمو معك')}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-500">
              {t('pricing_subtitle', 'اختر الباقة المثالية لمتجرك وابدأ البيع فوراً. بدون أي رسوم خفية أو عقود معقدة.')}
            </p>
          </div>

          {/* 3 Main Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            
            {/* 1. الباقة التجارية */}
            <div className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-slateDark-900 border transition-all duration-300 flex flex-col justify-between ${
              recommendedPlan === 'starter'
                ? 'border-brand-500 ring-2 ring-brand-500/40 shadow-xl'
                : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/40'
            }`}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">الباقة التجارية</h3>
                  <p className="text-xs text-slate-500 mt-1">تسهل لك طريق البداية لرحلة التجارة الإلكترونية</p>
                </div>

                <div className="py-3 border-y border-slate-100 dark:border-slate-800">
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {t('plan_starter_price', '36,000')} <span className="text-xs font-normal text-slate-500">{t('plan_starter_currency', 'ر.ي / 258 ر.س')}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-bold mt-1">لمدة ثلاثة أشهر</div>
                </div>

                <Link
                  href="/create-store"
                  className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold text-center block transition-all shadow-xs"
                >
                  ابدأ الآن 🚀
                </Link>

                <ul className="space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>عدد لا محدود من المنتجات</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>عدد لا محدود من الطلبات والعملاء</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>تخصيص المتجر عبر محرر القوالب الذكي</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>الدفع اليدوي وإدارة التحويلات</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>تقارير الأداء والمبيعات الأساسية</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 2. الباقة التسويقية */}
            <div className={`p-6 sm:p-8 rounded-3xl bg-white dark:bg-slateDark-900 border transition-all duration-300 flex flex-col justify-between ${
              recommendedPlan === 'marketing'
                ? 'border-brand-500 ring-2 ring-brand-500/40 shadow-xl'
                : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/40'
            }`}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">الباقة التسويقية</h3>
                  <p className="text-xs text-slate-500 mt-1">تساعدك على تنظيم تجارتك وتوسيع قاعدة مبيعاتك</p>
                </div>

                <div className="py-3 border-y border-slate-100 dark:border-slate-800">
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {t('plan_marketing_price', '72,000')} <span className="text-xs font-normal text-slate-500">{t('plan_marketing_currency', 'ر.ي / 518 ر.س')}</span>
                  </div>
                  <div className="text-xs text-slate-400 font-bold mt-1">لمدة ستة أشهر</div>
                </div>

                <Link
                  href="/create-store"
                  className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold text-center block transition-all shadow-md shadow-brand-600/25"
                >
                  انطلق بالتسويق 🚀
                </Link>

                <ul className="space-y-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 pt-2">
                  <li className="flex items-center gap-2 font-bold text-brand-600 dark:text-brand-400">
                    <span>✓ كل مزايا الباقة التجارية بالإضافة إلى:</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>ربط الدومين المخصص (Custom Domain)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>تطبيق ويب خاص للمتجر (PWA)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>بوابات الدفع عبر المحافظ الإلكترونية المحلية</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>الربط المباشر مع شركات الشحن والتوصيل</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>إدارة القسائم وكوبونات الخصم الترويجية</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 3. الباقة الاحترافية (الأكثر طلباً) */}
            <div className={`relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#0f2b48] via-[#0b1f35] to-[#061220] text-white border-2 border-[#2dd4bf] shadow-2xl shadow-[#14b8a6]/20 flex flex-col justify-between ${
              recommendedPlan === 'pro' ? 'ring-4 ring-[#2dd4bf]/40' : ''
            }`}>
              
              {/* Glowing Coral Badge */}
              <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-accent text-white text-[11px] font-black shadow-lg shadow-accent/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>الأكثر طلباً ونمواً 🔥</span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span>الباقة الاحترافية</span>
                    <Crown className="w-4 h-4 text-amber-400" />
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">تنقلك إلى النمو والتوسع والأتمتة الكاملة</p>
                </div>

                <div className="py-3 border-y border-slate-700">
                  <div className="text-3xl font-black text-white font-mono">
                    {t('plan_pro_price', '144,000')} <span className="text-xs font-normal text-slate-300">{t('plan_pro_currency', 'ر.ي / 1,035 ر.س')}</span>
                  </div>
                  <div className="text-xs text-accent font-bold mt-1">لمدة سنة كاملة (أوفر خطة)</div>
                </div>

                <Link
                  href="/create-store"
                  className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-brand-900 text-xs font-black text-center block transition-all shadow-lg active:scale-95"
                >
                  أنمو واشترك الآن 🌟
                </Link>

                <ul className="space-y-2.5 text-xs font-medium text-slate-200 pt-2">
                  <li className="flex items-center gap-2 font-bold text-accent">
                    <span>★ كل مزايا التجارية + التسويقية +:</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>نظام الطلب واستعادة السلات عبر WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>محرك المصارفة وتعدد العملات (عدن / صنعاء / SAR)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>مستشار الذكاء الاصطناعي والتوصيات الذكية</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>إضافة حسابات الموظفين وتفويض الصلاحيات (RBAC)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>إضافة حسابات مناديب التوصيل وإسناد الشحنات</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-accent shrink-0" />
                    <span>التكامل المباشر مع WhatsApp API وخدمات ميتا</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>

        </section>

        {/* ========================================================================= */}
        {/* 🧭 3. INTERACTIVE PRICING QUIZ ("أيّ باقة تناسبني؟") */}
        {/* ========================================================================= */}
        <section id="quiz" className="py-16 sm:py-20 px-4 sm:px-6 max-w-4xl mx-auto text-right">
          <div className="rounded-3xl bg-white/90 dark:bg-slateDark-900/90 backdrop-blur-md border border-brand-500/20 p-6 sm:p-8 shadow-xl">
            
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-accent mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('quiz_badge', 'مرشد الباقات السريع')}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {t('quiz_title', 'أيّ باقة تناسب حجم تجارتك؟ 🤔')}
              </h3>
              <p className="text-xs text-slate-500">{t('quiz_subtitle', 'أجب على سؤالين وسنرشّح لك الباقة الأنسب فورياً')}</p>
            </div>

            <div className="space-y-6 text-xs font-bold">
              
              {/* Question 1 */}
              <div>
                <div className="text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">1</span>
                  <span>أين متجرك الآن وحجم منتجاتك؟</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setQuizStep1('growing')}
                    className={`p-3.5 rounded-2xl border text-right transition-all ${
                      quizStep1 === 'growing'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div>متجر ناشئ أو متوسط (١٠ إلى ١٠٠ منتج)</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">أنوي البداية والنمو المنظم</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuizStep1('scale')}
                    className={`p-3.5 rounded-2xl border text-right transition-all ${
                      quizStep1 === 'scale'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div>متجر كبير وفريق متعدد (أكثر من ١٠٠ منتج)</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">أحتاج موظفين وأتمتة واتساب كاملة</div>
                  </button>
                </div>
              </div>

              {/* Question 2 */}
              <div>
                <div className="text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px]">2</span>
                  <span>ما هو الأهم بالنسبة لك حالياً؟</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setQuizStep2('essentials')}
                    className={`p-3.5 rounded-2xl border text-right transition-all ${
                      quizStep2 === 'essentials'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div>هوية ودفع محلي وشحن سريع</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">نطاق مخصص + محافظ محلية + شحن</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuizStep2('growth')}
                    className={`p-3.5 rounded-2xl border text-right transition-all ${
                      quizStep2 === 'growth'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <div>أدوات تسويق متقدمة وأتمتة WhatsApp وموظفين</div>
                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">استعادة السلات + مناديب الشحن + الذكاء الاصطناعي</div>
                  </button>
                </div>
              </div>

              {/* Dynamic Recommendation Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600 to-accent text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div>
                  <div className="text-[11px] text-white/80">الباقة المرشحة الأنسب لمتجرك بناءً على إجابتك:</div>
                  <div className="text-base font-black">
                    {recommendedPlan === 'pro' ? '👑 الباقة الاحترافية (السنة الكاملة)' : recommendedPlan === 'marketing' ? '🚀 الباقة التسويقية (6 أشهر)' : '📦 الباقة التجارية (3 أشهر)'}
                  </div>
                </div>
                <Link
                  href="/create-store"
                  className="px-5 py-2 rounded-xl bg-white text-brand-900 font-black text-xs hover:bg-slate-100 transition-all shrink-0"
                >
                  اختر هذه الباقة وانطلق 🚀
                </Link>
              </div>

            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 🛠️ 4. CUSTOM ADD-ON SERVICES (خدمات مخصصة) */}
        {/* ========================================================================= */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto text-right">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-accent mb-2">
              <Package className="w-3.5 h-3.5" />
              <span>{t('services_badge', 'خدمات إضافية عند الطلب')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {t('services_title', 'تحتاج خدمات خاصة تتجاوز باقة الاشتراك؟')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('services_subtitle', 'تصميم هوية مخصصة، نقل بياناتك، أو تطوير برمجيات خاصة بأسعار واضحة وشفافة')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'تصميم قالب مخصص', desc: 'قالب فريد بهويتك الكاملة يصممه خبراؤنا بناءً على طلبك ويسلّم جاهزاً خلال أسبوعين.' },
              { title: 'ساعات تطوير مخصصة', desc: 'ربط أنظمة محاسبية، تكاملات مع بوابات دفع بنكية خاصة، وتطوير خصائص حصرية بالساعة.' },
              { title: 'تدريب فريقك', desc: 'جلسات تدريبية مباشرة ومكثفة لفريق عملك على إدارة المخازن والشحن وتقارير الأداء.' },
              { title: '', desc: '' },
              { title: '', desc: '' },
              { title: '', desc: '' }
            ].map((defaultItem, idx) => {
              const num = idx + 1;
              const title = t(`service_title${num}`, defaultItem.title);
              const desc = t(`service_desc${num}`, defaultItem.desc);
              
              if (!title) return null;
              
              // Assign a different icon/color set based on the index to keep it vibrant
              const themes = [
                { icon: Brush, colors: 'bg-brand-50 dark:bg-brand-950 text-brand-600', link: 'text-brand-600' },
                { icon: Code2, colors: 'bg-teal-50 dark:bg-teal-950 text-teal-600', link: 'text-teal-600' },
                { icon: GraduationCap, colors: 'bg-purple-50 dark:bg-purple-950 text-purple-600', link: 'text-purple-600' },
                { icon: Database, colors: 'bg-accent-50 dark:bg-accent-950 text-accent', link: 'text-accent' },
                { icon: Sparkles, colors: 'bg-amber-50 dark:bg-amber-950 text-amber-500', link: 'text-amber-500' },
                { icon: Zap, colors: 'bg-rose-50 dark:bg-rose-950 text-rose-500', link: 'text-rose-500' },
              ];
              const theme = themes[idx % themes.length];
              const Icon = theme.icon;

              return (
                <div key={num} className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${theme.colors}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                  <Link href="/create-store" className={`text-xs font-bold hover:underline flex items-center gap-1 pt-2 ${theme.link}`}>
                    <span>طلب الخدمة</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>

        </section>

        {/* ========================================================================= */}
        {/* ❓ 4.5 FAQ SECTION (الأسئلة الشائعة) */}
        {/* ========================================================================= */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 max-w-3xl mx-auto text-right">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-3">
              {t('faq_title', 'أسئلة شائعة')}
            </h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              {t('faq_subtitle', 'ستجد معظم أسئلتك وتساؤلاتك هنا. إن لم تجد سؤالك في هذه القائمة رجاء لا تتردد في الاتصال بنا')}
            </p>
          </div>

          <div className="space-y-3">
            {[
              { q: 'ما هي منصة سِين؟', a: 'سِين هي منصة تجارة إلكترونية سحابية متكاملة تتيح لك إنشاء متجرك الإلكتروني الخاص في اليمن بسهولة، وإدارته بشكل كامل دون الحاجة لأي خبرة برمجية.' },
              { q: 'ما هي ميزات منصة سِين؟', a: 'توفر المنصة تصميمات جاهزة، إدارة للمخزون والطلبات، نظام تسعير متعدد العملات (صنعاء، عدن، سعودي)، وربط مع بوابات الدفع المحلية مثل الكريمي وجوالي وون كاش.' },
              { q: 'كيف يمكنني إنشاء حساب ومتجر؟', a: 'يمكنك البدء فوراً بالنقر على "أنشئ متجرك مجاناً" وتعبئة بياناتك الأساسية، وسيتم تجهيز متجرك وإطلاقه خلال دقائق معدودة.' },
              { q: 'هل يمكنني ربط طرق دفع محلية يمنية؟', a: 'نعم، المنصة مجهزة للربط المباشر مع أشهر طرق الدفع والمحافظ الإلكترونية في اليمن لتسهيل استلام أموالك من عملائك.' },
              { q: 'هل أستطيع استخدام اسم نطاق (Domain) خاص بي؟', a: 'بالتأكيد، يمكنك في الباقات المتقدمة ربط متجرك باسم نطاق خاص بك (مثل www.yourstore.com) لتعزيز علامتك التجارية.' },
              { q: 'هل تأخذ المنصة عمولة على المبيعات؟', a: 'لا، منصة سِين لا تفرض أي عمولات خفية على مبيعاتك. أنت تدفع فقط قيمة الاشتراك الشهري أو السنوي للباقة التي تختارها.' },
              { q: 'ما هي وسائل الدفع المتاحة للاشتراك في المنصة؟', a: 'نوفر خيارات دفع متعددة تناسب الجميع في اليمن، بما في ذلك الحوالات البنكية المباشرة عبر الكريمي، القطيبي، أو عبر المحافظ الإلكترونية.' }
            ].map((defaultItem, index) => {
              const num = index + 1;
              const q = t(`faq_q${num}`, defaultItem.q);
              const a = t(`faq_a${num}`, defaultItem.a);
              if (!q || !a) return null;
              
              const isOpen = openFaq === num;
              
              return (
                <div key={num} className="border-b border-slate-200 dark:border-slate-800 last:border-0 pb-1">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : num)}
                    className="w-full py-4 flex items-center justify-between text-right hover:text-brand-600 transition-colors"
                  >
                    <span className="font-bold text-slate-900 dark:text-white">{q}</span>
                    <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-600' : 'text-slate-400'}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <p className="text-sm text-slate-500 leading-relaxed pr-2">
                      {a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="https://wa.me/967777777777"
              target="_blank"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-xl hover:shadow-2xl transition-all"
            >
              <span>إتصل بنا</span>
            </Link>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 🎨 4.5 DYNAMIC THEMES SHOWCASE */}
        {/* ========================================================================= */}
        <section id="themes" className="py-20 sm:py-28 px-4 sm:px-6 max-w-7xl mx-auto text-right">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold mb-4">
              <Palette className="w-4 h-4" />
              <span>مكتبة القوالب</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6">
              قوالب <span className="text-brand-600 dark:text-brand-400">احترافية</span> جاهزة للعربية
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              قوالب مصمّمة للسوق العربي — متجاوبة مع كل الأجهزة، داعمة للـ RTL أصلياً، وجاهزة للتخصيص بضغطة زر.
            </p>

            {/* Stats Strip */}
            <div className="flex flex-wrap items-center justify-center divide-x divide-x-reverse divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm max-w-3xl mx-auto shadow-sm">
              <div className="px-6 py-4 flex-1 min-w-[120px]">
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">10ث</div>
                <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">إعداد سريع</div>
              </div>
              <div className="px-6 py-4 flex-1 min-w-[120px]">
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">100%</div>
                <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">متجاوب RTL</div>
              </div>
              <div className="px-6 py-4 flex-1 min-w-[120px]">
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">5</div>
                <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">صناعات مدعومة</div>
              </div>
              <div className="px-6 py-4 flex-1 min-w-[120px]">
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">+20</div>
                <div className="text-[10px] sm:text-xs text-slate-500 font-bold mt-1">تصميم احترافي</div>
              </div>
            </div>
          </div>

          {/* Dynamic Theme Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Theme 1: Fashion */}
            <div className="group rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md hover:shadow-xl hover:border-brand-300 dark:hover:border-brand-700 transition-all duration-300 flex flex-col">
              {/* Browser Header Mockup */}
              <div className="bg-slate-100 dark:bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              {/* Dynamic Scrolling Image Container */}
              <div className="h-[350px] overflow-hidden relative bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 cursor-pointer">
                <div className="absolute inset-0 w-full h-[800px] transition-transform duration-[4s] ease-linear group-hover:-translate-y-[calc(100%-350px)]">
                  <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=600&auto=format&fit=crop" alt="Fashion Theme" className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>
                {/* Overlay Gradient for visual depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              {/* Info */}
              <div className="p-5 text-right flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">الأزياء والموضة</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">مصمم ليدعم فلاتر المقاسات وجميع متغيرات منتجات الأزياء بشكل مثالي.</p>
                </div>
              </div>
            </div>

            {/* Theme 2: Abayas */}
            <div className="group rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md hover:shadow-xl hover:brand-300 dark:hover:border-brand-700 transition-all duration-300 flex flex-col">
              <div className="bg-slate-100 dark:bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <div className="h-[350px] overflow-hidden relative bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 cursor-pointer">
                <div className="absolute inset-0 w-full h-[800px] transition-transform duration-[4s] ease-linear group-hover:-translate-y-[calc(100%-350px)]">
                  <img src="https://images.unsplash.com/photo-1589465885857-44edb59bbff2?q=80&w=600&auto=format&fit=crop" alt="Abayas Theme" className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              <div className="p-5 text-right flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">العبايات</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">واجهات صُممت لعرض منتجات العبايات بشكل جذاب ومساحات واسعة للصور.</p>
                </div>
              </div>
            </div>

            {/* Theme 3: Beauty */}
            <div className="group rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-md hover:shadow-xl hover:brand-300 dark:hover:border-brand-700 transition-all duration-300 flex flex-col">
              <div className="bg-slate-100 dark:bg-slate-900 px-4 py-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <div className="h-[350px] overflow-hidden relative bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 cursor-pointer">
                <div className="absolute inset-0 w-full h-[800px] transition-transform duration-[4s] ease-linear group-hover:-translate-y-[calc(100%-350px)]">
                  <img src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=600&auto=format&fit=crop" alt="Cosmetics Theme" className="w-full h-full object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              <div className="p-5 text-right flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white mb-1">العناية والتجميل</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">صمم خصيصاً لمجال العناية والتجميل لإبراز تفاصيل المنتجات والبراند.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="mt-16 text-center max-w-xl mx-auto">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="ابحث عن قالب يناسب نشاطك..." 
                  className="w-full pl-4 pr-12 py-4 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm text-right"
                />
                <div className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
             </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 📊 5. COMPLETE 27-FEATURE COMPARISON MATRIX */}
        {/* ========================================================================= */}
        <section id="compare" className="py-16 sm:py-24 px-4 sm:px-6 max-w-7xl mx-auto text-right">
          
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {t('compare_title', 'مقارنة تفصيلية شاملة لكافة الميزات')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('compare_subtitle', 'تعرف على تفاصيل كل ميزة بدقة في باقات سِين لاختيار ما يلائم طموحك التجاري')}
            </p>
          </div>

          <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0f2b48] text-white border-b border-slate-700">
                  <tr>
                    <th className="p-4 text-sm font-black">الميزة والمواصفات</th>
                    <th className="p-4 text-center text-sm font-bold">التجارية (3 أشهر)</th>
                    <th className="p-4 text-center text-sm font-bold">التسويقية (6 أشهر)</th>
                    <th className="p-4 text-center text-sm font-black text-accent bg-accent/15">الاحترافية (سنة كاملة)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {compareData.map((cat, idx) => (
                    <React.Fragment key={cat.id}>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-900 dark:text-white">
                        <td colSpan={4} className="p-3 text-[11px] text-brand-600 dark:text-brand-400">{cat.title}</td>
                      </tr>
                      {cat.features.map(feat => (
                        <tr key={feat.id}>
                          <td className="p-4">{feat.name}</td>
                          <td className={`p-4 text-center ${feat.starter === '✓' ? 'text-emerald-500 font-bold' : feat.starter === '✗' ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300 font-bold'}`}>{feat.starter}</td>
                          <td className={`p-4 text-center ${feat.marketing === '✓' ? 'text-emerald-500 font-bold' : feat.marketing === '✗' ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300 font-bold'}`}>{feat.marketing}</td>
                          <td className={`p-4 text-center bg-accent/5 ${feat.pro.includes('✓') ? 'text-emerald-500 font-bold' : feat.pro === '✗' ? 'text-slate-400' : 'text-slate-600 dark:text-slate-300 font-bold'}`}>{feat.pro}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}

                </tbody>
              </table>
            </div>
          </div>

        </section>

      </main>

      {/* ========================================================================= */}
      {/* ⚓ COMPREHENSIVE FOOTER */}
      {/* ========================================================================= */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slateDark-950/80 backdrop-blur-xl text-right pt-16 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Top Grid (Brand + Links) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            
            {/* Brand Col */}
            <div className="md:col-span-2 space-y-4">
              <BrandLogo size="lg" />
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                سِين هي منصة التجارة الإلكترونية الأفضل في اليمن لإنشاء وإدارة المتاجر الإلكترونية. وتوفر حلولاً متكاملة للدفع والشحن والتسويق لتساعدك على إدارة وتنمية تجارتك من مكان واحد دون الحاجة لخبرة برمجية.
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <HelpCircle className="w-4 h-4 text-brand-600" />
                <span>دعم فني 6 أيام/أسبوع</span>
              </div>
            </div>

            {/* Links Cols */}
            <div className="space-y-4">
              <div className="font-black text-slate-900 dark:text-white mb-2">المنصة</div>
              <ul className="space-y-3 text-sm">
                <li><Link href="/#pricing" className="text-slate-500 hover:text-brand-600 transition-colors">الباقات</Link></li>
                <li><Link href="/create-store" className="text-slate-500 hover:text-brand-600 transition-colors">إنشاء متجر</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="font-black text-slate-900 dark:text-white mb-2">تعلم</div>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="text-slate-500 hover:text-brand-600 transition-colors">المدونة</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-brand-600 transition-colors">الأسئلة الشائعة</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-brand-600 transition-colors">مركز المساعدة</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <div className="font-black text-slate-900 dark:text-white mb-2">الشركة</div>
              <ul className="space-y-3 text-sm">
                <li><Link href="#" className="text-slate-500 hover:text-brand-600 transition-colors">من نحن</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-brand-600 transition-colors">تواصل معنا</Link></li>
                <li><Link href="#" className="text-slate-500 hover:text-brand-600 transition-colors">انضم لفريقنا</Link></li>
              </ul>
            </div>

          </div>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Middle Grid (Customer Service + Social) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            
            {/* Customer Service Info */}
            <div className="space-y-5">
              <div className="font-black text-slate-900 dark:text-white text-lg">نقاط خدمة العملاء</div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="w-5 h-5 shrink-0 text-brand-600 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {t('footer_branch_name', 'فرع صنعاء')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                  <span dir="ltr" className="font-medium">{t('footer_phone_1', '+967 779 500 088')}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <MessageCircle className="w-4 h-4 shrink-0 text-green-500" />
                  <span dir="ltr" className="font-medium">{t('footer_whatsapp', 'واتساب')}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                  <span dir="ltr" className="font-medium">{t('footer_email', 'info@seen.ye')}</span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{t('footer_hours', 'السبت - الأربعاء : 9 ص - 1 م')}</span>
                </div>
              </div>
            </div>

            {/* Social Media & Follow */}
            <div className="flex flex-col md:items-end gap-4">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-900 dark:text-white">تابعنا</span>
                <div className="flex gap-2">
                  <Link href={t('footer_social_linkedin', '#')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </Link>
                  <Link href={t('footer_social_facebook', '#')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                    <Facebook className="w-4 h-4" />
                  </Link>
                  <Link href={t('footer_social_youtube', '#')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                    <Youtube className="w-4 h-4" />
                  </Link>
                  <Link href={t('footer_social_x', '#')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                    <Twitter className="w-4 h-4" />
                  </Link>
                  <Link href={t('footer_social_instagram', '#')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                    <Instagram className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Copyright & Legal Links */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex gap-4 sm:gap-6 flex-wrap justify-center">
              <Link href="#" className="hover:text-brand-600">الشروط والأحكام</Link>
              <Link href="#" className="hover:text-brand-600">الخصوصية</Link>
              <Link href="#" className="hover:text-brand-600">سياسة الاسترداد</Link>
              <Link href="#" className="hover:text-brand-600">إمكانية الوصول</Link>
            </div>
            <div>جميع الحقوق محفوظة لمنصة سِين © 2026</div>
          </div>

        </div>
      </footer>

    </div>
  );
}
