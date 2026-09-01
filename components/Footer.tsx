import React from 'react';
import Link from 'next/link';
import { Heart, ShieldCheck, HelpCircle } from 'lucide-react';
import BrandLogo from './BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-1">
            <BrandLogo size="md" />
            <p className="text-xs text-slate-400 leading-relaxed">
              منصة سِين السحابية المتقدمة لتمكين التجار وأصحاب المشاريع في اليمن والمنطقة من إطلاق وإدارة متاجرهم الإلكترونية الاحترافية بضغطة زر.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">المنظومة والحلول</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/admin" className="hover:text-white transition-colors">بوابة مدير المنصة (Super Admin)</Link></li>
              <li><Link href="/create-store" className="hover:text-white transition-colors">إنشاء متجر سحابي جديد</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">تسجيل دخول التجار والعملاء</Link></li>
              <li><Link href="/#pricing" className="hover:text-white transition-colors">خطط وباقات الاشتراك (14 يوماً مجاناً)</Link></li>
            </ul>
          </div>

          {/* Support & Payments */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">طرق الدفع والشحن المعتمدة في اليمن</h4>
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              دعم كامل ومباشر لبنك القطيبي الإسلامي، الكريمي حاسب، جوالي، ون كاش، والدفع عند الاستلام.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-300">
              <span className="bg-[#14b8a6]/20 text-[#5eead4] px-2 py-0.5 rounded border border-[#14b8a6]/30 font-bold">بنك القطيبي الإسلامي</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">الكريمي</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">جوالي</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">ون كاش</span>
              <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">الدفع عند الاستلام</span>
            </div>
          </div>

          {/* Guarantee */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3">الأمان والسرعة</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              بنية تحتية سحابية موثوقة بنسبة تشغيل 99.9% مع سرعة تصفح فائقة متوافقة مع جميع سرعات الإنترنت في اليمن.
            </p>
          </div>

        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} منصة سِين (SEEN) للتجارة الإلكترونية. جميع الحقوق محفوظة.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            صُنعت بأعلى معايير الإتقان لتطوير التجارة الرقمية 🚀
          </p>
        </div>
      </div>
    </footer>
  );
};
