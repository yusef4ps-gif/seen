'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { History, Search, Filter, Monitor, Smartphone, Calendar } from 'lucide-react';
import { getStoreBySlugAction } from '@/app/actions/store';
import { getStoreActivitiesAction } from '@/app/actions/activity';
import { Store } from '@/lib/types';

export default function ActivityLogPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year' | 'custom'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

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

  const uniqueEmployees = useMemo(() => {
    const names = new Set(activities.map(a => a.userName));
    return Array.from(names);
  }, [activities]);

  const filteredActivities = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return activities.filter(act => {
      // Name or Details Search
      const matchesSearch = 
        act.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        act.details.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Action Type Filter
      const matchesAction = actionFilter === 'all' || act.action === actionFilter;
      
      // Employee Filter
      const matchesEmployee = employeeFilter === 'all' || act.userName === employeeFilter;
      
      // Date Filter
      let matchesDate = true;
      const actDate = new Date(act.createdAt);
      if (dateFilter === 'today') {
        matchesDate = actDate >= today;
      } else if (dateFilter === 'week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        matchesDate = actDate >= lastWeek;
      } else if (dateFilter === 'month') {
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        matchesDate = actDate >= lastMonth;
      } else if (dateFilter === 'year') {
        const lastYear = new Date(today);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        matchesDate = actDate >= lastYear;
      } else if (dateFilter === 'custom' && dateRange.start && dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        matchesDate = actDate >= new Date(dateRange.start) && actDate <= end;
      }

      return matchesSearch && matchesAction && matchesEmployee && matchesDate;
    });
  }, [activities, searchTerm, actionFilter, employeeFilter, dateFilter, dateRange]);


  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-slate-500 font-bold">جاري تحميل السجلات...</div>;
  }

  if (!store) return null;

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
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

      {/* Filters Area */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Top Filters (Search, Employee, Action) */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-1/3">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="text"
              placeholder="بحث وتصفية..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="w-full md:w-1/3 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none"
            >
              <option value="all">كل الموظفين</option>
              {uniqueEmployees.map(emp => (
                <option key={emp as string} value={emp as string}>{emp as string}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/3 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full text-xs font-bold bg-transparent text-slate-900 dark:text-white outline-none"
            >
              <option value="all">كافة الحركات</option>
              <option value="إضافة">إضافات فقط</option>
              <option value="تعديل">تعديلات فقط</option>
              <option value="حذف">حذوفات فقط</option>
            </select>
          </div>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => setDateFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'all' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >الكل</button>
              <button 
                onClick={() => setDateFilter('today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'today' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >اليوم</button>
              <button 
                onClick={() => setDateFilter('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'week' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >هذا الأسبوع</button>
              <button 
                onClick={() => setDateFilter('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'month' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >هذا الشهر</button>
              <button 
                onClick={() => setDateFilter('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'year' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >سنة</button>
              <button 
                onClick={() => setDateFilter('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${dateFilter === 'custom' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              ><Calendar className="w-3 h-3"/> مخصص</button>
            </div>
            
            {dateFilter === 'custom' && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none font-mono" />
                <span className="text-slate-400 text-xs">إلى</span>
                <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none font-mono" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-bold text-sm">
            لا توجد حركات مسجلة تطابق التصفية الحالية.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">الاسم</th>
                  <th className="p-4">نوع الحركة</th>
                  <th className="p-4">تاريخ</th>
                  <th className="p-4">وقت</th>
                  <th className="p-4">نوع الجهاز</th>
                  <th className="p-4 w-full">الحركة اللي عملها</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-brand-700 dark:text-brand-400">
                      {act.userName}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                        act.action === 'إضافة' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                        act.action === 'حذف' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800' :
                        act.action === 'تعديل' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                        {act.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">
                      {new Intl.DateTimeFormat('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(act.createdAt))}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300 font-mono">
                      {new Intl.DateTimeFormat('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(act.createdAt))}
                    </td>
                    <td className="p-4 text-slate-500">
                      <div className="flex items-center gap-1.5">
                        {act.device.includes('جوال') ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                        <span>{act.device}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-900 dark:text-white whitespace-normal block min-w-[200px]">
                        {act.details}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
