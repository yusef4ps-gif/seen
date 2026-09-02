'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, KeyRound, ShieldCheck, UserPlus, Phone, Mail, 
  CheckCircle2, Lock, ArrowLeft, Building2, Eye, ShieldAlert
} from 'lucide-react';
import { authEngine } from '@/lib/auth-engine';
import { User, Store, StaffPermission } from '@/lib/types';
import { getStoreBySlugAction } from '@/app/actions/store';

export default function MerchantStaffPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          // Get staff and owner for this store
          const team = authEngine.getUsers(s.id);
          setStaffMembers(team.filter((u) => u.role === 'STORE_STAFF' || u.role === 'STORE_OWNER'));
        }
      }
    }
    init();
  }, [slug]);

  if (!store) return null;

  const getPermissionLabel = (perm: StaffPermission) => {
    switch (perm) {
      case 'manage_products': return 'المنتجات والتصنيفات';
      case 'manage_inventory': return 'إدارة المخزون والتوريد';
      case 'manage_orders': return 'إدارة وتدقيق الطلبات';
      case 'manage_customers': return 'قاعدة بيانات العملاء';
      case 'manage_marketing': return 'السلات والعروض';
      case 'view_analytics': return 'التقارير والمبيعات';
      case 'manage_settings': return 'إعدادات المتجر والمحافظ';
      case 'manage_theme': return 'تخصيص القوالب والهوية';
      default: return perm;
    }
  };

  return (
    <div className="space-y-6 text-right font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>فريق العمل وتفويض الصلاحيات (Staff & RBAC)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
              {staffMembers.length} أعضاء
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            إدارة موظفي متجر {store.name}، وتوزيع مهام المحاسبة والمخازن والتوصيل
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const name = prompt('اسم الموظف الجديد:');
              if (!name) return;
              const phone = prompt('رقم هاتف الموظف:');
              if (!phone) return;
              
              authEngine.createUserByAdmin({
                name,
                email: `${phone}@seen.store`,
                phone,
                password: '123',
                role: 'STORE_STAFF',
                staffTitle: 'موظف مبيعات',
                storeId: store.id,
                storeSlug: store.slug,
                storeName: store.name,
                permissions: ['manage_orders', 'manage_products']
              });
              
              const team = authEngine.getUsers(store.id);
              setStaffMembers(team.filter((u) => u.role === 'STORE_STAFF' || u.role === 'STORE_OWNER'));
              alert('تمت إضافة الموظف بنجاح! كلمة المرور الافتراضية هي 123');
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف جديد مباشرة</span>
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staffMembers.map((member) => {
          const isOwner = member.role === 'STORE_OWNER';

          return (
            <div
              key={member.id}
              className="p-5 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                      alt={member.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">{member.name}</h3>
                      <div className="text-[11px] text-slate-400 font-mono">{member.email}</div>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                    isOwner
                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
                  }`}>
                    {isOwner ? '👑 مالك المتجر' : `🛠️ ${member.staffTitle || 'موظف'}`}
                  </span>
                </div>

                {/* Contact info */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>الهاتف: <strong>{member.phone}</strong></span>
                  <span className="text-[10px] text-emerald-600 font-bold">الحساب نشط ✓</span>
                </div>

                {/* Permissions Badges */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-500">الأذونات الممنوحة:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {isOwner ? (
                      <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200 text-[10px] font-bold">
                        صلاحيات كاملة مطلقة (Full Access)
                      </span>
                    ) : member.permissions && member.permissions.length > 0 ? (
                      member.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200 dark:border-slate-700"
                        >
                          ✓ {getPermissionLabel(perm)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-400">لا توجد صلاحيات مخصصة</span>
                    )}
                  </div>
                </div>

              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>تاريخ التعيين: {new Date(member.createdAt).toLocaleDateString('ar-YE')}</span>
                <span>آخر نشاط: {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleTimeString('ar-YE') : 'اليوم'}</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
