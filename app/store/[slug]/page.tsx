'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Store as StoreIcon, ShoppingCart, ShoppingBag, Search, Filter, 
  Sparkles, CheckCircle2, ChevronDown, ArrowLeft, Phone, 
  MapPin, Clock, ShieldCheck, X, Plus, Minus, Send, 
  Wallet, Image as ImageIcon, QrCode, ExternalLink, Flame, 
  Truck, RefreshCw, Star, Tag, Ticket, Cpu, Zap, Award, Coffee, Heart
} from 'lucide-react';
import { Store, Product, ProductVariant, OrderItem, CurrencyCode, PaymentMethodType, ThemeConfig } from '@/lib/types';
import { getStoreBySlugAction, getProductsByStoreAction } from '@/app/actions/store';
import { createOrderAction } from '@/app/actions/order';
import { formatCurrency, convertCurrency, DEFAULT_CURRENCIES } from '@/lib/currency-engine';
import { generateWhatsAppOrderMessage } from '@/lib/ai-generator';
import { THEME_PRESETS } from '@/lib/theme-presets';

export default function CustomerStorefrontPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>('YER_ADEN');

  // Cart state
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Product detail modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodType>('kuraimi');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    async function loadStorefront() {
      if (!slug) return;
      const s = await getStoreBySlugAction(slug);
      if (s) {
        setStore(s as any);
        setCity(s.city);
        if (s.paymentAccounts && s.paymentAccounts.length > 0) {
          const activeAcc = s.paymentAccounts.find((a: any) => a.isActive);
          if (activeAcc) setSelectedPayment(activeAcc.type);
        }

        const prods = await getProductsByStoreAction(s.id);
        setProducts(prods as any);
      }
    }
    loadStorefront();
  }, [slug]);

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <StoreIcon className="w-12 h-12 text-slate-400 mx-auto animate-pulse" />
          <h2 className="text-xl font-bold">جاري تحميل المتجر...</h2>
        </div>
      </div>
    );
  }

  // Active theme configuration
  const theme: ThemeConfig = store.themeConfig || THEME_PRESETS[0].config;
  const presetId = theme.presetId || 'fashion-luxury';
  const primaryColor = theme.colors.primary || store.primaryColor || '#0d9488';
  const secondaryColor = theme.colors.secondary || '#d97706';
  const fontFamily = theme.typography.fontFamily || 'Tajawal';
  const borderRadiusClass = theme.layout.borderRadius === 'pill' ? 'rounded-full' : theme.layout.borderRadius === 'curved' ? 'rounded-2xl' : 'rounded-none';
  const buttonRadiusClass = theme.layout.borderRadius === 'pill' ? 'rounded-full' : theme.layout.borderRadius === 'curved' ? 'rounded-xl' : 'rounded-none';

  // Currency conversion helper for current active currency
  const getConvertedPrice = (priceInBase: number) => {
    return convertCurrency(priceInBase, store.baseCurrency, activeCurrency, store.customRates);
  };

  const getFormattedPrice = (priceInBase: number) => {
    const converted = getConvertedPrice(priceInBase);
    return formatCurrency(converted, activeCurrency);
  };

  // Add to cart handler
  const handleAddToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    const basePrice = variant?.priceOverride || product.price;
    const variantId = variant?.id;
    const variantName = variant?.name;

    const existingIndex = cart.findIndex(
      (item) => item.productId === product.id && item.variantId === variantId
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].total = updated[existingIndex].quantity * basePrice;
      setCart(updated);
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        productImage: product.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
        variantId,
        variantName,
        price: basePrice,
        quantity,
        total: basePrice * quantity,
      };
      setCart([...cart, newItem]);
    }

    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    updated[index].quantity += delta;
    if (updated[index].quantity <= 0) {
      setCart(cart.filter((_, i) => i !== index));
    } else {
      updated[index].total = updated[index].quantity * updated[index].price;
      setCart(updated);
    }
  };

  // Totals calculations
  const cartSubtotalBase = cart.reduce((sum, item) => sum + item.total, 0);
  const cartSubtotalConverted = getConvertedPrice(cartSubtotalBase);
  const selectedShipping = store.shippingMethods.find(m => m.isActive && (deliveryType === 'pickup' ? m.isPickup : !m.isPickup));
  const shippingCostConverted = deliveryType === 'pickup' ? 0 : (selectedShipping?.cost || 3000);
  const cartTotalConverted = cartSubtotalConverted + shippingCostConverted;

  // Checkout submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || cart.length === 0) return;

    setIsSubmittingOrder(true);

    const orderId = `ord_${Date.now()}`;
    const orderNumber = `#${Math.floor(1000 + Math.random() * 9000)}`;

    const result = await createOrderAction({
      id: orderId,
      orderNumber,
      storeId: store.id,
      customerName,
      customerPhone,
      city: city || store.city,
      address: deliveryType === 'pickup' ? 'استلام من الفرع' : address,
      deliveryType,
      items: cart,
      subtotal: cartSubtotalConverted,
      shippingCost: shippingCostConverted,
      discount: 0,
      total: cartTotalConverted,
      currency: activeCurrency,
      paymentMethod: selectedPayment,
      paymentProofUrl: paymentProofUrl || undefined,
      paymentProofStatus: paymentProofUrl ? 'unverified' : undefined,
      status: selectedPayment === 'cod' ? 'new' : 'pending_payment',
      notes,
    });

    if (result.success) {
      const newOrder = result.order;

      // Prepare items list for WhatsApp formatting
      const formattedItems = cart.map((i) => ({
        name: i.variantName ? `${i.productName} (${i.variantName})` : i.productName,
        quantity: i.quantity,
        priceFormatted: formatCurrency(getConvertedPrice(i.price * i.quantity), activeCurrency),
      }));

      const activeAccount = store.paymentAccounts.find(a => a.type === selectedPayment);
      const paymentName = activeAccount?.name || selectedPayment;

      const waMessage = generateWhatsAppOrderMessage({
        storeName: store.name,
        orderNumber: newOrder.orderNumber,
        customerName,
        items: formattedItems,
        totalFormatted: formatCurrency(cartTotalConverted, activeCurrency),
        paymentMethodName: paymentName,
        city: city || store.city,
        address: deliveryType === 'pickup' ? 'استلام من المحل' : address,
      });

      setCart([]);
      setIsCheckoutOpen(false);
      setIsSubmittingOrder(false);

      const targetPhone = store.whatsapp || store.phone.replace(/[^0-9]/g, '');
      if (targetPhone) {
        window.open(`https://wa.me/${targetPhone}?text=${waMessage}`, '_blank');
      }

      router.push(`/store/${store.slug}/track/${newOrder.id}`);
    } else {
      setIsSubmittingOrder(false);
      alert('حدث خطأ أثناء إنشاء الطلب. حاول مرة أخرى.');
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div 
      className={`min-h-screen flex flex-col overflow-x-hidden w-full ${
        presetId === 'tech-modern'
          ? 'bg-slate-950 text-slate-100'
          : presetId === 'yemen-roastery'
          ? 'bg-[#fdfbf7] text-[#451a03]'
          : 'bg-slate-50 dark:bg-slateDark-950 text-slate-900 dark:text-slate-100'
      }`}
      style={{ fontFamily }}
    >
      
      {/* 1. ANNOUNCEMENT BAR (Customized per theme) */}
      {(() => {
        const annSec = theme.sections?.find(s => s.type === 'announcement_bar');
        if (annSec && annSec.isVisible) {
          return (
            <div 
              className={`py-1.5 sm:py-2 px-3 text-center flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold text-white shadow-xs ${
                presetId === 'tech-modern' ? 'border-b border-cyan-500/30 font-mono' : ''
              }`}
              style={{ backgroundColor: primaryColor }}
            >
              {presetId === 'tech-modern' ? (
                <Zap className="w-3.5 h-3.5 text-cyan-300 animate-pulse shrink-0" />
              ) : presetId === 'yemen-roastery' ? (
                <Coffee className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              )}
              <span className="truncate">{annSec.settings.bannerTitle || 'توصيل سريع لجميع المحافظات | الدفع عند الاستلام'}</span>
            </div>
          );
        }
        return null;
      })()}

      {/* 2. THEME-SPECIFIC HEADER NAVIGATION BAR */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-all ${
        presetId === 'tech-modern'
          ? 'bg-slate-900/90 border-slate-800 text-white'
          : presetId === 'yemen-roastery'
          ? 'bg-[#fefcf8]/95 border-amber-900/10 text-[#451a03]'
          : presetId === 'minimal-clean'
          ? 'bg-white border-black text-black'
          : 'bg-white/95 dark:bg-slateDark-900/95 border-slate-200 dark:border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20 gap-2 sm:gap-4">
            
            {/* Logo & Branding */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <img 
                src={store.logo} 
                alt={store.name}
                className={`w-9 h-9 sm:w-12 sm:h-12 object-cover bg-white shadow-xs shrink-0 ${
                  presetId === 'minimal-clean' 
                    ? 'rounded-none border-2 border-black' 
                    : presetId === 'tech-modern'
                    ? 'rounded-xl border border-cyan-500/40'
                    : 'rounded-xl sm:rounded-2xl border border-slate-200'
                }`}
              />
              <div className="min-w-0">
                <h1 className="text-xs sm:text-base font-black leading-tight truncate">
                  {store.name}
                </h1>
                <p className="text-[9px] sm:text-[10px] opacity-70 font-medium truncate">
                  {presetId === 'yemen-roastery' ? '☕ محمصة يمنية حرفية' : presetId === 'tech-modern' ? '⚡ Cyber Tech Store' : `📍 ${store.city} - ${store.category}`}
                </p>
              </div>
            </div>

            {/* Currency Selector & Cart Trigger */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              
              {/* Currency Selector */}
              <select
                value={activeCurrency}
                onChange={(e) => setActiveCurrency(e.target.value as CurrencyCode)}
                className={`px-2 py-1 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-bold outline-none cursor-pointer ${
                  presetId === 'tech-modern'
                    ? 'bg-slate-800 border-slate-700 text-cyan-400 font-mono rounded-xl'
                    : presetId === 'minimal-clean'
                    ? 'bg-white border-2 border-black text-black rounded-none font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl'
                }`}
              >
                <option value="YER_ADEN">ر.ي (عدن) 🇾🇪</option>
                <option value="YER_SANAA">ر.ي (صنعاء) 🇾🇪</option>
                <option value="SAR">ر.س (سعودي) 🇸🇦</option>
                <option value="USD">USD ($) 🇺🇸</option>
              </select>

              {/* Cart Drawer Trigger Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className={`relative px-3 py-1.5 sm:px-4 sm:py-2.5 font-bold text-xs sm:text-sm text-white flex items-center gap-1.5 shadow-md active:scale-95 transition-all ${
                  presetId === 'minimal-clean' ? 'rounded-none border-2 border-black bg-black text-white' : ''
                }`}
                style={{ 
                  backgroundColor: presetId === 'minimal-clean' ? '#000000' : primaryColor,
                  borderRadius: presetId === 'minimal-clean' ? '0px' : buttonRadiusClass === 'rounded-full' ? '9999px' : '14px',
                }}
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">السلة</span>
                {cart.length > 0 && (
                  <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white text-slate-950 text-[10px] sm:text-xs font-black flex items-center justify-center shadow-xs">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>

            </div>

          </div>
        </div>
      </header>

      {/* 3. DYNAMIC HOMEPAGE SECTIONS - ARCHITECTURALLY DIFFERENT PER THEME */}
      <div className="space-y-6 sm:space-y-12">
        {(theme.sections || [])
          .filter(s => s.isVisible && s.type !== 'announcement_bar')
          .map((section) => {
            
            // --- SECTION: HERO BANNER ---
            if (section.type === 'hero_slider') {
              
              // Tech Modern Cyber Hero
              if (presetId === 'tech-modern') {
                return (
                  <section key={section.id} className="relative max-w-7xl mx-auto px-3 sm:px-8 pt-4">
                    <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 p-6 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-cyan-900/10 to-transparent pointer-events-none" />
                      
                      <div className="relative z-10 space-y-3 sm:space-y-4 max-w-xl text-right">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 text-[10px] sm:text-xs font-mono font-bold">
                          <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                          <span>NEW GENERATION TECH 2026</span>
                        </div>
                        <h2 className="text-xl sm:text-4xl font-black text-white leading-tight">
                          {section.settings.bannerTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                          {section.settings.bannerSubtitle}
                        </p>
                        
                        {/* Tech Spec Badges */}
                        <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">⚡ 5G ULTRA SPEED</span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">🛡️ ضمان رسمي سنتين</span>
                          <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">🚚 شحن فوري للمحافظات</span>
                        </div>
                      </div>

                      <div className="relative w-full md:w-80 aspect-video md:aspect-square rounded-2xl overflow-hidden border border-slate-700 shadow-xl shrink-0">
                        <img src={section.settings.bannerImageUrl || store.banner} alt="Tech" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </section>
                );
              }

              // Artisan Roastery Story Hero
              if (presetId === 'yemen-roastery') {
                return (
                  <section key={section.id} className="max-w-7xl mx-auto px-3 sm:px-8 pt-4">
                    <div className="relative rounded-3xl overflow-hidden bg-[#3b1907] text-[#fefcf8] p-6 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border border-amber-900/30">
                      <div className="space-y-3 sm:space-y-4 max-w-xl text-right">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/60 border border-amber-500/30 text-amber-300 text-xs font-bold">
                          <Coffee className="w-3.5 h-3.5" />
                          <span>أصالة البن اليماني المختص ☕</span>
                        </div>
                        <h2 className="text-xl sm:text-4xl font-black leading-tight text-amber-100">
                          {section.settings.bannerTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                          {section.settings.bannerSubtitle}
                        </p>
                        <div className="pt-2">
                          <span className="text-[11px] font-bold bg-[#572911] px-4 py-2 rounded-xl text-amber-200 inline-block border border-amber-700/40">
                            🏔️ محاصيل حراز ومطر من ارتفاع 2200م
                          </span>
                        </div>
                      </div>

                      <div className="w-full md:w-80 aspect-video md:aspect-square rounded-2xl overflow-hidden border-2 border-amber-700/50 shadow-lg shrink-0">
                        <img src={section.settings.bannerImageUrl || store.banner} alt="Coffee" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </section>
                );
              }

              // Swiss Minimalist Stark Hero
              if (presetId === 'minimal-clean') {
                return (
                  <section key={section.id} className="max-w-7xl mx-auto px-3 sm:px-8 pt-4">
                    <div className="border-2 border-black p-6 sm:p-12 text-black bg-white space-y-4">
                      <div className="text-xs font-mono font-bold uppercase tracking-widest">[01] COLLECTION // 2026</div>
                      <h2 className="text-2xl sm:text-5xl font-black tracking-tight">{section.settings.bannerTitle}</h2>
                      <p className="text-xs sm:text-base text-slate-600 max-w-xl">{section.settings.bannerSubtitle}</p>
                    </div>
                  </section>
                );
              }

              // Default / Fashion Luxury Lookbook Hero
              return (
                <section key={section.id} className="relative h-44 sm:h-80 w-full bg-slate-950 overflow-hidden">
                  <img 
                    src={section.settings.bannerImageUrl || store.banner} 
                    alt={store.name} 
                    className="w-full h-full object-cover opacity-60" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-4 sm:pb-8 w-full text-white space-y-1 sm:space-y-2">
                      <span 
                        className="inline-block text-[9px] sm:text-[10px] font-black uppercase px-3 py-1 rounded-full text-white shadow-xs"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        تشكيلة الموسم الفاخرة
                      </span>
                      <h2 className="text-base sm:text-4xl font-black">{section.settings.bannerTitle || store.name}</h2>
                      <p className="text-[11px] sm:text-base text-slate-300 max-w-2xl line-clamp-1 sm:line-clamp-2">
                        {section.settings.bannerSubtitle || store.description}
                      </p>
                    </div>
                  </div>
                </section>
              );
            }

            // --- SECTION: FEATURES STRIP ---
            if (section.type === 'features_strip') {
              return (
                <section key={section.id} className="max-w-7xl mx-auto px-3 sm:px-8">
                  <div className={`p-4 sm:p-6 grid grid-cols-3 gap-2 sm:gap-6 text-center text-xs ${
                    presetId === 'tech-modern'
                      ? 'bg-slate-900 border border-slate-800 rounded-2xl text-slate-200'
                      : presetId === 'yemen-roastery'
                      ? 'bg-[#f8f4eb] border border-amber-900/10 rounded-2xl text-[#451a03]'
                      : presetId === 'minimal-clean'
                      ? 'border-2 border-black bg-white rounded-none text-black'
                      : 'bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs'
                  }`}>
                    <div className="space-y-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800" style={{ color: primaryColor }}>
                        {presetId === 'tech-modern' ? <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" /> : <Truck className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <h4 className="font-bold text-[11px] sm:text-sm">توصيل سريع</h4>
                      <p className="text-[9px] sm:text-xs opacity-70 hidden xs:block">لكافة المحافظات</p>
                    </div>

                    <div className="space-y-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800" style={{ color: primaryColor }}>
                        {presetId === 'tech-modern' ? <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" /> : <Award className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <h4 className="font-bold text-[11px] sm:text-sm">ضمان الجودة</h4>
                      <p className="text-[9px] sm:text-xs opacity-70 hidden xs:block">منتجات أصلية 100%</p>
                    </div>

                    <div className="space-y-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800" style={{ color: primaryColor }}>
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <h4 className="font-bold text-[11px] sm:text-sm">دفع مرن ومحلي</h4>
                      <p className="text-[9px] sm:text-xs opacity-70 hidden xs:block">كريمي وجوالي وكاش</p>
                    </div>
                  </div>
                </section>
              );
            }

            // --- SECTION: CATEGORIES & SEARCH ---
            if (section.type === 'featured_categories') {
              return (
                <section key={section.id} className="max-w-7xl mx-auto px-3 sm:px-8 space-y-3">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
                    
                    {/* Search Box */}
                    <div className="relative w-full sm:w-80">
                      <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-40 absolute right-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="ابحث عن منتج بالاسم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pr-9 pl-4 py-2 sm:py-2.5 text-xs sm:text-sm outline-none shadow-xs ${
                          presetId === 'tech-modern'
                            ? 'bg-slate-900 border border-slate-700 text-white rounded-xl font-mono'
                            : presetId === 'minimal-clean'
                            ? 'bg-white border-2 border-black text-black rounded-none'
                            : 'bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl'
                        }`}
                      />
                    </div>

                    {/* Category Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold whitespace-nowrap transition-all ${
                          selectedCategory === 'all'
                            ? 'text-white shadow-xs'
                            : 'bg-white/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                        } ${presetId === 'minimal-clean' ? 'rounded-none border-2 border-black' : ''}`}
                        style={{ 
                          backgroundColor: selectedCategory === 'all' ? (presetId === 'minimal-clean' ? '#000000' : primaryColor) : undefined,
                          borderRadius: presetId === 'minimal-clean' ? '0px' : theme.layout.borderRadius === 'pill' ? '9999px' : '12px'
                        }}
                      >
                        {presetId === 'minimal-clean' ? '[00] الكل' : `الكل (${products.length})`}
                      </button>
                      {categories.map((cat, idx) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-bold whitespace-nowrap transition-all ${
                            selectedCategory === cat
                              ? 'text-white shadow-xs'
                              : 'bg-white/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                          } ${presetId === 'minimal-clean' ? 'rounded-none border-2 border-black' : ''}`}
                          style={{ 
                            backgroundColor: selectedCategory === cat ? (presetId === 'minimal-clean' ? '#000000' : primaryColor) : undefined,
                            borderRadius: presetId === 'minimal-clean' ? '0px' : theme.layout.borderRadius === 'pill' ? '9999px' : '12px'
                          }}
                        >
                          {presetId === 'minimal-clean' ? `[0${idx + 1}] ${cat}` : cat}
                        </button>
                      ))}
                    </div>

                  </div>
                </section>
              );
            }

            // --- SECTION: PRODUCTS GRID (Visually different per template) ---
            if (section.type === 'products_grid') {
              return (
                <section key={section.id} className="max-w-7xl mx-auto px-3 sm:px-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm sm:text-xl font-black">
                      {section.settings.bannerTitle || 'المنتجات المميزة'}
                    </h3>
                    <span className="text-xs font-bold" style={{ color: primaryColor }}>
                      {filteredProducts.length} منتج متوفر
                    </span>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                      <h3 className="text-sm font-bold">لا توجد منتجات مطابقة للبحث</h3>
                      <p className="text-xs text-slate-500">جرب البحث بكلمات أخرى أو اختر تصنيفاً مختلفاً.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
                      {filteredProducts.map((prod) => {
                        const isLow = prod.stock <= (prod.lowStockAlert || 5) && prod.stock > 0;
                        const isOut = prod.stock === 0;

                        // 1. Tech Cyber Product Card
                        if (presetId === 'tech-modern') {
                          return (
                            <div
                              key={prod.id}
                              className="touch-card bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition-all"
                            >
                              <div 
                                onClick={() => {
                                  setSelectedProduct(prod);
                                  setSelectedVariant(prod.variants && prod.variants.length > 0 ? prod.variants[0] : null);
                                  setItemQuantity(1);
                                }}
                                className="relative aspect-square w-full overflow-hidden bg-slate-950 cursor-pointer"
                              >
                                <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-400 border border-cyan-500/40 text-[9px] font-mono font-bold">
                                  TECH SPEC
                                </div>
                              </div>

                              <div className="p-3 space-y-2 text-right">
                                <div className="text-[10px] text-cyan-400 font-mono">{prod.category}</div>
                                <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{prod.name}</h4>
                                <div className="text-xs sm:text-base font-black text-cyan-300 font-mono">
                                  {getFormattedPrice(prod.price)}
                                </div>

                                <button
                                  disabled={isOut}
                                  onClick={() => handleAddToCart(prod, undefined, 1)}
                                  className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>BUY NOW</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // 2. Artisanal Roastery Coffee Card
                        if (presetId === 'yemen-roastery') {
                          return (
                            <div
                              key={prod.id}
                              className="touch-card bg-white border border-amber-900/20 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between text-[#451a03]"
                            >
                              <div 
                                onClick={() => {
                                  setSelectedProduct(prod);
                                  setSelectedVariant(prod.variants && prod.variants.length > 0 ? prod.variants[0] : null);
                                  setItemQuantity(1);
                                }}
                                className="relative aspect-square w-full overflow-hidden bg-[#faf6f0] cursor-pointer"
                              >
                                <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-900 text-amber-100 text-[9px] font-bold">
                                  محصول فاخر ☕
                                </div>
                              </div>

                              <div className="p-3 space-y-2 text-right">
                                <div className="text-[10px] text-amber-800 font-semibold">حراز وبني مطر</div>
                                <h4 className="text-xs sm:text-sm font-bold line-clamp-1">{prod.name}</h4>
                                <div className="text-xs sm:text-base font-black text-[#78350f]">
                                  {getFormattedPrice(prod.price)}
                                </div>

                                <button
                                  disabled={isOut}
                                  onClick={() => handleAddToCart(prod, undefined, 1)}
                                  className="w-full py-2 rounded-xl bg-[#78350f] hover:bg-[#5a270a] text-white font-bold text-xs flex items-center justify-center gap-1"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>طلب المحصول</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // 3. Swiss Minimalist Card
                        if (presetId === 'minimal-clean') {
                          return (
                            <div
                              key={prod.id}
                              className="touch-card bg-white border-2 border-black overflow-hidden flex flex-col justify-between text-black rounded-none"
                            >
                              <div 
                                onClick={() => {
                                  setSelectedProduct(prod);
                                  setSelectedVariant(prod.variants && prod.variants.length > 0 ? prod.variants[0] : null);
                                  setItemQuantity(1);
                                }}
                                className="relative aspect-square w-full overflow-hidden bg-slate-100 cursor-pointer border-b-2 border-black"
                              >
                                <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                              </div>

                              <div className="p-3 space-y-2 text-right">
                                <h4 className="text-xs font-black line-clamp-1">{prod.name}</h4>
                                <div className="text-xs sm:text-sm font-mono font-bold">
                                  {getFormattedPrice(prod.price)}
                                </div>

                                <button
                                  disabled={isOut}
                                  onClick={() => handleAddToCart(prod, undefined, 1)}
                                  className="w-full py-2 bg-black hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-1 rounded-none"
                                >
                                  <span>[+] ADD TO CART</span>
                                </button>
                              </div>
                            </div>
                          );
                        }

                        // 4. Default / Luxury Boutique Lookbook Card
                        return (
                          <div
                            key={prod.id}
                            className="touch-card group bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                            style={{ 
                              borderRadius: theme.layout.borderRadius === 'pill' ? '20px' : theme.layout.borderRadius === 'curved' ? '16px' : '0px'
                            }}
                          >
                            <div 
                              onClick={() => {
                                setSelectedProduct(prod);
                                setSelectedVariant(prod.variants && prod.variants.length > 0 ? prod.variants[0] : null);
                                setItemQuantity(1);
                              }}
                              className="relative aspect-square w-full overflow-hidden bg-slate-100 cursor-pointer"
                            >
                              <img 
                                src={prod.images[0]} 
                                alt={prod.name}
                                className="w-full h-full object-cover" 
                              />
                              
                              {prod.comparePrice && (
                                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] sm:text-[10px] font-black shadow-xs">
                                  -{Math.round((1 - prod.price / prod.comparePrice) * 100)}%
                                </span>
                              )}

                              {isLow && (
                                <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[8px] sm:text-[10px] font-bold shadow-xs flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5 animate-bounce" />
                                  <span>بقي {prod.stock}!</span>
                                </span>
                              )}
                            </div>

                            <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3 text-right">
                              <div>
                                <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium mb-0.5">
                                  {prod.category}
                                </div>
                                <h3 
                                  onClick={() => {
                                    setSelectedProduct(prod);
                                    setSelectedVariant(prod.variants && prod.variants.length > 0 ? prod.variants[0] : null);
                                    setItemQuantity(1);
                                  }}
                                  className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 cursor-pointer"
                                >
                                  {prod.name}
                                </h3>
                              </div>

                              <div className="pt-1.5 sm:pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                                <div className="min-w-0">
                                  <div className="text-xs sm:text-base font-black text-slate-900 dark:text-white truncate">
                                    {getFormattedPrice(prod.price)}
                                  </div>
                                  {prod.comparePrice && (
                                    <div className="text-[9px] sm:text-[10px] line-through text-slate-400 font-normal">
                                      {getFormattedPrice(prod.comparePrice)}
                                    </div>
                                  )}
                                </div>

                                <button
                                  disabled={isOut}
                                  onClick={() => {
                                    if (prod.variants && prod.variants.length > 0) {
                                      setSelectedProduct(prod);
                                      setSelectedVariant(prod.variants[0]);
                                      setItemQuantity(1);
                                    } else {
                                      handleAddToCart(prod, undefined, 1);
                                    }
                                  }}
                                  className="p-1.5 sm:px-3 sm:py-2 font-bold text-xs transition-all flex items-center gap-1 disabled:opacity-40 shrink-0 text-white shadow-xs"
                                  style={{ 
                                    backgroundColor: primaryColor,
                                    borderRadius: buttonRadiusClass === 'rounded-full' ? '9999px' : '10px',
                                  }}
                                  title="إضافة للسلة"
                                >
                                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  <span className="hidden xs:inline">أضف</span>
                                </button>
                              </div>

                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            }

            // --- SECTION: PROMO BANNER ---
            if (section.type === 'promo_banner') {
              return (
                <section key={section.id} className="max-w-7xl mx-auto px-3 sm:px-8">
                  <div 
                    className={`p-5 sm:p-8 text-white relative overflow-hidden shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 ${
                      presetId === 'minimal-clean' ? 'border-2 border-black bg-black rounded-none' : 'rounded-2xl sm:rounded-3xl'
                    }`}
                    style={{ 
                      backgroundColor: presetId === 'minimal-clean' ? '#000000' : secondaryColor,
                      borderRadius: presetId === 'minimal-clean' ? '0px' : theme.layout.borderRadius === 'pill' ? '32px' : '20px'
                    }}
                  >
                    <div className="space-y-1.5 text-center sm:text-right">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold">
                        <Ticket className="w-3.5 h-3.5" />
                        <span>كوبون حصري</span>
                      </div>
                      <h3 className="text-base sm:text-2xl font-black">{section.settings.bannerTitle || 'خصم خاص لفترة محدودة!'}</h3>
                      <p className="text-xs sm:text-sm text-white/90">{section.settings.bannerSubtitle}</p>
                    </div>

                    {section.settings.discountCode && (
                      <div className="px-5 py-3 rounded-2xl bg-slate-950/80 text-white border border-white/20 text-center space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-medium">كود الخصم عند الدفع:</span>
                        <span className="text-base font-black font-mono tracking-widest text-amber-300">
                          {section.settings.discountCode}
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              );
            }

            // --- SECTION: CUSTOMER TESTIMONIALS ---
            if (section.type === 'testimonials') {
              return (
                <section key={section.id} className="max-w-7xl mx-auto px-3 sm:px-8 space-y-4">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>
                      آراء وتجارب
                    </span>
                    <h3 className="text-sm sm:text-xl font-black">
                      {section.settings.bannerTitle || 'ماذا يقول عملاؤنا عنا؟'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                    {[
                      { name: 'سارة عبد الله', city: 'عدن', text: 'سرعة في التوصيل وتغليف راقي جداً، والمنتج أصلي ومطابق للوصف 100%.' },
                      { name: 'محمد الصنعاني', city: 'صنعاء', text: 'سهولة خيالية في إتمام الطلب والدفع المباشر بالكريمي، شكراً على الاحترافية.' },
                      { name: 'أنور الحضرمي', city: 'المكلا', text: 'أفضل متجر تعاملت معه في اليمن، خدمة عملاء سريعة جداً عبر الواتساب.' },
                    ].map((t, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 sm:p-5 rounded-2xl space-y-2 text-right ${
                          presetId === 'tech-modern'
                            ? 'bg-slate-900 border border-slate-800 text-slate-200'
                            : presetId === 'yemen-roastery'
                            ? 'bg-[#f8f4eb] border border-amber-900/10 text-[#451a03]'
                            : presetId === 'minimal-clean'
                            ? 'border-2 border-black bg-white text-black rounded-none'
                            : 'bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs'
                        }`}
                      >
                        <div className="flex text-amber-400 gap-0.5">
                          {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">
                          "{t.text}"
                        </p>
                        <div className="pt-2 border-t border-slate-200/40 text-[11px] font-bold">
                          {t.name} <span className="opacity-60 font-normal">({t.city})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            return null;
          })}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fadeIn p-0 sm:p-4">
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-slateDark-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-slide-up sm:animate-fadeIn max-h-[90vh] flex flex-col">
            
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3 left-3 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full bg-white/80 dark:bg-slateDark-800/80 backdrop-blur-sm z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="overflow-y-auto flex-1">
              <div className="relative aspect-video sm:aspect-video w-full bg-slate-100">
                <img 
                  src={selectedProduct.images[0]} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover" 
                />
              </div>

              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 text-right">
                <div>
                  <span className="text-[10px] font-bold uppercase" style={{ color: primaryColor }}>
                    {selectedProduct.category}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedProduct.name}
                  </h3>
                  <div className="text-lg sm:text-xl font-black mt-1" style={{ color: primaryColor }}>
                    {getFormattedPrice(selectedVariant?.priceOverride || selectedProduct.price)}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl">
                  {selectedProduct.description}
                </p>

                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      اختر المقاس / اللون:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.variants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            selectedVariant?.id === v.id
                              ? 'text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                          style={{ backgroundColor: selectedVariant?.id === v.id ? primaryColor : undefined }}
                        >
                          {v.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5 bg-white dark:bg-slateDark-900">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-xs font-bold">{itemQuantity}</span>
                <button
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => handleAddToCart(selectedProduct, selectedVariant || undefined, itemQuantity)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>إضافة إلى السلة</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Slide-over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          <div 
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" 
          />
          
          <div className="fixed inset-y-0 left-0 max-w-full flex w-full sm:w-auto">
            <div className="w-full sm:w-96 bg-white dark:bg-slateDark-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
              
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" style={{ color: primaryColor }} />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    سلة مشترياتك ({cart.reduce((s, i) => s + i.quantity, 0)})
                  </h3>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-4 py-2.5 bg-brand-50 dark:bg-brand-950/40 border-b border-brand-100 dark:border-brand-900/60 text-[11px] sm:text-xs">
                <div className="flex justify-between font-bold text-brand-700 dark:text-brand-300 mb-1">
                  <span>🚀 التوصيل المجاني</span>
                  <span>{cartSubtotalConverted > 20000 ? 'مؤهل للتوصيل المجاني!' : 'أضف المزيد للتوصيل المجاني'}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-brand-200 dark:bg-brand-900 overflow-hidden">
                  <div 
                    className="h-full bg-brand-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (cartSubtotalConverted / 25000) * 100)}%` }} 
                  />
                </div>
              </div>

              <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-2.5">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">سلتك فارغة حالياً</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5 text-xs"
                    >
                      <img 
                        src={item.productImage} 
                        alt={item.productName} 
                        className="w-11 h-11 rounded-xl object-cover bg-white shrink-0" 
                      />
                      
                      <div className="flex-1 min-w-0 text-right">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">
                          {item.productName}
                        </h4>
                        {item.variantName && (
                          <div className="text-[10px] text-slate-400">{item.variantName}</div>
                        )}
                        <div className="font-bold mt-0.5" style={{ color: primaryColor }}>
                          {formatCurrency(getConvertedPrice(item.price * item.quantity), activeCurrency)}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => handleUpdateCartQuantity(idx, -1)}
                          className="p-1 text-slate-500 hover:text-red-500"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold px-1">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateCartQuantity(idx, 1)}
                          className="p-1 text-slate-500 hover:text-brand-600"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(cartSubtotalConverted, activeCurrency)}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-lg flex items-center justify-center gap-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <span>إتمام الطلب السريع 🛍️</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* One-Step Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm animate-fadeIn p-0 sm:p-4">
          <div className="relative w-full sm:max-w-xl bg-white dark:bg-slateDark-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col animate-slide-up sm:animate-fadeIn">
            
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600" />
                <span>إتمام الطلب في خطوة واحدة</span>
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaceOrder} className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs flex-1 text-right">
              
              <div className="space-y-2.5">
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  1. معلومات المستلم والتوصيل:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      الاسم الكامل <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: سارة محمد"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      رقم الواتساب / الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="770 000 000"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      المدينة
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      طريقة الاستلام
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryType('delivery')}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold ${
                          deliveryType === 'delivery' ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                        style={{ backgroundColor: deliveryType === 'delivery' ? primaryColor : undefined }}
                      >
                        توصيل للمنزل
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryType('pickup')}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold ${
                          deliveryType === 'pickup' ? 'text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                        style={{ backgroundColor: deliveryType === 'pickup' ? primaryColor : undefined }}
                      >
                        استلام من الفرع
                      </button>
                    </div>
                  </div>
                </div>

                {deliveryType === 'delivery' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      العنوان بالتفصيل
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: المعلا - الشارع الرئيسي بجانب بنك الكريمي"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  2. طريقة الدفع:
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {store.paymentAccounts.filter(a => a.isActive).map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedPayment(acc.type)}
                      className={`p-2.5 rounded-2xl border text-right transition-all ${
                        selectedPayment === acc.type
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold ring-1 ring-brand-500'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold truncate">{acc.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                        {acc.type === 'cod' ? 'الدفع نقداً للمندوب' : 'تحويل للمحفظة'}
                      </div>
                    </button>
                  ))}
                </div>

                {selectedPayment !== 'cod' && (
                  <div className="p-3.5 rounded-2xl bg-brand-50/40 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 space-y-2">
                    {(() => {
                      const activeAcc = store.paymentAccounts.find(a => a.type === selectedPayment);
                      if (!activeAcc) return null;
                      return (
                        <>
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 dark:text-white">
                              بيانات التحويل إلى {activeAcc.name}:
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 gap-1">
                              <span>رقم الحساب: <strong>{activeAcc.accountNumber || store.phone}</strong></span>
                              <span>الاسم: {activeAcc.accountName || store.name}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">
                              {activeAcc.instructions || 'يرجى إرفاق صورة إشعار التحويل لتسريع تجهيز الطلب.'}
                            </p>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                              صورة إشعار التحويل:
                            </label>
                            <input
                              type="url"
                              placeholder="https://... (رابط صورة السند أو إشعار البنك)"
                              value={paymentProofUrl}
                              onChange={(e) => setPaymentProofUrl(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">المجموع الفرعي ({cart.length} أصناف):</span>
                  <span className="font-bold">{formatCurrency(cartSubtotalConverted, activeCurrency)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">رسوم التوصيل:</span>
                  <span className="font-bold">
                    {deliveryType === 'pickup' ? 'مجاني (استلام)' : formatCurrency(shippingCostConverted, activeCurrency)}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <span>الإجمالي النهائي المستحق:</span>
                  <span>{formatCurrency(cartTotalConverted, activeCurrency)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full py-3.5 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmittingOrder ? 'جاري تأكيد الطلب...' : 'تأكيد الطلب وإرسال إشعار WhatsApp فوراً ✨'}</span>
              </button>

            </form>

          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/60 dark:border-slate-800 py-8 text-center text-xs opacity-75 px-4">
        <p>© {new Date().getFullYear()} {store.name}. متجر مدعوم ومستضاف بواسطة منصة مَزن (Mazn SaaS).</p>
      </footer>

    </div>
  );
}
