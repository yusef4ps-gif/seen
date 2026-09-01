'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, UserPlus, ShieldCheck, Building2, KeyRound, ShoppingBag, 
  Search, Filter, CheckCircle2, XCircle, MoreVertical, Edit3, 
  Trash2, Lock, ArrowLeft, Store as StoreIcon, ShieldAlert, Phone, Mail
} from 'lucide-react';
import { authEngine } from '@/lib/auth-engine';
import { storeEngine } from '@/lib/store-engine';
import { User, UserRole, StaffPermission, Store } from '@/lib/types';

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('pass123');
  const [newRole, setNewRole] = useState<UserRole>('STORE_STAFF');
  const [newStaffTitle, setNewStaffTitle] = useState('مسؤول المخزون والتوريد');
  const [newStoreId, setNewStoreId] = useState('');
  const [newPermissions, setNewPermissions] = useState<StaffPermission[]>([
    'manage_products',
    'manage_inventory',
    'manage_orders',
  ]);

  const [toastMessage, setToastMessage] = useState('');

  const refreshData = () => {
    setUsers(authEngine.getUsers());
    const s = storeEngine.getStores();
    setStores(s);
    if (s.length > 0 && !newStoreId) setNewStoreId(s[0].id);
  };

  useEffect(() => {
    const user = authEngine.getCurrentUser();
    setCurrentUser(user);
    setIsAuthChecking(false);
    if (user && user.role === 'SUPER_ADMIN') {
      refreshData();
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Toggle user status
  const handleToggleStatus = (userId: string) => {
    authEngine.toggleUserStatus(userId);
    refreshData();
    showToast('تم تحديث حالة الحساب بنجاح ✓');
  };

  // Delete user
  const handleDeleteUser = (userId: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الحساب؟')) {
      authEngine.deleteUser(userId);
      refreshData();
      showToast('تم حذف الحساب بنجاح ✓');
    }
  };

  // Toggle permission in modal
  const handleTogglePermission = (perm: StaffPermission) => {
    if (newPermissions.includes(perm)) {
      setNewPermissions(newPermissions.filter((p) => p !== perm));
    } else {
      setNewPermissions([...newPermissions, perm]);
    }
  };

  // Handle create user
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;

    const matchedStore = stores.find((s) => s.id === newStoreId);

    authEngine.createUserByAdmin({
      name: newName,
      email: newEmail || `${newPhone}@mazn.app`,
      phone: newPhone,
      password: newPassword,
      role: newRole,
      staffTitle: newRole === 'STORE_STAFF' ? newStaffTitle : undefined,
      storeId: newRole === 'STORE_OWNER' || newRole === 'STORE_STAFF' ? newStoreId : undefined,
      storeSlug: (newRole === 'STORE_OWNER' || newRole === 'STORE_STAFF') && matchedStore ? matchedStore.slug : undefined,
      storeName: (newRole === 'STORE_OWNER' || newRole === 'STORE_STAFF') && matchedStore ? matchedStore.name : undefined,
      permissions: newRole === 'STORE_STAFF' ? newPermissions : undefined,
    } as any);

    setIsAddUserModalOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    refreshData();
    showToast('تم إنشاء الحساب وتفويض الصلاحيات بنجاح 🚀');
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = selectedRoleFilter === 'ALL' || u.role === selectedRoleFilter;
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone.includes(searchTerm) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.storeName && u.storeName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  const superAdminCount = users.filter((u) => u.role === 'SUPER_ADMIN').length;
  const storeOwnerCount = users.filter((u) => u.role === 'STORE_OWNER').length;
  const staffCount = users.filter((u) => u.role === 'STORE_STAFF').length;
  const customerCount = users.filter((u) => u.role === 'CUSTOMER').length;

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 text-sm font-bold">
        جاري التحقق من صلاحيات الدخول...
      </div>
    );
  }

  // ⛔ ACCESS DENIED SCREEN FOR NON-SUPER-ADMINS
  if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-[#0a1317] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0f2a35]/90 border border-red-500/30 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">منطقة محظورة ⛔</h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              إدارة حسابات المنظومة وصلاحيات الـ RBAC مقتصرة فقط على <strong>المدير العام (Super Admin)</strong>.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href="/login?redirect=/admin/users"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-brand-600 hover:from-red-700 hover:to-brand-700 text-white text-xs font-bold block shadow-lg transition-all"
            >
              تسجيل الدخول كمدير عام 🔑
            </Link>

            <Link
              href="/"
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold block transition-all"
            >
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slateDark-950 text-slate-900 dark:text-slate-100 font-sans p-4 sm:p-8">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl text-xs font-bold flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2.5 rounded-xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-brand-600 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>إدارة المستخدمين والصلاحيات (RBAC)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200 font-bold">
                  {users.length} مستخدم
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                التحكم المركزي في حسابات المدراء، التجار، الموظفين، والعملاء وتفويض الأذونات
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/25 active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>إنشاء حساب وتفويض صلاحيات 👤</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs text-right">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold">مدراء المنصة</span>
              <ShieldCheck className="w-4 h-4 text-brand-600" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{superAdminCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs text-right">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold">ملاك المتاجر</span>
              <Building2 className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{storeOwnerCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs text-right">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold">موظفو المتاجر</span>
              <KeyRound className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{staffCount}</div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs text-right">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-bold">العملاء المشترون</span>
              <ShoppingBag className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{customerCount}</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الهاتف، أو المتجر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none text-right"
            />
          </div>

          {/* Role filter buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'الكل' },
              { id: 'SUPER_ADMIN', label: 'المدراء' },
              { id: 'STORE_OWNER', label: 'التجار' },
              { id: 'STORE_STAFF', label: 'الموظفون' },
              { id: 'CUSTOMER', label: 'العملاء' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedRoleFilter === tab.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <tr>
                  <th className="p-4">المستخدم</th>
                  <th className="p-4">الدور والمسمى</th>
                  <th className="p-4">المتجر المرتبط</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">تاريخ الإنشاء</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredUsers.map((user) => {
                  const isSuper = user.role === 'SUPER_ADMIN';
                  const isOwner = user.role === 'STORE_OWNER';
                  const isStaff = user.role === 'STORE_STAFF';
                  const isCust = user.role === 'CUSTOMER';

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                      
                      {/* Name & Contact */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={user.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100"
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                              <span>{user.phone}</span>
                              <span>•</span>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        {isSuper && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-black text-[10px] border border-brand-200 dark:border-brand-800">
                            <ShieldCheck className="w-3 h-3" />
                            <span>مدير المنصة</span>
                          </span>
                        )}
                        {isOwner && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-black text-[10px] border border-teal-200 dark:border-teal-800">
                            <Building2 className="w-3 h-3" />
                            <span>مالك متجر</span>
                          </span>
                        )}
                        {isStaff && (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-black text-[10px] border border-amber-200 dark:border-amber-800">
                              <KeyRound className="w-3 h-3" />
                              <span>موظف متجر</span>
                            </span>
                            <div className="text-[10px] text-slate-400">{user.staffTitle}</div>
                          </div>
                        )}
                        {isCust && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-black text-[10px] border border-purple-200 dark:border-purple-800">
                            <ShoppingBag className="w-3 h-3" />
                            <span>عميل ({user.ordersCount || 0} طلبات)</span>
                          </span>
                        )}
                      </td>

                      {/* Store */}
                      <td className="p-4">
                        {user.storeName ? (
                          <Link
                            href={`/merchant/${user.storeSlug}`}
                            className="font-bold text-brand-600 hover:underline flex items-center gap-1"
                          >
                            <StoreIcon className="w-3.5 h-3.5" />
                            <span>{user.storeName}</span>
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-[10px]">المنصة المركزية</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                            user.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                          }`}
                          title="انقر لتغيير الحالة"
                        >
                          {user.status === 'active' ? 'نشط ✓' : 'معلق ✗'}
                        </button>
                      </td>

                      {/* Created At */}
                      <td className="p-4 text-[10px] text-slate-400 font-mono">
                        {new Date(user.createdAt).toLocaleDateString('ar-YE')}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title={user.status === 'active' ? 'تجميد الحساب' : 'تفعيل الحساب'}
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="حذف الحساب"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL: CREATE USER & RBAC PROVISIONING */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slateDark-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-600" />
                <span>إنشاء حساب وتفويض الصلاحيات</span>
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الاسم الكامل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عبد الله ناصر"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الهاتف <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="770 000 000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    placeholder="user@gmail.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  تعيين كلمة المرور الافتراضية
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold outline-none"
                />
              </div>

              {/* Role Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  الدور الأساسي في النظام (Role):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'SUPER_ADMIN', label: '👑 مدير عام (Admin)' },
                    { id: 'STORE_OWNER', label: '💼 مالك متجر (Owner)' },
                    { id: 'STORE_STAFF', label: '🛠️ موظف متجر (Staff)' },
                    { id: 'CUSTOMER', label: '🛍️ عميل مشتري (Customer)' },
                  ].map((roleItem) => (
                    <button
                      key={roleItem.id}
                      type="button"
                      onClick={() => setNewRole(roleItem.id as any)}
                      className={`p-2.5 rounded-xl border text-right font-bold transition-all ${
                        newRole === roleItem.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600'
                      }`}
                    >
                      {roleItem.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* If Store Owner or Staff -> Choose Store */}
              {(newRole === 'STORE_OWNER' || newRole === 'STORE_STAFF') && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ربط الحساب بالمتجر:
                    </label>
                    <select
                      value={newStoreId}
                      onChange={(e) => setNewStoreId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold outline-none"
                    >
                      {stores.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  {newRole === 'STORE_STAFF' && (
                    <>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          المسمى الوظيفي للموظف:
                        </label>
                        <input
                          type="text"
                          value={newStaffTitle}
                          onChange={(e) => setNewStaffTitle(e.target.value)}
                          placeholder="مثال: مسؤول المخازن / مندوب التوصيل"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>

                      {/* Granular Permissions Checklist */}
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                          تحديد الصلاحيات الممنوحة للموظف:
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {[
                            { id: 'manage_products', label: 'إدارة وتعديل المنتجات' },
                            { id: 'manage_inventory', label: 'إدارة المخزون والتوريد' },
                            { id: 'manage_orders', label: 'معالجة وتجهيز الطلبات' },
                            { id: 'manage_customers', label: 'عرض قاعدة بيانات العملاء' },
                            { id: 'manage_marketing', label: 'استعادة السلات والعروض' },
                            { id: 'manage_settings', label: 'إعدادات المتجر والحسابات' },
                          ].map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={newPermissions.includes(perm.id as any)}
                                onChange={() => handleTogglePermission(perm.id as any)}
                                className="accent-brand-600 rounded"
                              />
                              <span className="font-medium">{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/25"
                >
                  حفظ وتفويض الصلاحيات 🚀
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
