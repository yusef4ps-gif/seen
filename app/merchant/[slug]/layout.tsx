'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Store as StoreIcon, LayoutDashboard, Package, Boxes, 
  ShoppingCart, Bot, Settings, ExternalLink, ShieldCheck, Bell, 
  Menu, X, Sparkles, RefreshCw, Users, ArrowUpRight, Palette,
  Ticket, Tag, BarChart, History, LogOut, Star, Crown, Lock, ShieldAlert,
  CheckCircle2, Briefcase, CalendarCheck, Share2, CreditCard
} from 'lucide-react';
import { storeEngine } from '@/lib/store-engine';
import { Store, SystemBroadcast, SubscriptionPlan } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import BrandLogo from '@/components/BrandLogo';
import ShareStoreModal from '@/components/ShareStoreModal';
import { getStoreBySlugAction, getPlansAction } from '@/app/actions/store';
import { getStoreNotificationsAction } from '@/app/actions/notifications';
import LiveVisitorPill from '@/components/LiveVisitorPill';
import toast from 'react-hot-toast';

import { authEngine } from '@/lib/auth-engine';
import { User as AuthUser } from '@/lib/types';

// 🔔 High-fidelity Web Audio sound chime for new order alerts (zero external dependencies)
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;
    
    // Tone 1: E5 (659.25Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.45);

    // Tone 2: A5 (880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0.24, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch (err) {}
}

