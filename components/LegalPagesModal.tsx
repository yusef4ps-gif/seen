'use client';

import React from 'react';
import { X, ShieldCheck, FileText, RefreshCw, HelpCircle } from 'lucide-react';
import { Store } from '@/lib/types';

interface LegalPagesModalProps {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
  pageType: 'privacy' | 'terms' | 'returns' | 'faq' | null;
}

export default function LegalPagesModal({
  store,
  isOpen,
  onClose,
  pageType
}: LegalPagesModalProps) {
  if (!isOpen || !pageType) return null;

  // Extract legal pages from themeConfig
  let legalPages = { privacy: '', terms: '', returns: '', faq: '' };
  try {
    const config = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : store.themeConfig;
    if (config?.legalPages) {
      legalPages = config.legalPages;
    }
  } catch (e) {
    console.error('Error parsing themeConfig for legal pages');
  }

  const pagesConfig = {
    privacy: {
      title: 'سياسة الخصوصية',
      icon: ShieldCheck,
      content: legalPages.privacy || 'لم يتم إضافة سياسة الخصوصية بعد لهذا المتجر.',
      iconColor: 'text-brand-600',
      bgColor: 'bg-brand-50 dark:bg-brand-900/20'
    },
    terms: {
      title: 'الشروط والأحكام',
      icon: FileText,
      content: legalPages.terms || 'لم يتم إضافة الشروط والأحكام بعد لهذا المتجر.',
      iconColor: 'text-slate-600 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-800'
    },
    returns: {
      title: 'سياسة الاسترجاع والتوصيل',
      icon: RefreshCw,
      content: legalPages.returns || 'لم يتم إضافة سياسة الاسترجاع والتوصيل بعد لهذا المتجر.',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    faq: {
      title: 'الأسئلة الشائعة',
      icon: HelpCircle,
      content: legalPages.faq || 'لم يتم إضافة الأسئلة الشائعة بعد لهذا المتجر.',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  };

  const activePage = pagesConfig[pageType];
  const Icon = activePage.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activePage.bgColor}`}>
              <Icon className={`w-5 h-5 ${activePage.iconColor}`} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">{activePage.title}</h3>
              <p className="text-[10px] text-slate-500">{store.name}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-300 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div 
          className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar text-sm leading-relaxed text-slate-700 dark:text-slate-300 prose prose-sm max-w-none dark:prose-invert prose-headings:text-brand-700 dark:prose-headings:text-brand-400 prose-p:leading-relaxed"
          style={{ fontFamily: 'inherit' }}
          dangerouslySetInnerHTML={{ __html: activePage.content.replace(/\n/g, '<br />') }}
        />
        
        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-center">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
