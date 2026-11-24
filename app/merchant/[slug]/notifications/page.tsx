'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bell, CheckCircle2, ShoppingCart, AlertTriangle, AlertCircle, 
  Crown, Megaphone, Trash2, Check, ArrowRight, ExternalLink,
  Filter, ShieldAlert, Sparkles, Clock, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStoreBySlugAction } from '@/app/actions/store';
import { getStoreNotificationsAction } from '@/app/actions/notifications';
import { storeEngine } from '@/lib/store-engine';
import { formatCurrency } from '@/lib/currency-engine';

function formatRelativeTime(dateInput: string | Date | number): string {
  try {
    const date = new Date(dateInput);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (isNaN(diffSec) || diffSec < 45) return 'الآن';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  } catch {
    return 'مؤخراً';
  }
}

export default function MerchantNotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [isLoading, setIsLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());
  const [hiddenNotifIds, setHiddenNotifIds] = useState<Set<string>>(new Set());
  
  // Filter Tab: 'all' | 'unread' | 'broadcasts' | 'orders' | 'system'
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'broadcasts' | 'orders' | 'system'>('all');

  // Load read & hidden IDs from localStorage
  useEffect(() => {
    if (!slug) return;
    try {
      const storedRead = localStorage.getItem(`seen_read_notifs_${slug}`);
      if (storedRead) setReadNotifIds(new Set(JSON.parse(storedRead)));
      
      const storedHidden = localStorage.getItem(`seen_hidden_notifs_${slug}`);
      if (storedHidden) setHiddenNotifIds(new Set(JSON.parse(storedHidden)));
    } catch {}
  }, [slug]);

  // Load Store & Notifications
  const fetchNotifications = async () => {
    if (!slug) return;
    setIsLoading(true);
    try {
      const s = await getStoreBySlugAction(slug);
      if (s) {
        setStore(s);
        const notifsRes = await getStoreNotificationsAction(s.id);
        if (notifsRes && notifsRes.success && notifsRes.data) {
          const data = notifsRes.data;
          const list: any[] = [];

          // 1. Platform Updates & Broadcasts from Admin
          const allBroadcasts = data.systemBroadcasts || storeEngine.getBroadcasts() || [];
          allBroadcasts.forEach((bc: any) => {
            list.push({
              id: `broadcast-${bc.id}`,
              rawId: bc.id,
              category: 'broadcasts',
              type: bc.type === 'alert' ? 'danger' : bc.type === 'warning' ? 'warning' : 'system',
              title: `تحديث من إدارة المنصة: ${bc.title}`,
              message: bc.message,
              time: formatRelativeTime(bc.createdAt || new Date()),
              rawDate: bc.createdAt ? new Date(bc.createdAt) : new Date(),
              link: null,
            });
          });

          // 2. New Orders
          if (data.recentNewOrders && data.recentNewOrders.length > 0) {
            data.recentNewOrders.forEach((ord: any) => {
              let itemsCount = 1;
              try {
                const parsed = typeof ord.items === 'string' ? JSON.parse(ord.items) : ord.items;
                itemsCount = Array.isArray(parsed) ? parsed.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) : 1;
              } catch {}

              list.push({
                id: `order-${ord.id}`,
                rawId: ord.id,
                category: 'orders',
                type: 'order',
                title: `طلب جديد: ${ord.orderNumber}`,
                message: `وصلك طلب جديد بقيمة ${formatCurrency(ord.total, ord.currency || s.baseCurrency)} من العميل (${ord.customerName}) يحتوي على ${itemsCount} منتج.`,
                time: formatRelativeTime(ord.createdAt),
                rawDate: new Date(ord.createdAt),
                link: `/merchant/${slug}/orders`,
              });
            });
          }

          // 3. Abandoned Carts
          if (data.abandoned && data.abandoned.count > 0) {
            list.push({
              id: `abandoned-${data.abandoned.count}`,
              category: 'system',
              type: 'warning',
              title: 'تنبيه: سلات شراء متروكة',
              message: `يوجد ${data.abandoned.count} سلات متروكة في متجرك بقيمة ${formatCurrency(data.abandoned.total, s.baseCurrency)}. يمكنك إرسال تذكيرات للعملاء.`,
              time: 'نشط الآن',
              rawDate: new Date(),
              link: `/merchant/${slug}/abandoned-carts`,
            });
          }

          // 4. Low Stock
          if (data.lowStock && data.lowStock.length > 0) {
            data.lowStock.forEach((prod: any, idx: number) => {
              list.push({
                id: `low-stock-${prod.name}-${idx}`,
                category: 'system',
                type: 'danger',
                title: `تنبيه نفاذ المخزون: ${prod.name}`,
                message: `تنبيه: مخزون المنتج قارب على الانتهاء، المتبقي ${prod.stock} قطع فقط في المستودع.`,
                time: 'تنبيه مستمر',
                rawDate: new Date(),
                link: `/merchant/${slug}/inventory`,
              });
            });
          }

          // 5. Subscription Plan Details
          if (data.storeDetails) {
            const now = new Date();
            let endDate = data.storeDetails.planEndDate ? new Date(data.storeDetails.planEndDate) : null;
            if (!endDate || isNaN(endDate.getTime())) {
              const createdAt = data.storeDetails.createdAt ? new Date(data.storeDetails.createdAt) : new Date();
              endDate = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
            }
            const remaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            if (data.storeDetails.planStatus === 'expired' || (remaining <= 0 && data.storeDetails.planStatus !== 'active' && data.storeDetails.planStatus !== 'suspended')) {
              list.push({
                id: `sub-expired`,
                category: 'system',
                type: 'danger',
                title: 'تنبيه: انتهت الفترة التجريبية',
                message: `انتهت الفترة التجريبية لمتجرك. للاستمرار في استقبال الطلبات يرجى تجديد أو ترقية باقتك الآن.`,
                time: 'عاجل',
                rawDate: new Date(),
                link: `/merchant/${slug}/subscription`,
              });
            } else if (data.storeDetails.planStatus === 'trial' || data.storeDetails.planStatus === 'pending_approval') {
              if (remaining <= 3 && remaining > 0) {
                list.push({
                  id: `sub-trial-${remaining}`,
                  category: 'system',
                  type: 'info',
                  title: 'تنبيه باقة المنصة التجريبية',
                  message: `تبقى ${remaining} أيام على انتهاء الفترة التجريبية المجانية. يرجى ترقية باقتك لضمان عدم توقف المتجر.`,
                  time: 'تنبيه اشتراك',
                  rawDate: new Date(),
                  link: `/merchant/${slug}/subscription`,
                });
              }
            }
          }

          setNotifications(list);
        }
      }
    } catch (e) {
      console.error('Error fetching notifications page:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [slug]);

  // Mark single as read / unread
  const handleToggleRead = (id: string) => {
    setReadNotifIds(prev => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
        toast('تم تحديد الإشعار كغير مقروء ✉️');
      } else {
        updated.add(id);
        toast.success('تم تحديد الإشعار كمقروء ✅');
      }
      try {
        localStorage.setItem(`seen_read_notifs_${slug}`, JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
  };

  // Mark All as read
  const handleMarkAllAsRead = () => {
    const allIds = new Set(notifications.map(n => n.id));
    setReadNotifIds(allIds);
    try {
      localStorage.setItem(`seen_read_notifs_${slug}`, JSON.stringify(Array.from(allIds)));
    } catch {}
    toast.success('تم تحديد جميع الإشعارات كمقروءة بنجاح! ✅');
  };

  // Hide single notification
  const handleHideNotification = (id: string) => {
    setHiddenNotifIds(prev => {
      const updated = new Set(prev);
      updated.add(id);
      try {
        localStorage.setItem(`seen_hidden_notifs_${slug}`, JSON.stringify(Array.from(updated)));
      } catch {}
      return updated;
    });
    toast.success('تم حذف الإشعار من القائمة');
  };

  // Filter visible notifications
  const visibleNotifications = notifications
    .filter(n => !hiddenNotifIds.has(n.id))
    .filter(n => {
      if (activeTab === 'unread') return !readNotifIds.has(n.id);
      if (activeTab === 'broadcasts') return n.category === 'broadcasts';
      if (activeTab === 'orders') return n.category === 'orders';
      if (activeTab === 'system') return n.category === 'system';
      return true;
    });

  const totalVisible = notifications.filter(n => !hiddenNotifIds.has(n.id)).length;
  const unreadCount = notifications.filter(n => !hiddenNotifIds.has(n.id) && !readNotifIds.has(n.id)).length;
  const broadcastsCount = notifications.filter(n => !hiddenNotifIds.has(n.id) && n.category === 'broadcasts').length;
  const ordersCount = notifications.filter(n => !hiddenNotifIds.has(n.id) && n.category === 'orders').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn text-right" dir="rtl">
      
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 shadow-xs">
            <Bell className="w-6 h-6 animate-swing" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                التنبيهات والإشعارات
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              متابعة تحديثات الإدارة، الطلبات الجديدة، وتنبيهات المتجر والاشتراك أولاً بأول.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-teal-600 transition-colors"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>تحديد الكل كمقروءة</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'all' 
              ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/20 shadow-xs' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slateDark-900 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-slate-500 mb-1">إجمالي التنبيهات</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{totalVisible}</div>
        </div>

        <div 
          onClick={() => setActiveTab('unread')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'unread' 
              ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 shadow-xs' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slateDark-900 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">غير مقروءة 🔔</div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 font-mono">{unreadCount}</div>
        </div>

        <div 
          onClick={() => setActiveTab('broadcasts')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'broadcasts' 
              ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-xs' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slateDark-900 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">تحديثات المنصة 📢</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{broadcastsCount}</div>
        </div>

        <div 
          onClick={() => setActiveTab('orders')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'orders' 
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs' 
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slateDark-900 hover:border-slate-300'
          }`}
        >
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">تنبيهات الطلبات 🛍️</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{ordersCount}</div>
        </div>
      </div>

      {/* Filter Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          كافة الإشعارات ({totalVisible})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'unread'
              ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          غير المقروءة ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('broadcasts')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'broadcasts'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          تحديثات المنصة ({broadcastsCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          الطلبات والحجوزات ({ordersCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'system'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          تنبيهات النظام والباقة
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {visibleNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-70" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              لا توجد إشعارات في هذا القسم حالياً
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              أنت مطلع على جميع التحديثات والطلبات! ستظهر أي تنبيهات جديدة هنا فور وصولها.
            </p>
          </div>
        ) : (
          visibleNotifications.map((n) => {
            const isRead = readNotifIds.has(n.id);
            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  !isRead
                    ? 'border-teal-400/80 bg-teal-50/30 dark:bg-teal-950/15 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slateDark-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                    n.type === 'order' ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600' :
                    n.type === 'danger' ? 'bg-red-100 dark:bg-red-900/60 text-red-600' :
                    n.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-600' :
                    'bg-blue-100 dark:bg-blue-900/60 text-blue-600'
                  }`}>
                    {n.type === 'order' ? <ShoppingCart className="w-5 h-5" /> : 
                     n.category === 'broadcasts' ? <Megaphone className="w-5 h-5" /> :
                     n.type === 'danger' ? <AlertCircle className="w-5 h-5" /> :
                     n.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> :
                     <Bell className="w-5 h-5" />}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {n.title}
                      </h4>
                      {n.category === 'broadcasts' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold">
                          تحديث المنصة
                        </span>
                      )}
                      {n.type === 'order' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold">
                          طلب جديد
                        </span>
                      )}
                      {!isRead ? (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold">
                          جديد
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-medium">
                          مقروء ✓
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono mr-auto">
                        {n.time}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0">
                  {n.link && (
                    <Link
                      href={n.link}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <span>الانتقال للعرض</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleRead(n.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                      isRead
                        ? 'bg-slate-100 text-slate-500 hover:text-slate-700 dark:bg-slate-800'
                        : 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isRead ? 'غير مقروء' : 'تحديد كمقروء'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleHideNotification(n.id)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="حذف الإشعار"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
