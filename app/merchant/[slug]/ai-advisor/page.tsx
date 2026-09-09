'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Bot, Sparkles, Send, Copy, Check, MessageSquare, Edit2, 
  Lightbulb, TrendingUp, Gift, Zap, Layers, RefreshCw, Image as ImageIcon, UploadCloud
} from 'lucide-react';
import { Store } from '@/lib/types';
import { getStoreBySlugAction } from '@/app/actions/store';
import { generateCampaignAction, generateAdDesignAction } from '@/app/actions/ai';
import { Pin, Trash } from 'lucide-react';

export default function MerchantAIAdvisorPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [customGoal, setCustomGoal] = useState('');
  const [generatedCampaign, setGeneratedCampaign] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editableTemplates, setEditableTemplates] = useState<Record<number, string>>({});

  // Image Ad Generator State
  const [adImageGoal, setAdImageGoal] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string | null>(null);
  const [isGeneratingAd, setIsGeneratingAd] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<any | null>(null);
  
  const [customCampaigns, setCustomCampaigns] = useState<{title: string, text: string, date: string, isEditing?: boolean}[]>([]);
  const [savedStrategies, setSavedStrategies] = useState<any[]>([]);

  const getTemplateContent = (idx: number, defaultTemplate: string) => {
    return editableTemplates[idx] !== undefined ? editableTemplates[idx] : defaultTemplate;
  };

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) setStore(s as any);
      }
    }
    init();
  }, [slug]);

  useEffect(() => {
    if (store && savedStrategies.length === 0) {
      const initialStrategies = [
        {
          title: 'حملة نهاية الأسبوع (Flash Sale)',
          type: 'عطلة نهاية الأسبوع',
          icon: Zap,
          description: 'خصم 15% على القطع الأكثر طلباً مع شحن سريع خلال 24 ساعة لزيادة المبيعات يومي الخميس والجمعة.',
          whatsappTemplate: `🔥 *عروض نهاية الأسبوع الكبرى من ${store.name}!* 🔥\n\nاستمتعوا بخصم خاص *15%* على كافة المنتجات + توصيل فوري لعنوانك في ${store.city}!\n\n🛍️ للطلب السريع تصفح المتجر الآن:\nhttps://seen.app/store/${store.slug}\n\n*العرض سارٍ حتى مساء السبت فقط.* ⏳`,
          isEditing: false
        },
        {
          title: 'عرض الشحن والتوصيل المجاني',
          type: 'زيادة حجم السلة AOV',
          icon: Gift,
          description: 'تقديم توصيل مجاني عند شراء منتجين أو أكثر أو عند تجاوز قيمة السلة 100 ر.س لرفع متوسط الطلب.',
          whatsappTemplate: `🚚 *بشرى سارة لزبائن ${store.name} الكرام!*\ ✨\n\nاحصل على *توصيل مجاني بالكامل* عند طلب منتجين أو أكثر اليوم!\n\n📦 تسوق الآن تشكيلتنا الجديدة:\nhttps://seen.app/store/${store.slug}\n\nالدفع عند الاستلام أو عبر المحافظ متاح بكل سهولة. 💳`,
          isEditing: false
        },
        {
          title: 'حملة العيد والمناسبات الخاصة',
          type: 'موسمي وتراثي',
          icon: Sparkles,
          description: 'باقة مخصصة للهدايا والتجهيز للمناسبات مع تغليف مجاني وبطاقة إهداء.',
          whatsappTemplate: `🎉 *أناقتك وفرحتك تكتمل مع ${store.name}!* ✨\n\nاخترنا لكم أجمل التشكيلات الفاخرة مع *تغليف هدايا مجاني فاخر* لكل طلب!\n\n👑 تصفح التشكيلة الحصرية واطلب الآن قبل نفاد الكميات:\nhttps://seen.app/store/${store.slug}`,
          isEditing: false
        }
      ];
      setSavedStrategies(initialStrategies);
    }
  }, [store]);


  if (!store) return null;

  

  
  
  

  const handleGenerateCustom = async (e: React.FormEvent) => {
    
    e.preventDefault();
    if (!customGoal || !store) return;

    setIsGenerating(true);
    
    const res = await generateCampaignAction(customGoal, store.name, store.slug, store.city);
    
    if (res.success) {
      setGeneratedCampaign(res.text);
      setCustomCampaigns([{title: customGoal, text: res.text, date: new Date().toLocaleDateString('ar-YE'), isEditing: false}, ...customCampaigns]);
      setCustomGoal('');
    } else if (res.error === 'MISSING_KEY') {
      alert('الرجاء إضافة مفتاح GEMINI_API_KEY في ملف .env لكي تتمكن من توليد الحملات حقيقياً.');
    } else {
      alert('حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.');
    }
    setIsGenerating(false);

  };


  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        setUploadedMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adImageGoal || !store) return;
    
    setIsGeneratingAd(true);
    const res = await generateAdDesignAction(adImageGoal, store.name, uploadedImage || undefined, uploadedMimeType || undefined);
    
    if (res.success && res.data) {
      setGeneratedAd(res.data);
    } else if (res.error === 'MISSING_KEY') {
      alert('الرجاء إضافة مفتاح GEMINI_API_KEY في ملف .env');
    } else {
      alert('حدث خطأ: ' + res.error);
    }
    setIsGeneratingAd(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            <span>مستشار الذكاء الاصطناعي للأعمال والتسويق</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            توليد استراتيجيات زيادة المبيعات، عروض الخصم التلقائية، ورسائل WhatsApp التسويقية
          </p>
        </div>
      </div>

      {/* AI Custom Prompt Generator */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 to-slate-900 text-white border border-teal-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              اطلب من مستشار الذكاء الاصطناعي تصميم حملة تسويقية مخصصة
            </h3>
            <p className="text-xs text-teal-200/80">اكتب هدفك (مثال: تصفية بضاعة الصيف، عرض يوم الجمعة، باقة هدايا)</p>
          </div>
        </div>

        <form onSubmit={handleGenerateCustom} className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            required
            placeholder="مثال: أريد عروض حصرية على العبايات لعيد الفطر مع هدية مجانية..."
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            className="w-full px-4 py-3 text-xs rounded-xl bg-slate-950/80 border border-teal-700/60 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-400"
          />
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-teal-500 hover:bg-teal-400 text-slate-950 whitespace-nowrap transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'جاري التوليد...' : 'توليد الحملة فوراً'}</span>
          </button>
        </form>
      </div>

      {/* New Feature: AI Image Ad Generator */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              تصميم صورة إعلانية بالذكاء الاصطناعي (جديد) ✨
            </h3>
            <p className="text-xs text-slate-500">ارفع صورة للمنتج (اختياري) واكتب الوصف، وسيقوم الذكاء الاصطناعي بإنشاء ملصق إعلاني مذهل!</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <form onSubmit={handleGenerateAd} className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">وصف الحملة / المنتج</label>
              <input
                type="text"
                required
                placeholder="مثال: ايفون 17 برو ماكس 256 جيجا مستخدم شبه جديد..."
                value={adImageGoal}
                onChange={(e) => setAdImageGoal(e.target.value)}
                className="w-full px-4 py-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">صورة المنتج (اختياري)</label>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Uploaded" className="h-24 object-contain rounded-lg" />
                ) : (
                  <div className="text-center">
                    <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="text-xs text-slate-500 font-medium">اضغط لرفع صورة المنتج</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isGeneratingAd}
              className="w-full px-6 py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{isGeneratingAd ? 'جاري التصميم...' : 'إنشاء ملصق إعلاني'}</span>
            </button>
          </form>

          {/* Ad Canvas Display */}
          <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 min-h-[300px] overflow-hidden">
            {isGeneratingAd ? (
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500 animate-pulse">جاري التحليل والتصميم...</p>
              </div>
            ) : generatedAd ? (
              <div 
                className={`relative w-full max-w-sm aspect-[4/5] rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-end p-6 transition-all transform hover:scale-[1.02] ${
                  generatedAd.colorTheme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                }`}
                style={uploadedImage ? {
                  backgroundImage: `url(${uploadedImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : {
                  background: 'linear-gradient(135deg, #4f46e5, #ec4899)'
                }}
              >
                {/* Gradient overlay to ensure text is readable */}
                <div className={`absolute inset-0 ${
                  generatedAd.colorTheme === 'dark' 
                    ? 'bg-gradient-to-t from-black/90 via-black/40 to-transparent' 
                    : 'bg-gradient-to-t from-white/90 via-white/40 to-transparent'
                }`} />

                {/* Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black shadow-lg uppercase tracking-wider">
                    {generatedAd.badge}
                  </span>
                </div>

                {/* Texts */}
                <div className="relative z-10 text-center space-y-2 mt-auto">
                  <h2 className={`text-3xl font-black drop-shadow-md leading-tight ${
                    generatedAd.colorTheme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {generatedAd.headline}
                  </h2>
                  <p className={`text-sm font-bold opacity-90 drop-shadow-sm ${
                    generatedAd.colorTheme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                  }`}>
                    {generatedAd.subheadline}
                  </p>
                  <button className="mt-4 w-full py-3 rounded-xl bg-brand-600 text-white text-xs font-black shadow-lg">
                    اطلب الآن
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs">سيتم عرض التصميم هنا</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Custom Generated Campaigns */}
      {customCampaigns.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            حملات تم توليدها بالذكاء الاصطناعي 🧠
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customCampaigns.map((camp, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                      توليد مخصص
                    </span>
                    <span className="text-[10px] text-slate-400">{camp.date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                    {camp.title}
                  </h4>
                  <div className="relative group">
                    <textarea
                      disabled={!camp.isEditing}
                      className={`w-full p-3 rounded-xl text-[11px] font-mono whitespace-pre-line leading-relaxed h-48 resize-y outline-none transition-all ${camp.isEditing ? 'bg-white dark:bg-slate-800 border-2 border-teal-500 shadow-inner text-slate-900 dark:text-white' : 'bg-transparent border border-transparent text-slate-700 dark:text-slate-300'}`}
                      value={camp.text}
                      onChange={(e) => {
                        const updated = [...customCampaigns];
                        updated[idx].text = e.target.value;
                        setCustomCampaigns(updated);
                      }}
                    />
                  </div>
                </div>
                <div className="pt-3 border-t border-teal-100 dark:border-teal-800/50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const updated = [...customCampaigns];
                      updated[idx].isEditing = !updated[idx].isEditing;
                      setCustomCampaigns(updated);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${camp.isEditing ? 'bg-teal-600 text-white' : 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 hover:bg-teal-200'}`}
                  >
                    {camp.isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                    <span>{camp.isEditing ? 'حفظ التعديل' : 'تعديل النص'}</span>
                  </button>
                  
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newStrat = {
                          title: camp.title,
                          type: 'حملة مخصصة',
                          icon: Sparkles,
                          description: 'تم توليد وتثبيت هذه الحملة بواسطة الذكاء الاصطناعي',
                          whatsappTemplate: camp.text,
                          isEditing: false
                        };
                        setSavedStrategies([newStrat, ...savedStrategies]);
                        const updated = customCampaigns.filter((_, i) => i !== idx);
                        setCustomCampaigns(updated);
                        alert('تم تثبيت الحملة في الأسفل!');
                      }}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-900/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">تثبيت</span>
                    </button>
                    <button
                      onClick={() => {
                        const updated = customCampaigns.filter((_, i) => i !== idx);
                        setCustomCampaigns(updated);
                      }}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-red-50 dark:bg-red-900/50 hover:bg-red-100 text-red-600 dark:text-red-400 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">حذف</span>
                    </button>
                    <button
                      onClick={() => handleCopy(camp.text, idx + 1000)}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {copiedIndex === idx + 1000 ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="hidden sm:inline">{copiedIndex === idx + 1000 ? 'تم النسخ!' : 'نسخ'}</span>
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(camp.text)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">إرسال</span>
                    </a>
                  </div>

                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pre-built Ready Strategies */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          حملات تسويقية جاهزة ومثبتة النجاح 🚀
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {savedStrategies.map((strat, idx) => {
            const Icon = strat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {strat.type}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {strat.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {strat.description}
                  </p>

                  
                  <textarea
                    disabled={!strat.isEditing}
                    className={`w-full mt-4 p-3 rounded-xl text-[11px] font-mono whitespace-pre-line leading-relaxed h-48 resize-y outline-none transition-all ${strat.isEditing ? 'bg-white dark:bg-slate-800 border-2 border-teal-500 shadow-inner text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                    value={strat.whatsappTemplate}
                    onChange={(e) => {
                      const updated = [...savedStrategies];
                      updated[idx].whatsappTemplate = e.target.value;
                      setSavedStrategies(updated);
                    }}
                  />

                </div>

                
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const updated = [...savedStrategies];
                      updated[idx].isEditing = !updated[idx].isEditing;
                      setSavedStrategies(updated);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${strat.isEditing ? 'bg-teal-600 text-white' : 'bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400'}`}
                  >
                    {strat.isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                    <span>{strat.isEditing ? 'حفظ' : 'تعديل'}</span>
                  </button>

                  <button
                    onClick={() => handleCopy(strat.whatsappTemplate, idx)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === idx ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(strat.whatsappTemplate)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>إرسال</span>
                  </a>
                </div>


              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
