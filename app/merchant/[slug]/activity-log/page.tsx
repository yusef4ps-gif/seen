'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { History, Search, Filter, Monitor, Smartphone, Clock, ShieldCheck, User } from 'lucide-react';
import { getStoreBySlugAction } from '@/app/actions/store';
import { getStoreActivitiesAction } from '@/app/actions/activity';
import { Store } from '@/lib/types';

export default function ActivityLogPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          const acts = await getStoreActivitiesAction(s.id);
          setActivities(acts);
        }
      }
      setIsLoading(false);
    }
    init();
  }, [slug]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-500 font-bold">جاري تحميل السجلات...</div>;
  }

  if (!store) return null;

  const filteredActivities = activities.filter(act => {
    const matchesSearch = 
      act.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      act.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || act.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    if (action === 'إضافة') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    if (action === 'حذف') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800';
    if (action === 'تعديل') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800';
    return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  const getActionIcon = (action: string) => {
    return <ShieldCheck className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-brand-600" />
            <span>سجل الحركات (Audit Log)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            مراقبة كافة عمليات الإضافة، التعديل، والحذف التي يقوم بها الموظفون داخل المتجر
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث باسم الموظف أو تفاصيل الحركة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          >
            <option value="all">كافة الحركات</option>
            <option value="إضافة">إضافات فقط</option>
            <option value="تعديل">تعديلات فقط</option>
            <option value="حذف">حذوفات فقط</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-bold text-sm">
            لا توجد حركات مسجلة تطابق بحثك حالياً.
          </div>
        ) : (
          <div className="relative border-r-2 border-slate-100 dark:border-slate-800 mr-4 pr-6 space-y-8">
            {filteredActivities.map((act) => (
              <div key={act.id} className="relative">
                {/* Timeline Node */}
                <div className={`absolute -right-[35px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slateDark-900 ${
                  act.action === 'إضافة' ? 'bg-emerald-500' :
                  act.action === 'حذف' ? 'bg-red-500' :
                  'bg-blue-500'
                }`}>
                  {getActionIcon(act.action)}
                </div>
                
                {/* Content */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${getActionColor(act.action)}`}>
                          {act.action} {act.entity}
                        </span>
                        <span className="text-slate-900 dark:text-white font-bold text-sm">
                          {act.details}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 mt-2">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>بواسطة: <span className="text-brand-600 dark:text-brand-400">{act.userName}</span></span>
                        </div>
                        <div className="flex items-center gap-1">
                          {act.device.includes('جوال') ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                          <span>{act.device}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-white dark:bg-slateDark-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(act.createdAt))}</span>
                      <span>-</span>
                      <span>{new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(act.createdAt))}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
