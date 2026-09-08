'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, User, LogOut, CheckCircle2, ShoppingBag, Settings, Lock, Trash2, Eye } from 'lucide-react';
import { getCurrentCustomerAction, logoutCustomerAction, changeCustomerPasswordAction, deleteCustomerAccountAction } from '@/app/actions/customer-auth';
import { getStoreBySlugAction } from '@/app/actions/store';
import { getCustomerOrdersAction } from '@/app/actions/order';
import { formatCurrency, convertCurrency, DEFAULT_CURRENCIES } from '@/lib/currency-engine';

export default function CustomerAccountPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;
  const initialTab = searchParams.get('tab') === 'settings' ? 'settings' : 'purchases';

  const [store, setStore] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'purchases' | 'settings'>(initialTab);

  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    async function loadData() {
      const s = await getStoreBySlugAction(slug);
      if (!s) {
        router.push('/');
        return;
      }
      setStore(s);

      const cust = await getCurrentCustomerAction();
      if (!cust || cust.storeId !== s.id) {
        // Not logged in or logged into a different store
        router.push(`/store/${slug}`);
        return;
      }
      setCustomer(cust);

      // Load orders
      const ords = await getCustomerOrdersAction(s.id, cust.customerId, 'id', cust.phone || undefined);
      setOrders(ords);

      setLoading(false);
    }
    loadData();
  }, [slug, router]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'settings') setActiveTab('settings');
    else if (tab === 'purchases') setActiveTab('purchases');
  }, [searchParams]);

  const handleLogout = async () => {
    await logoutCustomerAction();
    router.push(`/store/${slug}`);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    
    if (newPassword !== confirmPassword) {
      setPassError('كلمات المرور الجديدة غير متطابقة');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsChangingPass(true);
    const res = await changeCustomerPasswordAction(oldPassword, newPassword);
    setIsChangingPass(false);

    if (res.success) {
      setPassSuccess('تم تغيير كلمة المرور بنجاح');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPassError(res.error || 'حدث خطأ غير متوقع');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('هل أنت متأكد من حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
      const res = await deleteCustomerAccountAction();
      if (res.success) {
        router.push(`/store/${slug}`);
      } else {
        alert(res.error);
      }
    }
  };

  if (loading || !store || !customer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeCurrency = typeof window !== 'undefined' ? (localStorage.getItem('preferred_currency') || store.baseCurrency) : store.baseCurrency;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 font-sans text-slate-900 dark:text-slate-100 pb-20">
      
      {/* Header */}
      <header className="bg-white dark:bg-slateDark-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base">حسابي</h1>
              <p className="text-xs text-slate-500">{store.name}</p>
            </div>
          </div>

          <Link href={`/store/${slug}`} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <span>العودة للمتجر</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-slateDark-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-2xl font-black shadow-lg">
              {customer.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-black">{customer.name}</h2>
              <p className="text-sm text-slate-500 mt-1" dir="ltr">{customer.phone || customer.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            تسجيل خروج
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 px-2">
          <button
            onClick={() => setActiveTab('purchases')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 ${
              activeTab === 'purchases' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            مشترياتك
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-sm transition-colors border-b-2 ${
              activeTab === 'settings' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            إعدادات الحساب
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-slateDark-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              <h3 className="font-black text-lg mb-6">سجل طلباتي</h3>
              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-bold">لا توجد طلبات سابقة</p>
                  <p className="text-xs mt-1">لم تقم بإجراء أي طلب من هذا المتجر بعد.</p>
                  <Link href={`/store/${slug}`} className="inline-block mt-4 text-brand-600 font-bold text-sm">تصفح المنتجات</Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {orders.map((o) => {
                    const tConverted = convertCurrency(o.total, store.baseCurrency, activeCurrency);
                    return (
                      <div key={o.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm">طلب رقم {o.orderNumber}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(o.createdAt).toLocaleDateString('ar-EG')}</p>
                          </div>
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-bold">
                            {o.status === 'delivered' ? 'مكتمل' : o.status === 'shipped' ? 'مشحون' : 'قيد المعالجة'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                          <p className="font-black text-brand-600">{formatCurrency(tConverted, activeCurrency)}</p>
                          <Link href={`/store/${slug}/track/${o.id}`} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5" />
                            عرض الفاتورة
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              
              {/* Change Password */}
              <div>
                <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-brand-600" />
                  تغيير كلمة المرور
                </h3>
                <p className="text-xs text-slate-500 mb-6">قم بتحديث كلمة المرور الخاصة بحسابك في هذا المتجر لحماية بياناتك.</p>
                
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                  {passError && <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{passError}</div>}
                  {passSuccess && <div className="p-3 bg-green-50 text-green-600 text-xs font-bold rounded-xl">{passSuccess}</div>}
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الحالية</label>
                    <input 
                      type="password" 
                      required
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                    <input 
                      type="password" 
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-brand-500 outline-none" 
                      placeholder="••••••••"
                    />
                  </div>
                  <button 
                    disabled={isChangingPass}
                    type="submit" 
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-all"
                  >
                    {isChangingPass ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                  </button>
                </form>
              </div>

              {/* Delete Account */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-black text-lg mb-2 text-red-600 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  حذف الحساب
                </h3>
                <p className="text-xs text-slate-500 mb-4 max-w-md">عند حذف حسابك، سيتم مسح بيانات تسجيل الدخول ولن تتمكن من تتبع طلباتك السابقة من خلال لوحة التحكم.</p>
                <button 
                  onClick={handleDeleteAccount}
                  className="px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm rounded-xl transition-all"
                >
                  حذف الحساب نهائياً
                </button>
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}
