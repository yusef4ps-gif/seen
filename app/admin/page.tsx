import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { logSystemAction } from '@/app/actions/logs';

export default async function BlockedAdminPage() {
  // Log the firewall hit
  await logSystemAction('FIREWALL_BLOCK_HIT', { message: 'تم فتح صفحة الحظر (Firewall)' });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-red-900/50 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-red-900/20 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-600/20 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="w-20 h-20 bg-red-950/50 rounded-full flex items-center justify-center mx-auto border border-red-900/50">
          <ShieldAlert className="w-10 h-10 text-red-500 animate-pulse" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-red-500 tracking-tight">محظور (Access Denied)</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            محاولة وصول غير مصرح بها. تم تسجيل عنوان الـ IP الخاص بك وإشعار الإدارة.
          </p>
        </div>
        
        <div className="pt-4 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 font-mono">
            SEEN Security Firewall (v4.2.0) - Error Code: 403_FORBIDDEN
          </p>
        </div>
      </div>
    </div>
  );
}