function formatRelativeTime(dateInput: string | Date | number): string {
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (isNaN(diffSec) || diffSec < 45) return 'الآن';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} د`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} س`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} ي`;
  } catch {
    return 'مؤخراً';
  }
}

// Map sub-routes directly to their required plan feature ID
const ROUTE_FEATURE_MAP: Record<string, string> = {
  products: 'products',
  inventory: 'inventory',
  orders: 'orders',
  payments: 'orders',
  returns: 'returns',
  reviews: 'reviews',
  'abandoned-carts': 'abandoned_carts',
  customers: 'crm',
  staff: 'staff',
  'ai-advisor': 'ai_advisor',
  'theme-builder': 'theme_builder',
  settings: 'settings',
  subscription: 'subscription',
  coupons: 'coupons',
  offers: 'offers',
  reports: 'reports',
  'activity-log': 'audit',
};

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
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => storeEngine.getPlans());
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newReturnsCount, setNewReturnsCount] = useState(0);

  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(() => new Set());
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Load read notifications from localStorage
  useEffect(() => {
    if (!slug) return;
    try {
      const stored = localStorage.getItem(`seen_read_notifs_${slug}`);
      if (stored) {
        setReadNotifIds(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, [slug]);

  // Shared processor for notification data with real-time new order alerts
  const handleNotifData = useCallback((notifsData: any, currentStore: any) => {
    if (!notifsData || !currentStore) return;
    const dynamicNotifs: any[] = [];
    let unread = 0;

    // 1. New Orders Notifications (أحدث الطلبات الجديدة في الصدارة)
    if (notifsData.recentNewOrders && notifsData.recentNewOrders.length > 0) {
      // Find orders that just arrived (not present in our known set)
      const newArrivals = notifsData.recentNewOrders.filter(
        (ord: any) => !knownOrderIdsRef.current.has(ord.id)
      );

      // If this is a live update after initial load and new orders arrived -> chime & toast!
      if (!isInitialLoadRef.current && newArrivals.length > 0) {
        playNotificationChime();

        newArrivals.forEach((ord: any) => {
          toast.success(
            (t) => (
              <div 
                onClick={() => { router.push(`/merchant/${slug}/orders`); toast.dismiss(t.id); }}
                className="cursor-pointer flex items-center gap-3 text-right"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                  <ShoppingCart className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🔔 وصلك طلب جديد!</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">{ord.orderNumber}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                    بقيمة <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(ord.total, ord.currency || currentStore.baseCurrency)}</span> من العميل <span className="font-semibold">{ord.customerName}</span>
                  </div>
                  <div className="text-[10px] text-brand-600 dark:text-brand-400 font-bold mt-1 flex items-center gap-1">
                    <span>معاينة الطلب في لوحة التحكم</span>
                    <span>←</span>
                  </div>
                </div>
              </div>
            ),
            { duration: 10000, position: 'top-center', id: `toast-order-${ord.id}` }
          );

          // Native OS Desktop Notification if permission is granted
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`🔔 طلب جديد: ${ord.orderNumber}`, {
                body: `طلب جديد بقيمة ${ord.total} ${ord.currency || currentStore.baseCurrency} من ${ord.customerName}. انقر للعرض والمعالجة.`,
                icon: currentStore.logo || undefined
              });
            } catch {}
          }
        });
      }

      // Track all current order IDs as known
      notifsData.recentNewOrders.forEach((ord: any) => knownOrderIdsRef.current.add(ord.id));

      // Build notification list items for each recent new order
      notifsData.recentNewOrders.forEach((ord: any) => {
        const notifId = `order-${ord.id}`;
        const isRead = readNotifIds.has(notifId);
        let itemsCount = 0;
        try {
          const parsed = typeof ord.items === 'string' ? JSON.parse(ord.items) : ord.items;
          itemsCount = Array.isArray(parsed) ? parsed.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) : 1;
        } catch { itemsCount = 1; }

        dynamicNotifs.push({
          id: notifId,
          type: 'order',
          title: `طلب جديد: ${ord.orderNumber}`,
          message: `طلب جديد بقيمة ${formatCurrency(ord.total, ord.currency || currentStore.baseCurrency)} من العميل (${ord.customerName}) يحتوي على ${itemsCount} منتج.`,
          time: formatRelativeTime(ord.createdAt),
          link: `/merchant/${slug}/orders`,
          orderId: ord.id,
          isRead,
        });

        if (!isRead) unread++;
      });
    }

    // Mark initial load done
    isInitialLoadRef.current = false;

    // 2. Abandoned Carts
    if (notifsData.abandoned && notifsData.abandoned.count > 0) {
      const notifId = `abandoned-${notifsData.abandoned.count}`;
      const isRead = readNotifIds.has(notifId);
      dynamicNotifs.push({
        id: notifId,
        type: 'warning',
        title: 'سلات متروكة',
        message: `يوجد ${notifsData.abandoned.count} سلات متروكة بقيمة ${formatCurrency(notifsData.abandoned.total, currentStore.baseCurrency)}، قم بمتابعتها.`,
        time: 'جديد',
        link: `/merchant/${slug}/abandoned-carts`,
        isRead
      });
      if (!isRead) unread++;
    }

    // 3. Low Stock
    if (notifsData.lowStock && notifsData.lowStock.length > 0) {
      notifsData.lowStock.forEach((prod: any, idx: number) => {
        const notifId = `low-stock-${prod.name}-${idx}`;
        const isRead = readNotifIds.has(notifId);
        dynamicNotifs.push({
          id: notifId,
          type: 'danger',
          title: 'تنبيه المخزون',
          message: `تنبيه: منتج "${prod.name}" قارب على النفاذ (باقي ${prod.stock} قطع فقط).`,
          time: 'جديد',
          link: `/merchant/${slug}/inventory`,
          isRead
        });
        if (!isRead) unread++;
      });
    }

    // 4. Subscription Calculation
    if (notifsData.storeDetails) {
      const now = new Date();
      let endDate = notifsData.storeDetails.planEndDate ? new Date(notifsData.storeDetails.planEndDate) : null;
      if (!endDate || isNaN(endDate.getTime())) {
        const createdAt = notifsData.storeDetails.createdAt ? new Date(notifsData.storeDetails.createdAt) : new Date();
        endDate = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      }
      const remaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      if (notifsData.storeDetails.planStatus === 'trial' || notifsData.storeDetails.planStatus === 'pending_approval') {
        if (remaining <= 3 && remaining > 0) {
          const notifId = `sub-trial-${remaining}`;
          const isRead = readNotifIds.has(notifId);
          dynamicNotifs.push({
            id: notifId,
            type: 'info',
            title: 'تنبيه الاشتراك',
            message: `باقة المنصة الأساسية (الفترة التجريبية) ستنتهي بعد ${remaining} أيام، يرجى التجديد قريباً لتجنب الإيقاف.`,
            time: 'اليوم',
            link: `/merchant/${slug}/subscription`,
            isRead
          });
          if (!isRead) unread++;
        } else if (remaining <= 0 && notifsData.storeDetails.planStatus === 'expired') {
          const notifId = `sub-expired`;
          const isRead = readNotifIds.has(notifId);
          dynamicNotifs.push({
            id: notifId,
            type: 'danger',
            title: 'انتهاء الاشتراك',
            message: `انتهت الفترة التجريبية المجانية الخاصة بك. يرجى الاشتراك في إحدى الباقات للاستمرار في استقبال الطلبات.`,
            time: 'الآن',
            link: `/merchant/${slug}/subscription`,
            isRead
          });
          if (!isRead) unread++;
        }
      }
    }

    setNotifications(dynamicNotifs);
    setUnreadCount(unread);
    if (notifsData.newOrdersCount !== undefined) {
      setNewOrdersCount(notifsData.newOrdersCount);
    }
    if (notifsData.newReturnsCount !== undefined) {
      setNewReturnsCount(notifsData.newReturnsCount);
    }
  }, [slug, readNotifIds, router]);

  useEffect(() => {
    setCurrentUser(authEngine.getCurrentUser());
    
    async function loadData() {
      if (slug) {
        const [s, dbPlans] = await Promise.all([
          getStoreBySlugAction(slug),
          getPlansAction()
        ]);
        if (dbPlans && dbPlans.length > 0) {
          storeEngine.setPlans(dbPlans);
          setPlans(dbPlans);
        }
        if (s) {
          setStore(s as any);
          
          // Fetch Real Notifications
          const notifsRes = await getStoreNotificationsAction(s.id);
          if (notifsRes.success && notifsRes.data) {
            handleNotifData(notifsRes.data, s);
          }
        }
      }
    }
    
    loadData();
    setBroadcasts(storeEngine.getBroadcasts());
  }, [slug, handleNotifData]);

  // ⛔ Guard: If logged in as CUSTOMER, prevent them from accessing merchant management
  useEffect(() => {
    if (currentUser?.role === 'CUSTOMER') {
      router.replace(`/store/${slug}`);
    }
  }, [currentUser, router, slug]);

  if (currentUser?.role === 'CUSTOMER') {
    return null; // Return nothing while redirecting
  }

  // 🔄 Silent Live Refresh ("رفرش خفي") every 5 seconds for store freeze, tier changes, and feature permissions
  useEffect(() => {
    if (!slug) return;

    // 1. Instant cross-tab sync (0ms)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'seen_clean_stores_v3' || e.key === 'seen_clean_plans_v3' || !e.key) {
        storeEngine.reloadFromStorage();
        const local = storeEngine.getStoreBySlug(slug);
        if (local) {
          setStore((prev) => {
            if (!prev || prev.planStatus !== local.planStatus || prev.planTier !== local.planTier) {
              return local;
            }
            return prev;
          });
        }
        const updatedPlans = storeEngine.getPlans();
        setPlans(updatedPlans);
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. Server heartbeat check (Smart background refresh for notifications and store status)
    const checkLiveUpdates = async () => {
      // Don't poll if the browser tab is hidden in the background
      if (typeof document !== 'undefined' && document.hidden) return;

      try {
        if (!slug) return;
        
        // Single call to get store notifications
        const notifsRes = await getStoreNotificationsAction(store?.id || slug);
        if (notifsRes?.success && notifsRes.data) {
          handleNotifData(notifsRes.data, store);
          
          if (notifsRes.data.storeDetails) {
            const sd = notifsRes.data.storeDetails;
            setStore((prev) => {
              if (!prev) return prev;
              if (prev.planStatus !== sd.planStatus || prev.planTier !== sd.planTier) {
                router.refresh();
                return { ...prev, planStatus: sd.planStatus, planTier: sd.planTier };
              }
              return prev;
            });
          }
        }
      } catch (err) {
        // Fallback to local
        storeEngine.reloadFromStorage();
        const local = storeEngine.getStoreBySlug(slug);
        if (local) setStore(local);
        setPlans(storeEngine.getPlans());
      }
    };

    const interval = setInterval(checkLiveUpdates, 20000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [slug, router, handleNotifData]);

  // 🛡️ Route Permission Guard: If merchant is on a page whose feature was revoked, redirect immediately to dashboard
  useEffect(() => {
    if (!pathname || !slug || !store) return;
    
    // Extract current sub-path: e.g. /merchant/[slug]/coupons -> "coupons"
    const segments = pathname.split(`/merchant/${slug}/`);
    const subRoute = segments[1]?.split('/')[0]?.split('?')[0];
    if (!subRoute) return;

    const requiredFeature = ROUTE_FEATURE_MAP[subRoute];
    const currentStorePlan = plans.find(p => p.id === store.planTier) || storeEngine.getPlans().find(p => p.id === store.planTier);
    const currentActiveFeatures = currentStorePlan?.features || [];

    if (requiredFeature && currentActiveFeatures.length > 0 && !currentActiveFeatures.includes(requiredFeature)) {
      toast.error('تم إلغاء صلاحية الوصول لهذه الميزة من قبل إدارة المنصة 🔒', { id: 'permission-revoked' });
      router.replace(`/merchant/${slug}`);
    }
  }, [pathname, slug, store?.planTier, plans, router]);

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

  // ⛔ Suspended / Frozen Store Guard: Block entire dashboard if store is suspended
  if (store.planStatus === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col justify-between relative overflow-hidden select-none">
        {/* Background Ambient Glow */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30">
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-red-600/20 blur-[100px] animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-amber-600/15 blur-[120px]" />
        </div>

        {/* Top Header */}
        <header className="relative z-10 max-w-6xl mx-auto w-full p-6 flex items-center justify-between">
          <BrandLogo size="md" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold font-mono">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span>الحساب مُجمد (SUSPENDED)</span>
          </div>
        </header>

        {/* Central Lockout Card */}
        <main className="relative z-10 max-w-lg w-full mx-auto px-4 py-8">
          <div className="bg-slate-800/80 backdrop-blur-2xl rounded-3xl border border-red-500/30 p-8 sm:p-10 shadow-2xl shadow-red-950/50 space-y-6 text-center">
            
            {/* Pulsing Lock Icon */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-xl shadow-red-500/10">
              <Lock className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">
                تم تجميد هذا المتجر مؤقتاً
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                تم إيقاف صلاحيات الوصول والعمل على هذا المتجر مؤقتاً بسبب انتهاء الاشتراك أو بقرار من إدارة المنصة.
              </p>
            </div>

            {/* Store Details Card */}
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-700/80 text-right space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">اسم المتجر:</span>
                <span className="font-bold text-white">{store.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">رابط المتجر:</span>
                <span className="font-mono text-slate-300" dir="ltr">/store/{store.slug}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">حالة المتجر:</span>
                <span className="px-2.5 py-0.5 rounded-md bg-red-500/20 text-red-400 font-bold border border-red-500/30 text-[11px]">
                  مُجمد 🔒
                </span>
              </div>
            </div>

            {/* Notice Callout */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2.5 text-right">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
              <span>يرجى مراجعة إدارة المنصة (مالك المنصة) لإعادة التفعيل وتجديد الاشتراك.</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <a
                href={`https://wa.me/967774448016?text=${encodeURIComponent(`مرحباً مالك منصة سِين، بخصوص متجري (${store.name})، أود مراجعة حالة الحساب لإعادة التفعيل وتجديد الاشتراك.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>تواصل مع مالك المنصة عبر واتساب 💬</span>
              </a>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="py-3 px-3 rounded-2xl bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>فحص التفعيل 🔄</span>
                </button>

                <button
                  onClick={async () => {
                    authEngine.logout();
                    try { await fetch('/api/logout', { method: 'POST' }); } catch(e) {}
                    router.push('/seenlogin5xa');
                  }}
                  className="py-3 px-3 rounded-2xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-bold border border-red-800/60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تسجيل الخروج 🚪</span>
                </button>
              </div>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 max-w-6xl mx-auto w-full p-6 text-center text-xs text-slate-500">
          منصة سِين للتجارة الإلكترونية © {new Date().getFullYear()}
        </footer>
      </div>
    );
  }

  const isServiceStore = (() => {
    if (!store) return false;
    const cfg: any = typeof store.themeConfig === 'string' 
      ? (() => { try { return JSON.parse(store.themeConfig); } catch { return {}; } })()
      : store.themeConfig;
    return cfg?.storeType === 'SERVICE' || cfg?.presetId === 'service-expert';
  })();

  const allNavItems = [
    {
      id: 'dashboard', title: 'نظرة عامة والتحليلات',
      href: `/merchant/${slug}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      id: 'products', 
      title: isServiceStore ? 'الخدمات والاستشارات' : 'المنتجات والتصنيفات',
      href: `/merchant/${slug}/products`,
      icon: isServiceStore ? Briefcase : Package,
    },
    {
      id: 'inventory', title: 'المخزون',
      href: `/merchant/${slug}/inventory`,
      icon: Boxes,
    },
    {
      id: 'orders', 
      title: isServiceStore ? 'حجوزات وطلبات العملاء' : 'إدارة وتدقيق الطلبات',
      href: `/merchant/${slug}/orders`,
      icon: isServiceStore ? CalendarCheck : ShoppingCart,
      badge: newOrdersCount > 0 ? String(newOrdersCount) : undefined,
    },
    {
      id: 'payments',
      title: 'المدفوعات والفواتير',
      href: `/merchant/${slug}/payments`,
      icon: CreditCard,
    },
    {
      id: 'returns', title: 'إدارة المرتجعات',
      href: `/merchant/${slug}/returns`,
      icon: RefreshCw,
      badge: newReturnsCount > 0 ? String(newReturnsCount) : undefined,
    },
    {
      id: 'reviews', 
      title: isServiceStore ? 'آراء وتقييمات المستفيدين' : 'الآراء والتقييمات',
      href: `/merchant/${slug}/reviews`,
      icon: Star,
    },
    {
      id: 'abandoned_carts', title: 'استعادة السلات المتروكة',
      href: `/merchant/${slug}/abandoned-carts`,
      icon: RefreshCw,
    },
    {
      id: 'crm', 
      title: isServiceStore ? 'سجل العملاء والمستفيدين' : 'قاعدة بيانات العملاء (CRM)',
      href: `/merchant/${slug}/customers`,
      icon: Users,
    },
    {
      id: 'staff', title: 'فريق العمل والصلاحيات',
      href: `/merchant/${slug}/staff`,
      icon: ShieldCheck,
    },
    {
      id: 'ai_advisor', title: 'مستشار الذكاء الاصطناعي',
      href: `/merchant/${slug}/ai-advisor`,
      icon: Sparkles,
    },
    {
      id: 'theme_builder', 
      title: isServiceStore ? 'تخصيص البروفايل والهوية' : 'تخصيص الواجهة والمحتوى',
      href: `/merchant/${slug}/theme-builder`,
      icon: Palette,
    },
    {
      id: 'settings', 
      title: isServiceStore ? 'إعدادات البروفايل والمحافظ' : 'إعدادات المتجر والمحافظ',
      href: `/merchant/${slug}/settings`,
      icon: Settings,
    },
    {
      id: 'subscription', title: 'الاشتراكات والباقات',
      href: `/merchant/${slug}/subscription`,
      icon: Crown,
      badge: 'إدارة',
    },
    {
      id: 'coupons', title: 'كوبونات التخفيض',
      href: `/merchant/${slug}/coupons`,
      icon: Ticket,
    },
    {
      id: 'offers', title: 'العروض الخاصة',
      href: `/merchant/${slug}/offers`,
      icon: Tag,
    },
    {
      id: 'reports', title: 'التقارير',
      href: `/merchant/${slug}/reports`,
      icon: BarChart,
    },
    {
      id: 'audit', title: 'سجل الحركات (Audit)',
      href: `/merchant/${slug}/activity-log`,
      icon: History,
      badge: 'جديد',
    },
  ];

  const storePlan = plans.find(p => p.id === store.planTier) || storeEngine.getPlans().find(p => p.id === store.planTier);
  const activeFeatures = storePlan?.features || [];
  const navItems = allNavItems
    .filter(item => activeFeatures.includes(item.id))
    .filter(item => {
      if (isServiceStore) {
        if (['inventory', 'returns', 'abandoned_carts'].includes(item.id)) {
          return false;
        }
      }
      return true;
    });

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
                title={isServiceStore ? "معاينة البروفايل المهني" : "معاينة المتجر"}
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
            onClick={async () => {
              authEngine.logout();
              try { await fetch('/api/logout', { method: 'POST' }); } catch(e) {}
              router.push('/seenlogin5xa');
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
                title="التنبيهات والإشعارات"
              >
                <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-brand-600 dark:text-brand-400' : ''}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)}></div>
                  <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn text-right">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">التنبيهات والإشعارات</h4>
                      </div>
                      <span className="text-[10px] text-brand-600 font-bold px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30">
                        {unreadCount > 0 ? `${unreadCount} غير مقروء` : 'الكل مقروء'}
                      </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500/70 mx-auto" />
                          <div>لا توجد تنبيهات جديدة حالياً</div>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              if (n.link) {
                                router.push(n.link);
                                setIsNotificationsOpen(false);
                              }
                            }}
                            className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 cursor-pointer ${
                              !n.isRead ? 'bg-brand-50/20 dark:bg-brand-950/20' : ''
                            }`}
                          >
                            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-xs ${
                              n.type === 'order' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' :
                              n.type === 'danger' ? 'bg-red-100 dark:bg-red-900/50 text-red-600' :
                              n.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600' :
                              'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
                            }`}>
                              {n.type === 'order' ? <ShoppingCart className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                                  <span>{n.title}</span>
                                  {n.type === 'order' && (
                                    <span className="text-[9px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0">طلب جديد</span>
                                  )}
                                  {!n.isRead && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"></span>
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-400 font-mono shrink-0 ml-1">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 px-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/30">
                      <button 
                        onClick={() => {
                          const allIds = new Set(notifications.map(n => String(n.id)));
                          setReadNotifIds(allIds);
                          setUnreadCount(0);
                          try {
                            localStorage.setItem(`seen_read_notifs_${slug}`, JSON.stringify(Array.from(allIds)));
                          } catch {}
                        }} 
                        className="text-[11px] font-bold text-brand-600 hover:text-brand-700 transition-colors"
                      >
                        تحديد الكل كمقروء
                      </button>

                      {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
                        <button
                          onClick={async () => {
                            const res = await Notification.requestPermission();
                            if (res === 'granted') toast.success('تم تفعيل تنبيهات المتصفح بنجاح! 🔔');
                          }}
                          className="text-[10px] text-slate-500 hover:text-brand-600 flex items-center gap-1 font-bold transition-colors"
                        >
                          <span>تفعيل تنبيهات المتصفح 🔔</span>
                        </button>
                      )}
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
              <span className="hidden sm:inline">{isServiceStore ? 'معاينة البروفايل' : 'معاينة المتجر'}</span>
              <span className="sm:hidden">{isServiceStore ? 'البروفايل' : 'المتجر'}</span>
            </Link>

            {/* Share Platform Link Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              title="مشاركة رابط المنصة"
            >
              <Share2 className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span className="hidden sm:inline">مشاركة الرابط</span>
            </button>

          </div>

        </header>

        {/* Unified Subscription Banner */}
        {(() => {
          let startDate = store.planStartDate ? new Date(store.planStartDate) : (store.createdAt ? new Date(store.createdAt) : new Date());
          let endDate = store.planEndDate ? new Date(store.planEndDate) : (store.trialEndsAt ? new Date(store.trialEndsAt) : null);
          if (!endDate || isNaN(endDate.getTime())) {
            endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
          }
          if (isNaN(startDate.getTime())) startDate = new Date();
          if (isNaN(endDate.getTime())) endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

          const now = new Date();
          const diffMs = endDate.getTime() - now.getTime();
          const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 3600 * 24)));
          const isExpired = store.planStatus === 'expired' || (daysLeft <= 0 && store.planStatus !== 'active' && store.planStatus !== 'trial' && store.planStatus !== 'pending_approval');
          const isWarning = daysLeft <= 3 && daysLeft > 0 && !isExpired;
          
          const planNames: Record<string, string> = {
            'free': 'الفترة التجريبية المجانية (14 يوماً)',
            'starter': 'باقة الانطلاقة',
            'pro': 'الباقة الاحترافية',
            'vip': 'باقة المؤسسات (VIP)'
          };
          
          let planName = planNames[store.planTier] || 'الفترة التجريبية المجانية';
          if (store.planStatus === 'trial' || store.planStatus === 'pending_approval' || store.planTier === 'free') {
             planName = 'الفترة التجريبية المجانية (14 يوماً)';
          }
          
          let bannerBg = 'bg-gradient-to-r from-[#0f2b48] via-[#144b7a] to-[#14b8a6]'; 
          let icon = '🎁';
          let statusText = 'تجربة مجانية نشطة';
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
          } else if (store.planStatus === 'active') {
             icon = '⚡';
             statusText = 'اشتراك نشط';
             statusColor = 'bg-emerald-100 text-emerald-800';
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
                href={`/merchant/${store.slug}/subscription`}
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
              تم تطوير المنصة بواسطة
            </span>
            <BrandLogo size="sm" showText={true} href="/" className="hover:opacity-80 transition-opacity" />
          </div>
        </footer>

      </div>

      {/* Share Platform Modal */}
      {store && (
        <ShareStoreModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          storeSlug={store.slug}
          storeName={store.name}
          isService={isServiceStore}
        />
      )}

    </div>
  );
}
