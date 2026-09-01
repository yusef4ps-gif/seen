'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  variant?: 'icon-text' | 'full-3d' | 'horizontal';
}

export default function BrandLogo({
  className = '',
  showText = true,
  size = 'md',
  href = '/',
  variant = 'icon-text',
}: BrandLogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  };

  const fullLogoSizes = {
    sm: 'h-10 w-auto',
    md: 'h-14 w-auto',
    lg: 'h-20 w-auto',
    xl: 'h-32 w-auto',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg sm:text-xl',
    lg: 'text-2xl sm:text-3xl',
    xl: 'text-4xl sm:text-5xl',
  };

  const subTextSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[11px]',
    xl: 'text-[13px]',
  };

  // If Full 3D variant requested
  if (variant === 'full-3d') {
    const fullContent = (
      <div className={`group flex flex-col items-center justify-center outline-none select-none ${className}`}>
        <img
          src="/seen-logo-transparent.png"
          alt="شعار سِين - SEEN Official 3D Logo"
          className={`${fullLogoSizes[size]} object-contain drop-shadow-xl group-hover:scale-105 transition-all duration-300`}
        />
      </div>
    );
    if (href) return <Link href={href}>{fullContent}</Link>;
    return fullContent;
  }

  // Default Icon + Clean Styled Typography
  const logoContent = (
    <div className={`group flex items-center gap-2.5 outline-none select-none ${className}`}>
      {/* 3D Official Embossed Emblem Image from Original Artwork */}
      <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0 group-hover:scale-105 transition-all duration-300`}>
        <img
          src="/seen-icon-transparent.png"
          alt="سِين - SEEN Official Icon"
          className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(15,43,72,0.3)] filter brightness-105"
        />
      </div>

      {/* Brand Typography matching the Official Lettering */}
      {showText && (
        <div className="flex flex-col text-right leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight text-[#0f2b48] dark:text-white ${textSizes[size]}`}>
              سِين
            </span>
            <span className="font-mono font-black tracking-wider text-[#14b8a6] text-[10px] sm:text-xs px-1.5 py-0.5 rounded-md bg-[#14b8a6]/10 border border-[#14b8a6]/25">
              SEEN
            </span>
          </div>
          <span className={`font-semibold text-slate-500 dark:text-slate-400 mt-0.5 ${subTextSizes[size]}`}>
            منصة التجارة الإلكترونية
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{logoContent}</Link>;
  }

  return logoContent;
}
