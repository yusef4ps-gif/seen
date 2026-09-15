'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, Phone, User, X, LogIn, KeyRound } from 'lucide-react';
import { 
  registerCustomerAction, 
  loginCustomerAction, 
  customerForgotPasswordAction,
  sendCustomerVerificationCodeAction,
  setCustomerAuthCookieAction
} from '@/app/actions/customer-auth';

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
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // OTP State
  const [showOTP, setShowOTP] = useState(false);
  const [expectedOtp, setExpectedOtp] = useState('');
  const [otpInput, setOtpInput] = useState(['', '', '', '']);
  const [sessionData, setSessionData] = useState<any>(null);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setMode('login');
      setLoading(false);
      setError('');
      setName('');
      setEmailOrPhone('');
      setRegisterEmail('');
      setRegisterPhone('');
      setPassword('');
      setShowOTP(false);
      setExpectedOtp('');
      setOtpInput(['', '', '', '']);
      setSessionData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let res;
    if (mode === 'register') {
      if (!registerEmail && !registerPhone) {
        setError('الرجاء إدخال البريد الإلكتروني أو رقم الهاتف على الأقل');
        setLoading(false);
        return;
      }
      res = await registerCustomerAction(storeId, name, registerEmail, registerPhone, password);
    } else {
      res = await loginCustomerAction(storeId, emailOrPhone, password);
    }

    if (res.success && res.customer) {
      setSessionData(res.customer);
      // Send OTP
      const customerName = mode === 'register' ? name : (res.customer.name || 'عميل');
      const otpRes = await sendCustomerVerificationCodeAction(mode === 'register' ? (registerEmail || registerPhone) : emailOrPhone, customerName);
      
      if (otpRes.success) {
        setExpectedOtp(otpRes.code!);
        setShowOTP(true);
      } else {
        setError(otpRes.error || 'فشل إرسال كود التحقق');
      }
    } else {
      setError(res.error || 'حدث خطأ ما');
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    
    const newOtp = [...otpInput];
    newOtp[index] = value;
    setOtpInput(newOtp);

    // Auto-advance
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const code = otpInput.join('');
    if (code.length !== 4) {
      setError('يرجى إدخال كود التحقق كاملاً');
      return;
    }
    if (code !== expectedOtp && expectedOtp !== '0000') { // 0000 backdoor for dev if needed, or strictly match expectedOtp
      setError('كود التحقق غير صحيح');
      return;
    }

    setLoading(true);
    setError('');
    
    // Set cookie
    const finalRes = await setCustomerAuthCookieAction(sessionData);
    setLoading(false);
    
    if (finalRes.success) {
      onSuccess();
    } else {
      setError('حدث خطأ أثناء تسجيل الدخول');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {showOTP ? 'التحقق من الحساب' : (mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد')}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl font-bold border border-red-100 dark:border-red-800/50">
              {error}
            </div>
          )}

          {!showOTP ? (
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

              {mode === 'login' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  البريد الإلكتروني أو رقم الهاتف
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
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white text-left dir-ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">رقم الهاتف (للتواصل عبر واتساب)</label>
                    <div className="relative">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        placeholder="77xxxxxxx"
                        className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white text-left dir-ltr"
                      />
                    </div>
                  </div>
                </>
              )}

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
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-4"
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
              
              <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                {mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}
                <button 
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  {mode === 'login' ? 'إنشاء حساب' : 'تسجيل الدخول'}
                </button>
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 text-brand-600 mx-auto rounded-full flex items-center justify-center mb-4">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">أدخل كود التحقق</h3>
                <p className="text-sm text-slate-500">
                  تم إرسال كود تحقق مكون من 4 أرقام إلى:
                  <br />
                  <span className="font-bold text-slate-700 dark:text-slate-300" dir="ltr">{emailOrPhone}</span>
                </p>
              </div>

              <div className="flex justify-center gap-3" dir="ltr">
                {otpInput.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all dark:text-white"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otpInput.join('').length !== 4}
                className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>تحقق ودخول</span>
                )}
              </button>
              
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowOTP(false)}
                  className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  العودة للوراء
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
