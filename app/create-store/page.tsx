'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Store as StoreIcon, Sparkles, Palette, ArrowLeft, ArrowRight, 
  Check, CheckCircle2, ShoppingBag, ShieldCheck, Wallet, Globe, 
  Phone, MapPin, Eye, Cpu, Coffee, Zap, Layers, Smartphone, 
  Monitor, Rocket, Flame, Clock, Image as ImageIcon, Truck, Gift, MessageCircle, Bot, AlertCircle,
  Briefcase, UserCheck, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createStoreAction, checkMerchantCredentialsAction } from '@/app/actions/store';
import { ThemeConfig, ThemePreset, CurrencyCode } from '@/lib/types';
import { THEME_PRESETS } from '@/lib/theme-presets';
import { checkAuthStatusAction } from '@/app/actions/auth';
import BrandLogo from '@/components/BrandLogo';
import ImageUploader from '@/components/ImageUploader';

export default function CreateStorePage() {
  const router = useRouter();

  // Wizard Steps: 1 -> Details, 2 -> Theme & Visuals, 3 -> Payments & Currency, 4 -> Generation
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPendingApproval, setIsPendingApproval] = useState(false);
  const [createdStoreSlug, setCreatedStoreSlug] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  React.useEffect(() => {
    setIsCheckingAuth(false);
  }, []);

  // Store Basic Information
  const [storeName, setStoreName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('أزياء وملابس وعبايات');
  const [storeType, setStoreType] = useState<'PHYSICAL' | 'SERVICE'>('PHYSICAL');
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [city, setCity] = useState('عدن');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');

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
  const [qutaibiAccount, setQutaibiAccount] = useState('');
  const [enableKuraimi, setEnableKuraimi] = useState(true);
  const [kuraimiAccount, setKuraimiAccount] = useState('');
  const [enableUnified, setEnableUnified] = useState(true);
  const [unifiedAccount, setUnifiedAccount] = useState('');

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

  // Validation Errors State
  const [errors, setErrors] = useState<{
    storeName?: string;
    slug?: string;
    phone?: string;
    email?: string;
    password?: string;
  }>({});

  const validateStep1 = () => {
    const errs: Record<string, string> = {};

    if (!storeName.trim()) {
      errs.storeName = 'اسم المتجر حقل إلزامي لا يمكن تركه فارغاً.';
    } else if (storeName.trim().length < 2) {
      errs.storeName = 'اسم المتجر يجب أن يكون حرفين على الأقل.';
    }

    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug) {
      errs.slug = 'رابط المتجر (Slug) حقل إلزامي.';
    } else if (!/^[a-z0-9-]+$/i.test(cleanSlug)) {
      errs.slug = 'الرابط يجب أن يحتوي على أحرف وأرقام إنجليزية وشرطات (-) فقط بدون مسافات.';
    }

    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone) {
      errs.phone = 'رقم الواتساب / الهاتف إلزامي لاستقبال الطلبات والتواصل معك.';
    } else if (cleanPhone.length < 8) {
      errs.phone = 'يرجى كتابة رقم هاتف صالح لا يقل عن 8 أرقام.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'البريد الإلكتروني الرسمي حقل إلزامي للدخول وإدارة المتجر.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'صيغة البريد الإلكتروني غير صحيحة (مثال: store@example.com).';
    }

    if (!password) {
      errs.password = 'كلمة المرور مطلوبة لحماية لوحة تحكم متجرك.';
    } else if (password.length < 4) {
      errs.password = 'كلمة المرور يجب أن لا تقل عن 4 خانات.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const [isValidatingCredentials, setIsValidatingCredentials] = useState(false);

  const handleNextToStep2 = async () => {
    if (!validateStep1()) {
      toast.error('يرجى تعبئة الحقول الإلزامية المطلوبة أولاً');
      return;
    }

    setIsValidatingCredentials(true);
    try {
      const checkRes = await checkMerchantCredentialsAction(email, phone);
      if (!checkRes.available) {
        if (checkRes.field === 'email') {
          setErrors(prev => ({ ...prev, email: checkRes.error }));
        } else if (checkRes.field === 'phone') {
          setErrors(prev => ({ ...prev, phone: checkRes.error }));
        }
        toast.error(checkRes.error || 'البيانات المدخلة مسجلة مسبقاً لدى حساب آخر.');
        return;
      }
    } catch (e) {
      console.warn('Credentials validation check bypassed due to network error');
    } finally {
      setIsValidatingCredentials(false);
    }

    setCurrentStep(2);
  };

  // Generate slug automatically from name if user hasn't typed a custom slug
  const handleNameChange = (name: string) => {
    setStoreName(name);
    if (errors.storeName) {
      setErrors(prev => ({ ...prev, storeName: undefined }));
    }
    // Simple transliteration/slugify
    const autoSlug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0621-\u064A-]/g, '')
      .replace(/[\u0621-\u064A]/g, '') || 'my-store';
    
    if (autoSlug.length > 2) {
      setSlug(autoSlug);
      if (errors.slug) {
        setErrors(prev => ({ ...prev, slug: undefined }));
      }
    }
  };

  // Launch and create the store
  const handleLaunchStore = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      toast.error('يرجى تعبئة كافة بيانات المتجر الإلزامية بشكل صحيح أولاً');
      return;
    }

    // Strict double-check credentials before store launch
    const checkRes = await checkMerchantCredentialsAction(email, phone);
    if (!checkRes.available) {
      setCurrentStep(1);
      if (checkRes.field === 'email') {
        setErrors(prev => ({ ...prev, email: checkRes.error }));
      } else if (checkRes.field === 'phone') {
        setErrors(prev => ({ ...prev, phone: checkRes.error }));
      }
      toast.error(checkRes.error || 'البيانات المدخلة مسجلة مسبقاً.');
      return;
    }

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

      finalThemeConfig.storeType = storeType;
      if (storeType === 'SERVICE' && professionalTitle) {
        finalThemeConfig.professionalTitle = professionalTitle;
      }

      const res = await createStoreAction({
        name: storeName,
        slug: cleanSlug,
        phone,
        email,
        password,
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
        setCreatedStoreSlug(res.store.slug || cleanSlug);
        setIsPendingApproval(true);
      } else {
        alert('حدث خطأ أثناء إنشاء المتجر: ' + (res.error || 'حدث خطأ غير معروف'));
        setIsGenerating(false);
      }
  };

  if (isPendingApproval) {
    const targetSlug = createdStoreSlug || slug || 'my-store';
    const isService = storeType === 'SERVICE';
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slateDark-950 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2 max-w-lg">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
            {isService ? 'تم إنشاء بروفايلك المهني بنجاح! 🎉' : 'تم إنشاء متجرك السحابي بنجاح! 🎉'}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            تم تفعيل باقتك التجريبية المجانية لمدة 14 يوماً مع كافة الصلاحيات. رقم التواصل المسجل: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">{phone}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full max-w-md">
          <Link 
            href={`/merchant/${targetSlug}`} 
            className="w-full sm:flex-1 py-3.5 px-6 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-600/25 transition-all text-sm flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4" />
            <span>الدخول إلى لوحة التحكم فوراً 🚀</span>
          </Link>
          <Link 
            href={`/store/${targetSlug}`} 
            target="_blank"
            className="w-full sm:w-auto py-3.5 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة المنصة</span>
          </Link>
        </div>

        <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 pt-2">
          ← العودة للصفحة الرئيسية
        </Link>
      </div>
    );
  }

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slateDark-950 flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-slate-500 font-bold text-sm">جاري التحقق من الصلاحيات...</p>
      </div>
    );
  }

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
          <span className="text-slate-300">←</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${currentStep >= 2 ? 'bg-brand-50 text-brand-600 dark:bg-brand-950 border border-brand-200' : 'text-slate-400'}`}>
            <span>2. القالب والهوية المرئية</span>
          </div>
          <span className="text-slate-300">←</span>
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
                  اختر نوع نشاطك وأدخل بياناتك الأساسية لتخصيص لوحة التحكم والواجهة تلقائياً مع 14 يوماً تجربة مجانية.
                </p>
              </div>

              {/* Business Model Selection Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  نوع المتجر أو البروفايل المهني <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: Physical Store */}
                  <div
                    onClick={() => {
                      setStoreType('PHYSICAL');
                      if (category.includes('محاماة') || category.includes('استشارات') || category.includes('عيادات')) {
                        setCategory('أزياء وملابس وعبايات');
                      }
                      handleSelectPreset(THEME_PRESETS[0]);
                      setCustomPrimaryColor('#0f2b48');
                      setStoreServices(prev => ({ ...prev, delivery: true }));
                    }}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      storeType === 'PHYSICAL'
                        ? 'border-brand-600 bg-brand-50/40 dark:bg-brand-950/30 shadow-md ring-2 ring-brand-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center text-brand-600 mb-2">
                        <Package className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        storeType === 'PHYSICAL' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {storeType === 'PHYSICAL' ? '✓ تم التحديد' : 'تحديد'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        متجر سلع وبضائع ملموسة
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        ملابس، إلكترونيات، مقاهي، عطور. يتضمن سلة تسوق، إدارة المخزون، والشحن والتوصيل.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: Service Profile */}
                  <div
                    onClick={() => {
                      setStoreType('SERVICE');
                      setCategory('محاماة واستشارات قانونية');
                      const servicePreset = THEME_PRESETS.find(p => p.id === 'service-expert') || THEME_PRESETS[0];
                      handleSelectPreset(servicePreset);
                      setCustomPrimaryColor('#0d9488');
                      setStoreServices(prev => ({ ...prev, delivery: false }));
                    }}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      storeType === 'SERVICE'
                        ? 'border-teal-600 bg-teal-50/40 dark:bg-teal-950/30 shadow-md ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/40 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 mb-2">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        storeType === 'SERVICE' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {storeType === 'SERVICE' ? '✓ تم التحديد' : 'تحديد'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        بروفايل خدمات مهنية واستشارات
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        محامين، عيادات، مستشارين، مصممين. بروفايل مهني، حجز استشارات وطلب خدمات بدون شحن.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    {storeType === 'SERVICE' ? 'اسم المكتب / البروفايل المهني' : 'اسم المتجر التجاري'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder={storeType === 'SERVICE' ? 'مثال: مكتب المحامي يوسف العدني، استشارات د. محمد' : 'مثال: متجر صنعاء للإلكترونيات'}
                    className={`w-full px-4 py-3 rounded-2xl border ${
                      errors.storeName
                        ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-brand-500'
                    } text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 transition-all`}
                  />
                  {errors.storeName && (
                    <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.storeName}</span>
                    </p>
                  )}
                </div>

                {storeType === 'SERVICE' && (
                  <div className="animate-fadeIn">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      المسمى المهني / التخصص (اختياري)
                    </label>
                    <input
                      type="text"
                      value={professionalTitle}
                      onChange={(e) => setProfessionalTitle(e.target.value)}
                      placeholder="مثال: محامي ومستشار قانوني معتمد، استشاري طب أطفال، مصمم واجهات رقمية..."
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      {storeType === 'SERVICE' ? 'رابط المنصة والبروفايل (Slug URL)' : 'رابط المتجر السحابي (Slug URL)'} <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-brand-600 font-bold bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                      معرف فريد للرابط
                    </span>
                  </div>
                  <div
                    className={`flex items-center rounded-2xl border ${
                      errors.slug
                        ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                    } px-3 py-2 text-xs font-mono transition-all`}
                  >
                    <span className="text-slate-400 select-none" dir="ltr">seen.store/store/</span>
                    <input
                      type="text"
                      value={slug}
                      placeholder={storeType === 'SERVICE' ? 'lawyer-yusef' : 'my-store'}
                      dir="ltr"
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        setSlug(val);
                        if (errors.slug) setErrors((prev) => ({ ...prev, slug: undefined }));
                      }}
                      className="bg-transparent outline-none flex-1 text-brand-600 font-bold"
                    />
                  </div>
                  {errors.slug && (
                    <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.slug}</span>
                    </p>
                  )}

                  {/* Visual Guidance Box */}
                  <div className="mt-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 text-[11px] space-y-1.5 text-slate-600 dark:text-slate-400">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                      <span>كيفية كتابة رابط المنصة بشكل صحيح:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[10px] leading-relaxed pr-1 text-slate-500 dark:text-slate-400">
                      <li>استخدم <strong>أحرفاً إنجليزية صغيرة</strong> (a-z) وأرقاماً (0-9) فقط.</li>
                      <li>استخدم <strong>الشرطة (-)</strong> للفصل بين الكلمات بدون مسافات أو رموز خاصة.</li>
                      <li>اختر اسماً مختصراً يعبر عنك لمشاركته بسهولة مع عملائك.</li>
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                      تصنيف النشاط
                    </label>
                    <input
                      type="text"
                      list="categories"
                      placeholder="اختر أو اكتب نشاطك..."
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (e.target.value.includes('إلكترونيات')) handleSelectPreset(THEME_PRESETS[1]);
                        else if (e.target.value.includes('بن') || e.target.value.includes('أغذية')) handleSelectPreset(THEME_PRESETS[2]);
                        else if (e.target.value.includes('محاماة') || e.target.value.includes('استشارات')) {
                          const sPreset = THEME_PRESETS.find(p => p.id === 'service-expert');
                          if (sPreset) handleSelectPreset(sPreset);
                        } else handleSelectPreset(THEME_PRESETS[0]);
                      }}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                    />
                    {storeType === 'SERVICE' ? (
                      <datalist id="categories">
                        <option value="محاماة واستشارات قانونية" />
                        <option value="عيادات واستشارات طبية" />
                        <option value="تصميم وبرمجة وتقنية" />
                        <option value="استشارات أعمال ومالية" />
                        <option value="تدريب وتعليم وتطوير" />
                        <option value="خدمات هندسية ومعمارية" />
                        <option value="خدمات عامة وحرفية" />
                      </datalist>
                    ) : (
                      <datalist id="categories">
                        <option value="أزياء وملابس وعبايات" />
                        <option value="إلكترونيات وهواتف ذكية" />
                        <option value="بن يماني ومقاهي وأغذية" />
                        <option value="عطور ومستحضرات تجميل" />
                        <option value="هدايا وتحف وإكسسوارات" />
                        <option value="عام ومنوع" />
                      </datalist>
                    )}
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
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                    onBlur={async () => {
                      const clean = phone.replace(/[\s-]/g, '');
                      if (clean.length >= 8) {
                        try {
                          const res = await checkMerchantCredentialsAction(undefined, clean);
                          if (!res.available && res.field === 'phone') {
                            setErrors((prev) => ({ ...prev, phone: res.error }));
                            toast.error(res.error || 'رقم الهاتف مسجل مسبقاً');
                          }
                        } catch {}
                      }
                    }}
                    placeholder="770 000 000"
                    className={`w-full px-4 py-3 rounded-2xl border ${
                      errors.phone
                        ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-brand-500'
                    } text-xs font-mono font-bold outline-none focus:ring-2 transition-all`}
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.phone}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    البريد الإلكتروني الرسمي <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    onBlur={async () => {
                      const clean = email.trim().toLowerCase();
                      if (clean && clean.includes('@')) {
                        try {
                          const res = await checkMerchantCredentialsAction(clean);
                          if (!res.available && res.field === 'email') {
                            setErrors((prev) => ({ ...prev, email: res.error }));
                            toast.error(res.error || 'البريد الإلكتروني مسجل مسبقاً');
                          }
                        } catch {}
                      }
                    }}
                    placeholder="example@gmail.com"
                    className={`w-full px-4 py-3 rounded-2xl border ${
                      errors.email
                        ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-brand-500'
                    } text-xs font-mono font-bold outline-none focus:ring-2 transition-all`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-300 mb-2">
                    كلمة المرور للمتجر <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder="••••••••"
                    required
                    className={`w-full px-4 py-3 rounded-2xl border ${
                      errors.password
                        ? 'border-red-500 bg-red-50/40 dark:bg-red-950/20 focus:ring-red-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-brand-500'
                    } text-xs font-mono font-bold outline-none focus:ring-2 transition-all`}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-500 font-bold mt-1.5 flex items-center gap-1.5 animate-fadeIn">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                    نبذة تعريفية بالمتجر
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    placeholder="مثال: أفضل متجر لبيع الملابس العصرية بجودة عالية وتوصيل سريع لكافة المحافظات."
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={isValidatingCredentials}
                  onClick={handleNextToStep2}
                  className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-600/20 active:scale-95 transition-all"
                >
                  <span>{isValidatingCredentials ? 'جاري التحقق من توفر الحساب...' : 'التالي: اختيار القالب والهوية 🎨'}</span>
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
                  onClick={() => {
                    if (!validateStep1()) {
                      setCurrentStep(1);
                      toast.error('يرجى تعبئة الحقول الإلزامية أولاً');
                      return;
                    }
                    setCurrentStep(3);
                  }}
                  className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-brand-600/20 active:scale-95 transition-all"
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
              © {storeName} - مدعوم بواسطة منصة سِين
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
