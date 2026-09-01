'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, Store as StoreIcon, DollarSign, ShoppingBag, 
  TrendingUp, Users, Radio, Search, ExternalLink, KeyRound, 
  ArrowRight, Sparkles, Edit, Check, Crown, Lock, LogOut, X, AlertCircle, CheckCircle2, Menu, Trash2, Settings, Activity, Shield, Plus, Zap
} from 'lucide-react';
import { storeEngine } from '@/lib/store-engine';
import { getStoresAction, getPlatformStatsAction, deleteStoreAction, updateStoreAction } from '@/app/actions/store';
import { authEngine } from '@/lib/auth-engine';
import { Store, SubscriptionPlan, PlatformStats, SystemBroadcast, SubscriptionPlanTier, User as AuthUser, User } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import BrandLogo from '@/components/BrandLogo';
import { getUserAction, updateUserAction } from '@/app/actions/user';

const CSSDonutChart = ({ data }: { data: { label: string, value: number, color: string }[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="text-slate-500 text-xs text-center py-10">لا توجد بيانات</div>;

  let currentPercent = 0;
  const gradientStops = data.map(item => {
    const percent = (item.value / total) * 100;
    const start = currentPercent;
    currentPercent += percent;
    return `${item.color} ${start}%, ${item.color} ${currentPercent}%`;
  }).join(', ');

  return (
    <div className="flex flex-col items-center gap-6">
      <div 
        className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center relative shadow-sm"
        style={{ background: `conic-gradient(${gradientStops})` }}
      >
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white dark:bg-slateDark-900 rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-none flex flex-col items-center justify-center">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{total}</span>
          <span className="text-[10px] text-slate-500 font-bold">الإجمالي</span>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4 w-full">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1.5 text-[11px] sm:text-xs">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color.split(' ')[0] }}></span>
            <span className="text-slate-600 dark:text-slate-300 font-bold">{item.label}</span>
            <span className="text-slate-900 dark:text-white font-black">({item.value})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SuperAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);
  
  // Layout State
  const [activeTab, setActiveTab] = useState<'owner' | 'reports' | 'packages' | 'stores' | 'broadcasts'>('owner');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');

  // Broadcast modal/input state
  const [newBroadcastTitle, setNewBroadcastTitle] = useState('');
  const [newBroadcastMsg, setNewBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'success' | 'alert'>('info');

  // Plan editing modal / inline state
  const [editingPlanId, setEditingPlanId] = useState<SubscriptionPlanTier | null>(null);
  const [editPriceUSD, setEditPriceUSD] = useState<number>(0);
  const [editCommission, setEditCommission] = useState<number>(0);
  const [editMaxProducts, setEditMaxProducts] = useState<number>(0);
  const [editTrialDays, setEditTrialDays] = useState<number>(14);
  const [planSaveSuccess, setPlanSaveSuccess] = useState<string | null>(null);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileEmail, setEditProfileEmail] = useState('');
  const [editProfilePhone, setEditProfilePhone] = useState('');
  const [editProfileAvatar, setEditProfileAvatar] = useState('');

  // Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const session = authEngine.getCurrentSession();
    const localUser = session?.user || null;
    if (!localUser || localUser.role !== 'SUPER_ADMIN') {
      router.push('/admin/login');
      return;
    }
    setCurrentUser(localUser);
    
    // CLOUD SYNC: Fetch the latest user profile from the cloud to sync cross-device (Phone <-> PC)
    if (localUser?.id) {
      getUserAction(localUser.id).then(cloudUser => {
        if (cloudUser) {
          const parsedUser = {
            ...cloudUser,
            createdAt: cloudUser.createdAt.toISOString(),
            updatedAt: cloudUser.updatedAt.toISOString(),
            lastLoginAt: cloudUser.lastLoginAt.toISOString(),
          } as unknown as User;
          setCurrentUser(parsedUser);
          authEngine.updateUser(parsedUser.id, parsedUser as Partial<User>);
        }
      }).catch(console.error);
    }
    
    refreshData();
  }, [router]);

  const refreshData = async () => {
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

  const handleToggleStoreStatus = async (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' || currentStatus === 'trial' ? 'suspended' : 'active';
    storeEngine.updateStore(storeId, { planStatus: newStatus as any });
    try {
      await updateStoreAction(storeId, { planStatus: newStatus });
    } catch (e) {
      console.error(e);
    }
    refreshData();
  };

  const handleDeleteStore = async (storeId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المتجر نهائياً؟ سيتم مسح كافة بياناته ومنتجاته، وهذا الإجراء لا يمكن التراجع عنه.')) {
      storeEngine.deleteStore(storeId);
      try {
        await deleteStoreAction(storeId);
      } catch (e) {
        console.error(e);
      }
      refreshData();
    }
  };

  const handleUpgradePlan = async (storeId: string, planTier: SubscriptionPlanTier) => {
    storeEngine.updateStore(storeId, { planTier });
    try {
      await updateStoreAction(storeId, { planTier });
    } catch (e) {
      console.error(e);
    }
    refreshData();
  };

  const handleUpdateStoreCommission = async (storeId: string, commission: number) => {
    storeEngine.updateStore(storeId, { customCommissionRate: commission });
    try {
      await updateStoreAction(storeId, { customCommissionRate: commission });
    } catch (e) {
      console.error(e);
    }
    refreshData();
  };

  // Start editing plan
  const handleStartEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.id);
    setEditPriceUSD(plan.priceMonthlyUSD);
    setEditCommission(plan.commissionRate);
    setEditMaxProducts(plan.maxProducts);
    setEditTrialDays(plan.trialDays || 14);
  };

  // Save edited plan
  const handleSavePlan = (planId: SubscriptionPlanTier) => {
    storeEngine.updatePlan(planId, {
      priceMonthlyUSD: Number(editPriceUSD),
      priceYearlyUSD: Number(editPriceUSD) * 10,
      commissionRate: Number(editCommission),
      maxProducts: Number(editMaxProducts),
      trialDays: Number(editTrialDays),
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
      type: broadcastType as any,
    });
    setNewBroadcastTitle('');
    setNewBroadcastMsg('');
    refreshData();
  };

  const handleDeleteBroadcast = (id: string) => {
    storeEngine.deleteBroadcast(id);
    refreshData();
  };

  // Profile Management
  const handleStartEditProfile = () => {
    if (!currentUser) return;
    setEditProfileName(currentUser.name);
    setEditProfileEmail(currentUser.email);
    setEditProfilePhone(currentUser.phone || '');
    setEditProfileAvatar(currentUser.avatarUrl || '');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const updates = {
      name: editProfileName,
      email: editProfileEmail,
      phone: editProfilePhone,
      avatarUrl: editProfileAvatar,
    };
    
    // Update local immediately for fast UI
    authEngine.updateUser(currentUser.id, updates);
    setCurrentUser({ ...currentUser, ...updates } as User);
    setIsEditingProfile(false);
    
    // Cloud Sync: Push to DB so it appears on other devices (e.g. Phone -> PC)
    try {
      await updateUserAction(currentUser.id, {
        ...updates,
        role: currentUser.role,
        password: currentUser.password
      });
    } catch (error) {
      console.error('Error syncing profile to cloud:', error);
    }
    
    refreshData();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to compress/resize the image before saving to base64
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 300;
        const MAX_HEIGHT = 300;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to high-quality compressed JPEG base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setEditProfileAvatar(compressedBase64);
      };
      if (event.target?.result) {
        img.src = event.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered Stores
  const filteredStores = stores.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.planStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const TabButton = ({ id, label, icon: Icon }: { id: string, label: string, icon: any }) => (
    <button
      onClick={() => { setActiveTab(id as any); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-bold ${
        activeTab === id 
          ? 'bg-brand-600 dark:bg-brand-900 text-slate-900 dark:text-white shadow-lg shadow-brand-500/20' 
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slateDark-800'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === id ? 'text-slate-900 dark:text-white' : ''}`} />
      <span>{label}</span>
    </button>
  );

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 text-slate-800 dark:text-slate-100 font-sans flex flex-col md:flex-row selection:bg-brand-500 selection:text-slate-900" dir="rtl">
      
      {/* Mobile Header / Menu Toggle */}
      <div className="md:hidden bg-white dark:bg-slateDark-900 border-b border-slate-200 dark:border-slateDark-800 p-4 flex justify-between items-center sticky top-0 z-50">
        <BrandLogo size="sm" href="/admin" />
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 bg-slate-100 dark:bg-slateDark-800 rounded-lg text-slate-900 dark:text-white"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-72 bg-white dark:bg-slateDark-900 border-l border-slate-200 dark:border-slateDark-800 shrink-0 sticky top-0 h-screen overflow-y-auto z-40 transition-all shadow-2xl md:shadow-none`}>
        <div className="p-6 space-y-8 flex flex-col h-full">
           <div className="hidden md:block">
             <BrandLogo size="md" href="/admin" />
           </div>
           
           <nav className="space-y-2 flex-1 pt-4 md:border-t border-slate-200 dark:border-slateDark-800">
             <TabButton id="owner" label="بيانات المالك" icon={Crown} />
             <TabButton id="reports" label="التقارير والإحصائيات" icon={TrendingUp} />
             <TabButton id="packages" label="الباقات والاشتراكات" icon={ShoppingBag} />
             <TabButton id="stores" label="مراقبة المتاجر" icon={StoreIcon} />
             <TabButton id="broadcasts" label="التنبيهات العامة" icon={Radio} />
           </nav>

           <div className="pt-8 space-y-3 border-t border-slate-200 dark:border-slateDark-800">
             <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full px-4 py-3 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slateDark-800 hover:bg-slate-200 dark:hover:bg-slateDark-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slateDark-700 transition-colors flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>تغيير كلمة المرور</span>
             </button>
             <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-2xl text-xs font-bold bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto w-full max-w-[100vw]">
        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
           
           {/* Tab 1: Owner Data */}
           {activeTab === 'owner' && (
             <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slateDark-800 pb-4">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    بيانات المالك
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    الصفحة الشخصية للمدير المتصل بالمنصة
                  </p>
                </div>
                
                <div className="p-8 rounded-3xl bg-white dark:bg-slateDark-900 border border-brand-200 dark:border-brand-800 shadow-xl max-w-2xl relative">
                  {!isEditingProfile && (
                    <button
                      onClick={handleStartEditProfile}
                      className="absolute top-6 left-6 p-2 rounded-xl bg-slate-50 dark:bg-slateDark-950 text-slate-500 hover:text-brand-600 border border-slate-200 dark:border-slateDark-700 transition-colors"
                      title="تعديل الملف الشخصي"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  
                  {isEditingProfile ? (
                    <form onSubmit={handleSaveProfile} className="space-y-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">الصورة الشخصية</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="w-full md:w-64 px-4 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer" 
                          />
                        </div>
                        {editProfileAvatar && (
                          <img src={editProfileAvatar} alt="preview" className="w-20 h-20 rounded-2xl object-cover border-2 border-brand-200" />
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">الاسم الكامل</label>
                          <input 
                            type="text" 
                            required 
                            value={editProfileName} 
                            onChange={(e) => setEditProfileName(e.target.value)}
                            className="w-full px-4 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none focus:ring-2 focus:ring-brand-500" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
                          <input 
                            type="email" 
                            required 
                            value={editProfileEmail} 
                            onChange={(e) => setEditProfileEmail(e.target.value)}
                            className="w-full px-4 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none focus:ring-2 focus:ring-brand-500" 
                            dir="ltr"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">رقم الهاتف</label>
                          <input 
                            type="tel" 
                            required 
                            value={editProfilePhone} 
                            onChange={(e) => setEditProfilePhone(e.target.value)}
                            className="w-full px-4 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none focus:ring-2 focus:ring-brand-500" 
                            dir="ltr"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pt-4">
                        <button type="submit" className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md">
                          حفظ التعديلات
                        </button>
                        <button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slateDark-800 dark:hover:bg-slateDark-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors">
                          إلغاء
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <img 
                        src={currentUser.avatarUrl || "https://api.dicebear.com/7.x/initials/svg?seed=Admin"}
                        alt="" 
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-amber-400 shadow-lg"
                      />
                      <div className="text-center md:text-right space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white">{currentUser.name}</h2>
                          <Crown className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="text-sm text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-950/40 px-3 py-1 rounded-full inline-block">
                          {currentUser.staffTitle || 'المالك والمدير العام (Founder & CEO)'}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono pt-2 space-y-1">
                          <div dir="ltr">Email: {currentUser.email}</div>
                          {currentUser.phone && <div dir="ltr">Phone: {currentUser.phone}</div>}
                        </div>
                        <div className="text-xs text-emerald-500 font-bold pt-2 flex items-center justify-center md:justify-start gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>متصل الآن ولديه الصلاحيات الكاملة</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
             </div>
           )}

           {/* Tab 2: Reports */}
           {activeTab === 'reports' && (
             <div className="space-y-6">
               <div className="border-b border-slate-200 dark:border-slateDark-800 pb-4">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    التقارير والإحصائيات
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    نظرة شاملة على أداء منصة سِين
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                      <span>إجمالي مبيعات المنصة (GMV)</span>
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      ${stats?.totalGMV_USD.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                      المبيعات الحقيقية من المتاجر
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                      <span>المتاجر النشطة / الكلية</span>
                      <StoreIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {stats?.activeStoresCount} <span className="text-lg font-normal text-slate-500 dark:text-slate-400">/ {stats?.totalStoresCount}</span>
                    </div>
                    <div className="text-xs text-teal-500 mt-3">
                      تتضمن فترات تجريبية
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                      <span>الطلبات المنفذة</span>
                      <ShoppingBag className="w-5 h-5 text-teal-400" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {stats?.totalOrdersCount.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-teal-500 mt-3">
                      عبر بنك القطيبي والكريمي وCOD
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                      <span>المتسوقون المتصلون</span>
                      <Users className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <span>{stats?.activeVisitorsOnline}</span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-xs text-orange-400 mt-3">
                      حركة الزوار الحية
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                  {/* Store Status Chart */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 text-center">حالة المتاجر</h3>
                    <CSSDonutChart 
                      data={[
                        { label: 'نشطة', value: stores.filter(s => s.planStatus === 'active').length, color: '#10b981' }, // emerald-500
                        { label: 'تجريبية', value: stores.filter(s => s.planStatus === 'trial').length, color: '#f59e0b' }, // amber-500
                        { label: 'مجمدة/موقوفة', value: stores.filter(s => s.planStatus === 'suspended').length, color: '#ef4444' }, // red-500
                      ]}
                    />
                  </div>

                  {/* Plan Distribution Chart */}
                  <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mb-6 text-center">الباقات الأكثر طلباً</h3>
                    <CSSDonutChart 
                      data={[
                        { label: 'المجانية', value: stores.filter(s => s.planTier === 'free').length, color: '#94a3b8' }, // slate-400
                        { label: 'الانطلاق', value: stores.filter(s => s.planTier === 'starter').length, color: '#3b82f6' }, // blue-500
                        { label: 'المحترف', value: stores.filter(s => s.planTier === 'pro').length, color: '#8b5cf6' }, // violet-500
                        { label: 'المؤسسات', value: stores.filter(s => s.planTier === 'vip').length, color: '#eab308' }, // yellow-500
                      ].filter(d => d.value > 0)}
                    />
                  </div>
                </div>
             </div>
           )}

           {/* Tab 3: Packages */}
           {activeTab === 'packages' && (
             <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slateDark-800 pb-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      الباقات والاشتراكات
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      إدارة أسعار ومميزات الباقات ديناميكياً
                    </p>
                  </div>
                  {planSaveSuccess && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-800 animate-pulse">
                      {planSaveSuccess}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {plans.map((plan) => {
                    const isEditing = editingPlanId === plan.id;
                    const isFreeTrial = plan.id === 'free';

                    return (
                      <div 
                        key={plan.id}
                        className={`p-5 rounded-3xl border transition-all ${
                          isFreeTrial
                            ? 'bg-teal-950/20 border-brand-200 dark:border-brand-800'
                            : 'bg-white dark:bg-slateDark-900 border-slate-200 dark:border-slateDark-800'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-black text-slate-900 dark:text-white">{plan.name}</span>
                          {plan.badge && (
                            <span className="text-[10px] px-2 py-1 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 font-bold max-w-[100px] text-center leading-tight">
                              {plan.badge}
                            </span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="space-y-3 pt-2 text-xs">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">السعر الشهري ($):</label>
                              <input
                                type="number"
                                value={editPriceUSD}
                                onChange={(e) => setEditPriceUSD(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">نسبة العمولة الافتراضية (%):</label>
                              <input
                                type="number"
                                step="0.1"
                                value={editCommission}
                                onChange={(e) => setEditCommission(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">سعة المنتجات القصوى:</label>
                              <input
                                type="number"
                                value={editMaxProducts}
                                onChange={(e) => setEditMaxProducts(Number(e.target.value))}
                                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none"
                              />
                            </div>
                            
                            {isFreeTrial && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">أيام الفترة التجريبية:</label>
                                <input
                                  type="number"
                                  value={editTrialDays}
                                  onChange={(e) => setEditTrialDays(Number(e.target.value))}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none"
                                />
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-3">
                              <button
                                onClick={() => handleSavePlan(plan.id)}
                                className="flex-1 py-2 rounded-xl bg-brand-600 dark:bg-brand-900 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
                              >
                                حفظ
                              </button>
                              <button
                                onClick={() => setEditingPlanId(null)}
                                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slateDark-800 text-slate-600 dark:text-slate-300 text-xs font-bold"
                              >
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4 pt-2">
                            <div className="text-2xl font-black text-slate-900 dark:text-white">
                              {plan.priceMonthlyUSD === 0 ? `مجاناً (${plan.trialDays || 14} يوماً)` : `$${plan.priceMonthlyUSD} / شهر`}
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 bg-slate-50 dark:bg-slateDark-950 p-3 rounded-xl border border-slate-100 dark:border-slateDark-800">
                              <div className="flex justify-between">
                                <span>عمولة المبيعات:</span>
                                <strong className="text-slate-900 dark:text-white">{plan.commissionRate}%</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>سعة المنتجات:</span>
                                <strong className="text-slate-900 dark:text-white">{plan.maxProducts.toLocaleString()}</strong>
                              </div>
                              {isFreeTrial && (
                                <div className="flex justify-between">
                                  <span>مدة التجربة:</span>
                                  <strong className="text-slate-900 dark:text-white">{plan.trialDays || 14} يوم</strong>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => handleStartEditPlan(plan)}
                              className="w-full mt-2 py-2 rounded-xl bg-white dark:bg-slateDark-900 hover:bg-slate-50 dark:hover:bg-slateDark-800 border-2 border-slate-100 dark:border-slateDark-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5 text-brand-500" />
                              <span>تعديل سعر وميزات الباقة</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
             </div>
           )}

           {/* Tab 4: Store Management */}
           {activeTab === 'stores' && (
             <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slateDark-800 pb-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      مراقبة المتاجر
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      إجمالي {filteredStores.length} متجر مسجل على منصة سِين
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                      <input
                        type="text"
                        placeholder="بحث باسم المتجر..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-10 pl-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-700 outline-none focus:ring-2 focus:ring-brand-500 min-w-[200px]"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-700 outline-none"
                    >
                      <option value="all">كافة الحالات</option>
                      <option value="trial">فترة تجريبية</option>
                      <option value="active">نشط</option>
                      <option value="suspended">موقوف</option>
                    </select>
                  </div>
                </div>

                {filteredStores.length === 0 ? (
                   <div className="py-20 text-center space-y-4 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slateDark-800">
                     <StoreIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-700" />
                     <h3 className="text-lg font-black text-slate-900 dark:text-white">لا توجد متاجر تطابق البحث</h3>
                   </div>
                ) : (
                  <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slateDark-800 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 dark:bg-slateDark-950/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slateDark-800 font-bold">
                          <tr>
                            <th className="py-4 px-5">المتجر والتصنيف</th>
                            <th className="py-4 px-5">المدينة</th>
                            <th className="py-4 px-5">بوابات الدفع</th>
                            <th className="py-4 px-5 w-40">الباقة والعمولة</th>
                            <th className="py-4 px-5">الحالة</th>
                            <th className="py-4 px-5 text-center">إجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slateDark-800/80">
                          {filteredStores.map((store) => {
                            const defaultCommission = plans.find(p => p.id === store.planTier)?.commissionRate || 0;
                            const currentCommission = store.customCommissionRate !== undefined ? store.customCommissionRate : defaultCommission;

                            return (
                            <tr key={store.id} className="hover:bg-slate-50/50 dark:hover:bg-slateDark-800/20 transition-colors">
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-4">
                                  <img src={store.logo} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slateDark-700" />
                                  <div>
                                    <div className="font-black text-sm text-slate-900 dark:text-white">{store.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">/store/{store.slug}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <div className="font-bold text-slate-700 dark:text-slate-300">{store.city}</div>
                                <div className="text-[10px] text-slate-500 mt-1" dir="ltr">{store.phone}</div>
                              </td>
                              <td className="py-4 px-5">
                                <div className="flex flex-wrap gap-1.5 max-w-[120px]">
                                  {store.paymentAccounts?.some(p => p.type === 'qutaibi') && <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 text-[10px] font-bold">القطيبي</span>}
                                  {store.paymentAccounts?.some(p => p.type === 'kuraimi') && <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold">الكريمي</span>}
                                  {store.paymentAccounts?.some(p => p.type === 'cod') && <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold">COD</span>}
                                </div>
                              </td>
                              <td className="py-4 px-5 space-y-2">
                                <select
                                  value={store.planTier}
                                  onChange={(e) => handleUpgradePlan(store.id, e.target.value as SubscriptionPlanTier)}
                                  className="w-full px-2 py-1.5 text-[11px] font-bold rounded-lg bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none"
                                >
                                  <option value="free">المجانية</option>
                                  <option value="starter">الانطلاق</option>
                                  <option value="pro">المحترف</option>
                                  <option value="vip">المؤسسات VIP</option>
                                </select>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold text-slate-500">عمولة:</span>
                                  <input 
                                    type="number"
                                    step="0.1"
                                    value={currentCommission}
                                    onChange={(e) => handleUpdateStoreCommission(store.id, Number(e.target.value))}
                                    className="w-16 px-1.5 py-1 text-[11px] font-mono rounded bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none text-center"
                                  />
                                  <span className="text-[10px] font-bold text-slate-500">%</span>
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <span className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold inline-flex items-center gap-1.5 ${
                                  store.planStatus === 'trial' ? 'bg-teal-950/60 text-teal-400 border border-teal-800' : 
                                  store.planStatus === 'active' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800' : 
                                  'bg-red-950/60 text-red-400 border border-red-800'
                                }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                  {store.planStatus === 'trial' ? 'تجريبي' : store.planStatus === 'active' ? 'نشط' : 'موقوف'}
                                </span>
                              </td>
                              <td className="py-4 px-5">
                                <div className="flex items-center justify-center gap-2">
                                  <Link
                                    href={`/merchant/${store.slug}`}
                                    className="p-2 rounded-xl bg-slate-50 dark:bg-slateDark-950 hover:bg-brand-50 hover:text-brand-600 border border-slate-200 dark:border-slateDark-700 transition-colors text-slate-500"
                                    title="دخول كتاجر"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                  </Link>
                                  <Link
                                    href={`/store/${store.slug}`}
                                    target="_blank"
                                    className="p-2 rounded-xl bg-slate-50 dark:bg-slateDark-950 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 dark:border-slateDark-700 transition-colors text-slate-500"
                                    title="عرض المتجر"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                  <button
                                    onClick={() => handleToggleStoreStatus(store.id, store.planStatus)}
                                    className={`p-2 rounded-xl border transition-colors ${
                                      store.planStatus === 'active' || store.planStatus === 'trial'
                                        ? 'bg-slate-50 dark:bg-slateDark-950 hover:bg-orange-50 hover:text-orange-600 border-slate-200 text-slate-500'
                                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200'
                                    }`}
                                    title={store.planStatus === 'active' || store.planStatus === 'trial' ? 'تجميد' : 'تفعيل'}
                                  >
                                    <Lock className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStore(store.id)}
                                    className="p-2 rounded-xl bg-slate-50 dark:bg-slateDark-950 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-slate-200 dark:border-slateDark-700 transition-colors text-slate-500"
                                    title="حذف نهائي"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
             </div>
           )}

           {/* Tab 5: Broadcasts */}
           {activeTab === 'broadcasts' && (
             <div className="space-y-6">
                <div className="border-b border-slate-200 dark:border-slateDark-800 pb-4">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    الإعلانات والتنبيهات العامة
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    إرسال تنبيهات تظهر في لوحات تحكم كافة المتاجر
                  </p>
                </div>

                <form onSubmit={handlePublishBroadcast} className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 shadow-sm space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300">عنوان التنبيه:</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: تحديثات جديدة لمنصة سِين..."
                        value={newBroadcastTitle}
                        onChange={(e) => setNewBroadcastTitle(e.target.value)}
                        className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-black text-slate-700 dark:text-slate-300">نوع التنبيه:</label>
                      <select
                        value={broadcastType}
                        onChange={(e) => setBroadcastType(e.target.value as any)}
                        className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="info">معلومات (ℹ️)</option>
                        <option value="success">نجاح / ميزة (✨)</option>
                        <option value="warning">تنبيه هام (⚠️)</option>
                        <option value="alert">صيانة عاجلة (🚨)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300">التفاصيل والرسالة:</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="أدخل نص الرسالة بالكامل..."
                      value={newBroadcastMsg}
                      onChange={(e) => setNewBroadcastMsg(e.target.value)}
                      className="w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-6 py-3 rounded-2xl bg-brand-600 dark:bg-brand-900 hover:bg-brand-700 text-white font-bold text-sm shadow-xl shadow-brand-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                      <Radio className="w-4 h-4" />
                      <span>نشر التنبيه لجميع المتاجر الآن</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">التنبيهات النشطة حالياً</h3>
                  {broadcasts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">لا توجد تنبيهات نشطة.</div>
                  ) : (
                    broadcasts.map((bc) => (
                      <div key={bc.id} className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 flex items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4">
                          <span className={`w-3 h-3 rounded-full shrink-0 mt-1 sm:mt-0 ${
                            bc.type === 'success' ? 'bg-emerald-400' :
                            bc.type === 'warning' ? 'bg-amber-400' :
                            bc.type === 'alert' ? 'bg-red-400' : 'bg-blue-400'
                          }`} />
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{bc.title}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{bc.message}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteBroadcast(bc.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                          title="حذف الإشعار"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
             </div>
           )}

        </div>
      </main>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn" dir="rtl">
          <div className="w-full max-w-md bg-white dark:bg-slateDark-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slateDark-800 shadow-2xl relative">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slateDark-950 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 mb-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand-500" />
                <span>تغيير كلمة المرور</span>
              </h3>
              <p className="text-xs text-slate-500">
                للحساب: <strong className="text-brand-600">{currentUser?.email}</strong>
              </p>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}
            
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الحالية</label>
                <input 
                  type="password" 
                  required 
                  value={oldPassword} 
                  onChange={e => setOldPassword(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none focus:border-brand-500 transition-colors" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور الجديدة</label>
                <input 
                  type="password" 
                  required 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-700 outline-none focus:border-brand-500 transition-colors" 
                />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                تأكيد التغيير
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
