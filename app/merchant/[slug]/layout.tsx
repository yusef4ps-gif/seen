'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Store as StoreIcon, LayoutDashboard, Package, Boxes, 
  ShoppingCart, Bot, Settings, ExternalLink, ShieldCheck, Bell, 
  Menu, X, Sparkles, RefreshCw, Users, ArrowUpRight, Palette
} from 'lucide-react';
import { storeEngine } from '@/lib/store-engine';
import { Store, SystemBroadcast } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import BrandLogo from '@/components/BrandLogo';
import { getStoreBySlugAction, getStoresAction } from '@/app/actions/store';

import { authEngine } from '@/lib/auth-engine';
import { User as AuthUser } from '@/lib/types';

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const slug = params.slug as string;

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [allStores, setAllStores] = useState<Store[]>([]);

  useEffect(() => {
    setCurrentUser(authEngine.getCurrentUser());
    
    async function loadData() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) setStore(s as any);
      }
      const all = await getStoresAction();
      setAllStores(all as any);
    }
    
    loadData();
    setBroadcasts(storeEngine.getBroadcasts());
  }, [slug]);

  // ⛔ Guard: If logged in as CUSTOMER, prevent them from accessing merchant management
  if (currentUser?.role === 'CUSTOMER') {
    return (
      <div className="min-h-screen bg-[#0a1317] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0f2a35]/90 border border-purple-500/30 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mx-auto shadow-lg">
            <StoreIcon className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">لوحة خاصة بالتاجر 🏪</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              أنت مسجل حالياً كـ <strong>عميل مشتري ({currentUser.name})</strong>. هذه اللوحة مخصصة لمالك المتجر وفريق العمل لإدارة المنتجات والمبيعات.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href={`/store/${slug}`}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-brand-600 to-accent text-white text-xs font-bold block shadow-lg transition-all"
            >
              تصفح متجر {store?.name || 'المتجر'} للشراء 🛍️
            </Link>

            <Link
              href="/profile"
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold block transition-all"
            >
              عرض مشترياتي وطلباتي السابقة
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <StoreIcon className="w-12 h-12 text-slate-400 mx-auto animate-pulse" />
          <h2 className="text-xl font-bold">جاري تحميل لوحة تحكم التاجر...</h2>
          <p className="text-sm text-slate-500">إذا لم يتم التحميل تلقائياً، يمكنك العودة للصفحة الرئيسية.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold">
            الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      title: 'نظرة عامة والتحليلات',
      href: `/merchant/${slug}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'المنتجات والتصنيفات',
      href: `/merchant/${slug}/products`,
      icon: Package,
    },
    {
      title: 'ذكاء المخزون والتقييم',
      href: `/merchant/${slug}/inventory`,
      icon: Boxes,
      badge: 'الذكي',
    },
    {
      title: 'إدارة وتدقيق الطلبات',
      href: `/merchant/${slug}/orders`,
      icon: ShoppingCart,
    },
    {
      title: 'استعادة السلات المتروكة',
      href: `/merchant/${slug}/abandoned-carts`,
      icon: RefreshCw,
    },
    {
      title: 'قاعدة بيانات العملاء (CRM)',
      href: `/merchant/${slug}/customers`,
      icon: Users,
      badge: 'تلقائي 👥',
    },
    {
      title: 'فريق العمل والصلاحيات',
      href: `/merchant/${slug}/staff`,
      icon: ShieldCheck,
    },
    {
      title: 'مستشار الذكاء الاصطناعي',
      href: `/merchant/${slug}/ai-advisor`,
      icon: Bot,
      badge: 'AI ✨',
    },
    {
      title: 'محرر القوالب والهوية',
      href: `/merchant/${slug}/theme-builder`,
      icon: Palette,
      badge: 'جديد 🎨',
    },
    {
      title: 'إعدادات المتجر والمحافظ',
      href: `/merchant/${slug}/settings`,
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slateDark-950 text-slate-900 dark:text-slate-100 font-sans overflow-x-hidden w-full">
      
      {/* Mobile Drawer Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside 
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-[#0f2b48] border-l border-slate-700/60 text-slate-100 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-slate-700/60">
            <BrandLogo size="md" />

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Store Selector Card */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img 
                src={store.logo} 
                alt={store.name} 
                className="w-9 h-9 rounded-xl object-cover border border-slate-700 bg-white shrink-0" 
              />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  {store.name}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <span className="text-emerald-400">● نشط</span>
                  <span>•</span>
                  <span>باقة {store.planTier.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <Link
              href={`/store/${store.slug}`}
              target="_blank"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:text-accent shadow-xs shrink-0"
              title="معاينة متجر العميل"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="mt-5 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? pathname === item.href 
                : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.title}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-accent/20 text-accent border border-accent/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/50">
          <Link
            href="/admin"
            className="flex items-center justify-between p-2 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>لوحة الإدارة العليا (Admin)</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:mr-72 min-w-0">
        
        {/* Merchant Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/90 dark:bg-slateDark-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-8 py-3 flex items-center justify-between">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {store.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Live Visitors Pill Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{store.activeVisitorsNow} متسوق متصل</span>
            </div>

            {/* Quick Visit Customer Storefront Link */}
            <Link
              href={`/store/${store.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">معاينة متجر العميل</span>
              <span className="sm:hidden">المتجر</span>
            </Link>

          </div>

        </header>

        {/* Trial Countdown & Subscription Status Banner */}
        {store.planStatus === 'trial' && (
          <div className="mx-3 sm:mx-8 mt-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#0f2b48] via-[#144b7a] to-[#14b8a6] text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-sm shrink-0">
                🎁
              </span>
              <div>
                <div className="text-xs font-black flex items-center gap-2">
                  <span>أنت حالياً في الفترة التجريبية المجانية (14 يوماً)</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#2dd4bf] text-[#0f2b48] text-[10px] font-black">
                    تجربة مجانية نشطة
                  </span>
                </div>
                <div className="text-[11px] text-slate-200">
                  استمتع بكافة الميزات الاحترافية، دعم بنك القطيبي، وأسعار الصرف الحية مجاناً.
                </div>
              </div>
            </div>

            <Link
              href={`/merchant/${store.slug}/settings`}
              className="px-4 py-1.5 rounded-xl bg-white text-[#0f2b48] hover:bg-slate-100 text-xs font-black shadow-sm transition-all"
            >
              ترقية واختيار باقة ⚡
            </Link>
          </div>
        )}

        {/* Global Broadcast Banner (if any) */}
        {broadcasts.length > 0 && (
          <div className="px-3 sm:px-8 pt-3">
            {broadcasts.map((bc) => (
              <div 
                key={bc.id} 
                className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 font-medium"
              >
                <Bell className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="truncate">
                  <strong className="ml-1">{bc.title}:</strong>
                  <span>{bc.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Page Children Container */}
        <main className="p-3 sm:p-8 flex-1">
          {children}
        </main>

      </div>

    </div>
  );
}
