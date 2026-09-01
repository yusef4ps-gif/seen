'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Store as StoreIcon, Sparkles, Palette, ArrowLeft, ArrowRight, 
  Check, CheckCircle2, ShoppingBag, ShieldCheck, Wallet, Globe, 
  Phone, MapPin, Eye, Cpu, Coffee, Zap, Layers, Smartphone, 
  Monitor, Rocket, Flame, Clock, Image as ImageIcon, Truck, Gift, MessageCircle, Bot
} from 'lucide-react';
import { createStoreAction } from '@/app/actions/store';
import { ThemeConfig, ThemePreset, CurrencyCode } from '@/lib/types';
import { THEME_PRESETS } from '@/lib/theme-presets';
import BrandLogo from '@/components/BrandLogo';
import GoogleAuthButton from '@/components/GoogleAuthButton';
import ImageUploader from '@/components/ImageUploader';

export default function CreateStorePage() {
  const router = useRouter();

  // Wizard Steps: 1 -> Details, 2 -> Theme & Visuals, 3 -> Payments & Currency, 4 -> Generation
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Store Basic Information
  const [storeName, setStoreName] = useState('بوتيك عدن كولكشن');
  const [slug, setSlug] = useState('aden-collection');
  const [category, setCategory] = useState('أزياء وملابس وعبايات');
  const [city, setCity] = useState('عدن');
  const [phone, setPhone] = useState('777123456');
  const [description, setDescription] = useState('أفضل وأرقى تشكيلات الأزياء العصرية بجودة عالية وتوصيل سريع.');

  // Theme & Visual Identity State
  const [selectedPresetId, setSelectedPresetId] = useState<string>('fashion-luxury');
  const [customPrimaryColor, setCustomPrimaryColor] = useState<string>('#0f2b48');
  const [customFont, setCustomFont] = useState<'Tajawal' | 'Cairo' | 'Readex Pro' | 'Almarai'>('Tajawal');
  const [customBorderRadius, setCustomBorderRadius] = useState<'sharp' | 'curved' | 'pill'>('pill');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [logoUrl, setLogoUrl] = useState<string>('');

  // Services State
  const [storeServices, setStoreServices] = useState({
    delivery: true,
    packaging: false,
    whatsapp: true,
    aiAdvisor: false,
  });

  // Payments & Currency State
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('SAR');
  const [enableQutaibi, setEnableQutaibi] = useState(true);
  const [qutaibiAccount, setQutaibiAccount] = useState('1249827361');
  const [enableKuraimi, setEnableKuraimi] = useState(true);
  const [kuraimiAccount, setKuraimiAccount] = useState('3012345678');
  const [enableUnified, setEnableUnified] = useState(true);
  const [unifiedAccount, setUnifiedAccount] = useState('777123456');
  const [googleAuthenticated, setGoogleAuthenticated] = useState<any>(null);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');

  // Selected Preset Object
  const activePreset = THEME_PRESETS.find(p => p.id === selectedPresetId) || THEME_PRESETS[0];

  // Handle Preset Change
  const handleSelectPreset = (preset: ThemePreset) => {
    setSelectedPresetId(preset.id);
    setCustomPrimaryColor(preset.config.colors.primary);
    setCustomFont(preset.config.typography.fontFamily as any);
    setCustomBorderRadius(preset.config.layout.borderRadius as any);
  };

  // Generate slug automatically from name if user hasn't typed a custom slug
  const handleNameChange = (name: string) => {
    setStoreName(name);
    // Simple transliteration/slugify
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0621-\u064A-]/g, '')
      .replace(/[\u0621-\u064A]/g, '') || 'my-store';
    
    if (autoSlug.length > 2) {
      setSlug(autoSlug);
    }
  };

  // Launch and create the store
  const handleLaunchStore = async () => {
    setIsGenerating(true);
    setGenerationStage('تهيئة قاعدة البيانات السحابية...');
    setGenerationProgress(25);

    await new Promise((resolve) => setTimeout(resolve, 600));

    setGenerationStage('توليد القالب والهوية البصرية المختارة...');
    setGenerationProgress(50);

    await new Promise((resolve) => setTimeout(resolve, 600));

    setGenerationStage('إضافة المنتجات الافتراضية الذكية وتهيئة العملات...');
    setGenerationProgress(80);

    await new Promise((resolve) => setTimeout(resolve, 600));

    setGenerationStage('جاري حفظ المتجر في قاعدة البيانات...');
    setGenerationProgress(90);

      // Build ThemeConfig
      const finalThemeConfig: ThemeConfig = {
        ...activePreset.config,
        colors: {
          ...activePreset.config.colors,
          primary: customPrimaryColor,
        },
        typography: {
          ...activePreset.config.typography,
          fontFamily: customFont,
        },
        layout: {
          ...activePreset.config.layout,
          borderRadius: customBorderRadius,
        },
      };

      // Payment accounts
      const paymentAccounts = [];
      if (enableQutaibi) {
        paymentAccounts.push({
          id: `pay-${Date.now()}-qutaibi`,
          type: 'qutaibi' as const,
          name: 'بنك القطيبي الإسلامي - حساب رسمي / القطيبي باي',
          accountNumber: qutaibiAccount || '1249827361',
          accountName: storeName,
          instructions: 'التحويل المباشر لحساب بنك القطيبي وإرفاق الإشعار.',
          isActive: true,
        });
      }
      if (enableKuraimi) {
        paymentAccounts.push({
          id: `pay-${Date.now()}-2`,
          type: 'kuraimi' as const,
          name: 'الكريمي - خدمة حاسب',
          accountNumber: kuraimiAccount || '3000000000',
          accountName: storeName,
          instructions: 'التحويل لحساب الكريمي وإرفاق الإشعار.',
          isActive: true,
        });
      }
      if (enableUnified) {
        paymentAccounts.push({
          id: `pay-${Date.now()}-3`,
          type: 'jawali' as const, // We'll repurpose 'jawali' or just use 'unified' as type if supported, but for now we'll stick to 'jawali' as the backend type for mobile/network wallets, but rename it in UI.
          name: 'الشبكة الموحدة للحوالات',
          accountNumber: unifiedAccount || phone,
          accountName: storeName,
          instructions: 'تحويل عبر الشبكة الموحدة باسم المتجر وإرفاق الإشعار.',
          isActive: true,
        });
      }

      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-') || `store-${Math.floor(100 + Math.random() * 900)}`;

      const res = await createStoreAction({
        name: storeName,
        slug: cleanSlug,
        phone,
        category,
        city,
        description,
        baseCurrency,
        primaryColor: customPrimaryColor,
        themeConfig: finalThemeConfig,
        paymentAccounts,
        logo: logoUrl || undefined,
        storeServices,
      });

      setGenerationStage('اكتمل تجهيز المتجر بنجاح! جاري التوجيه...');
      setGenerationProgress(100);
      
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (res.success && res.store) {
        router.push(`/merchant/${res.store.slug}`);
      } else {
        alert('حدث خطأ أثناء إنشاء المتجر: ' + res.error);
        setIsGenerating(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slateDark-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      
      {/* Top Creation Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slateDark-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <BrandLogo size="md" />

        {/* Steps Progress Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${currentStep >= 1 ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 border border-brand-200' : 'text-slate-400'}`}>
            <span>1. تفاصيل المتجر</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${currentStep >= 2 ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 border border-brand-200' : 'text-slate-400'}`}>
            <span>2. القالب والهوية المرئية</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${currentStep >= 3 ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 border border-brand-200' : 'text-slate-400'}`}>
            <span>3. الدفع والعملة</span>
          </div>
        </div>

        <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900">
          إلغاء والعودة
        </Link>
      </header>

      {/* Main Creation Grid */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Form Steps Container */}
        <div className="flex-1 bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          
          {/* STEP 1: STORE DETAILS */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn text-right">
              <div>
                <span className="text-xs font-black text-brand-600 uppercase tracking-wider">الخطوة الأولى</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  معلومات وهوية متجرك الجديد 🏪
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  أدخل اسم متجرك ونشاطك التجاري ليتم تهيئة إعدادات المتجر تلقائياً مع 14 يوماً فترة تجريبية مجانية.
                </p>
              </div>

              {/* Google Verified Merchant Account Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                  <span className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                    <Sparkles className="w-4 h-4" />
                    <span>توثيق حساب التاجر الرسمي عبر Google</span>
                  </span>
                  {googleAuthenticated && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      ✓ موثق رسمياً
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  سجل دخولك بحساب Google ليتم ربط المتجر تلقائياً ببياناتك الموثقة ومنع أي حسابات وهمية.
                </p>
                <GoogleAuthButton
                  buttonText={googleAuthenticated ? `موثق بحساب: ${googleAuthenticated.user.email}` : "توثيق المتجر بحساب Google المعتمد"}
                  onSuccess={(session) => {
                    setGoogleAuthenticated(session);
                    if (session?.user?.name) handleNameChange(session.user.name + ' ستور');
                  }}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    اسم المتجر التجاري <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="مثال: متجر صنعاء للإلكترونيات"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    رابط المتجر السحابي (Slug URL) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono">
                    <span className="text-slate-400">seen.store/store/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="bg-transparent outline-none flex-1 text-brand-600 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      تصنيف النشاط التجاري
                    </label>
                    <select
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (e.target.value.includes('إلكترونيات')) handleSelectPreset(THEME_PRESETS[1]);
                        else if (e.target.value.includes('بن') || e.target.value.includes('أغذية')) handleSelectPreset(THEME_PRESETS[2]);
                        else handleSelectPreset(THEME_PRESETS[0]);
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                    >
                      <option value="أزياء وملابس وعبايات">أزياء وملابس وعبايات 👗</option>
                      <option value="إلكترونيات وهواتف ذكية">إلكترونيات وهواتف ذكية ⚡</option>
                      <option value="بن يماني ومقاهي وأغذية">بن يماني ومقاهي وأغذية ☕</option>
                      <option value="عطور ومستحضرات تجميل">عطور ومستحضرات تجميل ✨</option>
                      <option value="عام ومنوع">عام ومنوع 🛍️</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      المدينة الرئيسية للمتجر
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                    >
                      <option value="عدن">عدن 📍</option>
                      <option value="صنعاء">صنعاء 📍</option>
                      <option value="المكلا">المكلا 📍</option>
                      <option value="تعز">تعز 📍</option>
                      <option value="مأرب">مأرب 📍</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    رقم الواتساب لاستقبال الطلبات <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="770 000 000"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    نبذة تعريفية بالمتجر
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-600/20"
                >
                  <span>التالي: اختيار القالب والهوية 🎨</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: THEME & LIVE GENERATOR */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn text-right">
              <div>
                <span className="text-xs font-black text-brand-600 uppercase tracking-wider">الخطوة الثانية</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  اختيار القالب الهندسي والستايل 🎨
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  اختر الشكل الهندسي المناسب لنشاطك، وسيتغير شكل وهيكل العرض فوراً في شاشة المعاينة.
                </p>
              </div>

              {/* Logo Upload Section */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
                  شعار المتجر (Logo)
                </label>
                <ImageUploader 
                  onChange={(url) => setLogoUrl(url)}
                  value={logoUrl}
                  label="تغيير الشعار"
                />
              </div>

              {/* 4 Architectural Templates Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/40 ring-2 ring-brand-500 shadow-md'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Live Color & Font Customizer */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                <div className="font-bold text-xs">تخصيص سريع للألوان والخطوط:</div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">لون البراند:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={customPrimaryColor}
                        onChange={(e) => setCustomPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <span className="text-xs font-mono font-bold">{customPrimaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">الخط العربي:</label>
                    <select
                      value={customFont}
                      onChange={(e) => setCustomFont(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="Tajawal">Tajawal</option>
                      <option value="Cairo">Cairo</option>
                      <option value="Readex Pro">Readex Pro</option>
                      <option value="Almarai">Almarai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-bold">شكل الحواف:</label>
                    <select
                      value={customBorderRadius}
                      onChange={(e) => setCustomBorderRadius(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="pill">دائرية (Pill)</option>
                      <option value="curved">ناعمة (Curved)</option>
                      <option value="sharp">حادة (Sharp)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Services & Addons Section */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="font-bold text-xs text-slate-900 dark:text-white">الخدمات الإضافية للمتجر 🌟</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <input 
                      type="checkbox" 
                      checked={storeServices.delivery}
                      onChange={(e) => setStoreServices({...storeServices, delivery: e.target.checked})}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <div className="text-[11px] font-bold flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-brand-500"/> خدمة التوصيل السريع</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">تفعيل خيارات التوصيل مع مندوبين</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <input 
                      type="checkbox" 
                      checked={storeServices.packaging}
                      onChange={(e) => setStoreServices({...storeServices, packaging: e.target.checked})}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <div className="text-[11px] font-bold flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-purple-500"/> التغليف والهدايا</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">إتاحة خيار تغليف المنتجات للعملاء</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <input 
                      type="checkbox" 
                      checked={storeServices.whatsapp}
                      onChange={(e) => setStoreServices({...storeServices, whatsapp: e.target.checked})}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <div className="text-[11px] font-bold flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-emerald-500"/> الطلب عبر واتساب</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">تسهيل تأكيد الطلب للعملاء</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <input 
                      type="checkbox" 
                      checked={storeServices.aiAdvisor}
                      onChange={(e) => setStoreServices({...storeServices, aiAdvisor: e.target.checked})}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <div className="flex-1">
                      <div className="text-[11px] font-bold flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-blue-500"/> المساعد الذكي AI</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">شات بوت آلي للرد على الزوار</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ← السابق
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-600/20"
                >
                  <span>التالي: إعداد المحافظ والعملة 💳</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENTS & CURRENCIES */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn text-right">
              <div>
                <span className="text-xs font-black text-[#14b8a6] uppercase tracking-wider">الخطوة الثالثة والأخيرة</span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                  طرق الدفع والعملة الأساسية 💳
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  اختر العملة المعتمدة لتسعير منتجاتك، وفعل بوابات الدفع والمحافظ المحلية.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    العملة الأساسية لتسعير المنتجات في متجرك:
                  </label>
                  <select
                    value={baseCurrency}
                    onChange={(e) => setBaseCurrency(e.target.value as CurrencyCode)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                  >
                    <option value="SAR">ريال سعودي (SAR) - موصى به للتسعير المستقر 🇸🇦</option>
                    <option value="YER_ADEN">ريال يمني - طبعة عدن (YER_ADEN) 🇾🇪</option>
                    <option value="YER_SANAA">ريال يمني - طبعة صنعاء (YER_SANAA) 🇾🇪</option>
                    <option value="USD">دولار أمريكي (USD) 🇺🇸</option>
                  </select>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    تفعيل طرق الدفع والمحافظ في اليمن:
                  </div>

                  {/* 1. Al-Qutaibi Islamic Bank */}
                  <div className="p-3.5 rounded-2xl border-2 border-[#14b8a6]/40 bg-teal-50/30 dark:bg-slate-800/80 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#0f2b48] text-[#2dd4bf] font-black text-sm flex items-center justify-center shadow-xs">
                          🏦
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#0f2b48] dark:text-white flex items-center gap-1.5">
                            <span>بنك القطيبي الإسلامي (القطيبي باي)</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-[#14b8a6]/20 text-[#0f2b48] dark:text-[#5eead4] font-bold">
                              رئيسي في عدن 🌟
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">استقبال التحويلات المباشرة لحسابك في بنك القطيبي</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableQutaibi}
                        onChange={(e) => setEnableQutaibi(e.target.checked)}
                        className="w-4 h-4 accent-[#14b8a6] rounded"
                      />
                    </label>

                    {enableQutaibi && (
                      <input
                        type="text"
                        placeholder="رقم حساب بنك القطيبي (مثال: 1249827361)"
                        value={qutaibiAccount}
                        onChange={(e) => setQutaibiAccount(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-right"
                        dir="ltr"
                      />
                    )}
                  </div>

                  {/* 2. Kuraimi */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">K</div>
                        <div>
                          <div className="text-xs font-bold">بنك الكريمي - حاسب والتحويل</div>
                          <div className="text-[10px] text-slate-500">استقبال التحويلات لحسابك المباشر في الكريمي</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableKuraimi}
                        onChange={(e) => setEnableKuraimi(e.target.checked)}
                        className="w-4 h-4 accent-brand-600 rounded"
                      />
                    </label>

                    {enableKuraimi && (
                      <input
                        type="text"
                        placeholder="رقم حساب الكريمي (مثال: 3012345678)"
                        value={kuraimiAccount}
                        onChange={(e) => setKuraimiAccount(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-right"
                        dir="ltr"
                      />
                    )}
                  </div>

                  {/* 3. Unified Network */}
                  <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <div>
                          <div className="text-xs font-bold">الشبكة الموحدة للحوالات</div>
                          <div className="text-[10px] text-slate-500">استقبال التحويلات عبر الشبكة الموحدة</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={enableUnified}
                        onChange={(e) => setEnableUnified(e.target.checked)}
                        className="w-4 h-4 accent-brand-600 rounded"
                      />
                    </label>

                    {enableUnified && (
                      <input
                        type="text"
                        placeholder="رقم المستفيد أو الهاتف"
                        value={unifiedAccount}
                        onChange={(e) => setUnifiedAccount(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-right"
                        dir="ltr"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ← السابق
                </button>
                <button
                  onClick={handleLaunchStore}
                  disabled={isGenerating}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
                >
                  <Rocket className="w-4 h-4" />
                  <span>إطلاق وتوليد المتجر بالذكاء الاصطناعي 🚀</span>
                </button>
              </div>
            </div>
          )}

          {/* AI GENERATING MODAL */}
          {isGenerating && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fadeIn">
              <div className="w-full max-w-md bg-white dark:bg-slateDark-900 rounded-3xl p-8 text-center space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-brand-500/30 animate-bounce">
                  <Sparkles className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    جاري توليد متجرك السحابي...
                  </h3>
                  <p className="text-xs text-slate-500">{generationStage}</p>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-600 to-teal-400 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Interactive Live Store Mockup Canvas */}
        <div className="w-full lg:w-[420px] flex flex-col items-center shrink-0">
          
          <div className="w-full flex items-center justify-between mb-3 text-xs font-bold text-slate-500">
            <span>📱 معاينة حية للمتجر أثناء الإنشاء:</span>
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-200 text-[10px]">
              {activePreset.name.split('(')[0]}
            </span>
          </div>

          {/* Live Mobile Frame */}
          <div
            className={`w-[360px] min-h-[580px] rounded-3xl border-4 border-slate-300 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col text-right ${
              selectedPresetId === 'tech-modern'
                ? 'bg-slate-950 text-white'
                : selectedPresetId === 'yemen-roastery'
                ? 'bg-[#fdfbf7] text-[#451a03]'
                : selectedPresetId === 'minimal-clean'
                ? 'bg-white text-black'
                : 'bg-white text-slate-900'
            }`}
            style={{ fontFamily: customFont }}
          >
            {/* Announcement */}
            <div 
              className="py-1.5 px-3 text-center text-[10px] font-bold text-white"
              style={{ backgroundColor: customPrimaryColor }}
            >
              توصيل سريع لكافة المحافظات | الدفع عند الاستلام
            </div>

            {/* Store Top */}
            <div className={`p-3 border-b flex items-center justify-between ${
              selectedPresetId === 'tech-modern' ? 'border-slate-800 bg-slate-900' : 'border-slate-200'
            }`}>
              <div>
                <div className="text-xs font-black">{storeName}</div>
                <div className="text-[9px] opacity-60">📍 {city} - {category}</div>
              </div>
              <div 
                className="px-2.5 py-1 text-[10px] font-bold text-white shadow-xs"
                style={{ 
                  backgroundColor: customPrimaryColor,
                  borderRadius: customBorderRadius === 'pill' ? '9999px' : customBorderRadius === 'curved' ? '8px' : '0px'
                }}
              >
                السلة (0)
              </div>
            </div>

            {/* Hero Snippet */}
            <div className="p-3 space-y-2">
              {selectedPresetId === 'tech-modern' ? (
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
                  <span className="text-[9px] font-mono text-cyan-400">⚡ NEW TECH 2026</span>
                  <div className="text-xs font-black">{storeName}</div>
                  <div className="text-[9px] text-slate-400">أحدث الهواتف والأجهزة مع ضمان رسمي</div>
                </div>
              ) : selectedPresetId === 'yemen-roastery' ? (
                <div className="p-3 rounded-2xl bg-[#3b1907] text-white space-y-1">
                  <span className="text-[9px] text-amber-300">☕ محاصيل يمنية نادرة</span>
                  <div className="text-xs font-black">{storeName}</div>
                  <div className="text-[9px] text-amber-200/80">بن حرازي ومطري مختص ومحمص طازجاً</div>
                </div>
              ) : selectedPresetId === 'minimal-clean' ? (
                <div className="p-3 border-2 border-black space-y-1">
                  <div className="text-[9px] font-mono">[01] COLLECTION // 2026</div>
                  <div className="text-xs font-black">{storeName}</div>
                </div>
              ) : (
                <div 
                  className="p-3 rounded-2xl text-white space-y-1 shadow-sm"
                  style={{ backgroundColor: customPrimaryColor }}
                >
                  <span className="text-[9px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full">تشكيلة حصرية</span>
                  <div className="text-xs font-black">{storeName}</div>
                  <div className="text-[9px] opacity-90">{description}</div>
                </div>
              )}

              {/* Sample Product Cards */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {[
                  { name: 'منتج تجريبي فاخر #1', price: 120, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300' },
                  { name: 'منتج تجريبي عصري #2', price: 85, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' },
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className={`p-2 overflow-hidden flex flex-col justify-between border ${
                      selectedPresetId === 'tech-modern' ? 'bg-slate-900 border-slate-800 rounded-xl' :
                      selectedPresetId === 'minimal-clean' ? 'border-black bg-white text-black rounded-none' :
                      'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl shadow-xs'
                    }`}
                  >
                    <img src={item.img} alt={item.name} className="aspect-square object-cover rounded-lg w-full mb-1.5" />
                    <div className="text-[10px] font-bold truncate">{item.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] font-black" style={{ color: customPrimaryColor }}>
                        {item.price} {baseCurrency}
                      </span>
                      <span 
                        className="text-[9px] px-1.5 py-0.5 text-white font-bold"
                        style={{ 
                          backgroundColor: customPrimaryColor,
                          borderRadius: customBorderRadius === 'pill' ? '9999px' : '4px'
                        }}
                      >
                        + أضف
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto p-2 border-t text-center text-[8px] opacity-50">
              © {storeName} - استضافة سحابية بواسطة مَزن
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
