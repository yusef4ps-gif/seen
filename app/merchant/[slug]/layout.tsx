'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Store as StoreIcon, LayoutDashboard, Package, Boxes, 
  ShoppingCart, Bot, Settings, ExternalLink, ShieldCheck, Bell, 
  Menu, X, Sparkles, RefreshCw, Users, ArrowUpRight, Palette,
  Ticket, Tag, BarChart, History, LogOut, Star
} from 'lucide-react';
import { storeEngine } from '@/lib/store-engine';
import { Store, SystemBroadcast } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import BrandLogo from '@/components/BrandLogo';
import { getStoreBySlugAction } from '@/app/actions/store';
import { getStoreNotificationsAction } from '@/app/actions/notifications';
import LiveVisitorPill from '@/components/LiveVisitorPill';

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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);


  useEffect(() => {
    setCurrentUser(authEngine.getCurrentUser());
    
    
    async function loadData() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          
          // Fetch Real Notifications
          const notifsRes = await getStoreNotificationsAction(s.id);
          if (notifsRes.success && notifsRes.data) {
            const dynamicNotifs: any[] = [];
            let unread = 0;
            let currentId = 1;

            // Abandoned Carts
            if (notifsRes.data.abandoned.count > 0) {
              dynamicNotifs.push({
                id: currentId++,
                type: 'warning',
                title: 'سلات متروكة',
                message: `يوجد ${notifsRes.data.abandoned.count} سلات متروكة بقيمة ${formatCurrency(notifsRes.data.abandoned.total, s.baseCurrency)}، قم بمتابعتها.`,
                time: 'جديد'
              });
              unread++;
            }

            // Low Stock
            if (notifsRes.data.lowStock && notifsRes.data.lowStock.length > 0) {
              notifsRes.data.lowStock.forEach((prod: any) => {
                dynamicNotifs.push({
                  id: currentId++,
                  type: 'danger',
                  title: 'تنبيه المخزون',
                  message: `تنبيه: منتج "${prod.name}" قارب على النفاذ (باقي ${prod.stock} قطع فقط).`,
                  time: 'جديد'
                });
                unread++;
              });
            }

            // Subscription Calculation
            if (notifsRes.data.storeDetails) {
              const createdAt = new Date(notifsRes.data.storeDetails.createdAt);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - createdAt.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const maxTrialDays = 14;
              const remaining = maxTrialDays - diffDays;

              if (notifsRes.data.storeDetails.planStatus === 'trial') {
                if (remaining <= 3 && remaining > 0) {
                  dynamicNotifs.push({
                    id: currentId++,
                    type: 'info',
                    title: 'تنبيه الاشتراك',
                    message: `باقة المتجر الأساسية (الفترة التجريبية) ستنتهي بعد ${remaining} أيام، يرجى التجديد قريباً لتجنب الإيقاف.`,
                    time: 'اليوم'
                  });
                  unread++;
                } else if (remaining <= 0) {
                  dynamicNotifs.push({
                    id: currentId++,
                    type: 'danger',
                    title: 'انتهاء الاشتراك',
                    message: `انتهت الفترة التجريبية المجانية الخاصة بك. يرجى الاشتراك في إحدى الباقات للاستمرار في استقبال الطلبات.`,
                    time: 'الآن'
                  });
                  unread++;
                }
              }
            }

            setNotifications(dynamicNotifs);
            setUnreadCount(unread);
          }
        }
      }
    }
    
    loadData();
    setBroadcasts(storeEngine.getBroadcasts());
  }, [slug]);

  // ⛔ Guard: If logged in as CUSTOMER, prevent them from accessing merchant management
  useEffect(() => {
    if (currentUser?.role === 'CUSTOMER') {
      router.replace(`/store/${slug}`);
    }
  }, [currentUser, router, slug]);

  if (currentUser?.role === 'CUSTOMER') {
    return null; // Return nothing while redirecting
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
      title: 'المخزون',
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
      title: 'إدارة المرتجعات',
      href: `/merchant/${slug}/returns`,
      icon: RefreshCw,
      badge: 'إجراء',
    },
    {
      title: 'الآراء والتقييمات',
      href: `/merchant/${slug}/reviews`,
      icon: Star,
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
      title: 'تخصيص الواجهة والمحتوى',
      href: `/merchant/${slug}/theme-builder`,
      icon: Palette,
      badge: 'جديد 🎨',
    },
    {
      title: 'إعدادات المتجر والمحافظ',
      href: `/merchant/${slug}/settings`,
      icon: Settings,
    },
    {
      title: 'كوبونات التخفيض',
      href: `/merchant/${slug}/coupons`,
      icon: Ticket,
    },
    {
      title: 'العروض الخاصة',
      href: `/merchant/${slug}/offers`,
      icon: Tag,
    },
    {
      title: 'التقارير',
      href: `/merchant/${slug}/reports`,
      icon: BarChart,
    },
    {
      title: 'سجل الحركات (Audit)',
      href: `/merchant/${slug}/activity-log`,
      icon: History,
      badge: 'جديد',
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
          
          {/* Store Header (Replaced BrandLogo) */}
          <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-slate-700/60">
            <div className="flex items-center gap-3 min-w-0">
              <img 
                src={store.logo} 
                alt={store.name} 
                className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-white shrink-0" 
              />
              <div className="min-w-0 flex flex-col">
                <h4 className="text-sm font-bold text-white truncate">
                  {store.name}
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mt-0.5">
                  <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span> نشط</span>
                  <span>•</span>
                  <span>باقة {store.planTier.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href={`/store/${store.slug}`}
                target="_blank"
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                title="معاينة المتجر"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
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

          <button
            onClick={() => {
              authEngine.logout();
              router.push('/login');
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </div>
          </button>
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
            
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white dark:border-slateDark-900"></span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-fadeIn text-right">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">التنبيهات</h4>
                      <span className="text-[10px] text-brand-600 font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30">جديد {unreadCount}</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map(n => (
                        <div key={n.id} className="p-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3">
                          <div className={`mt-0.5 shrink-0 w-2 h-2 rounded-full ${n.type === 'danger' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{n.title}</div>
                            <p className="text-[11px] text-slate-500 leading-relaxed mb-1">{n.message}</p>
                            <span className="text-[9px] text-slate-400 font-mono">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 text-center bg-slate-50 dark:bg-slate-800/30">
                      <button onClick={() => setUnreadCount(0)} className="text-[11px] font-bold text-brand-600 hover:text-brand-700">تحديد الكل كمقروء</button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live Visitors Pill Indicator */}
            <LiveVisitorPill storeId={store.slug} />

            {/* Quick Visit Customer Storefront Link */}
            <Link
              href={`/store/${store.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">معاينة المتجر</span>
              <span className="sm:hidden">المتجر</span>
            </Link>

          </div>

        </header>

        {/* Unified Subscription Banner */}
        {(() => {
          let startDateStr = store.planStartDate;
          let endDateStr = store.planEndDate;
          
          if (!startDateStr) startDateStr = store.createdAt;
          if (!endDateStr) {
            const fallbackEnd = new Date(store.createdAt);
            fallbackEnd.setDate(fallbackEnd.getDate() + 14);
            endDateStr = fallbackEnd;
          }

          const startDate = new Date(startDateStr);
          const endDate = new Date(endDateStr);
          const now = new Date();
          
          const diffMs = endDate.getTime() - now.getTime();
          const daysLeft = Math.ceil(diffMs / (1000 * 3600 * 24));
          const isExpired = daysLeft <= 0;
          const isWarning = daysLeft <= 7 && daysLeft > 0;
          
          const planNames: Record<string, string> = {
            'free': 'الفترة المجانية',
            'starter': 'باقة الانطلاقة',
            'pro': 'الباقة الاحترافية',
            'vip': 'باقة كبار الشخصيات (VIP)'
          };
          
          // Use planTier to display the Arabic name, or fallback
          let planName = planNames[store.planTier] || 'باقة غير معروفة';
          if (store.planStatus === 'trial' && store.planTier === 'starter') {
             planName = 'الفترة المجانية (انطلاقة)';
          }
          
          let bannerBg = 'bg-gradient-to-r from-[#0f2b48] via-[#144b7a] to-[#14b8a6]'; 
          let icon = '🎁';
          let statusText = 'اشتراك نشط';
          let statusColor = 'bg-[#2dd4bf] text-[#0f2b48]';
          
          if (isExpired) {
            bannerBg = 'bg-gradient-to-r from-red-900 via-red-800 to-red-600';
            icon = '⚠️';
            statusText = 'الاشتراك منتهي';
            statusColor = 'bg-red-100 text-red-900 animate-pulse';
          } else if (isWarning) {
            bannerBg = 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400';
            icon = '⏳';
            statusText = 'قارب على الانتهاء';
            statusColor = 'bg-amber-100 text-amber-900';
          } else if (store.planStatus === 'trial') {
             icon = '✨';
             statusText = 'تجربة مجانية';
          }

          return (
            <div className={`mx-3 sm:mx-8 mt-3 p-3 sm:p-3.5 rounded-2xl text-white flex flex-wrap items-center justify-between gap-3 shadow-md transition-all ${bannerBg}`}>
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-sm shrink-0 shadow-sm">
                  {icon}
                </span>
                <div>
                  <div className="text-xs font-black flex items-center gap-2">
                    <span>
                      {isExpired 
                        ? `لقد انتهى اشتراكك في ${planName}`
                        : `أنت مشترك في ${planName} (${daysLeft} يوماً متبقية)`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/90 mt-0.5 font-medium flex items-center gap-3">
                    <span>تاريخ الاشتراك: <b className="text-white">{startDate.toLocaleDateString('ar-YE')}</b></span>
                    <span>تاريخ التجديد: <b className="text-white">{endDate.toLocaleDateString('ar-YE')}</b></span>
                  </div>
                </div>
              </div>

              <Link
                href={`/merchant/${store.slug}/settings`}
                className="px-4 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black shadow-sm transition-all"
              >
                {isExpired ? 'تجديد الاشتراك ⚡' : 'إدارة الباقة ⚡'}
              </Link>
            </div>
          );
        })()}


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

        {/* SEEN Platform Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-3 sm:px-8 flex flex-col items-center justify-center bg-slate-50 dark:bg-slateDark-950">
          <div className="flex flex-col items-center gap-3 p-4">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              تم تطوير هذا المتجر بواسطة
            </span>
            <BrandLogo size="sm" showText={true} href="/" className="hover:opacity-80 transition-opacity" />
          </div>
        </footer>

      </div>

    </div>
  );
}
