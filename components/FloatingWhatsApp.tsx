'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function FloatingWhatsApp() {
  const pathname = usePathname();

  // Hide the WhatsApp button in merchant dashboard and storefronts to avoid confusing merchants and their customers.
  // We only want this on the main platform pages (home, pricing, about, etc).
  if (pathname?.startsWith('/merchant') || pathname?.startsWith('/store')) {
    return null;
  }

  // Admin phone number for SEEN platform consultations
  const adminWhatsAppNumber = "967774448016"; // Can be modified by the admin
  const whatsappUrl = `https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent("مرحباً فريق سِين، لدي استفسار بخصوص المنصة!")}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 p-3.5 rounded-full shadow-2xl bg-[#25D366] text-white border-4 border-white/20 dark:border-slate-800/50 hover:scale-110 active:scale-95 hover:shadow-[#25D366]/40 transition-all flex items-center justify-center group"
      aria-label="تواصل معنا عبر واتساب"
    >
      <MessageCircle className="w-6 h-6 animate-pulse" />
      
      {/* Tooltip on hover */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
        تواصل للاستشارة 💬
        {/* Triangle pointer */}
        <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 border-t-[6px] border-t-transparent border-l-[6px] border-l-slate-900 dark:border-l-slate-800 border-b-[6px] border-b-transparent"></div>
      </div>
    </a>
  );
}
