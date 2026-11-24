'use client';

import React, { useEffect } from 'react';
import { Palette, RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ThemeBuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const slug = params?.slug as string;

  useEffect(() => {
    console.error('ThemeBuilder Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
          <Palette className="w-7 h-7" />
        </div>
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          استوديو تخصيص البروفايل والهوية
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          تعذر تحميل واجهة التخصيص مؤقتاً بسبب خطأ في قراءة إعدادات القالب. يمكنك إعادة المحاولة الآن.
        </p>
        {error?.message && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 text-left overflow-x-auto">
            {error.message}
          </div>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-600/20 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>إعادة المحاولة</span>
          </button>
          {slug && (
            <Link
              href={`/merchant/${slug}`}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة للوحة التحكم</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
