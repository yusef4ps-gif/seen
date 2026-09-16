'use client';

import React, { useState, useEffect } from 'react';
import { 
  Store as StoreIcon, Phone, Clock, CheckCircle2, 
  XCircle, Activity, Calendar, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStoresAction, approveStoreRequestAction, rejectStoreRequestAction, deleteStoreAction } from '@/app/actions/store';
import { Store } from '@/lib/types';

export default function StoreRequestsTab() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'rejected'>('pending');

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
    toast.loading('جاري التفعيل...', { id: 'approve' });
    const res = await approveStoreRequestAction(id);
    if (res.success) {
      toast.success('تم الموافقة وتفعيل المتجر بنجاح!', { id: 'approve' });
      fetchStores();
    } else {
      toast.error(res.error || 'حدث خطأ', { id: 'approve' });
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
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeSubTab === 'pending' 
                ? 'bg-white dark:bg-slateDark-700 text-brand-600 dark:text-brand-400 shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            قيد المراجعة ({pendingStores.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
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
