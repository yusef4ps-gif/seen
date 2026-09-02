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
  CheckCircle2, Building2, Package, Layers
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
      
      {/* 🌌 Cosmic Space Canvas with Nebula Pulses & Twinkling Stars Background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        
        {/* Radial Depth Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_35%,transparent_40%,rgba(15,43,72,0.06)_100%)] dark:bg-[radial-gradient(ellipse_80%_70%_at_50%_35%,transparent_30%,rgba(6,15,27,0.8)_100%)]" />

        {/* Moving Nebula Glow Orbs matching SEEN Navy & Mint-Cyan Palette */}
        <div className="absolute -top-[10%] -right-[10%] w-[60vw] h-[60vh] min-w-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(45,212,191,0.18)_0%,transparent_70%)] dark:bg-[radial-gradient(closest-side,rgba(45,212,191,0.25)_0%,transparent_70%)] animate-nebula-a" />
        <div className="absolute top-[35%] -left-[10%] w-[55vw] h-[55vh] min-w-[450px] rounded-full bg-[radial-gradient(closest-side,rgba(15,43,72,0.22)_0%,transparent_65%)] dark:bg-[radial-gradient(closest-side,rgba(20,184,166,0.18)_0%,transparent_65%)] animate-nebula-b" />
        <div className="absolute bottom-[10%] right-[15%] w-[65vw] h-[50vh] min-w-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(20,184,166,0.15)_0%,transparent_70%)] dark:bg-[radial-gradient(closest-side,rgba(15,43,72,0.35)_0%,transparent_70%)] animate-nebula-c" />

        {/* Twinkling Starfield Pattern */}
        <div 
          className="absolute inset-0 opacity-30 dark:opacity-50 animate-star-twinkle"
          style={{
            backgroundImage: `radial-gradient(2px 2px at 20px 30px, #2dd4bf, rgba(0,0,0,0)),
                              radial-gradient(2px 2px at 40px 70px, #0f2b48, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 90px 40px, #14b8a6, rgba(0,0,0,0)),
                              radial-gradient(2px 2px at 160px 120px, #2dd4bf, rgba(0,0,0,0)),
                              radial-gradient(1.5px 1.5px at 230px 180px, #0f2b48, rgba(0,0,0,0))`,
            backgroundSize: '300px 300px'
          }}
        />
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
          {/* 💻 REALISTIC 3D FLOATING DASHBOARD VIEWPORT MOCKUP */}
          {/* ========================================================================= */}
          <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
            <div className="relative rounded-3xl sm:rounded-[2.5rem] bg-[#071322] border-[3px] sm:border-[5px] border-[#0f2b48] p-2 sm:p-3.5 shadow-[0_30px_100px_-20px_rgba(15,43,72,0.7),0_0_50px_rgba(45,212,191,0.15)] text-right">
              
              {/* Laptop Camera Notch & Status LEDs */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-3 bg-[#0a1727] rounded-b-xl flex items-center justify-center gap-1.5 z-30 border-b border-x border-[#14283e]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf] shadow-[0_0_6px_#2dd4bf]" />
                <div className="w-1 h-1 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]" />
              </div>

              {/* Viewport Screen Container */}
              <div className="relative rounded-2xl sm:rounded-3xl bg-[#0a1727] border border-slate-800 overflow-hidden text-slate-100 min-h-[420px] sm:min-h-[500px] flex flex-col justify-between">
                
                {/* Viewport Top Bar & Mockup Tab Switcher */}
                <div className="bg-[#0f2b48] border-b border-slate-700/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Left Mockup Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-300 hidden sm:inline mr-2">
                      seen.store/create-store
                    </span>
                  </div>

                  {/* Interactive Switcher Tabs */}
                  <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-700/60 text-xs font-bold">
                    <button
                      onClick={() => setActiveMockupTab('dashboard')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeMockupTab === 'dashboard'
                          ? 'bg-brand-500 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📊 لوحة التحكم
                    </button>
                    <button
                      onClick={() => setActiveMockupTab('products')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeMockupTab === 'products'
                          ? 'bg-brand-500 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🛍️ المنتجات
                    </button>
                    <button
                      onClick={() => setActiveMockupTab('storefront')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeMockupTab === 'storefront'
                          ? 'bg-brand-500 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🏪 متجر العميل
                    </button>
                    <button
                      onClick={() => setActiveMockupTab('theme')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        activeMockupTab === 'theme'
                          ? 'bg-brand-500 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🎨 استوديو القوالب
                    </button>
                  </div>

                </div>

                {/* Viewport Dynamic Content based on selected Tab */}
                <div className="p-4 sm:p-6 flex-1 flex flex-col justify-center">
                  
                  {activeMockupTab === 'dashboard' && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                          <div className="text-[10px] text-slate-400 font-bold">مبيعات اليوم (GMV)</div>
                          <div className="text-lg sm:text-xl font-black text-emerald-400 mt-1">$4,850</div>
                          <div className="text-[9px] text-emerald-300 mt-0.5">+18% نمو مباشر</div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                          <div className="text-[10px] text-slate-400 font-bold">الطلبات المكتملة</div>
                          <div className="text-lg sm:text-xl font-black text-white mt-1">128 طلب</div>
                          <div className="text-[9px] text-brand-300 mt-0.5">تجهيز وشحن فوري</div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                          <div className="text-[10px] text-slate-400 font-bold">الزوار النشطين الآن</div>
                          <div className="text-lg sm:text-xl font-black text-accent mt-1">42 متسوق</div>
                          <div className="text-[9px] text-accent mt-0.5">سلات قيد الشراء</div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                          <div className="text-[10px] text-slate-400 font-bold">استعادة السلات</div>
                          <div className="text-lg sm:text-xl font-black text-teal-300 mt-1">84%</div>
                          <div className="text-[9px] text-teal-200 mt-0.5">عبر بوت WhatsApp</div>
                        </div>
                      </div>

                      {/* Mini Live Orders Table */}
                      <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                          <span>أحدث الطلبات الواردة فورياً:</span>
                          <span className="text-emerald-400 text-[10px]">مباشر 🟢</span>
                        </div>
                        <div className="space-y-1.5 text-[11px]">
                          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                            <span className="font-bold">ORD-9421 • ريم باعباد (عدن)</span>
                            <span className="text-emerald-400 font-mono font-bold">45,000 YER</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[9px]">كريمي حاسب</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                            <span className="font-bold">ORD-9420 • محمد الصنعاني (صنعاء)</span>
                            <span className="text-emerald-400 font-mono font-bold">320 SAR</span>
                            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[9px]">جوالي محفظة</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMockupTab === 'products' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fadeIn">
                      {[
                        { name: 'فستان مخمل ملكي فاخر', price: '45,000 YER', stock: 'متوفر 8 قطع', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200' },
                        { name: 'عطر عود عدني فاخر', price: '28,000 YER', stock: 'متوفر 15 قطعة', img: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=200' },
                        { name: 'حقيبة يد جلدية أصلية', price: '38,000 YER', stock: 'متوفر 4 قطع', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
                          <img src={item.img} alt="" className="w-full h-24 rounded-xl object-cover mb-2" />
                          <div className="font-bold text-xs truncate">{item.name}</div>
                          <div className="flex items-center justify-between text-[10px] mt-2">
                            <span className="text-emerald-400 font-mono font-bold">{item.price}</span>
                            <span className="text-slate-400">{item.stock}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeMockupTab === 'storefront' && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 text-center space-y-3 animate-fadeIn">
                      <div className="text-xs font-bold text-brand-300">واجهة متجر عدن بوتيك لاكجري</div>
                      <div className="text-lg font-black text-white">تسوق أرقى التشكيلات اليمنية الفاخرة</div>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">شراء فوري بنقرة واحدة، وتتبع الطلب بالخريطة، وتأكيد عبر الواتساب</p>
                      <Link
                        href="/create-store"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs"
                      >
                        <span>تصفح المتجر الحي الآن</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}

                  {activeMockupTab === 'theme' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-bold animate-fadeIn">
                      {[
                        { title: 'عدن لاكجري', desc: 'قالب الأزياء الفاخر', color: 'border-brand-500 bg-brand-950/40 text-brand-300' },
                        { title: 'صنعاء نيو تيك', desc: 'قالب الإلكترونيات 120Hz', color: 'border-cyan-500 bg-cyan-950/40 text-cyan-300' },
                        { title: 'مزارع حراز', desc: 'قالب البن والتراث', color: 'border-amber-500 bg-amber-950/40 text-amber-300' },
                        { title: 'مينيمال السويسري', desc: 'قالب أبيض وأسود حاد', color: 'border-slate-500 bg-slate-800 text-white' },
                      ].map((th, i) => (
                        <div key={i} className={`p-3 rounded-2xl border ${th.color}`}>
                          <Palette className="w-4 h-4 mx-auto mb-1 opacity-80" />
                          <div>{th.title}</div>
                          <div className="text-[9px] font-normal opacity-70 mt-0.5">{th.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

                {/* Viewport Bottom Quick Bar */}
                <div className="bg-[#19313b]/90 border-t border-slate-700/60 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span>محرر القوالب الحي متاح في لوحة التاجر</span>
                  </span>
                  <Link
                    href="/create-store"
                    className="font-bold text-brand-300 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>فتح اللوحة الحقيقية</span>
                    <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>

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
      {/* ⚓ FOOTER WITH YEMEN PAYMENTS BADGES & SOCIAL LINKS */}
      {/* ========================================================================= */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slateDark-950/80 backdrop-blur-xl text-right pt-12 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Brand Col */}
            <div className="space-y-3">
              <BrandLogo size="md" />
              <p className="text-xs text-slate-500 leading-relaxed">
                منصة التجارة الإلكترونية السحابية الرائدة في اليمن، لتمكين التجار وأصحاب المشاريع من إدارة مبيعاتهم واشتراكاتهم بكل ثقة واحترافية.
              </p>
            </div>

            {/* Links Col 1 */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white mb-2">روابط سريعة</div>
              <div><Link href="/create-store" className="text-slate-500 hover:text-brand-600">أنشئ متجرك مجاناً</Link></div>
              <div><Link href="/#pricing" className="text-slate-500 hover:text-brand-600">باقات الأسعار</Link></div>
              <div><Link href="/#quiz" className="text-slate-500 hover:text-brand-600">مرشد الباقات السريع</Link></div>
              <div><Link href="/create-store" className="text-slate-500 hover:text-brand-600">إنشاء متجر جديد</Link></div>
            </div>

            {/* Links Col 2 */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white mb-2">البوابات والأنظمة</div>
              <div><Link href="/login" className="text-slate-500 hover:text-brand-600">بوابة تسجيل الدخول الموحدة</Link></div>
              <div><Link href="/admin" className="text-slate-500 hover:text-brand-600">لوحة الإدارة العليا (Super Admin)</Link></div>
              <div><Link href="/create-store" className="text-slate-500 hover:text-brand-600">إنشاء متجر جديد</Link></div>
              <div><Link href="/login" className="text-slate-500 hover:text-brand-600">تسجيل دخول التجار والعملاء</Link></div>
            </div>

            {/* Yemen Payments */}
            <div className="space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-white mb-2">طرق الدفع والتحويل المدعومة</div>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">الكريمي حاسب</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">محفظة جوالي</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">ون كاش</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">فلوسك</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">العمقي للصرافة</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">الدفع عند الاستلام (COD)</span>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <div>جميع الحقوق محفوظة © 2026 منصة سِين (SEEN SaaS)</div>
            <div className="flex items-center gap-4">
              <span>صنع بحب في اليمن 🇾🇪</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
