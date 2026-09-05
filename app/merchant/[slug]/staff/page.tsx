'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  UserPlus, Phone, ShieldCheck, CheckCircle2, Lock, Edit, Ban, PlayCircle, Trash2
} from 'lucide-react';
import { authEngine } from '@/lib/auth-engine';
import { User, Store, StaffPermission } from '@/lib/types';
import { getStoreBySlugAction } from '@/app/actions/store';
import { logActivityAction } from '@/app/actions/activity';

const AVAILABLE_PERMISSIONS: { id: StaffPermission, label: string }[] = [
  { id: 'manage_products', label: 'المنتجات والتصنيفات' },
  { id: 'manage_inventory', label: 'إدارة المخزون والتوريد' },
  { id: 'manage_orders', label: 'إدارة وتدقيق الطلبات' },
  { id: 'manage_customers', label: 'قاعدة بيانات العملاء' },
  { id: 'manage_marketing', label: 'السلات والعروض' },
  { id: 'view_analytics', label: 'التقارير والمبيعات' },
  { id: 'manage_settings', label: 'إعدادات المتجر والمحافظ' },
  { id: 'manage_theme', label: 'تخصيص القوالب والهوية' }
];

export default function MerchantStaffPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  
  // Add Employee State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    phone: '',
    staffTitle: 'مدير',
    password: '',
    salary: '',
    startDate: new Date().toISOString().split('T')[0],
    permissions: [] as StaffPermission[]
  });

  // Edit Employee State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);

  const refreshStaff = (storeId: string) => {
    const team = authEngine.getUsers(storeId);
    setStaffMembers(team.filter((u) => u.role === 'STORE_STAFF' || u.role === 'STORE_OWNER'));
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.phone || !newEmployee.password || !store) return;
    
    authEngine.createUserByAdmin({
      name: newEmployee.name,
      email: `${newEmployee.phone}@seen.store`,
      phone: newEmployee.phone,
      password: newEmployee.password,
      role: 'STORE_STAFF',
      staffTitle: newEmployee.staffTitle,
      salary: Number(newEmployee.salary) || undefined,
      startDate: newEmployee.startDate || undefined,
      storeId: store.id,
      storeSlug: store.slug,
      storeName: store.name,
      permissions: newEmployee.permissions
    });
    
    logActivityAction(store.id, 'ADD', `تمت إضافة الموظف الجديد: ${newEmployee.name}`, newEmployee.name, 'STAFF');

    refreshStaff(store.id);
    setIsAddModalOpen(false);
    setNewEmployee({
      name: '', phone: '', staffTitle: 'مدير', password: '', salary: '', 
      startDate: new Date().toISOString().split('T')[0], permissions: []
    });
  };

  const handleEditEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee || !store) return;
    
    authEngine.updateUser(editingEmployee.id, {
      name: editingEmployee.name,
      phone: editingEmployee.phone,
      password: editingEmployee.password,
      staffTitle: editingEmployee.staffTitle,
      salary: editingEmployee.salary,
      startDate: editingEmployee.startDate,
      permissions: editingEmployee.permissions
    });
    
    logActivityAction(store.id, 'UPDATE', `تم تعديل بيانات الموظف: ${editingEmployee.name}`, editingEmployee.name, 'STAFF');

    refreshStaff(store.id);
    setIsEditModalOpen(false);
    setEditingEmployee(null);
  };

  const handleToggleStatus = (userId: string) => {
    if (!store) return;
    if (confirm('هل أنت متأكد من تغيير حالة حساب هذا الموظف؟')) {
      authEngine.toggleUserStatus(userId);
      const user = authEngine.getUsers(store.id).find(u => u.id === userId);
      logActivityAction(store.id, 'UPDATE', `تم تغيير حالة حساب الموظف: ${user?.name || ''}`, user?.name || '', 'STAFF');
      refreshStaff(store.id);
    }
  };

  const handleDeleteEmployee = (userId: string) => {
    if (!store) return;
    if (confirm('هل أنت متأكد من حذف حساب الموظف نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      const user = authEngine.getUsers(store.id).find(u => u.id === userId);
      authEngine.deleteUser(userId);
      logActivityAction(store.id, 'DELETE', `تم حذف حساب الموظف: ${user?.name || ''}`, user?.name || '', 'STAFF');
      refreshStaff(store.id);
      setIsEditModalOpen(false);
      setEditingEmployee(null);
    }
  };

  const togglePermission = (perm: StaffPermission, isEditing: boolean) => {
    if (isEditing && editingEmployee) {
      const current = editingEmployee.permissions || [];
      const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
      setEditingEmployee({ ...editingEmployee, permissions: updated });
    } else {
      const current = newEmployee.permissions || [];
      const updated = current.includes(perm) ? current.filter(p => p !== perm) : [...current, perm];
      setNewEmployee({ ...newEmployee, permissions: updated });
    }
  };

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          refreshStaff(s.id);
        }
      }
    }
    init();
  }, [slug]);

  if (!store) return null;

  const getPermissionLabel = (perm: StaffPermission) => {
    const p = AVAILABLE_PERMISSIONS.find(x => x.id === perm);
    return p ? p.label : perm;
  };

  return (
    <div className="space-y-6 text-right font-sans pb-20">
      
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
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة موظف جديد</span>
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {staffMembers.map((member) => {
          const isOwner = member.role === 'STORE_OWNER';
          const isSuspended = member.status === 'suspended';

          return (
            <div
              key={member.id}
              className={`p-5 rounded-3xl bg-white dark:bg-slateDark-900 border ${isSuspended ? 'border-red-200 dark:border-red-900/50' : 'border-slate-200 dark:border-slate-800'} shadow-xs space-y-4 flex flex-col justify-between relative overflow-hidden`}
            >
              {isSuspended && (
                <div className="absolute top-0 right-0 left-0 bg-red-500/10 text-red-600 text-xs text-center py-1 font-bold backdrop-blur-sm z-10">
                  الحساب مُجمد (موقوف)
                </div>
              )}

              <div className={`space-y-3 ${isSuspended ? 'opacity-75 pt-4' : ''}`}>
                
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                      alt={member.name}
                      className={`w-12 h-12 rounded-2xl object-cover border ${isSuspended ? 'border-red-200 grayscale' : 'border-slate-200'} bg-slate-100`}
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        {member.name}
                      </h3>
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
                  <span className={`text-[10px] font-bold ${isSuspended ? 'text-red-500' : 'text-emerald-600'}`}>
                    {isSuspended ? 'الحساب معلق ⚠️' : 'الحساب نشط ✓'}
                  </span>
                </div>

                {/* Actions */}
                {!isOwner && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => { setEditingEmployee(member); setIsEditModalOpen(true); }}
                      className="flex-1 py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> تعديل
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(member.id)}
                      className={`flex-1 py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-colors flex items-center justify-center gap-1 ${
                        isSuspended ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                      }`}
                    >
                      {isSuspended ? <PlayCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                      {isSuspended ? 'تفعيل' : 'تجميد'}
                    </button>
                    <button 
                      onClick={() => handleDeleteEmployee(member.id)}
                      className="flex-1 py-1.5 px-1 rounded-lg text-[10px] sm:text-[11px] font-bold bg-red-50 hover:bg-red-100 text-red-600 transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> حذف
                    </button>
                  </div>
                )}

                {/* Permissions Badges */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-500">الأذونات الممنوحة:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {isOwner ? (
                      <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-800 text-[10px] font-bold">
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

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {(member.salary || member.startDate) && (
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                    {member.salary && <span>الراتب: {member.salary}</span>}
                    {member.startDate && <span>بدء العمل: {new Date(member.startDate).toLocaleDateString('ar-YE')}</span>}
                  </div>
                )}
                <div className="text-[10px] text-slate-400 flex items-center justify-between">
                  <span>تاريخ التعيين: {new Date(member.createdAt).toLocaleDateString('ar-YE')}</span>
                  <span>آخر نشاط: {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleTimeString('ar-YE') : 'اليوم'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Employee Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto pt-20">
          <div className="bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 my-auto">
            <div className="p-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6">
                {isEditModalOpen ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h2>
              <form onSubmit={isEditModalOpen ? handleEditEmployee : handleAddEmployee} className="space-y-5">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">اسم الموظف</label>
                    <input 
                      type="text" 
                      required 
                      value={isEditModalOpen ? editingEmployee?.name : newEmployee.name}
                      onChange={(e) => isEditModalOpen ? setEditingEmployee({...editingEmployee!, name: e.target.value}) : setNewEmployee({...newEmployee, name: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                      placeholder="مثال: أحمد محمد"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">رقم الهاتف (لتسجيل الدخول)</label>
                    <input 
                      type="tel" 
                      required 
                      value={isEditModalOpen ? editingEmployee?.phone : newEmployee.phone}
                      onChange={(e) => isEditModalOpen ? setEditingEmployee({...editingEmployee!, phone: e.target.value}) : setNewEmployee({...newEmployee, phone: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-left font-mono" 
                      placeholder="777000000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">كلمة المرور</label>
                    <input 
                      type="text" 
                      required 
                      value={isEditModalOpen ? editingEmployee?.password || '' : newEmployee.password}
                      onChange={(e) => isEditModalOpen ? setEditingEmployee({...editingEmployee!, password: e.target.value}) : setNewEmployee({...newEmployee, password: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-left font-mono" 
                      placeholder="مثال: 123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">المسمى الوظيفي</label>
                    <input 
                      type="text" 
                      required 
                      value={isEditModalOpen ? editingEmployee?.staffTitle || '' : newEmployee.staffTitle}
                      onChange={(e) => isEditModalOpen ? setEditingEmployee({...editingEmployee!, staffTitle: e.target.value}) : setNewEmployee({...newEmployee, staffTitle: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                      placeholder="مثال: مسؤول مبيعات"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">الراتب (اختياري)</label>
                    <input 
                      type="number" 
                      value={isEditModalOpen ? editingEmployee?.salary || '' : newEmployee.salary}
                      onChange={(e) => isEditModalOpen ? setEditingEmployee({...editingEmployee!, salary: Number(e.target.value)}) : setNewEmployee({...newEmployee, salary: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 text-left font-mono" 
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">تاريخ بدء العمل</label>
                    <input 
                      type="date" 
                      value={isEditModalOpen ? editingEmployee?.startDate || '' : newEmployee.startDate}
                      onChange={(e) => isEditModalOpen ? setEditingEmployee({...editingEmployee!, startDate: e.target.value}) : setNewEmployee({...newEmployee, startDate: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">الصلاحيات المخصصة للموظف</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                    {AVAILABLE_PERMISSIONS.map(perm => {
                      const isChecked = isEditModalOpen 
                        ? (editingEmployee?.permissions || []).includes(perm.id)
                        : newEmployee.permissions.includes(perm.id);
                        
                      return (
                        <label key={perm.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => togglePermission(perm.id, isEditModalOpen)}
                            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                          />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 flex-1">
                    <button 
                      type="submit" 
                      className="flex-1 px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black transition-colors"
                    >
                      {isEditModalOpen ? 'حفظ التعديلات' : 'إضافة الموظف'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAddModalOpen(false);
                        setIsEditModalOpen(false);
                        setEditingEmployee(null);
                      }}
                      className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors"
                    >
                      إلغاء
                    </button>
                  </div>
                  {isEditModalOpen && editingEmployee && (
                    <button
                      type="button"
                      onClick={() => handleDeleteEmployee(editingEmployee.id)}
                      className="px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-bold transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">حذف الموظف</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
