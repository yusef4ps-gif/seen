'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, ArrowLeft, Activity, ShieldAlert, Lock, Unlock, Search, Calendar, Globe, AlertCircle, Ban, Server, Clock, SearchIcon, Filter, Trash2, RefreshCw, CheckCircle2
} from 'lucide-react';
import { getSystemLogsAction, getBlockedIPsAction, blockIPAction, unblockIPAction } from '@/app/actions/logs';

export default function AdminLogsPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'blocked'>('logs');
  
  const [logs, setLogs] = useState<any[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [blockIpAddress, setBlockIpAddress] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    const res = await getSystemLogsAction();
    if (res.success && res.data) {
      setLogs(res.data);
    }
    const blockRes = await getBlockedIPsAction();
    if (blockRes.success && blockRes.data) {
      setBlockedIPs(blockRes.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleBlockIP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockIpAddress) return;
    setIsBlocking(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    const res = await blockIPAction(blockIpAddress, blockReason);
    if (res.success) {
      setSuccessMsg('تم حظر عنوان الـ IP بنجاح');
      setBlockIpAddress('');
      setBlockReason('');
      fetchLogs();
    } else {
      setErrorMsg(res.error || 'حدث خطأ');
    }
    setIsBlocking(false);
  };

  const handleUnblockIP = async (id: string) => {
    if (!confirm('هل أنت متأكد من فك الحظر عن هذا العنوان؟')) return;
    const res = await unblockIPAction(id);
    if (res.success) {
      setSuccessMsg('تم فك الحظر بنجاح');
      fetchLogs();
    } else {
      setErrorMsg('حدث خطأ أثناء فك الحظر');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slateDark-950 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-slateDark-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link 
              href="/seenayhq7x" 
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-brand-600 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">سجل النظام الأمني</h1>
                <p className="text-xs text-slate-500">تتبع العمليات الحساسة وعناوين IP</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="w-5 h-5" />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30 flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5" />
            {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white dark:bg-slate-900 p-1 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'logs' 
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            سجل العمليات
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'blocked' 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Ban className="w-4 h-4" />
            قائمة الحظر (IPs)
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        ) : activeTab === 'logs' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                <div className="relative">
                  <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="ابحث في السجلات..." 
                    className="w-full md:w-64 pl-4 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-brand-500 transition-colors text-white"
                  />
                </div>
                <button onClick={fetchLogs} className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors text-slate-300 hover:text-white" title="تحديث البيانات">
                  <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-brand-500' : ''}`} />
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">العملية</th>
                      <th className="px-6 py-4">عنوان IP</th>
                      <th className="px-6 py-4">التاريخ والوقت</th>
                      <th className="px-6 py-4">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">لا توجد سجلات حالياً</td>
                      </tr>
                    ) : logs.map((log) => {
                      // Helpers
                      const getActionName = (action: string) => {
                        const map: Record<string, string> = {
                          'FIREWALL_BLOCK_HIT': 'زيارة صفحة الحظر (Firewall)',
                          'ADMIN_LOGIN_SUCCESS': 'تسجيل دخول ناجح',
                          'ADMIN_LOGIN_FAILED': 'فشل تسجيل الدخول',
                          'ADMIN_ACCESS_BLOCKED': 'محاولة وصول محظورة',
                          'AUTO_BLOCK_IP': 'حظر تلقائي للـ IP'
                        };
                        return map[action] || action;
                      };

                      const formatDetails = (details: string) => {
                        try {
                          const parsed = JSON.parse(details);
                          let result = '';
                          if (parsed.message) result += parsed.message;
                          if (parsed.username) result += `المستخدم: ${parsed.username}`;
                          if (parsed.location) result += ` | الموقع: ${parsed.location}`;
                          
                          if (result) return result;
                          return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`).join(' | ');
                        } catch(e) {
                          return details;
                        }
                      };

                      return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            log.action.includes('SUCCESS') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            log.action.includes('FAILED') || log.action.includes('BLOCK') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {getActionName(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400" dir="ltr">{log.ipAddress}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(log.createdAt).toLocaleString('ar-SA')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-500 max-w-xs truncate" title={log.details}>
                          {formatDetails(log.details)}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add Block */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                حظر عنوان IP جديد
              </h2>
              <form onSubmit={handleBlockIP} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">عنوان IP المستهدف</label>
                  <input 
                    type="text" 
                    required
                    value={blockIpAddress}
                    onChange={(e) => setBlockIpAddress(e.target.value)}
                    placeholder="مثال: 192.168.1.1"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm font-mono"
                    dir="ltr"
                  />
                </div>
                <div className="flex-[2] w-full space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">سبب الحظر (اختياري)</label>
                  <input 
                    type="text"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="سبب أمني، محاولات دخول متكررة..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isBlocking || !blockIpAddress}
                  className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-xl font-bold transition-colors disabled:opacity-50 h-[42px]"
                >
                  {isBlocking ? 'جاري التنفيذ...' : 'تنفيذ الحظر'}
                </button>
              </form>
            </div>

            {/* Blocked IPs Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4">عنوان IP</th>
                      <th className="px-6 py-4">سبب الحظر</th>
                      <th className="px-6 py-4">تاريخ الحظر</th>
                      <th className="px-6 py-4">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {blockedIPs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">لا توجد عناوين محظورة حالياً</td>
                      </tr>
                    ) : blockedIPs.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-red-600 dark:text-red-400" dir="ltr">{b.ipAddress}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{b.reason || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(b.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleUnblockIP(b.id)}
                            className="text-sm font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 flex items-center gap-1.5"
                          >
                            <Unlock className="w-4 h-4" />
                            فك الحظر
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
