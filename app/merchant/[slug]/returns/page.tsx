'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  RefreshCw, CheckCircle2, AlertTriangle, Eye, X, Check, PackageX
} from 'lucide-react';
import { Store, Order } from '@/lib/types';
import { getStoreBySlugAction } from '@/app/actions/store';
import { getStoreReturnsAction, updateOrderReturnStatusAction } from '@/app/actions/order';
import { formatCurrency } from '@/lib/currency-engine';

export default function MerchantReturnsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [returns, setReturns] = useState<any[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadReturns = async (storeId: string) => {
    const res = await getStoreReturnsAction(storeId);
    if (res.success && res.returns) {
      setReturns(res.returns);
    }
  };

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          await loadReturns(s.id);
        }
      }
    }
    init();
  }, [slug]);

  const handleUpdateStatus = async (returnId: string, newStatus: 'restocked' | 'damaged') => {
    setIsProcessing(true);
    await updateOrderReturnStatusAction(returnId, store!.id, newStatus);
    await loadReturns(store!.id);
    setSelectedReturn(null);
    setIsProcessing(false);
  };

  if (!store) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-brand-600" />
            <span>إدارة المرتجعات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            مراجعة طلبات الإرجاع واتخاذ قرار بإعادة المنتجات للمخزون أو إتلافها.
          </p>
        </div>
      </div>

      {/* Returns List */}
      <div className="bg-white dark:bg-slateDark-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">رقم الطلب</th>
                <th className="py-3 px-4">تاريخ الإرجاع</th>
                <th className="py-3 px-4">المبلغ المسترد</th>
                <th className="py-3 px-4">حالة المرتجع</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">لا توجد طلبات إرجاع حالياً.</td>
                </tr>
              ) : (
                returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {ret.order?.orderNumber || 'غير معروف'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(ret.createdAt).toLocaleString('ar-YE', { dateStyle: 'short' })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(ret.refundAmount, ret.order?.currency || store.baseCurrency)}
                    </td>
                    <td className="py-3.5 px-4">
                      {ret.status === 'pending_inspection' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 text-xs font-bold border border-amber-200 dark:border-amber-800/50">
                          قيد الفحص
                        </span>
                      ) : ret.status === 'restocked' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/50">
                          أُعيد للمخزون
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400 text-xs font-bold border border-red-200 dark:border-red-800/50">
                          تالف
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedReturn(ret)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                        title="تفاصيل المرتجع"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Detail Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  تفاصيل مرتجع للطلب #{selectedReturn.order?.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400 space-y-2">
                <div className="font-bold">سبب الإرجاع:</div>
                <div className="text-sm">{selectedReturn.reason || 'لم يتم تحديد سبب.'}</div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">المنتجات المرتجعة:</div>
                {JSON.parse(selectedReturn.items).map((ri: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <img src={ri.item.productImage} alt={ri.item.productName} className="w-10 h-10 rounded-lg object-cover bg-white" />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{ri.item.productName}</div>
                      <div className="text-[10px] text-slate-500">الكمية: {ri.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedReturn.status === 'pending_inspection' && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="font-bold text-slate-900 dark:text-white">القرار:</div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleUpdateStatus(selectedReturn.id, 'restocked')}
                      disabled={isProcessing}
                      className="py-3 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>سليم - إرجاع للمخزون</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedReturn.id, 'damaged')}
                      disabled={isProcessing}
                      className="py-3 px-4 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <PackageX className="w-4 h-4" />
                      <span>تالف - عدم الإرجاع</span>
                    </button>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
