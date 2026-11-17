'use client';

import React from 'react';

interface WhatsAppSupportButtonProps {
  phone?: string | null;
  storeName?: string;
  className?: string;
  floating?: boolean;
  customMessage?: string;
}

export function formatWhatsAppUrl(rawPhone?: string | null, storeName?: string, customMessage?: string): string | null {
  if (!rawPhone) return null;

  let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
  if (!cleanPhone) return null;

  // Strip international prefix if already typed as 00
  if (cleanPhone.startsWith('00')) {
    cleanPhone = cleanPhone.slice(2);
  }

  // Auto-detect Yemen numbers (9 digits starting with 7 or 1, or 10 digits starting with 07)
  if (cleanPhone.length === 9 && (cleanPhone.startsWith('7') || cleanPhone.startsWith('1'))) {
    cleanPhone = '967' + cleanPhone;
  } else if (cleanPhone.startsWith('07') && cleanPhone.length === 10) {
    cleanPhone = '967' + cleanPhone.slice(1);
  } else if (cleanPhone.startsWith('05') && cleanPhone.length === 10) {
    // Saudi number with leading 0
    cleanPhone = '966' + cleanPhone.slice(1);
  } else if (cleanPhone.length === 9 && cleanPhone.startsWith('5')) {
    // Saudi number without leading 0
    cleanPhone = '966' + cleanPhone;
  }

  const defaultMsg = customMessage || (storeName ? `مرحباً متجر ${storeName}، أود الاستفسار حول منتجاتكم وخدماتكم.` : 'مرحباً، أود الاستفسار عن منتجاتكم.');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMsg)}`;
}

export default function WhatsAppSupportButton({
  phone,
  storeName,
  className = '',
  floating = true,
  customMessage,
}: WhatsAppSupportButtonProps) {
  const waUrl = formatWhatsAppUrl(phone, storeName, customMessage);

  if (!waUrl) return null;

  if (!floating) {
    return (
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs transition-all duration-200 shadow-md shadow-green-500/20 active:scale-95 ${className}`}
      >
        <WhatsAppIcon className="w-4 h-4 fill-current" />
        <span>تواصل عبر واتساب</span>
      </a>
    );
  }

  return (
    <aside aria-label="محادثة واتساب مباشرة" className={`fixed bottom-6 left-6 z-40 flex items-center group select-none ${className}`}>
      {/* Tooltip on Hover / Desktop */}
      <div className="hidden sm:flex items-center ml-3 px-3.5 py-1.5 rounded-2xl bg-slate-900/90 text-white text-xs font-bold shadow-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-x-2 group-hover:translate-x-0 border border-slate-700/50">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
          <span>تواصل مع صاحب المتجر</span>
        </span>
      </div>

      {/* Floating Action Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل مع المتجر عبر واتساب"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-2xl shadow-green-500/40 hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-400/40"
      >
        {/* Pulsing Beacon Ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none"></span>

        {/* WhatsApp Icon */}
        <WhatsAppIcon className="w-7 h-7 fill-current relative z-10 drop-shadow-sm" />
      </a>
    </aside>
  );
}

function WhatsAppIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}
