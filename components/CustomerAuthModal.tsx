'use client';

import React, { useState } from 'react';
import { Mail, Lock, Phone, User, X, LogIn, Chrome } from 'lucide-react';
import { registerCustomerAction, loginCustomerAction, verifyGoogleTokenAndLoginCustomer, customerForgotPasswordAction } from '@/app/actions/customer-auth';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

interface Props {
  storeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerAuthModal({ storeId, isOpen, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let res;
    if (mode === 'register') {
      const isEmail = emailOrPhone.includes('@');
      res = await registerCustomerAction(
        storeId, 
        name, 
        isEmail ? emailOrPhone : '', 
        isEmail ? '' : emailOrPhone, 
        password
      );
    } else {
      res = await loginCustomerAction(storeId, emailOrPhone, password);
    }

    if (res.success) {
      onSuccess();
    } else {
      setError(res.error || 'حدث خطأ ما');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl font-bold border border-red-100 dark:border-red-800/50">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: أحمد محمد"
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {mode === 'login' ? 'البريد الإلكتروني أو رقم الهاتف' : 'البريد الإلكتروني أو رقم الهاتف'}
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="name@example.com أو 77xxxxxxx"
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white text-left dir-ltr"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white text-left dir-ltr"
                />
              </div>
              {mode === 'login' && (
                <div className="flex justify-end pt-1">
                  <button 
                    type="button" 
                    onClick={async () => {
                      if (!emailOrPhone || !emailOrPhone.includes('@')) {
                        setError('الرجاء إدخال بريدك الإلكتروني في الحقل الأول لإرسال رابط الاستعادة');
                        return;
                      }
                      setLoading(true);
                      const res = await customerForgotPasswordAction(storeId, emailOrPhone);
                      setLoading(false);
                      if (res.success) {
                        alert('تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني بنجاح!');
                      } else {
                        setError(res.error || 'حدث خطأ أثناء الإرسال');
                      }
                    }}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? <LogIn className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  <span>{mode === 'login' ? 'دخول' : 'إنشاء حساب'}</span>
                </>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <div className="relative px-4 bg-white dark:bg-slateDark-900 text-xs text-slate-500">أو</div>
          </div>

          <div className="flex justify-center" dir="ltr">
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy'}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (credentialResponse.credential) {
                    setLoading(true);
                    setError('');
                    const res = await verifyGoogleTokenAndLoginCustomer(storeId, credentialResponse.credential);
                    if (res?.success) {
                      onSuccess();
                    } else {
                      setError(res?.error || 'فشل تسجيل الدخول بواسطة جوجل');
                      setLoading(false);
                    }
                  }
                }}
                onError={() => {
                  setError('حدث خطأ أثناء الاتصال بحساب جوجل');
                }}
                useOneTap
                theme="outline"
                text="continue_with"
                shape="rectangular"
                width="100%"
              />
            </GoogleOAuthProvider>
          </div>

          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
            {mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
            <button 
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              {mode === 'login' ? 'إنشاء حساب' : 'تسجيل الدخول'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
