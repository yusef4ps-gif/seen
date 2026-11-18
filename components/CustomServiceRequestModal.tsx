'use client';

import React, { useState } from 'react';
import { X, Send, Briefcase, Calendar, DollarSign, User, Phone, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeName: string;
  merchantPhone: string;
  baseCurrency?: string;
}

export default function CustomServiceRequestModal({
  isOpen,
  onClose,
  storeName,
  merchantPhone,
  baseCurrency = 'SAR',
}: CustomServiceRequestModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceTitle, setServiceTitle] = useState('');
  const [details, setDetails] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('عاجل (خلال أيام قليلة)');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('يرجى إدخال اسمك الكريم');
      return;
    }
    if (!phone.trim()) {
      toast.error('يرجى إدخال رقم الواتساب للتواصل');
      return;
    }
    if (!serviceTitle.trim()) {
      toast.error('يرجى تحديد عنوان أو نوع الخدمة المطلوبة');
      return;
    }
    if (!details.trim()) {
      toast.error('يرجى توضيح متطلبات الخدمة بالتفصيل');
      return;
    }

    const cleanMerchantPhone = merchantPhone.replace(/[^0-9]/g, '');

    const message = `السلام عليكم ورحمة الله وبركاته،
أود تقديم *طلب خدمة مخصصة* عبر منصتكم (${storeName}):

👤 *الاسم:* ${name.trim()}
📱 *رقم التواصل:* ${phone.trim()}
💼 *نوع الخدمة:* ${serviceTitle.trim()}
📝 *التفاصيل والمتطلبات:*
${details.trim()}
${budget ? `💰 *الميزانية المقترحة:* ${budget} ${baseCurrency}\n` : ''}⏳ *الموعد المفضل للإنجاز:* ${timeline}

بانتظار ردكم الكريم لمناقشة التفاصيل والبدء في التنفيذ.`;

    const waUrl = `https://wa.me/${cleanMerchantPhone}?text=${encodeURIComponent(message)}`;

    setIsSubmitted(true);
    toast.success('تم تجهيز طلبك بنجاح! جاري فتح الواتساب...');

    setTimeout(() => {
      window.open(waUrl, '_blank');
    }, 600);
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setServiceTitle('');
    setDetails('');
    setBudget('');
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-right overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              تم إرسال طلب الخدمة المخصصة! 🎉
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
              تم توجيه تفاصيل طلبك مباشرة إلى واتساب إدارة {storeName}. سنراجع المتطلبات ونتواصل معك في أسرع وقت.
            </p>
            <div className="pt-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl text-xs shadow-md transition-all"
              >
                إغلاق والعودة للمنصة
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shadow-inner shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  طلب خدمة مخصصة أو استشارة ✍️
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  أرسل متطلبات مشروعك مباشرة إلى {storeName} للحصول على عرض سعر مخصص
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    <span>الاسم الكريم <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: د. عبدالله اليافعي"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    <span>رقم الواتساب <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="96777xxxxxxx"
                    dir="ltr"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Service Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                  <span>عنوان أو مجال الخدمة المطلوبة <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="مثال: صياغة عقد تأسيس شركة تجارية / استشارة عقارية"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Details Textarea */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>شرح المتطلبات بالتفصيل <span className="text-red-500">*</span></span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="اشرح نطاق العمل، النقاط الأساسية، وأي شروط خاصة ترغب بتضمينها..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                />
              </div>

              {/* Row 2: Budget & Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-teal-600" />
                    <span>الميزانية التقديرية (اختياري)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      placeholder="مثال: 500"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                      {baseCurrency}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>وقت الإنجاز المفضل</span>
                  </label>
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="عاجل (خلال 24-48 ساعة)">عاجل (خلال 24-48 ساعة) ⚡</option>
                    <option value="خلال أسبوع">خلال أسبوع 🗓️</option>
                    <option value="خلال شهر">خلال شهر 💼</option>
                    <option value="مرن وفق تقديركم">مرن وفق تقديركم 🤝</option>
                  </select>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال طلب الخدمة مباشرة عبر واتساب 💬</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  سيتم فتح محادثة رسمية مباشرة مع مزود الخدمة متضمنة كافة تفاصيل طلبك
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
