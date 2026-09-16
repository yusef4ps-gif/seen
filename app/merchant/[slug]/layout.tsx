'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Store as StoreIcon, LayoutDashboard, Package, Boxes, 
  ShoppingCart, Bot, Settings, ExternalLink, ShieldCheck, Bell, 
  Menu, X, Sparkles, RefreshCw, Users, ArrowUpRight, Palette,
  Ticket, Tag, BarChart, History, LogOut, Star, Crown
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
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newReturnsCount, setNewReturnsCount] = useState(0);


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
                title: 'ط³ظ„ط§طھ ظ…طھط±ظˆظƒط©',
                message: `ظٹظˆط¬ط¯ ${notifsRes.data.abandoned.count} ط³ظ„ط§طھ ظ…طھط±ظˆظƒط© ط¨ظ‚ظٹظ…ط© ${formatCurrency(notifsRes.data.abandoned.total, s.baseCurrency)}طŒ ظ‚ظ… ط¨ظ…طھط§ط¨ط¹طھظ‡ط§.`,
                time: 'ط¬ط¯ظٹط¯'
              });
              unread++;
            }

            // Low Stock
            if (notifsRes.data.lowStock && notifsRes.data.lowStock.length > 0) {
              notifsRes.data.lowStock.forEach((prod: any) => {
                dynamicNotifs.push({
                  id: currentId++,
                  type: 'danger',
                  title: 'طھظ†ط¨ظٹظ‡ ط§ظ„ظ…ط®ط²ظˆظ†',
                  message: `طھظ†ط¨ظٹظ‡: ظ…ظ†طھط¬ "${prod.name}" ظ‚ط§ط±ط¨ ط¹ظ„ظ‰ ط§ظ„ظ†ظپط§ط° (ط¨ط§ظ‚ظٹ ${prod.stock} ظ‚ط·ط¹ ظپظ‚ط·).`,
                  time: 'ط¬ط¯ظٹط¯'
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
                    title: 'طھظ†ط¨ظٹظ‡ ط§ظ„ط§ط´طھط±ط§ظƒ',
                    message: `ط¨ط§ظ‚ط© ط§ظ„ظ…طھط¬ط± ط§ظ„ط£ط³ط§ط³ظٹط© (ط§ظ„ظپطھط±ط© ط§ظ„طھط¬ط±ظٹط¨ظٹط©) ط³طھظ†طھظ‡ظٹ ط¨ط¹ط¯ ${remaining} ط£ظٹط§ظ…طŒ ظٹط±ط¬ظ‰ ط§ظ„طھط¬ط¯ظٹط¯ ظ‚ط±ظٹط¨ط§ظ‹ ظ„طھط¬ظ†ط¨ ط§ظ„ط¥ظٹظ‚ط§ظپ.`,
                    time: 'ط§ظ„ظٹظˆظ…'
                  });
                  unread++;
                } else if (remaining <= 0) {
                  dynamicNotifs.push({
                    id: currentId++,
                    type: 'danger',
                    title: 'ط§ظ†طھظ‡ط§ط، ط§ظ„ط§ط´طھط±ط§ظƒ',
                    message: `ط§ظ†طھظ‡طھ ط§ظ„ظپطھط±ط© ط§ظ„طھط¬ط±ظٹط¨ظٹط© ط§ظ„ظ…ط¬ط§ظ†ظٹط© ط§ظ„ط®ط§طµط© ط¨ظƒ. ظٹط±ط¬ظ‰ ط§ظ„ط§ط´طھط±ط§ظƒ ظپظٹ ط¥ط­ط¯ظ‰ ط§ظ„ط¨ط§ظ‚ط§طھ ظ„ظ„ط§ط³طھظ…ط±ط§ط± ظپظٹ ط§ط³طھظ‚ط¨ط§ظ„ ط§ظ„ط·ظ„ط¨ط§طھ.`,
                    time: 'ط§ظ„ط¢ظ†'
                  });
                  unread++;
                }
              }
            }

            setNotifications(dynamicNotifs);
            setUnreadCount(unread);
            if (notifsRes.data.newOrdersCount !== undefined) {
              setNewOrdersCount(notifsRes.data.newOrdersCount);
            }
            if (notifsRes.data.newReturnsCount !== undefined) {
              setNewReturnsCount(notifsRes.data.newReturnsCount);
            }
          }
        }
      }
    }
    
    loadData();
    setBroadcasts(storeEngine.getBroadcasts());
  }, [slug]);

  // â›” Guard: If logged in as CUSTOMER, prevent them from accessing merchant management
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
          <h2 className="text-xl font-bold">ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ„ظˆط­ط© طھط­ظƒظ… ط§ظ„طھط§ط¬ط±...</h2>
          <p className="text-sm text-slate-500">ط¥ط°ط§ ظ„ظ… ظٹطھظ… ط§ظ„طھط­ظ…ظٹظ„ طھظ„ظ‚ط§ط¦ظٹط§ظ‹طŒ ظٹظ…ظƒظ†ظƒ ط§ظ„ط¹ظˆط¯ط© ظ„ظ„طµظپط­ط© ط§ظ„ط±ط¦ظٹط³ظٹط©.</p>
          <Link href="/" className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold">
            ط§ظ„ط±ط¦ظٹط³ظٹط©
          </Link>
        </div>
      </div>
    );
  }

  if (store.planStatus === 'pending_approval') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center">
          <StoreIcon className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">ظ…طھط¬ط±ظƒ ظ‚ظٹط¯ ط§ظ„ظ…ط±ط§ط¬ط¹ط© âڈ³</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          ظ„ظ… ظٹطھظ… ط§ظ„ظ…ظˆط§ظپظ‚ط© ط¹ظ„ظ‰ ط·ظ„ط¨ ط¥ظ†ط´ط§ط، ظ…طھط¬ط±ظƒ ط¨ط¹ط¯. ظٹط±ط¬ظ‰ ط§ظ„ط§ظ†طھط¸ط§ط± ظ„ط­ظٹظ† ظ…ط±ط§ط¬ط¹ط© ط§ظ„ط·ظ„ط¨ ظ…ظ† ظ‚ط¨ظ„ ط§ظ„ط¥ط¯ط§ط±ط© ظˆط³ظ†طھظˆط§طµظ„ ظ…ط¹ظƒ ط¹ط¨ط± ط§ظ„ظˆط§طھط³ط§ط¨.
        </p>
        <Link href="/" className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold">ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©</Link>
      </div>
    );
  }

  if (store.planStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
          <StoreIcon className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">طھظ… ط±ظپط¶ ط§ظ„ط·ظ„ط¨ ًںڑ«</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          ط¹ط°ط±ط§ظ‹طŒ ظ„ظ… طھظˆط§ظپظ‚ ط§ظ„ط¥ط¯ط§ط±ط© ط¹ظ„ظ‰ ط·ظ„ط¨ ط¥ظ†ط´ط§ط، ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط±. ط³ظٹطھظ… ط­ط°ظپظ‡ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ظ‚ط±ظٹط¨ط§ظ‹.
        </p>
        <Link href="/" className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-bold">ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ط±ط¦ظٹط³ظٹط©</Link>
      </div>
    );
  }

  const navItems = [
    {
      title: 'ظ†ط¸ط±ط© ط¹ط§ظ…ط© ظˆط§ظ„طھط­ظ„ظٹظ„ط§طھ',
      href: `/merchant/${slug}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: 'ط§ظ„ظ…ظ†طھط¬ط§طھ ظˆط§ظ„طھطµظ†ظٹظپط§طھ',
      href: `/merchant/${slug}/products`,
      icon: Package,
    },
    {
      title: 'ط§ظ„ظ…ط®ط²ظˆظ†',
      href: `/merchant/${slug}/inventory`,
      icon: Boxes,
    },
    {
      title: 'ط¥ط¯ط§ط±ط© ظˆطھط¯ظ‚ظٹظ‚ ط§ظ„ط·ظ„ط¨ط§طھ',
      href: `/merchant/${slug}/orders`,
      icon: ShoppingCart,
      badge: newOrdersCount > 0 ? String(newOrdersCount) : undefined,
    },
    {
      title: 'ط¥ط¯ط§ط±ط© ط§ظ„ظ…ط±طھط¬ط¹ط§طھ',
      href: `/merchant/${slug}/returns`,
      icon: RefreshCw,
      badge: newReturnsCount > 0 ? String(newReturnsCount) : undefined,
    },
    {
      title: 'ط§ظ„ط¢ط±ط§ط، ظˆط§ظ„طھظ‚ظٹظٹظ…ط§طھ',
      href: `/merchant/${slug}/reviews`,
      icon: Star,
    },
    {
      title: 'ط§ط³طھط¹ط§ط¯ط© ط§ظ„ط³ظ„ط§طھ ط§ظ„ظ…طھط±ظˆظƒط©',
      href: `/merchant/${slug}/abandoned-carts`,
      icon: RefreshCw,
    },
    {
      title: 'ظ‚ط§ط¹ط¯ط© ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¹ظ…ظ„ط§ط، (CRM)',
      href: `/merchant/${slug}/customers`,
      icon: Users,
    },
    {
      title: 'ظپط±ظٹظ‚ ط§ظ„ط¹ظ…ظ„ ظˆط§ظ„طµظ„ط§ط­ظٹط§طھ',
      href: `/merchant/${slug}/staff`,
      icon: ShieldCheck,
    },
    {
      title: 'ظ…ط³طھط´ط§ط± ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ',
      href: `/merchant/${slug}/ai-advisor`,
      icon: Sparkles,
    },
    {
      title: 'طھط®طµظٹطµ ط§ظ„ظˆط§ط¬ظ‡ط© ظˆط§ظ„ظ…ط­طھظˆظ‰',
      href: `/merchant/${slug}/theme-builder`,
      icon: Palette,
    },
    {
      title: 'ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ظ…طھط¬ط± ظˆط§ظ„ظ…ط­ط§ظپط¸',
      href: `/merchant/${slug}/settings`,
      icon: Settings,
    },
    {
      title: 'ط§ظ„ط§ط´طھط±ط§ظƒط§طھ ظˆط§ظ„ط¨ط§ظ‚ط§طھ',
      href: `/merchant/${slug}/subscription`,
      icon: Crown,
      badge: 'ط¥ط¯ط§ط±ط©',
    },
    {
      title: 'ظƒظˆط¨ظˆظ†ط§طھ ط§ظ„طھط®ظپظٹط¶',
      href: `/merchant/${slug}/coupons`,
      icon: Ticket,
    },
    {
      title: 'ط§ظ„ط¹ط±ظˆط¶ ط§ظ„ط®ط§طµط©',
      href: `/merchant/${slug}/offers`,
      icon: Tag,
    },
    {
      title: 'ط§ظ„طھظ‚ط§ط±ظٹط±',
      href: `/merchant/${slug}/reports`,
      icon: BarChart,
    },
    {
      title: 'ط³ط¬ظ„ ط§ظ„ط­ط±ظƒط§طھ (Audit)',
      href: `/merchant/${slug}/activity-log`,
      icon: History,
      badge: 'ط¬ط¯ظٹط¯',
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
                  <span className="text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span> ظ†ط´ط·</span>
                  <span>â€¢</span>
                  <span>ط¨ط§ظ‚ط© {store.planTier.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link
                href={`/store/${store.slug}`}
                target="_blank"
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                title="ظ…ط¹ط§ظٹظ†ط© ط§ظ„ظ…طھط¬ط±"
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
                        : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
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
            onClick={async () => {
              authEngine.logout();
              try { await fetch('/api/logout', { method: 'POST' }); } catch(e) {}
              router.push('/seenlogin5xa');
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl text-[11px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <LogOut className="w-4 h-4" />
              <span>طھط³ط¬ظٹظ„ ط§ظ„ط®ط±ظˆط¬</span>
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
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">ط§ظ„طھظ†ط¨ظٹظ‡ط§طھ</h4>
                      <span className="text-[10px] text-brand-600 font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30">ط¬ط¯ظٹط¯ {unreadCount}</span>
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
                      <button onClick={() => setUnreadCount(0)} className="text-[11px] font-bold text-brand-600 hover:text-brand-700">طھط­ط¯ظٹط¯ ط§ظ„ظƒظ„ ظƒظ…ظ‚ط±ظˆط،</button>
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
              <span className="hidden sm:inline">ظ…ط¹ط§ظٹظ†ط© ط§ظ„ظ…طھط¬ط±</span>
              <span className="sm:hidden">ط§ظ„ظ…طھط¬ط±</span>
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
            'free': 'ط§ظ„ظپطھط±ط© ط§ظ„ظ…ط¬ط§ظ†ظٹط©',
            'starter': 'ط¨ط§ظ‚ط© ط§ظ„ط§ظ†ط·ظ„ط§ظ‚ط©',
            'pro': 'ط§ظ„ط¨ط§ظ‚ط© ط§ظ„ط§ط­طھط±ط§ظپظٹط©',
            'vip': 'ط¨ط§ظ‚ط© ظƒط¨ط§ط± ط§ظ„ط´ط®طµظٹط§طھ (VIP)'
          };
          
          // Use planTier to display the Arabic name, or fallback
          let planName = planNames[store.planTier] || 'ط¨ط§ظ‚ط© ط؛ظٹط± ظ…ط¹ط±ظˆظپط©';
          if (store.planStatus === 'trial' && store.planTier === 'starter') {
             planName = 'ط§ظ„ظپطھط±ط© ط§ظ„ظ…ط¬ط§ظ†ظٹط© (ط§ظ†ط·ظ„ط§ظ‚ط©)';
          }
          
          let bannerBg = 'bg-gradient-to-r from-[#0f2b48] via-[#144b7a] to-[#14b8a6]'; 
          let icon = 'ًںژپ';
          let statusText = 'ط§ط´طھط±ط§ظƒ ظ†ط´ط·';
          let statusColor = 'bg-[#2dd4bf] text-[#0f2b48]';
          
          if (isExpired) {
            bannerBg = 'bg-gradient-to-r from-red-900 via-red-800 to-red-600';
            icon = 'âڑ ï¸ڈ';
            statusText = 'ط§ظ„ط§ط´طھط±ط§ظƒ ظ…ظ†طھظ‡ظٹ';
            statusColor = 'bg-red-100 text-red-900 animate-pulse';
          } else if (isWarning) {
            bannerBg = 'bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400';
            icon = 'âڈ³';
            statusText = 'ظ‚ط§ط±ط¨ ط¹ظ„ظ‰ ط§ظ„ط§ظ†طھظ‡ط§ط،';
            statusColor = 'bg-amber-100 text-amber-900';
          } else if (store.planStatus === 'trial') {
             icon = 'âœ¨';
             statusText = 'طھط¬ط±ط¨ط© ظ…ط¬ط§ظ†ظٹط©';
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
                        ? `ظ„ظ‚ط¯ ط§ظ†طھظ‡ظ‰ ط§ط´طھط±ط§ظƒظƒ ظپظٹ ${planName}`
                        : `ط£ظ†طھ ظ…ط´طھط±ظƒ ظپظٹ ${planName} (${daysLeft} ظٹظˆظ…ط§ظ‹ ظ…طھط¨ظ‚ظٹط©)`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/90 mt-0.5 font-medium flex items-center gap-3">
                    <span>طھط§ط±ظٹط® ط§ظ„ط§ط´طھط±ط§ظƒ: <b className="text-white">{startDate.toLocaleDateString('ar-YE')}</b></span>
                    <span>طھط§ط±ظٹط® ط§ظ„طھط¬ط¯ظٹط¯: <b className="text-white">{endDate.toLocaleDateString('ar-YE')}</b></span>
                  </div>
                </div>
              </div>

              <Link
                href={`/merchant/${store.slug}/subscription`}
                className="px-4 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black shadow-sm transition-all"
              >
                {isExpired ? 'طھط¬ط¯ظٹط¯ ط§ظ„ط§ط´طھط±ط§ظƒ âڑ،' : 'ط¥ط¯ط§ط±ط© ط§ظ„ط¨ط§ظ‚ط© âڑ،'}
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
              طھظ… طھط·ظˆظٹط± ظ‡ط°ط§ ط§ظ„ظ…طھط¬ط± ط¨ظˆط§ط³ط·ط©
            </span>
            <BrandLogo size="sm" showText={true} href="/" className="hover:opacity-80 transition-opacity" />
          </div>
        </footer>

      </div>

    </div>
  );
}


