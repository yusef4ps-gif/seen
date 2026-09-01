'use client';

import React, { useState, useRef } from 'react';
import { 
  UploadCloud, Image as ImageIcon, X, Check, 
  Sparkles, AlertCircle, Link as LinkIcon, RefreshCw 
} from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  maxSizeMB?: number;
  className?: string;
}

export default function ImageUploader({
  value,
  onChange,
  label = 'صورة المنتج',
  maxSizeMB = 5,
  className = '',
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabMode, setTabMode] = useState<'upload' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert file to WebP/JPEG data URL
  const processFile = (file: File) => {
    setError(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح (PNG, JPG, WEBP, GIF)');
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`حجم الصورة كبير جداً. الحد الأقصى المسموح به هو ${maxSizeMB} ميجابايت.`);
      return;
    }

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize & resize image on canvas
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Export as compressed WebP or JPEG
          const optimizedDataUrl = canvas.toDataURL('image/webp', 0.85);
          onChange(optimizedDataUrl);
          setIsProcessing(false);
        } else {
          // Fallback to raw base64
          onChange(event.target?.result as string);
          setIsProcessing(false);
        }
      };
      img.onerror = () => {
        setError('فشل في معالجة الصورة.');
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setError('حدث خطأ أثناء قراءة الملف.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className={`space-y-2 text-right ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>{label}</span>
        </label>

        {/* Tab Switcher: Upload vs URL */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setTabMode('upload')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              tabMode === 'upload'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            رفع ملف 📁
          </button>
          <button
            type="button"
            onClick={() => setTabMode('url')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              tabMode === 'url'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            رابط مباشر 🔗
          </button>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-300 text-xs flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* UPLOAD MODE */}
      {tabMode === 'upload' && (
        <div>
          {value ? (
            /* Image Preview Card */
            <div className="relative rounded-2xl border border-brand-500/30 bg-slate-50 dark:bg-slate-900/60 p-2.5 flex items-center gap-3">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white shrink-0">
                <img
                  src={value}
                  alt="معاينة"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>تم رفع وضغط الصورة بنجاح (WebP)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  جاهزة للعرض السريع في المتجر
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-brand-500 hover:text-white text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-all flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>تغيير الصورة</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChange('')}
                    className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 hover:bg-red-100 text-[10px] font-bold transition-all flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Drag & Drop Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/40'
                  : 'border-slate-300 dark:border-slate-700 hover:border-brand-500 bg-slate-50/60 dark:bg-slate-900/40'
              }`}
            >
              {isProcessing ? (
                <div className="py-3 flex flex-col items-center gap-2 text-brand-600">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-bold">جاري ضغط ومعالجة الصورة...</span>
                </div>
              ) : (
                <div className="py-2 flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      اضغط لاختيار صورة من جهازك
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      أو اسحب الصورة وأفلتها هنا (PNG, JPG, WEBP)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* URL INPUT MODE */}
      {tabMode === 'url' && (
        <div className="space-y-2">
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            <input
              type="url"
              placeholder="https://images.unsplash.com/photo-..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {value && (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <img src={value} alt="معاينة" className="w-8 h-8 rounded-lg object-cover" />
              <span className="text-[10px] text-slate-400 truncate flex-1">{value}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
