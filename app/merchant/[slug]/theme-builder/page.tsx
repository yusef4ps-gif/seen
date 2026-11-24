'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Palette, Layout, Layers, Sparkles, Smartphone, Monitor, Tablet, 
  Eye, EyeOff, ArrowUp, ArrowDown, Check, Save, RotateCcw, 
  ExternalLink, Type, Sliders, CheckCircle2, ChevronDown, ChevronUp, 
  Flame, ShoppingCart, Star, ShieldCheck, Truck, RefreshCw, Send, 
  Zap, Cpu, Coffee, Award, Tag, Ticket, Image as ImageIcon, X
} from 'lucide-react';
import { Store, ThemeConfig, ThemeSection, ThemePreset } from '@/lib/types';
import { THEME_PRESETS, DEFAULT_THEME_SECTIONS } from '@/lib/theme-presets';
import { formatCurrency } from '@/lib/currency-engine';
import { getStoreBySlugAction, updateStoreAction } from '@/app/actions/store';
import ImageUploader from '@/components/ImageUploader';

export default function ThemeBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState<'presets' | 'styles' | 'sections'>('presets');
  const [deviceView, setDeviceView] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  
  // Theme working state with safe defaults
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(THEME_PRESETS[0].config);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>('sec-hero');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState(false);

  useEffect(() => {
    async function init() {
      if (slug) {
        try {
          const s = await getStoreBySlugAction(slug);
          if (s) {
            setStore(s as any);
            let parsed: any = null;
            if (typeof s.themeConfig === 'string') {
              try { parsed = JSON.parse(s.themeConfig); } catch {}
            } else if (s.themeConfig && typeof s.themeConfig === 'object') {
              parsed = s.themeConfig;
            }

            const isService = parsed?.storeType === 'SERVICE' || 
              (s.category && (s.category.includes('استشارات') || s.category.includes('خدمات') || s.category.includes('محاماة') || s.category.includes('تدريب')));
            
            const defaultPresetId = isService ? 'service-expert' : 'fashion-luxury';
            const fallbackPreset = THEME_PRESETS.find(p => p.id === defaultPresetId) || THEME_PRESETS[0];

            if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
              const matchedPreset = THEME_PRESETS.find(p => p.id === parsed.presetId) || fallbackPreset;
              setThemeConfig({
                ...matchedPreset.config,
                ...parsed,
                colors: {
                  ...matchedPreset.config.colors,
                  ...(parsed.colors || {})
                },
                typography: {
                  ...matchedPreset.config.typography,
                  ...(parsed.typography || {})
                },
                layout: {
                  ...matchedPreset.config.layout,
                  ...(parsed.layout || {})
                },
                sections: Array.isArray(parsed.sections) && parsed.sections.length > 0
                  ? parsed.sections
                  : matchedPreset.config.sections
              });
            } else {
              setThemeConfig(fallbackPreset.config);
            }
          }
        } catch (err) {
          console.error('ThemeBuilder init error:', err);
        }
      }
    }
    init();
  }, [slug]);

  // Loading skeleton state
  if (!store) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mb-3 animate-pulse shadow-sm">
          <Palette className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          جاري تجهيز استوديو تخصيص البروفايل والهوية...
        </h3>
        <p className="text-xs text-slate-400 mt-1">يتم الآن فحص إعدادات المتجر والقوالب النشطة</p>
      </div>
    );
  }

  // Safe normalized properties
  const safeSections = Array.isArray(themeConfig?.sections) && themeConfig.sections.length > 0 
    ? themeConfig.sections 
    : DEFAULT_THEME_SECTIONS;

  const presetId = themeConfig?.presetId || 'fashion-luxury';
  const primaryColor = themeConfig?.colors?.primary || '#0d9488';
  const secondaryColor = themeConfig?.colors?.secondary || '#0f172a';
  const backgroundColor = themeConfig?.colors?.background || '#f8fafc';
  const fontFamily = themeConfig?.typography?.fontFamily || 'Tajawal';
  const borderRadius = themeConfig?.layout?.borderRadius || 'curved';

  // Apply a ready preset
  const handleApplyPreset = (preset: ThemePreset) => {
    setThemeConfig({
      ...preset.config,
      sections: safeSections.length > 0 ? safeSections : preset.config.sections,
    });
  };

  // Section visibility toggle
  const handleToggleSectionVisibility = (sectionId: string) => {
    setThemeConfig({
      ...themeConfig,
      sections: safeSections.map((sec) => 
        sec.id === sectionId ? { ...sec, isVisible: !sec.isVisible } : sec
      ),
    });
  };

  // Section reordering
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...safeSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const updated = newSections.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setThemeConfig({ ...themeConfig, sections: updated });
  };

  // Update section settings
  const handleUpdateSectionSettings = (sectionId: string, updates: Partial<ThemeSection['settings']>) => {
    setThemeConfig({
      ...themeConfig,
      sections: safeSections.map((sec) =>
        sec.id === sectionId ? { ...sec, settings: { ...(sec.settings || {}), ...updates } } : sec
      ),
    });
  };

  // Save and publish theme
  const handleSaveTheme = async () => {
    if (isSaving || !store) return;
    setIsSaving(true);
    try {
      const bannerUrl = (themeConfig as any)?.bannerUrl || store.banner;
      await updateStoreAction(store.id, { 
        primaryColor: primaryColor,
        banner: bannerUrl,
        themeConfig: JSON.stringify({ ...themeConfig, bannerUrl }) 
      });
      setIsSavedSuccessfully(true);
      setTimeout(() => setIsSavedSuccessfully(false), 3000);
    } catch (e) {
      console.error('Error saving theme:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const isServiceStore = (() => {
    if (!store) return false;
    const cfg = typeof store.themeConfig === 'string' ? (() => { try { return JSON.parse(store.themeConfig); } catch { return {}; } })() : store.themeConfig;
    return cfg?.storeType === 'SERVICE' || themeConfig?.storeType === 'SERVICE' || themeConfig?.presetId?.startsWith('service-');
  })();

  const availablePresets = THEME_PRESETS.filter(p => {
    if (isServiceStore) {
      return p.config.storeType === 'SERVICE' || p.id.startsWith('service-');
    } else {
      return p.config.storeType !== 'SERVICE' && !p.id.startsWith('service-');
    }
  });

  const colorSwatches = [
    { label: 'زمردي راقي', hex: '#0d9488' },
    { label: 'أزرق كهربائي', hex: '#2563eb' },
    { label: 'بن محمص', hex: '#78350f' },
    { label: 'كربوني داكن', hex: '#09090b' },
    { label: 'عنابي فاخر', hex: '#881337' },
    { label: 'بنفسجي ملكي', hex: '#7c3aed' },
    { label: 'أخضر غابات', hex: '#15803d' },
    { label: 'برتقالي مرجاني', hex: '#ea580c' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slateDark-950 flex flex-col font-sans -m-3 sm:-m-8">
      
      {/* Studio Top Control Bar */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slateDark-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xs sm:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{isServiceStore ? 'استوديو تخصيص البروفايل والهوية' : 'استوديو تخصيص القوالب والواجهة'}</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 font-bold border border-brand-200">
                مباشر ✨
              </span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden xs:block">
              تخصيص الألوان والخطوط والأقسام مع معاينة حية لحظية
            </p>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setDeviceView('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              deviceView === 'mobile'
                ? 'bg-white dark:bg-slateDark-900 text-brand-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>جوال (375px)</span>
          </button>
          <button
            onClick={() => setDeviceView('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              deviceView === 'tablet'
                ? 'bg-white dark:bg-slateDark-900 text-brand-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>تابلت</span>
          </button>
          <button
            onClick={() => setDeviceView('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              deviceView === 'desktop'
                ? 'bg-white dark:bg-slateDark-900 text-brand-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>كمبيوتر</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href={`/store/${store.slug}`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{isServiceStore ? 'البروفايل الحي' : 'المتجر الحي'}</span>
          </Link>

          <button
            onClick={handleSaveTheme}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-700 hover:to-teal-600 shadow-md shadow-brand-600/25 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>جاري الحفظ...</span>
              </>
            ) : isSavedSuccessfully ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>تم النشر بنجاح! ✓</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>نشر الهوية الآن 🚀</span>
              </>
            )}
          </button>
        </div>

      </header>

      {/* Main Studio Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Right Controls Panel */}
        <div className="w-full lg:w-[420px] bg-white dark:bg-slateDark-900 border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-auto lg:h-[calc(100vh-61px)] overflow-y-auto">
          
          <div className="p-4 sm:p-5 space-y-5">
            
            {/* Tabs Selector */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setActiveTab('presets')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'presets' 
                    ? 'bg-white dark:bg-slateDark-900 text-brand-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                1. القوالب الهندسية
              </button>
              <button
                onClick={() => setActiveTab('styles')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'styles' 
                    ? 'bg-white dark:bg-slateDark-900 text-brand-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                2. الألوان والخطوط
              </button>
              <button
                onClick={() => setActiveTab('sections')}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'sections' 
                    ? 'bg-white dark:bg-slateDark-900 text-brand-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                3. ترتيب الأقسام
              </button>
            </div>

            {/* TAB 1: PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-4 animate-fadeIn text-right">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{isServiceStore ? 'قوالب البروفايل المهني والخدمات:' : 'اختر قالباً هندسياً متكاملاً:'}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-600 font-bold">
                      {isServiceStore ? 'مقدم خدمة وفريلانسر 💼' : 'متاجر تجزئة 🛍️'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isServiceStore 
                      ? 'قوالب مخصصة حصرياً للمستشارين والمكاتب المهنية والمدربين لحجز الخدمات والمواعيد.' 
                      : 'كل قالب يغير شكل وهندسة وعناصر العرض كلياً ليناسب تخصص تجارتك.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {availablePresets.map((preset) => {
                    const isSelected = presetId === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleApplyPreset(preset)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/30 ring-2 ring-brand-500 shadow-md'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.config.colors.primary }} />
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {preset.name}
                            </h4>
                          </div>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[9px] font-bold">
                              القالب النشط ✓
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {preset.description}
                        </p>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
                          <span>{preset.category}</span>
                          <span>الخط: {preset.config.typography.fontFamily}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: STYLES */}
            {activeTab === 'styles' && (
              <div className="space-y-5 animate-fadeIn text-right">
                
                {/* Primary Brand Color */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    لون البراند الأساسي (Primary Color):
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setThemeConfig({
                        ...themeConfig,
                        colors: { ...(themeConfig.colors || {}), primary: e.target.value } as any,
                      })}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setThemeConfig({
                        ...themeConfig,
                        colors: { ...(themeConfig.colors || {}), primary: e.target.value } as any,
                      })}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {colorSwatches.map((swatch) => (
                      <button
                        key={swatch.hex}
                        onClick={() => setThemeConfig({
                          ...themeConfig,
                          colors: { ...(themeConfig.colors || {}), primary: swatch.hex } as any,
                        })}
                        className="w-6 h-6 rounded-full border-2 border-white shadow-xs transition-transform hover:scale-110 active:scale-95"
                        style={{ backgroundColor: swatch.hex }}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Secondary Accent Color */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    لون الإبراز والخصومات (Accent Color):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setThemeConfig({
                        ...themeConfig,
                        colors: { ...(themeConfig.colors || {}), secondary: e.target.value } as any,
                      })}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setThemeConfig({
                        ...themeConfig,
                        colors: { ...(themeConfig.colors || {}), secondary: e.target.value } as any,
                      })}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    لون خلفية المتجر (Background Color):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setThemeConfig({
                        ...themeConfig,
                        colors: { ...(themeConfig.colors || {}), background: e.target.value } as any,
                      })}
                      className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setThemeConfig({
                        ...themeConfig,
                        colors: { ...(themeConfig.colors || {}), background: e.target.value } as any,
                      })}
                      className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                {/* Store Cover / Banner */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    غلاف وبنر المتجر / البروفايل (Cover Banner):
                  </label>
                  <ImageUploader
                    value={(themeConfig as any)?.bannerUrl || store.banner || ''}
                    onChange={(url) => {
                      setThemeConfig({ ...themeConfig, bannerUrl: url } as any);
                      setStore({ ...store, banner: url });
                    }}
                    label="تغيير صورة الغلاف الرئيسية"
                  />
                </div>

                {/* Font Selector */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    الخط العربي المعتمد (Typography):
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Tajawal', 'Cairo', 'Readex Pro', 'Almarai'].map((fontName) => (
                      <button
                        key={fontName}
                        onClick={() => setThemeConfig({
                          ...themeConfig,
                          typography: { ...(themeConfig.typography || {}), fontFamily: fontName as any } as any,
                        })}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          fontFamily === fontName
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600 font-bold'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                        style={{ fontFamily: fontName }}
                      >
                        <div className="text-xs font-bold">{fontName}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">تجربة الخط العربي</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Radius Style */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    درجة انحناء الحواف والأزرار:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sharp', label: 'حادة (Sharp)' },
                      { id: 'curved', label: 'ناعمة (Curved)' },
                      { id: 'pill', label: 'دائرية (Pill)' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setThemeConfig({
                          ...themeConfig,
                          layout: { ...(themeConfig.layout || {}), borderRadius: item.id as any } as any,
                        })}
                        className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                          borderRadius === item.id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: SECTIONS MANAGER */}
            {activeTab === 'sections' && (
              <div className="space-y-4 animate-fadeIn text-right">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                    ترتيب وإدارة أقسام الصفحة الرئيسية:
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    استخدم الأسهم لتغيير الترتيب، وعين الرؤية لإخفاء أو إظهار أي قسم.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {safeSections.map((sec, index) => {
                    const isExpanded = expandedSectionId === sec.id;
                    const secSettings = sec.settings || {};

                    return (
                      <div
                        key={sec.id}
                        className={`rounded-2xl border transition-all ${
                          sec.isVisible
                            ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slateDark-900'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/20 opacity-60'
                        }`}
                      >
                        <div className="p-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col gap-0.5">
                              <button
                                disabled={index === 0}
                                onClick={() => handleMoveSection(index, 'up')}
                                className="p-1 text-slate-400 hover:text-brand-600 disabled:opacity-20"
                                title="تحريك لأعلى"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                disabled={index === safeSections.length - 1}
                                onClick={() => handleMoveSection(index, 'down')}
                                className="p-1 text-slate-400 hover:text-brand-600 disabled:opacity-20"
                                title="تحريك لأسفل"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {index + 1}. {sec.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleSectionVisibility(sec.id)}
                              className={`p-1.5 rounded-lg ${
                                sec.isVisible ? 'text-slate-600 hover:bg-slate-100' : 'text-red-500'
                              }`}
                            >
                              {sec.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => setExpandedSectionId(isExpanded ? null : sec.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 text-xs">
                            {secSettings.bannerTitle !== undefined && sec.type !== 'hero_slider' && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  العنوان الرئيسي للقسم:
                                </label>
                                <input
                                  type="text"
                                  value={secSettings.bannerTitle || ''}
                                  onChange={(e) => handleUpdateSectionSettings(sec.id, { bannerTitle: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                              </div>
                            )}

                            {secSettings.bannerSubtitle !== undefined && sec.type !== 'hero_slider' && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  النص الفرعي / الوصف:
                                </label>
                                <input
                                  type="text"
                                  value={secSettings.bannerSubtitle || ''}
                                  onChange={(e) => handleUpdateSectionSettings(sec.id, { bannerSubtitle: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                              </div>
                            )}

                            {secSettings.bannerImageUrl !== undefined && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  {sec.type === 'hero_slider' ? 'الشرائح (Sliders):' : 'صورة القسم (الرفع من الجهاز):'}
                                </label>
                                
                                {sec.type === 'hero_slider' ? (
                                  <div className="mt-1 flex flex-col gap-4">
                                    <div className="flex flex-col gap-3">
                                      {(() => {
                                        let currentSlides = secSettings.heroSlides;
                                        if (!Array.isArray(currentSlides) || currentSlides.length === 0) {
                                          const legacyImages = (secSettings.bannerImages && secSettings.bannerImages.length > 0) 
                                            ? secSettings.bannerImages 
                                            : (secSettings.bannerImageUrl ? [secSettings.bannerImageUrl] : []);
                                          currentSlides = legacyImages.map((img: string) => ({
                                            image: img,
                                            title: secSettings.bannerTitle || '',
                                            subtitle: secSettings.bannerSubtitle || '',
                                          }));
                                        }

                                        return (
                                          <>
                                            {currentSlides.map((slide: any, idx: number) => {
                                              const slideImg = typeof slide === 'string' ? slide : (slide?.image || '');
                                              const slideTitle = typeof slide === 'string' ? '' : (slide?.title || '');
                                              const slideSubtitle = typeof slide === 'string' ? '' : (slide?.subtitle || '');

                                              return (
                                                <div key={idx} className="relative p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
                                                  <button 
                                                    type="button"
                                                    onClick={() => {
                                                      const newSlides = [...currentSlides];
                                                      newSlides.splice(idx, 1);
                                                      handleUpdateSectionSettings(sec.id, { heroSlides: newSlides });
                                                    }}
                                                    className="absolute top-2 left-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                  >
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                  
                                                  <div className="flex items-start gap-3">
                                                    <img src={slideImg || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200'} className="w-20 h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100" alt={`Slide ${idx + 1}`} />
                                                    <div className="flex-1 space-y-2 w-full">
                                                      <input
                                                        type="text"
                                                        placeholder="عنوان الشريحة"
                                                        value={slideTitle}
                                                        onChange={(e) => {
                                                          const newSlides = currentSlides.map((sItem: any, sIdx: number) => {
                                                            if (sIdx !== idx) return sItem;
                                                            if (typeof sItem === 'string') return { image: sItem, title: e.target.value, subtitle: '' };
                                                            return { ...sItem, title: e.target.value };
                                                          });
                                                          handleUpdateSectionSettings(sec.id, { heroSlides: newSlides });
                                                        }}
                                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                                      />
                                                      <input
                                                        type="text"
                                                        placeholder="النص الفرعي (الوصف)"
                                                        value={slideSubtitle}
                                                        onChange={(e) => {
                                                          const newSlides = currentSlides.map((sItem: any, sIdx: number) => {
                                                            if (sIdx !== idx) return sItem;
                                                            if (typeof sItem === 'string') return { image: sItem, title: '', subtitle: e.target.value };
                                                            return { ...sItem, subtitle: e.target.value };
                                                          });
                                                          handleUpdateSectionSettings(sec.id, { heroSlides: newSlides });
                                                        }}
                                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                                                      />
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                            
                                            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 w-full py-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all bg-white dark:bg-slate-900 text-slate-400">
                                              <div className="flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4" />
                                                <span className="text-xs font-bold">إضافة شريحة جديدة</span>
                                              </div>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={(e) => {
                                                  const files = Array.from(e.target.files || []);
                                                  if (files.length > 0) {
                                                    let processedCount = 0;
                                                    const newSlidesToAppend: any[] = [];
                                                    
                                                    files.forEach((file, fileIdx) => {
                                                      const reader = new FileReader();
                                                      reader.onloadend = () => {
                                                        newSlidesToAppend[fileIdx] = {
                                                          image: reader.result as string,
                                                          title: '',
                                                          subtitle: ''
                                                        };
                                                        processedCount++;
                                                        if (processedCount === files.length) {
                                                          const finalSlides = [...currentSlides, ...newSlidesToAppend.filter(Boolean)];
                                                          handleUpdateSectionSettings(sec.id, { heroSlides: finalSlides });
                                                        }
                                                      };
                                                      reader.readAsDataURL(file);
                                                    });
                                                  }
                                                }}
                                              />
                                            </label>
                                          </>
                                        );
                                      })()}
                                    </div>

                                    {((secSettings.heroSlides && secSettings.heroSlides.length > 1) || (secSettings.bannerImages && secSettings.bannerImages.length > 1)) && (
                                      <div className="p-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 mt-1">
                                        <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                                          سرعة التمرير التلقائي (بالثواني):
                                        </label>
                                        <div className="flex gap-4">
                                          {[5, 7, 9].map(secVal => (
                                            <label key={secVal} className="flex items-center gap-1.5 cursor-pointer">
                                              <input 
                                                type="radio" 
                                                name={`bannerInterval-${sec.id}`}
                                                value={secVal} 
                                                checked={(secSettings.bannerInterval || 5) === secVal}
                                                onChange={(e) => handleUpdateSectionSettings(sec.id, { bannerInterval: Number(e.target.value) })}
                                                className="w-3.5 h-3.5 text-brand-600 focus:ring-brand-500 border-slate-300"
                                              />
                                              <span className="text-[10px] font-medium">{secVal} ثواني</span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="mt-1 flex items-center gap-3">
                                    {secSettings.bannerImageUrl && secSettings.bannerImageUrl.trim() !== '' && (
                                      <img src={secSettings.bannerImageUrl} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0" alt="Preview" />
                                    )}
                                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all bg-white dark:bg-slate-900">
                                      <ImageIcon className="w-4 h-4 text-slate-400" />
                                      <span className="text-xs text-slate-500 font-bold">تصفح لرفع صورة...</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              handleUpdateSectionSettings(sec.id, { bannerImageUrl: reader.result as string });
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                )}
                              </div>
                            )}

                            {secSettings.ctaText !== undefined && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  نص الزر (CTA):
                                </label>
                                <input
                                  type="text"
                                  value={secSettings.ctaText || ''}
                                  onChange={(e) => handleUpdateSectionSettings(sec.id, { ctaText: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                                />
                              </div>
                            )}

                            {secSettings.discountCode !== undefined && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  كود الخصم الترويجي:
                                </label>
                                <input
                                  type="text"
                                  value={secSettings.discountCode || ''}
                                  onChange={(e) => handleUpdateSectionSettings(sec.id, { discountCode: e.target.value })}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-brand-600"
                                />
                              </div>
                            )}

                            {secSettings.itemsCount !== undefined && (
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                                  عدد العناصر المراد عرضها:
                                </label>
                                <input
                                  type="number"
                                  min={2}
                                  max={12}
                                  value={secSettings.itemsCount || 4}
                                  onChange={(e) => handleUpdateSectionSettings(sec.id, { itemsCount: parseInt(e.target.value) || 4 })}
                                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Left Live Device Canvas Preview Area */}
        <div className="flex-1 bg-slate-200/70 dark:bg-slate-950 p-4 sm:p-8 flex items-center justify-center overflow-y-auto">
          
          {/* Dynamic Device Frame */}
          <div
            className={`transition-all duration-300 shadow-2xl overflow-hidden border-4 border-slate-300 dark:border-slate-800 ${
              presetId === 'tech-modern' 
                ? 'bg-slate-950 text-slate-100' 
                : presetId === 'yemen-roastery'
                ? 'bg-[#fdfbf7] text-[#451a03]'
                : presetId === 'minimal-clean'
                ? 'bg-white text-black'
                : 'bg-white dark:bg-slateDark-900 text-slate-900 dark:text-slate-100'
            } ${
              deviceView === 'mobile' 
                ? 'w-[375px] min-h-[667px] rounded-3xl' 
                : deviceView === 'tablet' 
                ? 'w-[680px] min-h-[700px] rounded-3xl' 
                : 'w-full max-w-5xl min-h-[750px] rounded-3xl'
            }`}
            style={{ fontFamily }}
          >
            
            {/* Top Announcement Bar */}
            {(() => {
              const annSec = safeSections.find(s => s && s.type === 'announcement_bar');
              if (annSec && annSec.isVisible) {
                return (
                  <div 
                    className="py-1.5 px-3 text-center text-[10px] font-bold text-white transition-colors"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {annSec.settings?.bannerTitle}
                  </div>
                );
              }
              return null;
            })()}

            {/* Store Top Bar */}
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
              presetId === 'tech-modern' ? 'bg-slate-900 border-slate-800' :
              presetId === 'minimal-clean' ? 'bg-white border-black' : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <img 
                  src={store.logo || 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=100'} 
                  alt={store.name || ''} 
                  className="w-8 h-8 rounded-xl object-cover bg-white shrink-0" 
                />
                <div>
                  <div className="text-xs font-black">{store.name}</div>
                  <div className="text-[9px] opacity-60">{store.city}</div>
                </div>
              </div>
              <div 
                className="px-3 py-1 text-[11px] font-bold text-white shadow-xs flex items-center gap-1"
                style={{ 
                  backgroundColor: presetId === 'minimal-clean' ? '#000000' : primaryColor,
                  borderRadius: borderRadius === 'pill' ? '9999px' : borderRadius === 'curved' ? '12px' : '0px'
                }}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>السلة</span>
              </div>
            </div>

            {/* Dynamically Rendered Sections in Custom Order */}
            <div className="space-y-4 p-4 text-right">
              {safeSections
                .filter(s => s && s.isVisible && s.type !== 'announcement_bar')
                .map((section) => {
                  const secSettings = section.settings || {};
                  
                  // 1. HERO SLIDER / BANNER
                  if (section.type === 'hero_slider') {
                    let displayImage = secSettings.bannerImageUrl;
                    if (Array.isArray(secSettings.heroSlides) && secSettings.heroSlides.length > 0) {
                      const first = secSettings.heroSlides[0];
                      displayImage = typeof first === 'string' ? first : (first?.image || displayImage);
                    } else if (Array.isArray(secSettings.bannerImages) && secSettings.bannerImages.length > 0) {
                      displayImage = secSettings.bannerImages[0];
                    } else if (!displayImage && store.banner) {
                      try {
                        const parsed = JSON.parse(store.banner);
                        if (Array.isArray(parsed) && parsed.length > 0) displayImage = parsed[0];
                        else if (parsed && typeof parsed === 'object' && parsed.images && parsed.images.length > 0) displayImage = parsed.images[0];
                      } catch(e) {
                        if (!store.banner.startsWith('{') && !store.banner.startsWith('[')) displayImage = store.banner;
                      }
                    }
                    displayImage = displayImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80';

                    if (presetId === 'tech-modern') {
                      return (
                        <div key={section.id} className="relative rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white space-y-2 flex flex-col sm:flex-row items-center gap-4">
                          <div className="flex-1">
                            <div className="text-[9px] font-mono text-cyan-400">⚡ CYBER TECH 2026</div>
                            <h2 className="text-sm font-black">{secSettings.bannerTitle}</h2>
                            <p className="text-[10px] text-slate-400">{secSettings.bannerSubtitle}</p>
                          </div>
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-slate-700 shrink-0">
                            <img src={displayImage} alt="Hero" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      );
                    }
                    if (presetId === 'yemen-roastery') {
                      return (
                        <div key={section.id} className="rounded-2xl bg-[#3b1907] text-[#fefcf8] p-4 space-y-1.5 border border-amber-900/30 flex flex-col sm:flex-row items-center gap-4">
                          <div className="flex-1 text-right">
                            <div className="text-[9px] text-amber-300 font-bold">☕ محاصيل يمنية نادرة</div>
                            <h2 className="text-sm font-black text-amber-100">{secSettings.bannerTitle}</h2>
                            <p className="text-[10px] text-amber-200/80">{secSettings.bannerSubtitle}</p>
                          </div>
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden border-2 border-amber-700/50 shrink-0">
                            <img src={displayImage} alt="Hero" className="w-full h-full object-cover" />
                          </div>
                        </div>
                      );
                    }
                    if (presetId === 'minimal-clean') {
                      return (
                        <div key={section.id} className="border-2 border-black p-4 text-black bg-white space-y-1.5">
                          <div className="text-[9px] font-mono font-bold">[01] COLLECTION // 2026</div>
                          <h2 className="text-sm font-black">{secSettings.bannerTitle}</h2>
                          <p className="text-[10px] text-slate-600">{secSettings.bannerSubtitle}</p>
                        </div>
                      );
                    }
                    return (
                      <div key={section.id} className="relative rounded-2xl overflow-hidden bg-slate-900 text-white min-h-[140px] flex items-center p-4 shadow-sm">
                        <img src={displayImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                        <div className="relative z-10 space-y-1.5 max-w-sm">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: secondaryColor }}>
                            {isServiceStore ? 'بروفايل معتمد' : 'عرض حصري'}
                          </span>
                          <h2 className="text-xs sm:text-base font-black">{secSettings.bannerTitle}</h2>
                          <p className="text-[10px] text-slate-300">{secSettings.bannerSubtitle}</p>
                        </div>
                      </div>
                    );
                  }

                  // 2. FEATURES STRIP
                  if (section.type === 'features_strip') {
                    return (
                      <div key={section.id} className="grid grid-cols-3 gap-2 py-2 border-y text-center text-[10px]">
                        <div className="space-y-0.5">
                          <Truck className="w-4 h-4 mx-auto" style={{ color: primaryColor }} />
                          <div className="font-bold">{isServiceStore ? 'تنفيذ دقيق' : 'توصيل سريع'}</div>
                        </div>
                        <div className="space-y-0.5">
                          <ShieldCheck className="w-4 h-4 mx-auto" style={{ color: primaryColor }} />
                          <div className="font-bold">{isServiceStore ? 'سرية وأمان' : 'ضمان أصلي'}</div>
                        </div>
                        <div className="space-y-0.5">
                          <RefreshCw className="w-4 h-4 mx-auto" style={{ color: primaryColor }} />
                          <div className="font-bold">{isServiceStore ? 'متابعة دورية' : 'دفع مرن'}</div>
                        </div>
                      </div>
                    );
                  }

                  // 3. FEATURED CATEGORIES
                  if (section.type === 'featured_categories') {
                    return (
                      <div key={section.id} className="space-y-2">
                        <h3 className="text-xs font-black">
                          {secSettings.bannerTitle || 'الأقسام المميزة'}
                        </h3>
                        <div className="flex gap-2 overflow-x-auto no-scrollbar">
                          {['الكل', 'الأكثر طلباً', 'خدمات مميزة', 'باقات الاستشارة'].map((cat, idx) => (
                            <span 
                              key={idx}
                              className={`px-3 py-1 text-[10px] font-bold whitespace-nowrap ${
                                idx === 0 ? 'text-white' : 'bg-slate-100 dark:bg-slate-800'
                              } ${presetId === 'minimal-clean' ? 'border border-black' : ''}`}
                              style={{ 
                                backgroundColor: idx === 0 ? (presetId === 'minimal-clean' ? '#000000' : primaryColor) : undefined,
                                borderRadius: presetId === 'minimal-clean' ? '0px' : borderRadius === 'pill' ? '9999px' : '10px'
                              }}
                            >
                              {presetId === 'minimal-clean' ? `[0${idx}] ${cat}` : cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // 4. PRODUCTS GRID
                  if (section.type === 'products_grid') {
                    return (
                      <div key={section.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-black">
                            {secSettings.bannerTitle || (isServiceStore ? 'الخدمات والاستشارات المتاحة' : 'المنتجات الأكثر طلباً')}
                          </h3>
                          <span className="text-[10px] font-bold" style={{ color: primaryColor }}>عرض الكل</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                          {[
                            { name: isServiceStore ? 'جلسة إرشاد واستشارة خاصة #1' : 'منتج مميز تشكيلة حصرية #1', price: 180, image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=400' },
                            { name: isServiceStore ? 'باقة إدارة وتطوير الأعمال #2' : 'منتج بتصميم عصري راقي #2', price: 120, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400' },
                          ].map((p, idx) => (
                            <div 
                              key={idx}
                              className={`overflow-hidden flex flex-col justify-between ${
                                presetId === 'tech-modern' ? 'bg-slate-900 border border-slate-800 rounded-xl' :
                                presetId === 'yemen-roastery' ? 'bg-white border border-amber-900/20 rounded-xl' :
                                presetId === 'minimal-clean' ? 'bg-white border border-black rounded-none' :
                                'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              <img src={p.image} alt={p.name} className="aspect-square object-cover w-full" />
                              <div className="p-2 space-y-1">
                                <div className="text-[10px] font-bold line-clamp-1">{p.name}</div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black" style={{ color: primaryColor }}>
                                    {p.price} ر.س
                                  </span>
                                  <button 
                                    className="px-2 py-0.5 text-[9px] font-bold text-white"
                                    style={{ 
                                      backgroundColor: presetId === 'minimal-clean' ? '#000000' : primaryColor,
                                      borderRadius: presetId === 'minimal-clean' ? '0px' : borderRadius === 'pill' ? '9999px' : '6px'
                                    }}
                                  >
                                    {isServiceStore ? 'حجز' : '+ أضف'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  // 5. PROMO BANNER
                  if (section.type === 'promo_banner') {
                    return (
                      <div 
                        key={section.id} 
                        className={`p-3.5 text-white space-y-1 ${presetId === 'minimal-clean' ? 'border border-black bg-black rounded-none' : 'rounded-2xl'}`}
                        style={{ 
                          backgroundColor: presetId === 'minimal-clean' ? '#000000' : secondaryColor,
                          borderRadius: presetId === 'minimal-clean' ? '0px' : borderRadius === 'pill' ? '20px' : '14px'
                        }}
                      >
                        <h4 className="text-xs font-black">{secSettings.bannerTitle}</h4>
                        <p className="text-[9px] opacity-90">{secSettings.bannerSubtitle}</p>
                        {secSettings.discountCode && (
                          <div className="inline-block mt-1 px-2 py-0.5 rounded bg-black/30 font-mono font-bold text-[10px]">
                            كود الخصم: {secSettings.discountCode}
                          </div>
                        )}
                      </div>
                    );
                  }

                  // 6. TESTIMONIALS
                  if (section.type === 'testimonials') {
                    return (
                      <div key={section.id} className="space-y-1.5 pt-2 border-t text-[10px]">
                        <h3 className="font-black">{secSettings.bannerTitle || 'آراء وتقييمات العملاء'}</h3>
                        <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 space-y-1">
                          <div className="flex text-amber-400 gap-0.5">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />)}
                          </div>
                          <p className="opacity-90">"خدمة واستشارة متميزة جداً، دقة عالية في المواعيد واحترافية تستحق التقدير."</p>
                          <div className="font-bold">- عميل معتمد</div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
            </div>

            <div className="p-3 border-t text-center text-[9px] opacity-60">
              © {new Date().getFullYear()} {store.name} - مدعوم بواسطة مَزن
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
