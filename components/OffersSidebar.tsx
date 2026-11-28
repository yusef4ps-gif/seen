'use client';

import React, { useEffect, useState } from 'react';
import {
  Flame,
  Gift,
  Zap,
  X,
  ChevronLeft,
  Sparkles,
  Tag,
  Clock,
  ShoppingBag,
  Briefcase,
  ArrowLeft,
} from 'lucide-react';
import { StoreOfferItem, doesOfferApplyToProduct } from '@/lib/offers-utils';

interface OffersSidebarProps {
  visible: boolean;
  activeOffers: StoreOfferItem[];
  discountedProducts: any[];
  allProducts: any[];
  primaryColor: string;
  secondaryColor: string;
  isServiceStore: boolean;
  activeOfferFilterId: string | null;
  onSelectOfferFilter: (offer: StoreOfferItem | null) => void;
  onSelectProduct: (product: any) => void;
  formatPrice: (priceInBase: number) => string;
}

export default function OffersSidebar({
  visible,
  activeOffers,
  discountedProducts,
  allProducts,
  primaryColor,
  secondaryColor,
  isServiceStore,
  activeOfferFilterId,
  onSelectOfferFilter,
  onSelectProduct,
  formatPrice,
}: OffersSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tickerIndex, setTickerIndex] = useState(0);

  const totalDealsCount = activeOffers.length + discountedProducts.length;

  // Build concise rotating headlines for the animated floating side bar
  const tickerItems: { label: string; sub: string }[] = [
    ...activeOffers.map((o) => ({
      label: o.discountStr || o.title,
      sub: o.title,
    })),
    ...discountedProducts.map((p) => {
      const pct = Math.max(
        1,
        Math.round((1 - Number(p.price) / Number(p.comparePrice)) * 100)
      );
      return {
        label: `خصم ${pct}%`,
        sub: p.name,
      };
    }),
  ];

  useEffect(() => {
    if (!visible || tickerItems.length <= 1) return;
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickerItems.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [visible, tickerItems.length]);

  if (!visible || totalDealsCount === 0) {
    return null;
  }

  const currentTicker = tickerItems[tickerIndex % Math.max(1, tickerItems.length)] || {
    label: 'عروض خاصة',
    sub: '',
  };

  return (
    <>
      {/* Animated Floating Side Ribbon (Fixed Right Edge — RTL Native) */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center select-none pointer-events-none">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="عرض العروض والخصومات المتاحة"
          className="pointer-events-auto group relative flex flex-col items-center gap-2 py-3.5 px-2 sm:px-2.5 rounded-l-2xl text-white shadow-2xl border-y border-l border-white/25 overflow-hidden transition-all duration-300 hover:pr-3.5 active:scale-95 animate-in slide-in-from-right duration-500"
          style={{
            background: `linear-gradient(180deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 12px 32px -6px ${primaryColor}70`,
          }}
        >
          {/* Animated Shimmer Sweep */}
          <span className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-transparent animate-offers-shimmer pointer-events-none" />

          {/* Pulsing Count Badge */}
          <span className="relative z-10 flex items-center justify-center w-7 h-7 rounded-xl bg-white text-slate-900 font-black text-xs shadow-md">
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500" />
            {totalDealsCount}
          </span>

          {/* Vertical Animated Label + Rotating Discount Snippet */}
          <div className="relative z-10 flex flex-col items-center gap-1 py-1">
            <Flame className="w-4 h-4 text-amber-300 animate-bounce" />
            <span
              className="text-[11px] font-black tracking-wide whitespace-nowrap"
              style={{ writingMode: 'vertical-rl' }}
            >
              العروض والخصومات
            </span>
            <span
              key={tickerIndex}
              className="text-[10px] font-bold bg-black/25 px-1.5 py-1 rounded-lg max-h-24 overflow-hidden text-amber-200 animate-fadeIn whitespace-nowrap"
              style={{ writingMode: 'vertical-rl' }}
            >
              {currentTicker.label}
            </span>
          </div>

          <ChevronLeft className="relative z-10 w-4 h-4 text-white/90 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] animate-fadeIn"
        />
      )}

      {/* Animated Slide-Out Offers & Discounts Sidebar Panel */}
      <aside
        aria-label="الشريط الجانبي للعروض والخصومات"
        className={`fixed top-0 right-0 bottom-0 z-50 w-[88vw] max-w-sm bg-white dark:bg-slateDark-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header Banner */}
        <div
          className="p-5 text-white relative overflow-hidden shrink-0"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          }}
        >
          <div className="flex items-start justify-between gap-3 relative z-10">
            <div className="space-y-1 text-right">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                <span>مفعّل الآن ({totalDealsCount})</span>
              </div>
              <h3 className="text-base sm:text-lg font-black">العروض والخصومات الحصرية</h3>
              <p className="text-[11px] text-white/85">
                {isServiceStore
                  ? 'عروض سارية على الباقات والخدمات الاستشارية'
                  : 'أقوى العروض والخصومات النشطة حالياً في المتجر'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors shrink-0"
              aria-label="إغلاق شريط العروض"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Deals List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-right">
          {/* Active Offer Filter Reset Pill */}
          {activeOfferFilterId && (
            <button
              type="button"
              onClick={() => {
                onSelectOfferFilter(null);
                setIsOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between"
            >
              <span>إلغاء تصفية العرض والعودة للكل</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Promotional Offers from Merchant Offers Engine */}
          {activeOffers.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Tag className="w-4 h-4" style={{ color: primaryColor }} />
                <span>العروض الترويجية النشطة:</span>
              </div>

              {activeOffers.map((offer) => {
                const matchedProducts = allProducts.filter((p) =>
                  doesOfferApplyToProduct(offer, p.id)
                );
                const isFiltered = activeOfferFilterId === offer.id;

                return (
                  <div
                    key={offer.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                      isFiltered
                        ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/30 ring-1 ring-brand-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {offer.type === 'percentage' ? (
                            <Zap className="w-4 h-4" />
                          ) : (
                            <Gift className="w-4 h-4" />
                          )}
                        </span>
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                          {offer.title}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-black shrink-0 shadow-xs">
                        {offer.discountStr ||
                          (offer.type === 'percentage'
                            ? `خصم ${offer.discountValue}%`
                            : `خصم ${offer.discountValue}`)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {offer.scopeType === 'all'
                          ? `يشمل كافة العناصر (${matchedProducts.length})`
                          : `يشمل (${matchedProducts.length}) عناصر مختارة`}
                      </span>
                      {offer.endDate && (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                          <Clock className="w-3 h-3" />
                          <span>
                            حتى{' '}
                            {new Date(offer.endDate).toLocaleDateString('ar-EG')}
                          </span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectOfferFilter(offer);
                        setIsOpen(false);
                        if (typeof document !== 'undefined') {
                          document
                            .getElementById('products-grid')
                            ?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span>عرض العناصر المشمولة بالعرض</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Product-Level Price Discounts (comparePrice > price) */}
          {discountedProducts.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>تخفيضات مباشرة على الأسعار:</span>
              </div>

              <div className="space-y-2.5">
                {discountedProducts.map((prod) => {
                  const pct = Math.max(
                    1,
                    Math.round(
                      (1 - Number(prod.price) / Number(prod.comparePrice)) * 100
                    )
                  );
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onSelectProduct(prod);
                      }}
                      className="w-full text-right p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-brand-400 flex items-center gap-3 transition-all group"
                    >
                      {prod.images?.[0] ? (
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-700"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                        >
                          {isServiceStore ? (
                            <Briefcase className="w-5 h-5" />
                          ) : (
                            <ShoppingBag className="w-5 h-5" />
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-brand-600">
                          {prod.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-xs font-black"
                            style={{ color: primaryColor }}
                          >
                            {prod.price === 0 ? 'مجاناً 🎁' : formatPrice(prod.price)}
                          </span>
                          <span className="text-[10px] line-through text-slate-400">
                            {formatPrice(prod.comparePrice)}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-black shrink-0">
                        -{pct}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
