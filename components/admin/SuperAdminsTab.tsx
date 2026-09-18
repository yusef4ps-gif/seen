'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, Loader2, AlertCircle, CheckCircle2, UserPlus, Mail, Phone, Lock } from 'lucide-react';
import { createSuperAdminAction } from '@/app/actions/auth';
import { User } from '@/lib/types';

export default function SuperAdminsTab() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/super-admins');
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    if (formData.password.length < 4) {
      setError('كلمة المرور يجب أن تكون 4 أحرف على الأقل.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await createSuperAdminAction(formData);
      if (result.success) {
        setSuccess('تم إضافة المدير بنجاح!');
        setFormData({ name: '', email: '', phone: '', password: '' });
        fetchAdmins(); // refresh list
      } else {
        setError(result.error || 'حدث خطأ أثناء الإضافة.');
      }
    } catch (e) {
      setError('حدث خطأ غير متوقع.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Add New Admin Form */}
      <div className="bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">إضافة مدير جديد</h2>
            <p className="text-xs text-slate-500">منح صلاحيات الإدارة العليا لشخص جديد.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-bold animate-pulse">
            <CheckCircle2 className="w-4 h-4" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الاسم الكامل</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="email"
                name="email"
                required
                dir="ltr"
                value={formData.email}
                onChange={handleChange}
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all text-right"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم الجوال</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                name="phone"
                required
                dir="ltr"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all text-right"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">كلمة المرور المؤقتة</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                name="password"
                required
                dir="ltr"
                value={formData.password}
                onChange={handleChange}
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slateDark-950 border border-slate-200 dark:border-slateDark-800 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all text-right"
              />
            </div>
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>إضافة المدير</span>}
            </button>
          </div>
        </form>
      </div>

      {/* Admins List */}
      <div className="bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800 rounded-3xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slateDark-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">قائمة المدراء</h2>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        ) : admins.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            لا يوجد مدراء حالياً (باستثناء حسابك).
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slateDark-800 text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 text-right text-xs font-bold">المدير</th>
                  <th className="py-3 px-4 text-right text-xs font-bold">البريد الإلكتروني</th>
                  <th className="py-3 px-4 text-right text-xs font-bold">رقم الجوال</th>
                  <th className="py-3 px-4 text-right text-xs font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b border-slate-100 dark:border-slateDark-800/50 hover:bg-slate-50 dark:hover:bg-slateDark-800/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{admin.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-500 font-mono text-right" dir="ltr">{admin.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-500 font-mono text-right" dir="ltr">{admin.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        admin.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {admin.status === 'active' ? 'نشط' : 'معلق'}
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
