'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store as StoreIcon, Phone, Clock, CheckCircle2, 
  XCircle, Activity, Calendar, Mail, Crown, CreditCard, ExternalLink, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStoresAction, approveStoreRequestAction, rejectStoreRequestAction, deleteStoreAction, approvePlanUpgradeAction } from '@/app/actions/store';
import { Store } from '@/lib/types';
import { authEngine } from '@/lib/auth-engine';

export default function StoreRequestsTab() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'rejected' | 'upgrades'>('pending');

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const res = await getStoresAction();
      if (Array.isArray(res)) {
        setStores(res as any);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleApprove = async (id: string) => {
    // Auto-WhatsApp when activated
    const store = stores.find(s => s.id === id);
    if (store && (store.whatsapp || store.phone)) {
      const users = authEngine.getUsers(store.id);
      const owner = users.find(u => u.role === 'STORE_OWNER' || (u.role as string) === 'owner');
      
      const merchantEmail = store.email || (owner ? owner.email : '') || 'البريد الإلكتروني الخاص بك';
      const storeLink = 'https://seens.net/seenlogin5xa';
      
      const welcomeMsg = `مرحباً بك في منصة سين! 🎉\n\nيسعدنا إخبارك بأنه تم تفعيل متجرك: (${store.name}) بنجاح.\n\nرابط تسجيل الدخول للمتجر:\n${storeLink}\n\nبيانات الدخول:\nالبريد الإلكتروني: ${merchantEmail}\nكلمة المرور: كلمة المرور التي قمت بإنشائها وقت إنشاء المتجر\n\nنتمنى لك مبيعات موفقة ونجاحاً باهراً! 🚀`;
      
      let cleanPhone = (store.whatsapp || store.phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.slice(2);
      const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(welcomeMsg)}`;
      window.open(waLink, '_blank');
    }

    toast.loading('جاري التفعيل...', { id: 'approve' });
    const res = await approveStoreRequestAction(id);
    if (res.success) {
      toast.success('تم الموافقة وتفعيل المتجر بنجاح!', { id: 'approve' });
      fetchStores();
    } else {
      toast.error(res.error || 'حدث خطأ', { id: 'approve' });
    }
  };

  const handleApproveUpgrade = async (store: Store) => {
    let cfg: any = {};
    try {
      cfg = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : store.themeConfig;
    } catch {
      cfg = {};
    }
    const req = cfg?.pendingPlanUpgrade;
    if (!req) return;

    const months = req.billingCycle === 'yearly' ? 12 : 1;
    toast.loading('جاري اعتماد التحويل وتفعيل الباقة...', { id: 'upgrade-plan' });
    
    const res = await approvePlanUpgradeAction({
      storeId: store.id,
      planTier: req.planTier,
      monthsDuration: months,
    });

    if (res.success) {
      toast.success(`تم تفعيل باقة (${req.planTier.toUpperCase()}) بنجاح للمتجر! 🎉`, { id: 'upgrade-plan' });
      fetchStores();
    } else {
      toast.error(res.error || 'حدث خطأ أثناء تفعيل الباقة', { id: 'upgrade-plan' });
    }
  };

  const handleReject = async (id: string) => {
    toast.loading('جاري الرفض...', { id: 'reject' });
    const res = await rejectStoreRequestAction(id);
    if (res.success) {
      toast.success('تم رفض الطلب بنجاح.', { id: 'reject' });
      fetchStores();
    } else {
      toast.error(res.error || 'حدث خطأ', { id: 'reject' });
    }
  };
  
  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this store? This cannot be undone.')) return;
    
    toast.loading('جاري الحذف...', { id: 'delete' });
    const res = await deleteStoreAction(id);
    if (res.success) {
      toast.success('تم حذف المتجر نهائياً.', { id: 'delete' });
      fetchStores();
    } else {
      toast.error(res.error || 'حدث خطأ', { id: 'delete' });
    }
  };

  const pendingStores = stores.filter(s => s.planStatus === 'pending_approval');
  const rejectedStores = stores.filter(s => s.planStatus === 'rejected');
  const upgradeRequests = stores.filter(s => {
    try {
      const cfg = typeof s.themeConfig === 'string' ? JSON.parse(s.themeConfig) : s.themeConfig;
      return cfg?.pendingPlanUpgrade && cfg.pendingPlanUpgrade.status === 'pending';
    } catch {
      return false;
    }
  });
  
  const displayStores = activeSubTab === 'pending' ? pendingStores : rejectedStores;

  const formatDate = (dateInput: Date | string) => {
    if (!dateInput) return 'غير محدد';
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slateDark-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">طلبات إنشاء المتاجر</h2>
          <p className="text-sm text-slate-500 mt-1">مراجعة وقبول المتاجر المسجلة حديثاً</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slateDark-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveSubTab('pending')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'pending' 
                ? 'bg-white dark:bg-slateDark-700 text-brand-600 dark:text-brand-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            متاجر جديدة ({pendingStores.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('upgrades')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'upgrades' 
                ? 'bg-white dark:bg-slateDark-700 text-teal-600 dark:text-teal-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ترقية الباقات ({upgradeRequests.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('rejected')}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'rejected' 
                ? 'bg-white dark:bg-slateDark-700 text-red-600 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            المرفوضة ({rejectedStores.length})
          </button>
        </div>
        <button
          onClick={fetchStores}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slateDark-800 dark:hover:bg-slateDark-700 rounded-xl text-sm font-bold transition-colors shadow-sm"
          title="تحديث البيانات"
        >
          <Activity className="w-4 h-4" />
          <span className="hidden sm:inline">تحديث</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Activity className="w-10 h-10 text-brand-500 animate-spin" />
        </div>
      ) : activeSubTab === 'upgrades' ? (
        upgradeRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Crown className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-bold mb-2">لا توجد طلبات ترقية معلقة</h3>
            <p className="text-sm">كافة طلبات الترقية مسددة ومفعلة حالياً.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {upgradeRequests.map((store: any) => {
              let req: any = {};
              try {
                const cfg = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : store.themeConfig;
                req = cfg?.pendingPlanUpgrade || {};
              } catch {}

              return (
                <div key={store.id} className="bg-white dark:bg-slateDark-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-right">
                  <div className="flex items-start gap-4">
                    {store.logo ? (
                      <img src={store.logo} alt={store.name} className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-200 dark:border-slate-700 shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 flex items-center justify-center font-black text-xl shrink-0">
                        {store.name?.charAt(0) || 'م'}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-lg text-slate-900 dark:text-white">{store.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 text-xs font-black border border-teal-200 dark:border-teal-800">
                          طلب ترقية: {req.planTier?.toUpperCase()} ({req.billingCycle === 'yearly' ? 'سنوي' : 'شهري'})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-bold">
                        <span>👤 اسم المحول: {req.senderName || 'غير محدد'}</span>
                        <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">رقم الحوالة: #{req.transferRef}</span>
                        <span>📅 {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString('ar-YE') : 'اليوم'}</span>
                      </div>

                      {req.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                          📝 ملاحظات: {req.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    {req.proofUrl && (
                      <a
                        href={req.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="w-4 h-4 text-teal-600" />
                        <span>معاينة إشعار السداد</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleApproveUpgrade(store)}
                      className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/25 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>موافقة وتفعيل الباقة فوراً 🚀</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : displayStores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold mb-2">لا توجد طلبات هنا</h3>
          <p className="text-sm">لم يتم العثور على أي متاجر بهذه الحالة.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayStores.map(store => (
            <div key={store.id} className="bg-white dark:bg-slateDark-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4">
                <img src={store.logo} alt={store.name} className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-200 dark:border-slate-700" />
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{store.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{store.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <StoreIcon className="w-3.5 h-3.5" />
                      <span>seens.net/store/{store.slug}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5" />
                      <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="hover:text-emerald-500 transition-colors">
                        {store.whatsapp || store.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{store.email || 'لا يوجد بريد'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(store.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:shrink-0 pt-4 sm:pt-0 border-t border-slate-100 dark:border-slate-800 sm:border-0">
                {activeSubTab === 'pending' ? (
                  <>
                    <button 
                      onClick={() => handleApprove(store.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>موافقة وتفعيل</span>
                    </button>
                    <button 
                      onClick={() => handleReject(store.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>رفض</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleApprove(store.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>موافقة</span>
                    </button>
                    <button 
                      onClick={() => handlePermanentDelete(store.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
