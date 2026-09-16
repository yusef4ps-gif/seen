'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, Store as StoreIcon, Phone, User, Clock, CheckCircle2, 
  XCircle, ArrowRight, Activity, Calendar
} from 'lucide-react';
import { getStoresAction, approveStoreRequestAction, rejectStoreRequestAction, deleteStoreAction } from '@/app/actions/store';
import { Store } from '@/lib/types';
import BrandLogo from '@/components/BrandLogo';

export default function StoreRequestsPage() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected'>('pending');

  const fetchStores = async () => {
    setIsLoading(true);
    const res = await getStoresAction();
    if (res.success && res.stores) {
      setStores(res.stores as any);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm('هل أنت متأكد من تفعيل هذا المتجر؟')) return;
    const res = await approveStoreRequestAction(id);
    if (res.success) {
      alert('تم الموافقة على المتجر وتفعيله!');
      fetchStores();
    } else {
      alert(res.error || 'حدث خطأ');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('هل أنت متأكد من رفض هذا الطلب؟ سيتم تحويله للمرفوضات.')) return;
    const res = await rejectStoreRequestAction(id);
    if (res.success) {
      alert('تم رفض الطلب بنجاح.');
      fetchStores();
    } else {
      alert(res.error || 'حدث خطأ');
    }
  };
  
  const handlePermanentDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المتجر نهائياً من قاعدة البيانات وتحرير الرابط الخاص به؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    const res = await deleteStoreAction(id);
    if (res.success) {
      alert('تم حذف المتجر نهائياً.');
      fetchStores();
    } else {
      alert(res.error || 'حدث خطأ');
    }
  };

  const pendingStores = stores.filter(s => s.planStatus === 'pending_approval');
  const rejectedStores = stores.filter(s => s.planStatus === 'rejected');
  
  const displayStores = activeTab === 'pending' ? pendingStores : rejectedStores;

  const formatDate = (dateInput: Date | string) => {
    if (!dateInput) return 'غير محدد';
    const d = new Date(dateInput);
    return new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 text-slate-900 dark:text-slate-100 font-sans">
      <header className="bg-[#0f2b48] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-4">
          <BrandLogo size="md" />
          <div className="h-6 w-px bg-white/20 mx-2 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="font-black tracking-tight text-lg hidden sm:block">طلبات المتاجر الجديدة</h1>
          </div>
        </div>
        <Link 
          href="/seenayhq7x"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-bold"
        >
          <span>العودة للإدارة</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-8">
        
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 mb-8 pb-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'pending' 
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>قيد المراجعة ({pendingStores.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'rejected' 
                ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <XCircle className="w-5 h-5" />
            <span>المرفوضة ({rejectedStores.length})</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Activity className="w-10 h-10 text-brand-500 animate-spin" />
          </div>
        ) : displayStores.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <h3 className="text-xl font-bold mb-2">لا توجد طلبات هنا</h3>
            <p className="text-sm">لم يتم العثور على أي متاجر بهذه الحالة.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {displayStores.map(store => (
              <div key={store.id} className="bg-white dark:bg-slateDark-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                
                <div className="flex items-start gap-4">
                  <img src={store.logo} alt={store.name} className="w-16 h-16 rounded-2xl object-cover bg-slate-100 border border-slate-200 dark:border-slate-700" />
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{store.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">{store.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <StoreIcon className="w-3.5 h-3.5" />
                        <span>الرابط: seens.net/store/{store.slug}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Phone className="w-3.5 h-3.5" />
                        <a href={`https://wa.me/${store.whatsapp}`} target="_blank" className="hover:text-emerald-500 transition-colors">
                          {store.whatsapp || store.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>الطلب: {formatDate(store.createdAt)}</span>
                      </div>
                      {activeTab === 'rejected' && store.planEndDate && (
                        <div className="flex items-center gap-1.5 text-red-500">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>يُحذف نهائياً في: {formatDate(store.planEndDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:shrink-0 pt-4 sm:pt-0 border-t border-slate-100 dark:border-slate-800 sm:border-0">
                  {activeTab === 'pending' ? (
                    <>
                      <button 
                        onClick={() => handleApprove(store.id)}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>موافقة وتفعيل</span>
                      </button>
                      <button 
                        onClick={() => handleReject(store.id)}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/40 dark:text-red-400 dark:hover:bg-red-900/60 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>رفض الطلب</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleApprove(store.id)}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تراجع وموافقة</span>
                      </button>
                      <button 
                        onClick={() => handlePermanentDelete(store.id)}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>حذف نهائي</span>
                      </button>
                    </>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
