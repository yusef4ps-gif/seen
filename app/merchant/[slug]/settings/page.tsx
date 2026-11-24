'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Settings, Wallet, RefreshCw, Truck, Store as StoreIcon, Database, 
  Save, CheckCircle2, Plus, Trash2, Building2, Phone, MapPin, Image as ImageIcon,
  Target, ShieldCheck, Sparkles, X, Share2, Globe, Linkedin
} from 'lucide-react';
import { Store, CurrencyCode, PaymentAccountConfig, ShippingMethod } from '@/lib/types';
import { getStoreBySlugAction, updateStoreAction, getPlansAction } from '@/app/actions/store';
import { getSiteContentAction } from '@/app/actions/content';
import { isAiAllowedForStore, isAiPlanAllowedForStore } from '@/lib/ai-access';
import { updateMerchantCredentialsAction, getMerchantUserAction } from '@/app/actions/auth';
import { generateApiKeyAction, getApiKeysAction, deleteApiKeyAction } from '@/app/actions/apiKey';
import { generateLegalPageAction } from '@/app/actions/ai';
import { storeEngine } from '@/lib/store-engine';
import toast from 'react-hot-toast';

export default function MerchantSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'currencies' | 'shipping' | 'marketing' | 'accounting' | 'legal'>('general');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  
  const [legalPages, setLegalPages] = useState({
    privacy: '',
    terms: '',
    returns: '',
    faq: ''
  });
  const [isGeneratingLegal, setIsGeneratingLegal] = useState<'privacy' | 'terms' | 'returns' | 'faq' | null>(null);

  // Compress image client-side to prevent large base64 payload errors
  const compressAndSetImage = (file: File, maxWidth: number, maxHeight: number, callback: (url: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          callback(dataUrl);
        } else {
          callback(e.target?.result as string);
        }
      };
      img.onerror = () => {
        callback(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  
  const generateApiKey = async () => {
    if (!store) return;
    setIsGeneratingKey(true);
    try {
      const newKey = await generateApiKeyAction(store.id, 'مفتاح جديد ' + new Date().toLocaleDateString('ar-EG'));
      setApiKeys([...apiKeys, newKey]);
    } catch (e) {
      setIsSaving(false);
      alert('فشل توليد المفتاح');
    }
    setIsGeneratingKey(false);
  };

  const copyApiKey = (keyStr: string) => {
    navigator.clipboard.writeText(keyStr);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRevokeApiKey = async (keyId: string) => {
    if (!store) return;
    if (confirm('هل أنت متأكد من إلغاء هذا المفتاح؟ سيتوقف أي نظام متصل به عن العمل.')) {
      await deleteApiKeyAction(store.id, keyId);
      setApiKeys(apiKeys.filter(k => k.id !== keyId));
    }
  };


  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0d9488');
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('SAR');
  const [storeType, setStoreType] = useState('PHYSICAL');
  const [allowDigitalProducts, setAllowDigitalProducts] = useState(true);
  const [professionalTitle, setProfessionalTitle] = useState('');
  const [providerBio, setProviderBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [consultationsCount, setConsultationsCount] = useState('');
  const [certifications, setCertifications] = useState('');
  const [hideBannerTexts, setHideBannerTexts] = useState(false);
  const [hideTrustBadges, setHideTrustBadges] = useState(false);
  const [hideBannerButtons, setHideBannerButtons] = useState(false);
  const [bannerOverlayStyle, setBannerOverlayStyle] = useState<'none' | 'light' | 'dark'>('light');
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [deliveryCurrency, setDeliveryCurrency] = useState<CurrencyCode>('YER_SANAA');
  const [activeYemeniMarket, setActiveYemeniMarket] = useState<'YER_ADEN' | 'YER_SANAA'>('YER_ADEN');
  const [ratesByBase, setRatesByBase] = useState<Record<string, any>>({
    SAR: { YER_ADEN: 0, YER_SANAA: 0, SAR: 0, USD: 0 },
    USD: { YER_ADEN: 0, YER_SANAA: 0, SAR: 0, USD: 0 },
    YER_ADEN: { YER_ADEN: 0, YER_SANAA: 0, SAR: 0, USD: 0 },
    YER_SANAA: { YER_ADEN: 0, YER_SANAA: 0, SAR: 0, USD: 0 },
  });

  const customRates = ratesByBase[baseCurrency] || { YER_ADEN: 0, YER_SANAA: 0, SAR: 0, USD: 0 };
  const updateCustomRate = (currency: string, val: number) => {
    setRatesByBase(prev => ({
      ...prev,
      [baseCurrency]: {
        ...(prev[baseCurrency] || {}),
        [currency]: val
      }
    }));
  };
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccountConfig[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  
  const [marketingPixels, setMarketingPixels] = useState({
    meta: '',
    tiktok: '',
    snapchat: '',
    googleAds: '',
    googleAnalytics: '',
    x: '',
  });

  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    instagram: '',
    x: '',
    tiktok: '',
    snapchat: '',
    linkedin: '',
  });

  // Account Credentials State
  const [accountId, setAccountId] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [credentialsSaved, setCredentialsSaved] = useState(false);

  useEffect(() => {
    async function init() {
      const user = await getMerchantUserAction();
      if (user) {
        setAccountId(user.id);
        setLoginEmail(user.email);
      }

      if (slug) {
        const [s, dbPlans, siteContentRes] = await Promise.all([
          getStoreBySlugAction(slug),
          getPlansAction(),
          getSiteContentAction()
        ]);
        if (s) {
          setStore(s as any);
          setName(s.name || '');
          setEmail(s.email || '');
          setCustomDomain((s as any).customDomain || '');
          setDescription(s.description || '');
          setPhone(s.phone);
          setWhatsapp(s.whatsapp || '');
          setCity(s.city || '');
          setAddress(s.address || '');
          setLogo(s.logo || '');
          setBanner(s.banner || '');
          setPrimaryColor(s.primaryColor || '#0d9488');
          setBaseCurrency(s.baseCurrency as any);
          setDeliveryCurrency((s as any).deliveryCurrency as any || 'YER_SANAA');
          setActiveYemeniMarket((s as any).activeYemeniMarket || 'YER_ADEN');
          
          let parsedRates = s.customRates;
          if (parsedRates && parsedRates[s.baseCurrency as string] && typeof parsedRates[s.baseCurrency as string] === 'object') {
             setRatesByBase(prev => ({ ...prev, ...parsedRates }));
          } else if (parsedRates) {
             setRatesByBase(prev => ({
                ...prev,
                [s.baseCurrency as string]: { ...prev[s.baseCurrency as string], ...parsedRates }
             }));
          }
          setPaymentAccounts(s.paymentAccounts || []);
          setShippingMethods(s.shippingMethods || []);
          const keys = await getApiKeysAction(s.id);
          setApiKeys(keys);
          if ((s as any).marketingPixels) {
            try {
              const parsed = JSON.parse((s as any).marketingPixels);
              setMarketingPixels(parsed);
            } catch (e) {
              // ignore
            }
          }
          if ((s as any).socialLinks) {
            try {
              const parsed = JSON.parse((s as any).socialLinks);
              setSocialLinks(prev => ({
                ...prev,
                ...parsed,
                linkedin: parsed.linkedin || ''
              }));
            } catch (e) {
              // ignore
            }
          }
          if ((s as any).themeConfig) {
            try {
              const parsed = typeof s.themeConfig === 'string' ? JSON.parse(s.themeConfig) : s.themeConfig;
              if (parsed.legalPages) {
                setLegalPages(parsed.legalPages);
              }
              if (parsed.storeType) {
                setStoreType(parsed.storeType);
              }
              if (parsed.allowDigitalProducts !== undefined) {
                setAllowDigitalProducts(parsed.allowDigitalProducts);
              }
              if (parsed.professionalTitle) setProfessionalTitle(parsed.professionalTitle);
              if (parsed.providerBio) setProviderBio(parsed.providerBio);
              if (parsed.experienceYears) setExperienceYears(parsed.experienceYears);
              if (parsed.consultationsCount) setConsultationsCount(parsed.consultationsCount);
              if (parsed.certifications) setCertifications(parsed.certifications);
              if (parsed.hideBannerTexts !== undefined) setHideBannerTexts(Boolean(parsed.hideBannerTexts));
              if (parsed.hideTrustBadges !== undefined) setHideTrustBadges(Boolean(parsed.hideTrustBadges));
              if (parsed.hideBannerButtons !== undefined) setHideBannerButtons(Boolean(parsed.hideBannerButtons));
              if (parsed.bannerOverlayStyle) setBannerOverlayStyle(parsed.bannerOverlayStyle);
              if (parsed.showPortfolio !== undefined) setShowPortfolio(Boolean(parsed.showPortfolio));
            } catch (e) {
              // ignore
            }
          }

          // Evaluate AI availability across all platform layers
          const globalAiEnabled = siteContentRes?.dictionary?.['ai_enabled'];
          const allowed = isAiAllowedForStore(
            s as any,
            dbPlans || [],
            globalAiEnabled
          );
          setIsAiEnabled(allowed);
        }
      }
    }
    init();
  }, [slug]);

  if (!store) return null;

  const isServiceStore = (() => {
    if (storeType === 'SERVICE' || storeType === 'DIGITAL') return true;
    try {
      const cfg = typeof store?.themeConfig === 'string' ? JSON.parse(store?.themeConfig) : (store?.themeConfig || {});
      return (
        cfg?.storeType === 'SERVICE' || 
        cfg?.storeType === 'DIGITAL' || 
        cfg?.presetId === 'service-expert' ||
        (store as any)?.storeType === 'SERVICE' ||
        (store as any)?.storeType === 'DIGITAL' ||
        store?.category?.includes('خدمات') ||
        store?.category?.includes('استشارات') ||
        store?.category?.includes('تدريب') ||
        store?.category?.includes('محاماة') ||
        store?.category?.includes('عياد') ||
        store?.category?.includes('services') ||
        store?.category?.includes('consulting') ||
        store?.category?.includes('digital')
      );
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    if (isServiceStore && (activeTab === 'shipping' || activeTab === 'accounting')) {
      setActiveTab('general');
    }
  }, [isServiceStore, activeTab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    if (isSaving) return;
    setIsSaving(true);
    e.preventDefault();
    if (!store) return;
    
    const currentThemeConfig = typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig || '{}') : (store.themeConfig || {});
    
    // If banner is updated, also synchronize hero_slider section slides so Theme Builder and Storefront stay in sync
    let syncedSections = currentThemeConfig.sections;
    if (banner && Array.isArray(syncedSections)) {
      syncedSections = syncedSections.map((sec: any) => {
        if (sec.type === 'hero_slider') {
          return {
            ...sec,
            settings: {
              ...sec.settings,
              bannerImageUrl: banner,
              heroSlides: [{ image: banner, title: sec.settings?.bannerTitle || '', subtitle: sec.settings?.bannerSubtitle || '' }]
            }
          };
        }
        return sec;
      });
    }

    const updatedThemeConfig = { 
      ...currentThemeConfig, 
      colors: {
        ...(currentThemeConfig.colors || {}),
        primary: primaryColor
      },
      bannerUrl: banner || currentThemeConfig.bannerUrl,
      sections: syncedSections || currentThemeConfig.sections,
      legalPages, 
      storeType,
      allowDigitalProducts,
      professionalTitle,
      providerBio,
      experienceYears,
      consultationsCount,
      certifications,
      hideBannerTexts,
      hideTrustBadges,
      hideBannerButtons,
      bannerOverlayStyle,
      showPortfolio
    };

    const res = await updateStoreAction(store.id, {
      name,
      email,
      customDomain: customDomain || null,
      description,
      phone,
      whatsapp,
      city,
      address,
      logo,
      banner,
      primaryColor,
      baseCurrency,
      customRates: JSON.stringify(ratesByBase),
      paymentAccounts: JSON.stringify(paymentAccounts),
      shippingMethods: JSON.stringify(shippingMethods),
      marketingPixels: JSON.stringify(marketingPixels),
      socialLinks: JSON.stringify(socialLinks),
      themeConfig: JSON.stringify(updatedThemeConfig),
    });

    if (res.success && res.store) {
      setStore(res.store as any);
      try {
        storeEngine.updateStore(res.store as any);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`seen_store_primaryColor_${slug}`, primaryColor);
        }
      } catch (e) {}
      setIsSaving(false);
      setIsSaved(true);
      toast.success('تم حفظ التعديلات وتحديث هوية المتجر بنجاح! 🎉');
      setTimeout(() => setIsSaved(false), 3000);
    } else {
      setIsSaving(false);
      toast.error('فشل حفظ التعديلات: ' + (res.error || 'خطأ غير معروف'));
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingCredentials || !accountId) return;
    setIsSavingCredentials(true);

    const res = await updateMerchantCredentialsAction(accountId, loginEmail, newPassword);
    
    if (res.success) {
      setNewPassword('');
      setIsSavingCredentials(false);
      setCredentialsSaved(true);
      setTimeout(() => setCredentialsSaved(false), 3000);
    } else {
      setIsSavingCredentials(false);
      alert(res.error || 'فشل تحديث بيانات الدخول');
    }
  };

  const handleTogglePayment = (id: string) => {
    setPaymentAccounts(
      paymentAccounts.map((acc) => (acc.id === id ? { ...acc, isActive: !acc.isActive } : acc))
    );
  };

  const handleUpdatePaymentField = (id: string, field: 'accountNumber' | 'accountName' | 'instructions' | 'name', value: string) => {
    setPaymentAccounts(
      paymentAccounts.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
  };

  const handleAddPaymentMethod = () => {
    const newName = prompt('أدخل اسم طريقة الدفع (مثال: محفظة كذا، بنك كذا):');
    if (!newName) return;
    const newId = `custom_${Date.now()}`;
    setPaymentAccounts([
      ...paymentAccounts,
      {
        id: newId,
        type: newId as any,
        name: newName,
        isActive: true,
        accountNumber: '',
        accountName: '',
        instructions: ''
      }
    ]);
  };

  const handleAddShippingMethod = () => {
    const newName = prompt('أدخل اسم شركة/منطقة التوصيل:');
    if (!newName) return;
    const newCostStr = prompt('أدخل تكلفة التوصيل (رقم، مثلا 500 أو 0 للمجاني):', '0');
    const newCost = parseFloat(newCostStr || '0') || 0;
    
    setShippingMethods([
      ...shippingMethods,
      {
        id: `ship_${Date.now()}`,
        name: newName,
        cost: newCost,
        currency: baseCurrency,
        estimatedDelivery: '1-2 أيام',
        isActive: true,
        isPickup: false
      }
    ]);
  };

  const handleRemovePaymentMethod = (id: string) => {
    if(confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) {
      setPaymentAccounts(paymentAccounts.filter(acc => acc.id !== id));
    }
  };

  
  const handleToggleShipping = (id: string) => {
    setShippingMethods(
      shippingMethods.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    );
  };

  const handleRemoveShippingMethod = (id: string) => {
    if(confirm('هل أنت متأكد من حذف شركة التوصيل هذه؟')) {
      setShippingMethods(shippingMethods.filter(m => m.id !== id));
    }
  };

  const handleGenerateLegal = async (type: 'privacy' | 'terms' | 'returns' | 'faq') => {
    if (!store) return;
    setIsGeneratingLegal(type);
    try {
      const res = await generateLegalPageAction(store.name, store.category || 'متجر عام', type);
      if (res.success && res.text) {
        setLegalPages(prev => ({ ...prev, [type]: res.text }));
      } else {
        alert('حدث خطأ أثناء التوليد. الرجاء المحاولة مرة أخرى.');
      }
    } catch (e) {
      alert('حدث خطأ أثناء الاتصال بالخادم.');
    }
    setIsGeneratingLegal(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-600" />
            <span>إعدادات المتجر والهوية والمدفوعات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            تخصيص الهوية البصرية، ربط المحافظ المحلية والكريمي، وإدارة أسعار الصرف الحية
          </p>
        </div>

        <button
          onClick={handleSaveSettings} disabled={isSaving}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/25 flex items-center justify-center gap-1.5 ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'جاري الحفظ...' : isSaved ? 'تم حفظ الإعدادات بنجاح ✓' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'general', label: 'الهوية العامة والمعلومات', icon: StoreIcon },
          { id: 'payments', label: 'المحافظ وطرق الدفع', icon: Wallet },
          { id: 'currencies', label: 'العملات وأسعار الصرف', icon: RefreshCw },
          { id: 'shipping', label: 'الشحن والتوصيل', icon: Truck },
          { id: 'marketing', label: 'التسويق والبكسلات', icon: Target },
          { id: 'accounting', label: 'الربط المحاسبي (ERP)', icon: Database },
          { id: 'legal', label: 'الصفحات القانونية', icon: ShieldCheck },
        ].filter(tab => !isServiceStore || (tab.id !== 'accounting' && tab.id !== 'shipping')).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Tab 1: General Branding */}
        {activeTab === 'general' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              بيانات المتجر والهوية البصرية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم المتجر
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  البريد الإلكتروني للمتجر
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none dir-ltr text-right"
                  placeholder="contact@example.com"
                />
              </div>

              {/* Platform Slug Link Section */}
              <div className="sm:col-span-2 p-5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl mb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div>
                    <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                      رابط المنصة السحابي الرسمي (Platform URL)
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      هذا هو الرابط الدائم المعتمد لمشاركة بروفايلك أو متجرك مع العملاء والمستفيدين
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/store/${slug}`;
                        navigator.clipboard.writeText(url);
                        alert('تم نسخ الرابط بنجاح: ' + url);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </button>
                    <a
                      href={`/store/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>فتح المنصة</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-brand-600 dark:text-brand-400 font-bold" dir="ltr">
                  <span>/store/{slug}</span>
                </div>
              </div>

              <div className="sm:col-span-2 p-5 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800/50 rounded-2xl mb-4">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                  النطاق المخصص (Custom Domain)
                </label>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  اربط دومين خاص بمتجرك (مثل www.yourstore.com). يرجى التأكد من إضافة سجل <strong>CNAME</strong> باسم <strong>www</strong> في إعدادات النطاق الخاص بك (DNS) ليوجه إلى <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-brand-600">aden-salla.netlify.app</code>، وسجل <strong>A Record</strong> باسم <strong>@</strong> يوجه إلى <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-brand-600">75.2.60.5</code>.
                </p>
                <div className="flex w-full sm:w-2/3">
                  <span className="inline-flex items-center px-3 rounded-r-xl border border-l-0 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs dir-ltr">
                    https://
                  </span>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value.toLowerCase().trim())}
                    className="flex-1 min-w-0 px-3 py-2.5 text-xs rounded-none rounded-l-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none dir-ltr font-mono focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="www.mystore.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    المدينة / المحافظة الرئيسية
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
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نوع المتجر (طبيعة المنتجات)
                  </label>
                  <select
                    value={storeType}
                    onChange={(e) => setStoreType(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="PHYSICAL">متجر سلع وبضائع ملموسة (شحن ومخزون وسلة تسوق)</option>
                    <option value="SERVICE">منصة خدمات واستشارات مهنية (بروفايل خبير وحجوزات)</option>
                    <option value="DIGITAL">منتجات رقمية وملفات قابلة للتنزيل</option>
                  </select>
                </div>

                {/* Optional Digital Products Support */}
                <div className="pt-2 flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      تمكين بيع وإرفاق المنتجات الرقمية (ملفات PDF والكتب والملفات)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      يتيح إمكانية إرفاق ملفات رقمية يتم تسليمها للعميل تلقائياً فور الشراء
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={allowDigitalProducts}
                      onChange={(e) => setAllowDigitalProducts(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Service & Consultant Executive Profile Section */}
            {(storeType === 'SERVICE' || storeType === 'DIGITAL') && (
              <div className="p-5 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-4">
                <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-xs">
                  <span>💼 بيانات البروفايل المهني والنبذة التعريفية (خاص بالخدمات والاستشارات)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      المسمى المهني / التخصص الدقيق
                    </label>
                    <input
                      type="text"
                      value={professionalTitle}
                      onChange={(e) => setProfessionalTitle(e.target.value)}
                      placeholder="مثال: مستشار قانوني ومحكم دولي معتمد"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      سنوات الخبرة العملية
                    </label>
                    <input
                      type="text"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      placeholder="مثال: +12 سنة خبرة"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      عدد الاستشارات أو المشاريع المنجزة
                    </label>
                    <input
                      type="text"
                      value={consultationsCount}
                      onChange={(e) => setConsultationsCount(e.target.value)}
                      placeholder="مثال: +450 استشارة ناجحة"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      الاعتمادات والتراخيص المهنية
                    </label>
                    <input
                      type="text"
                      value={certifications}
                      onChange={(e) => setCertifications(e.target.value)}
                      placeholder="مثال: عضو نقابة المحامين، معتمد من وزارة العدل"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    النبذة التعريفية المفصلة عن مقدم الخدمة (Bio)
                  </label>
                  <textarea
                    rows={3}
                    value={providerBio}
                    onChange={(e) => setProviderBio(e.target.value)}
                    placeholder="اكتب نبذة شاملة عن مؤهلاتك، مجالات خبرتك، والقيمة المضافة التي تقدمها لعملائك ومستفيدي خدماتك..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none resize-none"
                  />
                </div>

                {/* Show Portfolio Toggle */}
                <div className="pt-2 border-t border-teal-200/60 dark:border-teal-800/40">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-teal-200 dark:border-teal-800 bg-white dark:bg-slate-900 cursor-pointer">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">تفعيل تبويب وقسم معرض الأعمال وسابقة المشاريع (Portfolio)</div>
                      <div className="text-[10px] text-slate-500">إظهار تبويب "معرض الأعمال" في الشريط العلوي بالمتجر لاستعراض سابقة أعمالك ونماذج المشاريع المنجزة</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={showPortfolio}
                      onChange={(e) => setShowPortfolio(e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نبذة تعريفية عن المتجر (Bio)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رقم الهاتف الرسمي
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رقم WhatsApp (للتواصل المباشر مع العملاء في المتجر والإشعارات)
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="967770000000"
                  dir="ltr"
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">روابط وسائل التواصل الاجتماعي</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">رابط Facebook</label>
                  <input
                    type="url"
                    value={socialLinks.facebook}
                    onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    placeholder="https://facebook.com/..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">رابط Instagram</label>
                  <input
                    type="url"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    placeholder="https://instagram.com/..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">رابط X (Twitter)</label>
                  <input
                    type="url"
                    value={socialLinks.x}
                    onChange={(e) => setSocialLinks({ ...socialLinks, x: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    placeholder="https://x.com/..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">رابط TikTok</label>
                  <input
                    type="url"
                    value={socialLinks.tiktok}
                    onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    placeholder="https://tiktok.com/@..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">رابط Snapchat</label>
                  <input
                    type="url"
                    value={socialLinks.snapchat}
                    onChange={(e) => setSocialLinks({ ...socialLinks, snapchat: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    placeholder="https://snapchat.com/add/..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5 text-sky-600" />
                    <span>رابط LinkedIn</span>
                  </label>
                  <input
                    type="url"
                    value={socialLinks.linkedin || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    placeholder="https://linkedin.com/in/..."
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  شعار المتجر (Logo)
                </label>
                <div className="flex items-center gap-3">
                  {logo && logo.trim() !== '' && (
                    <div className="relative group shrink-0">
                      <img src={logo} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" alt="Logo" />
                      <button
                        type="button"
                        onClick={() => setLogo('')}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 shadow transition-opacity"
                        title="حذف الشعار"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs font-bold">رفع شعار...</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          compressAndSetImage(file, 600, 600, (url) => setLogo(url));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Store Cover / Banner */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  غلاف وبنر المتجر / البروفايل (Cover Banner)
                </label>
                <div className="flex items-center gap-3">
                  {banner && banner.trim() !== '' && (
                    <div className="relative group shrink-0">
                      <img src={banner} className="w-16 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700" alt="Banner" />
                      <button
                        type="button"
                        onClick={() => setBanner('')}
                        className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 opacity-90 hover:opacity-100 shadow transition-opacity"
                        title="حذف الغلاف"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs font-bold">رفع صورة الغلاف...</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          compressAndSetImage(file, 1600, 900, (url) => setBanner(url));
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Cover Banner Customization & Visibility Controls */}
                <div className="mt-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>🎨 تخصيص مظهر ونصوص الغلاف (Cover Banner Options)</span>
                    <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">للتحكم بما يظهر فوق صورة الغلاف</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Hide Texts Toggle */}
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer hover:border-teal-500 transition-colors">
                      <div className="text-right pl-2">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">إخفاء النصوص والعناوين من الغلاف</div>
                        <div className="text-[10px] text-slate-500">موصى به إذا كان البنر مصمماً وجاهزاً ومكتوباً عليه مسبقاً</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={hideBannerTexts}
                        onChange={(e) => setHideBannerTexts(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 shrink-0"
                      />
                    </label>

                    {/* Hide Badges Toggle */}
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer hover:border-teal-500 transition-colors">
                      <div className="text-right pl-2">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">إخفاء شارات الثقة من الغلاف</div>
                        <div className="text-[10px] text-slate-500">إخفاء شارات (خصوصية وسرية، دقة المواعيد، خبرة معتمدة)</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={hideTrustBadges}
                        onChange={(e) => setHideTrustBadges(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 shrink-0"
                      />
                    </label>

                    {/* Hide Hero Buttons Toggle */}
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer hover:border-teal-500 transition-colors">
                      <div className="text-right pl-2">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">إخفاء أزرار الإجراءات من الغلاف</div>
                        <div className="text-[10px] text-slate-500">إخفاء أزرار (طلب خدمة / استعراض الباقات) من فوق الغلاف</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={hideBannerButtons}
                        onChange={(e) => setHideBannerButtons(e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 shrink-0"
                      />
                    </label>

                    {/* Banner Overlay Style */}
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">تعتيم خلفية صورة الغلاف</div>
                        <div className="text-[10px] text-slate-500">درجة التظليل والتعتيم فوق الغلاف</div>
                      </div>
                      <select
                        value={bannerOverlayStyle}
                        onChange={(e) => setBannerOverlayStyle(e.target.value as any)}
                        className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none shrink-0"
                      >
                        <option value="none">بدون تعتيم (ألوان حقيقية 100%)</option>
                        <option value="light">تعتيم خفيف (متوازن)</option>
                        <option value="dark">تعتيم داكن (تباين عالي للنصوص)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Color */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    لون الهوية الأساسي (Primary Brand Color)
                  </label>
                  <p className="text-[11px] text-slate-500">يتحكم في لون الأزرار، العناوين، وشارات المتجر</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-9 h-9 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-24 px-2 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payments & Wallets */}
        {activeTab === 'payments' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  تفعيل حسابات المحافظ وطرق الدفع المحلية
                </h3>
                <p className="text-xs text-slate-500">
                  أدخل أرقام حساباتك لتظهر للزبون مباشرة في شاشة الدفع مع تعليمات التحويل
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPaymentMethod}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة طريقة دفع</span>
              </button>
            </div>

            <div className="space-y-4">
              {paymentAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    acc.isActive
                      ? 'border-brand-300 dark:border-brand-800 bg-brand-50/30 dark:bg-brand-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {true ? (
                        <input
                          type="text"
                          value={acc.name}
                          onChange={(e) => handleUpdatePaymentField(acc.id, 'name', e.target.value)}
                          className="font-bold text-xs bg-transparent border-b border-dashed border-slate-400 outline-none w-32 dark:text-white"
                        />
                      ) : (
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{acc.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {true && (
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentMethod(acc.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acc.isActive}
                          onChange={() => handleTogglePayment(acc.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>
                  </div>

                  {acc.type !== 'cod' && acc.isActive && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          رقم الحساب / رقم المحفظة
                        </label>
                        <input
                          type="text"
                          value={acc.accountNumber}
                          onChange={(e) => handleUpdatePaymentField(acc.id, 'accountNumber', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          اسم صاحب الحساب
                        </label>
                        <input
                          type="text"
                          value={acc.accountName}
                          onChange={(e) => handleUpdatePaymentField(acc.id, 'accountName', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Currencies & Exchange Rates */}
        {activeTab === 'currencies' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                محرك العملات وأسعار الصرف الحية
              </h3>
              <p className="text-xs text-slate-500">
                حدد العملة الأساسية لتسعير منتجاتك، واضبط أسعار الصرف لحساب الأسعار المعروضة لزبائن عدن وصنعاء تلقائياً.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  العملة الأساسية لمتجرك
                </label>
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="YER_ADEN">ريال يمني - عدن (YER)</option>
                  <option value="YER_SANAA">ريال يمني - صنعاء (YER)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  العملة الأساسية للتوصيل
                </label>
                <select
                  value={deliveryCurrency}
                  onChange={(e) => setDeliveryCurrency(e.target.value as CurrencyCode)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="YER_ADEN">ريال يمني - عدن (YER)</option>
                  <option value="YER_SANAA">ريال يمني - صنعاء (YER)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                {baseCurrency === 'SAR' ? 'أسعار الصرف المعتمدة مقابل الريال السعودي' : 
                 baseCurrency === 'USD' ? 'أسعار الصرف المعتمدة مقابل الدولار الأمريكي' :
                 'أسعار الصرف المعتمدة'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {baseCurrency !== 'YER_ADEN' && (
                  <div className={`transition-all ${(baseCurrency === 'SAR' || baseCurrency === 'USD') && activeYemeniMarket !== 'YER_ADEN' ? 'opacity-50 grayscale' : ''}`}>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 cursor-pointer">
                      {(baseCurrency === 'SAR' || baseCurrency === 'USD') && (
                        <input 
                          type="radio" 
                          name="yemeni_market" 
                          checked={activeYemeniMarket === 'YER_ADEN'} 
                          onChange={() => setActiveYemeniMarket('YER_ADEN')}
                          className="w-3.5 h-3.5 text-brand-600 accent-brand-600 cursor-pointer"
                        />
                      )}
                      <span className={(baseCurrency === 'SAR' || baseCurrency === 'USD') && activeYemeniMarket !== 'YER_ADEN' ? 'line-through' : ''}>
                        {baseCurrency === 'SAR' ? 'سعر صرف الريال السعودي مقابل الريال اليمني (عدن)' : 'سعر صرف الريال اليمني في عدن مقابل ' + (baseCurrency === 'USD' ? 'الدولار' : 'العملة الأساسية')}
                      </span>
                    </label>
                    <input
                      type="number"
                      disabled={(baseCurrency === 'SAR' || baseCurrency === 'USD') && activeYemeniMarket !== 'YER_ADEN'}
                      value={customRates.YER_ADEN}
                      onChange={(e) => updateCustomRate('YER_ADEN', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                {baseCurrency !== 'YER_SANAA' && (
                  <div className={`transition-all ${(baseCurrency === 'SAR' || baseCurrency === 'USD') && activeYemeniMarket !== 'YER_SANAA' ? 'opacity-50 grayscale' : ''}`}>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1 cursor-pointer">
                      {(baseCurrency === 'SAR' || baseCurrency === 'USD') && (
                        <input 
                          type="radio" 
                          name="yemeni_market" 
                          checked={activeYemeniMarket === 'YER_SANAA'} 
                          onChange={() => setActiveYemeniMarket('YER_SANAA')}
                          className="w-3.5 h-3.5 text-brand-600 accent-brand-600 cursor-pointer"
                        />
                      )}
                      <span className={(baseCurrency === 'SAR' || baseCurrency === 'USD') && activeYemeniMarket !== 'YER_SANAA' ? 'line-through' : ''}>
                        {baseCurrency === 'SAR' ? 'سعر صرف الريال السعودي مقابل الريال اليمني (صنعاء)' : 'سعر صرف الريال اليمني في صنعاء مقابل ' + (baseCurrency === 'USD' ? 'الدولار' : 'العملة الأساسية')}
                      </span>
                    </label>
                    <input
                      type="number"
                      disabled={(baseCurrency === 'SAR' || baseCurrency === 'USD') && activeYemeniMarket !== 'YER_SANAA'}
                      value={customRates.YER_SANAA}
                      onChange={(e) => updateCustomRate('YER_SANAA', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                {baseCurrency !== 'SAR' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      سعر صرف الريال السعودي مقابل {baseCurrency === 'USD' ? 'الدولار' : 'العملة الأساسية'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customRates.SAR}
                      onChange={(e) => updateCustomRate('SAR', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                )}
                
                {baseCurrency !== 'USD' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      سعر صرف {baseCurrency === 'SAR' ? 'الريال السعودي' : 'العملة الأساسية'} مقابل الدولار
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={customRates.USD}
                      onChange={(e) => updateCustomRate('USD', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Account Credentials Section */}
            <div className="bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm mt-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white">إعدادات تسجيل الدخول</h2>
                    <p className="text-sm text-slate-500">إدارة البريد الإلكتروني وكلمة المرور الخاصة بك كتاجر</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <form onSubmit={handleSaveCredentials} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        البريد الإلكتروني للدخول
                      </label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slateDark-900 focus:ring-2 focus:ring-brand-500 outline-none"
                        required
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        كلمة المرور الجديدة (اختياري)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="اتركه فارغاً للاحتفاظ بكلمة المرور الحالية"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slateDark-900 focus:ring-2 focus:ring-brand-500 outline-none"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
                    <button
                      type="submit"
                      disabled={isSavingCredentials}
                      className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all ${
                        credentialsSaved
                          ? 'bg-emerald-500 text-white'
                          : isSavingCredentials
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:shadow-lg'
                      }`}
                    >
                      {credentialsSaved ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          تم تحديث بيانات الدخول بنجاح!
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          {isSavingCredentials ? 'جاري الحفظ...' : 'حفظ بيانات الدخول'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Shipping Methods */}
        {!isServiceStore && activeTab === 'shipping' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  خيارات الشحن والتوصيل المحلي
                </h3>
                <p className="text-xs text-slate-500">
                  تحديد تكلفة ومدة التوصيل لزبائن المتجر
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddShippingMethod}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة شركة توصيل</span>
              </button>
            </div>

            <div className="space-y-3">
              {shippingMethods.map((m, idx) => (
                <div key={m.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${m.isActive !== false ? 'border-brand-200 dark:border-brand-800 bg-slate-50 dark:bg-slate-800/40' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20 opacity-60'}`}>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                    <div className="text-[11px] text-slate-500">{m.estimatedDelivery}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-brand-600 dark:text-brand-400">
                      {m.cost === 0 ? 'مجاني / استلام فرع' : `${m.cost.toLocaleString()} ر.ي`}
                    </div>
                    {true && (
                      <button
                        type="button"
                        onClick={() => handleRemoveShippingMethod(m.id)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Tab 5: Marketing & Pixels */}
        {activeTab === 'marketing' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-600" />
                <span>الربط بكسلات والإعلانات</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                قم بربط متجرك مع منصات الإعلانات لتتبع التحويلات وزيارات العملاء بدقة.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Meta Pixel ID (فيسبوك وإنستغرام)</label>
                <input
                  type="text"
                  value={marketingPixels.meta}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, meta: e.target.value })}
                  placeholder="مثال: 123456789012345"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">TikTok Pixel ID</label>
                <input
                  type="text"
                  value={marketingPixels.tiktok}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, tiktok: e.target.value })}
                  placeholder="مثال: C123ABCD..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Snapchat Pixel ID</label>
                <input
                  type="text"
                  value={marketingPixels.snapchat}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, snapchat: e.target.value })}
                  placeholder="مثال: a1b2c3d4-..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Google Analytics (G-XXXX)</label>
                <input
                  type="text"
                  value={marketingPixels.googleAnalytics}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, googleAnalytics: e.target.value })}
                  placeholder="مثال: G-123456789"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">X (Twitter) Pixel ID</label>
                <input
                  type="text"
                  value={marketingPixels.x}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, x: e.target.value })}
                  placeholder="مثال: ab12c"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Google Ads (AW-XXXX)</label>
                <input
                  type="text"
                  value={marketingPixels.googleAds}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, googleAds: e.target.value })}
                  placeholder="مثال: AW-123456789"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        
        {/* Tab 6: Accounting Integrations */}
        {!isServiceStore && activeTab === 'accounting' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-600" />
                <span>الربط بالأنظمة المحاسبية (ERP)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                قم بربط متجرك بأنظمة المحاسبة الشهيرة لمزامنة المنتجات، الكميات، الفواتير، وحسابات العملاء تلقائياً.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {[
                { id: 'onyx', name: 'أونكس برو (Onyx Pro)', desc: 'نظام يمن سوفت المحاسبي', color: 'bg-blue-600' },
                { id: 'smacc', name: 'سماك (SMACC)', desc: 'النظام المحاسبي السحابي', color: 'bg-emerald-600' },
                { id: 'quickbooks', name: 'QuickBooks', desc: 'نظام إدارة الحسابات العالمي', color: 'bg-green-600' },
                { id: 'odoo', name: 'أودو (Odoo)', desc: 'نظام تخطيط الموارد الشامل', color: 'bg-purple-600' },
              ].map(sys => (
                <div key={sys.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between transition-colors hover:border-brand-300 group">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sys.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{sys.desc}</p>
                  </div>
                  <button type="button" onClick={() => alert('تم إرسال طلب الربط بنجاح وسيتم التواصل معك')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:text-brand-600 group-hover:border-brand-300 transition-colors">
                    ربط النظام
                  </button>
                </div>
              ))}
            </div>
            
            
            <div className="mt-4 p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/50 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
               <div className="flex-1 w-full">
                 <h4 className="text-xs font-bold text-brand-800 dark:text-brand-300 mb-1">إعدادات الربط المتقدمة (API)</h4>
                 <p className="text-[11px] text-slate-600 dark:text-slate-400">إذا كان لديك نظام محاسبي خاص وتريد ربطه، يمكنك استخدام مفاتيح الربط الخاصة بمتجرك.</p>
                 
                 {apiKeys && apiKeys.length > 0 && (
                   <div className="mt-4 space-y-2">
                     {apiKeys.map((ak, idx) => (
                       <div key={ak.id || idx} className="flex items-center gap-2 w-full animate-fadeIn">
                         <div className="px-3 py-2 bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 flex-1 overflow-x-auto">
                           {ak.key}
                         </div>
                         <button type="button" onClick={() => copyApiKey(ak.key)} className="shrink-0 p-2 rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 hover:bg-brand-200 transition-colors flex items-center gap-1">
                           {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-xs font-bold">نسخ</span>}
                         </button>
                         <button type="button" onClick={() => handleRevokeApiKey(ak.id)} className="shrink-0 p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
               
               <button 
                 type="button" 
                 onClick={generateApiKey} 
                 disabled={isGeneratingKey}
                 className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-sm hover:bg-brand-500 transition-colors disabled:opacity-50 flex items-center gap-2"
               >
                 {isGeneratingKey ? (
                   <><RefreshCw className="w-4 h-4 animate-spin" /> جاري التوليد...</>
                 ) : apiKeys.length > 0 ? 'توليد مفتاح جديد' : 'إنشاء مفتاح API'}
               </button>
            </div>

          </div>
        )}

        {/* Tab 7: Legal Pages */}
        {activeTab === 'legal' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                الصفحات القانونية والسياسات
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isAiEnabled
                  ? 'تظهر هذه الصفحات أسفل المتجر للعملاء في نوافذ منبثقة سريعة. يمكنك كتابتها بنفسك يدوياً أو استخدام الذكاء الاصطناعي لتوليدها.'
                  : 'تظهر هذه الصفحات أسفل المتجر للعملاء في نوافذ منبثقة سريعة. يمكنك كتابتها بنفسك يدوياً أو تركها فارغة.'}
              </p>
            </div>

            {[
              { id: 'privacy', label: 'سياسة الخصوصية', desc: 'لحماية بيانات العميل وتوضيح كيف يتم استخدامها.' },
              { id: 'terms', label: 'الشروط والأحكام', desc: 'شروط استخدام الموقع وضوابط الطلبات والمشتريات.' },
              { id: 'returns', label: 'سياسة الاسترجاع والتوصيل', desc: 'حقوق العميل في إرجاع المنتجات ومناطق وأوقات التوصيل.' },
              { id: 'faq', label: 'الأسئلة الشائعة', desc: 'الأسئلة المتكررة من العملاء وأجوبتها لتوفير الوقت.' }
            ].map((pageType) => (
              <div key={pageType.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                      {pageType.label}
                    </label>
                    <p className="text-[10px] text-slate-500">{pageType.desc}</p>
                  </div>
                  {isAiEnabled && (
                    <button
                      type="button"
                      onClick={() => handleGenerateLegal(pageType.id as any)}
                      disabled={isGeneratingLegal !== null}
                      className="px-3 py-1.5 rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 hover:bg-brand-100 transition-colors text-[11px] font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isGeneratingLegal === pageType.id ? (
                        <><RefreshCw className="w-3 h-3 animate-spin" /> جاري التوليد...</>
                      ) : (
                        <><Sparkles className="w-3 h-3" /> توليد بالذكاء الاصطناعي</>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  value={(legalPages as any)[pageType.id] || ''}
                  onChange={(e) => setLegalPages(prev => ({ ...prev, [pageType.id]: e.target.value }))}
                  className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-medium focus:ring-2 focus:ring-brand-500/50 outline-none custom-scrollbar"
                  placeholder={`اكتب ${pageType.label} يدوياً هنا (أو اتركها فارغة)...`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 transition-all"
          >
            {isSaved ? 'تم حفظ التعديلات بنجاح ✓' : 'حفظ جميع الإعدادات'}
          </button>
        </div>

      </form>

    </div>
  );
}
