'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, QrCode, Download, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  storeName: string;
  isService?: boolean;
}

export default function ShareStoreModal({
  isOpen,
  onClose,
  storeSlug,
  storeName,
  isService = false,
}: ShareStoreModalProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!isOpen) return null;

  const storeUrl = `${origin}/store/${storeSlug}`;
  const shareText = isService
    ? `تفضل بزيارة البروفايل المهني الرسمي لـ (${storeName}) واطلع على الخدمات والاستشارات المتاحة: ${storeUrl}`
    : `تسوق الآن من متجر (${storeName}) الرسمي: ${storeUrl}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(storeUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast.success('تم نسخ رابط المنصة بنجاح! 📋');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('تعذر نسخ الرابط تلقائياً');
    }
  };

  const shareChannels = [
    {
      name: 'واتساب',
      icon: '💬',
      bgColor: 'bg-emerald-500 hover:bg-emerald-600',
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'تيليجرام',
      icon: '✈️',
      bgColor: 'bg-sky-500 hover:bg-sky-600',
      url: `https://t.me/share/url?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'منصة X',
      icon: '𝕏',
      bgColor: 'bg-black hover:bg-slate-800',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(storeUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'فيسبوك',
      icon: '📘',
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`,
    },
    {
      name: 'لينكد إن',
      icon: '💼',
      bgColor: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(storeUrl)}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-right overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center shadow-inner">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              مشاركة رابط {isService ? 'البروفايل المهني' : 'المنصة'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              شارك الرابط المباشر أو الـ QR كود مع عملائك ومتابعيك
            </p>
          </div>
        </div>

        {/* Copy Link Input */}
        <div className="space-y-1.5 mb-5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            رابط المنصة الرسمي
          </label>
          <div className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <input
              type="text"
              readOnly
              value={storeUrl}
              dir="ltr"
              className="flex-1 bg-transparent text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-600 hover:bg-brand-500 text-white active:scale-95'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الرابط</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            مشاركة سريعة عبر وسائل التواصل
          </label>
          <div className="grid grid-cols-5 gap-2">
            {shareChannels.map((ch) => (
              <a
                key={ch.name}
                href={ch.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`py-2.5 px-1 rounded-2xl text-white text-center flex flex-col items-center justify-center gap-1 shadow-xs transition-transform hover:-translate-y-0.5 active:scale-95 ${ch.bgColor}`}
                title={`مشاركة على ${ch.name}`}
              >
                <span className="text-base">{ch.icon}</span>
                <span className="text-[10px] font-bold truncate max-w-full">{ch.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* QR Code Section */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col items-center text-center space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <QrCode className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>رمز الاستجابة السريعة (QR Code)</span>
          </div>

          <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <img
              src={qrImageUrl}
              alt={`QR Code لـ ${storeName}`}
              className="w-32 h-32 object-contain"
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            امسح الرمز بكاميرا الجوال للانتقال مباشرة إلى المنصة
          </p>

          <a
            href={qrImageUrl}
            download={`seen-qr-${storeSlug}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تحميل رمز QR</span>
          </a>
        </div>

      </div>
    </div>
  );
}
