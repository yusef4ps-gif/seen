'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, Store as StoreIcon, DollarSign, ShoppingBag, 
  TrendingUp, Users, Radio, Search, ExternalLink, KeyRound, 
  ArrowRight, Sparkles, Edit, Check, Crown, Lock, LogOut, X, AlertCircle, CheckCircle2
} from 'lucide-react';
import { storeEngine } from '@/lib/store-engine';
import { getStoresAction, getPlatformStatsAction } from '@/app/actions/store';
import { authEngine } from '@/lib/auth-engine';
import { Store, SubscriptionPlan, PlatformStats, SystemBroadcast, SubscriptionPlanTier, User as AuthUser } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import BrandLogo from '@/components/BrandLogo';

export default function SuperAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');

  // Broadcast modal/input state
  const [newBroadcastTitle, setNewBroadcastTitle] = useState('');
  const [newBroadcastMsg, setNewBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'success' | 'alert'>('info');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Plan editing modal / inline state
  const [editingPlanId, setEditingPlanId] = useState<SubscriptionPlanTier | null>(null);
  const [editPriceUSD, setEditPriceUSD] = useState<number>(0);
  const [editCommission, setEditCommission] = useState<number>(0);
  const [editMaxProducts, setEditMaxProducts] = useState<number>(0);
  const [planSaveSuccess, setPlanSaveSuccess] = useState<string | null>(null);

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const user = authEngine.getCurrentUser();
    if (!user || user.role !== 'SUPER_ADMIN') {
      router.push('/admin/login');
      return;
    }
    setCurrentUser(user);
    refreshData();
  }, [router]);

  const refreshData = async () => {
    setCurrentUser(authEngine.getCurrentUser());
    
    const fetchedStores = await getStoresAction();
    const fetchedStats = await getPlatformStatsAction();
    
    setStores(fetchedStores as any);
    setStats(fetchedStats);
    
    setPlans(storeEngine.getPlans());
    setBroadcasts(storeEngine.getBroadcasts());
  };

  const handleLogout = () => {
    authEngine.logout();
    router.push('/admin/login');
  };

  // Switch active director session between Yousef and Abbas
  const handleSwitchOwner = (username: string) => {
    authEngine.login(username, '1234');
    refreshData();
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentUser) return;

    const res = authEngine.changePassword(currentUser.id, oldPassword, newPassword);
    if (!res.success) {
      setPasswordError(res.error || 'حدث خطأ أثناء تغيير كلمة المرور.');
    } else {
      setPasswordSuccess('تم تحديث كلمة المرور بنجاح! ✓');
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordSuccess('');
      }, 1500);
    }
  };

  // Toggle store status
  const handleToggleStoreStatus = (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' || currentStatus === 'trial' ? 'suspended' : 'active';
    storeEngine.updateStore(storeId, { planStatus: newStatus as any });
    refreshData();
  };

  // Change store plan
  const handleUpgradePlan = (storeId: string, planTier: SubscriptionPlanTier) => {
    storeEngine.updateStore(storeId, { planTier });
    refreshData();
  };

  // Start editing plan
  const handleStartEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setEditPriceUSD(plan.priceMonthlyUSD);
    setEditCommission(plan.commissionRate);
    setEditMaxProducts(plan.maxProducts);
  };

  // Save edited plan
  const handleSavePlan = (planId: SubscriptionPlanTier) => {
    storeEngine.updatePlan(planId, {
      priceMonthlyUSD: Number(editPriceUSD),
      priceYearlyUSD: Number(editPriceUSD) * 10,
      commissionRate: Number(editCommission),
      maxProducts: Number(editMaxProducts),
    });
    setEditingPlanId(null);
    setPlanSaveSuccess(`تم تحديث باقة ${planId.toUpperCase()} بنجاح!`);
    setTimeout(() => setPlanSaveSuccess(null), 3000);
    refreshData();
  };

  // Submit Broadcast
  const handlePublishBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBroadcastTitle || !newBroadcastMsg) return;

    storeEngine.addBroadcast({
      title: newBroadcastTitle,
      message: newBroadcastMsg,
      type: broadcastType,
    });

    setNewBroadcastTitle('');
    setNewBroadcastMsg('');
    setIsBroadcasting(false);
    refreshData();
  };

  const handleDeleteBroadcast = (id: string) => {
    storeEngine.deleteBroadcast(id);
    refreshData();
  };

  // Filtered Stores
  const filteredStores = stores.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.planStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 text-slate-800 dark:text-slate-100 font-sans pb-20 selection:bg-brand-500 selection:text-slate-900 dark:text-white">
      
      {/* Super Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slateDark-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slateDark-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <BrandLogo size="md" href="/admin" />
            <div className="border-r border-slate-200 dark:border-slateDark-700 pr-4">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  بوابة إدارة منصة سِين (Super Admin HQ)
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  لوحة المالكين الرسمية
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">إدارة المتاجر، باقات الاشتراك، وبنوك الدفع المركزية</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slateDark-800 hover:bg-slate-200 dark:hover:bg-slateDark-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slateDark-700 transition-colors flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>تغيير كلمة المرور</span>
            </button>

            <Link
              href="/admin/users"
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-600 dark:bg-brand-900 hover:bg-brand-700 dark:hover:bg-brand-800 border border-brand-200 dark:border-brand-800 text-slate-900 dark:text-white shadow-md transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>الصلاحيات</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 transition-colors flex items-center gap-1.5"
              title="تسجيل الخروج من لوحة الإدارة"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-8">
        
        {/* 👑 EXECUTIVE PLATFORM OWNERS PANEL */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-brand-200 dark:border-brand-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slateDark-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-xl">
                👑
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>مالكو ومديرو المنصة الرسميون</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold">
                    حسابات الملاك الحصريين
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  صلاحيات التحكم المركزية الكاملة بإدارة المتاجر وبنوك الدفع وأسعار الاشتراكات
                </p>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
              المدير المتصل الآن: <span className="text-brand-600 dark:text-brand-300 font-black">{currentUser?.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Director 1: Yousef Yaqoub */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              currentUser?.email === 'yusef@seen.store'
                ? 'bg-slate-50/90 dark:bg-slateDark-900/90 border-brand-500 dark:border-brand-600 shadow-lg shadow-[#14b8a6]/10'
                : 'bg-slate-50/40 dark:bg-slateDark-900/40 border-slate-200 dark:border-slateDark-800'
            }`}>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                  alt="" 
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-slate-900 dark:text-white">يوسف يعقوب</span>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-[11px] text-brand-600 dark:text-brand-400 font-bold">المالك والمدير العام (Founder & CEO)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono" dir="ltr">Username: yousef</div>
                </div>
              </div>

              <button
                onClick={() => handleSwitchOwner('yousef')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentUser?.email === 'yusef@seen.store'
                    ? 'bg-brand-100 dark:bg-brand-900 text-[#0f2b48]'
                    : 'bg-slate-100 dark:bg-slateDark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slateDark-700'
                }`}
              >
                {currentUser?.email === 'yusef@seen.store' ? 'الجلسة النشطة ✓' : 'التبديل لهذا الحساب'}
              </button>
            </div>

            {/* Director 2: Abbas Al-Aghbar */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              currentUser?.email === 'abbas@seen.store'
                ? 'bg-slate-50/90 dark:bg-slateDark-900/90 border-brand-500 dark:border-brand-600 shadow-lg shadow-[#14b8a6]/10'
                : 'bg-slate-50/40 dark:bg-slateDark-900/40 border-slate-200 dark:border-slateDark-800'
            }`}>
              <div className="flex items-center gap-3">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" 
                  alt="" 
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-slate-900 dark:text-white">عباس الأغبر</span>
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-[11px] text-brand-600 dark:text-brand-400 font-bold">المالك والشريك المؤسس (Co-Founder)</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono" dir="ltr">Username: abbas</div>
                </div>
              </div>

              <button
                onClick={() => handleSwitchOwner('abbas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  currentUser?.email === 'abbas@seen.store'
                    ? 'bg-brand-100 dark:bg-brand-900 text-[#0f2b48]'
                    : 'bg-slate-100 dark:bg-slateDark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slateDark-700'
                }`}
              >
                {currentUser?.email === 'abbas@seen.store' ? 'الجلسة النشطة ✓' : 'التبديل لهذا الحساب'}
              </button>
            </div>

          </div>
        </div>

        {/* KPI Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>إجمالي مبيعات المنصة (GMV)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              ${stats?.totalGMV_USD.toLocaleString() || '0'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              المبيعات الحقيقية من المتاجر
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>المتاجر النشطة / الكلية</span>
              <StoreIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.activeStoresCount} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/ {stats?.totalStoresCount} متجر</span>
            </div>
            <div className="text-[11px] text-teal-300 mt-2">
              تتضمن فترة تجريبية 14 يوماً
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>إجمالي الطلبات المنفذة</span>
              <ShoppingBag className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {stats?.totalOrdersCount.toLocaleString() || '0'}
            </div>
            <div className="text-[11px] text-teal-300 mt-2">
              عبر بنك القطيبي والكريمي وCOD
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>المتسوقون المتصلون الآن</span>
              <Users className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{stats?.activeVisitorsOnline}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-[11px] text-orange-300 mt-2">
              حركة الزوار الحية على المنصة
            </div>
          </div>

        </div>

        {/* 📦 SUBSCRIPTION PLANS DYNAMIC MANAGER */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slateDark-800 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>إدارة باقات الاشتراك والأسعار ديناميكياً</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 font-bold">
                  تحكم مباشر
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يمكن ليوسف وعباس تعديل رسوم الاشتراك الشهري، نسبة العمولة، وسعة المنتجات لكل باقة فوراً
              </p>
            </div>
            {planSaveSuccess && (
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-800 animate-pulse">
                {planSaveSuccess}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isEditing = editingPlanId === plan.id;

              return (
                <div 
                  key={plan.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    plan.id === 'free'
                      ? 'bg-teal-950/20 border-brand-200 dark:border-brand-800'
                      : 'bg-slate-50 dark:bg-slateDark-950 border-slate-200 dark:border-slateDark-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white">{plan.name}</span>
                    {plan.badge && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 font-bold">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2.5 pt-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">السعر الشهري ($):</label>
                        <input
                          type="number"
                          value={editPriceUSD}
                          onChange={(e) => setEditPriceUSD(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-700 text-slate-900 dark:text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">نسبة العمولة (%):</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editCommission}
                          onChange={(e) => setEditCommission(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-700 text-slate-900 dark:text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 mb-1">الحد الأقصى للمنتجات:</label>
                        <input
                          type="number"
                          value={editMaxProducts}
                          onChange={(e) => setEditMaxProducts(Number(e.target.value))}
                          className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-700 text-slate-900 dark:text-white font-mono text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleSavePlan(plan.id)}
                          className="flex-1 py-1.5 rounded-lg bg-brand-100 dark:bg-brand-900 hover:bg-teal-600 text-[#0f2b48] font-bold text-xs flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>حفظ</span>
                        </button>
                        <button
                          onClick={() => setEditingPlanId(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slateDark-800 text-slate-500 dark:text-slate-400 text-xs"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <div className="text-xl font-black text-slate-900 dark:text-white">
                        {plan.priceMonthlyUSD === 0 ? 'مجاناً (تجربة 14 يوماً)' : `$${plan.priceMonthlyUSD} / شهرياً`}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                        <div>عمولة المبيعات: <strong className="text-slate-900 dark:text-white">{plan.commissionRate}%</strong></div>
                        <div>سعة المنتجات: <strong className="text-slate-900 dark:text-white">{plan.maxProducts.toLocaleString()} منتج</strong></div>
                      </div>

                      <button
                        onClick={() => handleStartEditPlan(plan)}
                        className="w-full mt-3 py-1.5 rounded-lg bg-white dark:bg-slateDark-900 hover:bg-slate-100 dark:bg-slateDark-800 border border-slate-200 dark:border-slateDark-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Edit className="w-3 h-3 text-[#14b8a6]" />
                        <span>تعديل سعر وميزات الباقة</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* System Broadcast Announcements */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-brand-600 dark:text-brand-400 animate-pulse" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">الإعلانات والتنبيهات العامة لجميع التجار</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">تظهر هذه التنبيهات في أعلى لوحات تحكم التجار فوراً</p>
              </div>
            </div>
            <button
              onClick={() => setIsBroadcasting(!isBroadcasting)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 dark:bg-brand-900 hover:bg-brand-700 dark:hover:bg-brand-800 border border-brand-200 dark:border-brand-800 text-slate-900 dark:text-white transition-colors flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>{isBroadcasting ? 'إغلاق نافذة النشر' : 'نشر إعلان وتنبيه جديد 📢'}</span>
            </button>
          </div>

          {/* Broadcast Composer */}
          {isBroadcasting && (
            <form onSubmit={handlePublishBroadcast} className="p-4 rounded-2xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-800 space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">عنوان الإشعار:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: إضافة بنك القطيبي الإسلامي رسمياً في منصة سِين"
                    value={newBroadcastTitle}
                    onChange={(e) => setNewBroadcastTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#14b8a6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">نوع التنبيه:</label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-700 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="info">معلومات وتحديث (Info ℹ️)</option>
                    <option value="success">نجاح وميزة جديدة (Success ✨)</option>
                    <option value="warning">تنبيه هام (Warning ⚠️)</option>
                    <option value="alert">صيانة عاجلة (Alert 🚨)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">نص الرسالة والتفاصيل:</label>
                <textarea
                  required
                  rows={2}
                  placeholder="أدخل الرسالة التي ستظهر في أعلى لوحة التاجر..."
                  value={newBroadcastMsg}
                  onChange={(e) => setNewBroadcastMsg(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#14b8a6]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-100 dark:bg-brand-900 hover:bg-teal-600 text-[#0f2b48] font-bold text-xs shadow-md transition-colors"
                >
                  بث الإشعار الآن لجميع المتاجر 🚀
                </button>
              </div>
            </form>
          )}

          {/* Active Broadcasts List */}
          <div className="space-y-2">
            {broadcasts.map((bc) => (
              <div 
                key={bc.id} 
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    bc.type === 'success' ? 'bg-emerald-400' :
                    bc.type === 'warning' ? 'bg-amber-400' :
                    bc.type === 'alert' ? 'bg-red-400' : 'bg-blue-400'
                  }`} />
                  <div>
                    <strong className="text-slate-900 dark:text-white ml-2">{bc.title}</strong>
                    <span className="text-slate-500 dark:text-slate-400">{bc.message}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteBroadcast(bc.id)}
                  className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white dark:bg-slateDark-900 transition-colors text-[11px]"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* STORES MANAGEMENT & SUPERVISION TABLE */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">إدارة ومراقبة المتاجر السحابية</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">إجمالي {filteredStores.length} متجر مسجل على منصة سِين</p>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                <input
                  type="text"
                  placeholder="بحث باسم المتجر أو المدينة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-[#14b8a6] w-52 sm:w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-800 text-slate-900 dark:text-white outline-none"
              >
                <option value="all">كافة الحالات</option>
                <option value="trial">فترة تجريبية (14 يوماً)</option>
                <option value="active">نشط</option>
                <option value="suspended">موقوف</option>
              </select>
            </div>
          </div>

          {/* Stores Table or Clean Empty State */}
          {filteredStores.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-4 bg-slate-50 dark:bg-slateDark-950 rounded-2xl border border-slate-200 dark:border-slateDark-800/80">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-600 dark:bg-brand-900 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-3xl shadow-lg">
                🏪
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900 dark:text-white">المنصة نظيفة وجاهزة تماماً — لا توجد متاجر حالياً</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  تم تفريغ كافة البيانات الافتراضية بنجاح. يمكنك الآن البدء بإنشاء متاجرك الحقيقية وتعبئة المنتجات والمستخدمين بنفسك من الصفر.
                </p>
              </div>
              <Link
                href="/create-store"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#0f2b48] via-[#144b7a] to-[#14b8a6] text-slate-900 dark:text-white font-black text-xs shadow-xl shadow-[#0f2b48]/30 hover:scale-105 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>إنشاء وتأسيس أول متجر إلكتروني الآن 🚀</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slateDark-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slateDark-800">
                  <tr>
                    <th className="py-3 px-4">المتجر والتصنيف</th>
                    <th className="py-3 px-4">المدينة والهاتف</th>
                    <th className="py-3 px-4">بوابات الدفع</th>
                    <th className="py-3 px-4">الباقة الحالية</th>
                    <th className="py-3 px-4">المبيعات (GMV)</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">إجراءات الإدارة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStores.map((store) => (
                    <tr key={store.id} className="hover:bg-slate-100 dark:bg-slateDark-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img src={store.logo} alt={store.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slateDark-700 bg-white" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{store.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono" dir="ltr">/store/{store.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-600 dark:text-slate-300">📍 {store.city}</div>
                        <div className="text-[10px] text-slate-500" dir="ltr">{store.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {store.paymentAccounts?.some(p => p.type === 'qutaibi') && (
                            <span className="px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 text-[9px] font-bold">
                              القطيبي 🏦
                            </span>
                          )}
                          {store.paymentAccounts?.some(p => p.type === 'kuraimi') && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 text-[9px] font-bold">
                              الكريمي
                            </span>
                          )}
                          {store.paymentAccounts?.some(p => p.type === 'cod') && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-300 text-[9px] font-bold">
                              COD
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={store.planTier}
                          onChange={(e) => handleUpgradePlan(store.id, e.target.value as SubscriptionPlanTier)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 text-brand-600 dark:text-brand-400 outline-none"
                        >
                          <option value="free">المجانية (Free Trial)</option>
                          <option value="starter">الانطلاق (Starter)</option>
                          <option value="pro">المحترف (Pro)</option>
                          <option value="vip">المؤسسات VIP</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        {formatCurrency(store.totalSalesGMV, store.baseCurrency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          store.planStatus === 'trial'
                            ? 'bg-teal-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800'
                            : store.planStatus === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}>
                          {store.planStatus === 'trial' ? '🎁 تجربة 14 يوماً' : store.planStatus === 'active' ? '● نشط ويعمل' : '● موقوف'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/merchant/${store.slug}`}
                            className="px-2.5 py-1.5 rounded-lg bg-brand-600 dark:bg-brand-900 hover:bg-brand-700 dark:hover:bg-brand-800 border border-brand-200 dark:border-brand-800 text-slate-900 dark:text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-colors"
                            title="الدخول إلى لوحة تحكم التاجر كمسؤول"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                            <span>دخول كـ تاجر</span>
                          </Link>
                          <Link
                            href={`/store/${store.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slateDark-800 hover:bg-slate-200 dark:hover:bg-slateDark-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title="عرض واجهة متجر العميل"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleToggleStoreStatus(store.id, store.planStatus)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                              store.planStatus === 'active' || store.planStatus === 'trial'
                                ? 'bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800'
                                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                            }`}
                          >
                            {store.planStatus === 'active' || store.planStatus === 'trial' ? 'تجميد' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </main>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slateDark-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slateDark-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slateDark-800 shadow-2xl space-y-4 text-right relative">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-slate-100 dark:bg-slateDark-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#14b8a6]" />
                <span>تغيير كلمة المرور الخاصة بحسابك</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                الحساب الحالي: <strong className="text-brand-600 dark:text-brand-300">{currentUser?.name} ({currentUser?.email})</strong>
              </p>
            </div>

            {passwordError && (
              <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">كلمة المرور الحالية:</label>
                <input
                  type="password"
                  required
                  placeholder="كلمة المرور القديمة"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 text-white text-xs font-mono outline-none focus:ring-1 focus:ring-[#14b8a6]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">كلمة المرور الجديدة:</label>
                <input
                  type="password"
                  required
                  placeholder="أدخل كلمة المرور الجديدة"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 text-white text-xs font-mono outline-none focus:ring-1 focus:ring-[#14b8a6]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slateDark-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-100 dark:bg-brand-900 hover:bg-teal-600 text-[#0f2b48] font-black text-xs shadow-md transition-all"
                >
                  حفظ كلمة المرور الجديدة ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
