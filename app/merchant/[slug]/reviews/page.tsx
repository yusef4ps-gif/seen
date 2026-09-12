'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Star, MessageSquare, Check, X, EyeOff, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { getStoreReviewsForMerchantAction, updateReviewStatusAction, deleteReviewAction } from '@/app/actions/review';
import { getStoreBySlugAction } from '@/app/actions/store';
import { Store } from '@/lib/types';

export default function MerchantReviewsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'published'>('pending');

  useEffect(() => {
    async function loadData() {
      if (!slug) return;
      const s = await getStoreBySlugAction(slug);
      if (s) {
        setStore(s as any);
        const res = await getStoreReviewsForMerchantAction(s.id);
        if (res.success && res.data) {
          setReviews(res.data);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [slug]);

  const handleUpdateStatus = async (reviewId: string, status: 'pending' | 'published' | 'hidden') => {
    if (!store) return;
    const res = await updateReviewStatusAction(reviewId, store.id, status);
    if (res.success) {
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, status } : r));
    } else {
      alert(res.error || 'حدث خطأ');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!store) return;
    if (!confirm('هل أنت متأكد من حذف هذا التقييم نهائياً؟')) return;
    
    const res = await deleteReviewAction(reviewId, store.id);
    if (res.success) {
      setReviews(reviews.filter(r => r.id !== reviewId));
    } else {
      alert(res.error || 'حدث خطأ');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 animate-pulse text-brand-500" />
          <span>جاري تحميل التقييمات...</span>
        </div>
      </div>
    );
  }

  const pendingReviews = reviews.filter(r => r.status === 'pending');
  const publishedReviews = reviews.filter(r => r.status === 'published');
  
  const displayReviews = activeTab === 'pending' ? pendingReviews : publishedReviews;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-600" />
            الآراء والتقييمات
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            إدارة تقييمات العملاء لمنتجاتك وخدماتك.
          </p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === 'pending' 
              ? 'text-brand-600 dark:text-brand-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          قيد المراجعة
          <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px]">
            {pendingReviews.length}
          </span>
          {activeTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('published')}
          className={`pb-4 px-2 text-sm font-bold flex items-center gap-2 transition-all relative ${
            activeTab === 'published' 
              ? 'text-brand-600 dark:text-brand-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          المنشورة
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px]">
            {publishedReviews.length}
          </span>
          {activeTab === 'published' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600 rounded-t-full" />
          )}
        </button>
      </div>

      <div className="space-y-4">
        {displayReviews.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">لا توجد تقييمات {activeTab === 'pending' ? 'قيد المراجعة' : 'منشورة'} حالياً.</p>
          </div>
        ) : (
          displayReviews.map(review => (
            <div key={review.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center font-bold text-sm">
                    {review.customer.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{review.customer.name}</h3>
                    <div className="flex text-yellow-400 text-[10px] mt-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 mr-auto sm:ml-4 sm:mr-0">
                    {new Date(review.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
                
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  "{review.content}"
                </p>
              </div>

              <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-4 sm:pt-0 sm:border-0">
                {activeTab === 'pending' ? (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(review.id, 'published')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      نشر
                    </button>
                    <button 
                      onClick={() => handleDelete(review.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(review.id, 'pending')}
                      className="flex-1 sm:flex-none px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl text-xs font-bold hover:bg-orange-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <EyeOff className="w-4 h-4" />
                      إخفاء
                    </button>
                    <button 
                      onClick={() => handleDelete(review.id)}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
