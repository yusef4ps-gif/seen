'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Bot, Sparkles, Send, Copy, Check, MessageSquare, 
  Lightbulb, TrendingUp, Gift, Zap, Layers, RefreshCw
} from 'lucide-react';
import { Store } from '@/lib/types';
import { getStoreBySlugAction } from '@/app/actions/store';

export default function MerchantAIAdvisorPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [customGoal, setCustomGoal] = useState('');
  const [generatedCampaign, setGeneratedCampaign] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) setStore(s as any);
      }
    }
    init();
  }, [slug]);

  if (!store) return null;

  const quickStrategies = [
    {
      title: 'حملة نهاية الأسبوع (Flash Sale)',
      type: 'عطلة نهاية الأسبوع',
      icon: Zap,
      description: 'خصم 15% على القطع الأكثر طلباً مع شحن سريع خلال 24 ساعة لزيادة المبيعات يومي الخميس والجمعة.',
      whatsappTemplate: `🔥 *عروض نهاية الأسبوع الكبرى من ${store.name}!* 🔥\n\nاستمتعوا بخصم خاص *15%* على كافة المنتجات + توصيل فوري لعنوانك في ${store.city}!\n\n🛍️ للطلب السريع تصفح المتجر الآن:\nhttps://mazn.app/store/${store.slug}\n\n*العرض سارٍ حتى مساء السبت فقط.* ⏳`,
    },
    {
      title: 'عرض الشحن والتوصيل المجاني',
      type: 'زيادة حجم السلة AOV',
      icon: Gift,
      description: 'تقديم توصيل مجاني عند شراء منتجين أو أكثر أو عند تجاوز قيمة السلة 100 ر.س لرفع متوسط الطلب.',
      whatsappTemplate: `🚚 *بشرى سارة لزبائن ${store.name} الكرام!* ✨\n\nاحصل على *توصيل مجاني بالكامل* عند طلب منتجين أو أكثر اليوم!\n\n📦 تسوق الآن تشكيلتنا الجديدة:\nhttps://mazn.app/store/${store.slug}\n\nالدفع عند الاستلام أو عبر المحافظ متاح بكل سهولة. 💳`,
    },
    {
      title: 'حملة العيد والمناسبات الخاصة',
      type: 'موسمي وتراثي',
      icon: Sparkles,
      description: 'باقة مخصصة للهدايا والتجهيز للمناسبات مع تغليف مجاني وبطاقة إهداء.',
      whatsappTemplate: `🎉 *أناقتك وفرحتك تكتمل مع ${store.name}!* ✨\n\nاخترنا لكم أجمل التشكيلات الفاخرة مع *تغليف هدايا مجاني فاخر* لكل طلب!\n\n👑 تصفح التشكيلة الحصرية واطلب الآن قبل نفاد الكميات:\nhttps://mazn.app/store/${store.slug}`,
    },
  ];

  const handleGenerateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal) return;

    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedCampaign(
        `🎯 *خطة مقترحة لحملة: ${customGoal}*\n` +
        `━━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 *الفكرة التسويقية:* تركيز العرض على شعور التميز والسرعة في التوصيل لعملاء ${store.city}.\n\n` +
        `📱 *نص رسالة الواتساب المقترح:*\n` +
        `"مرحباً بكم في ${store.name}! بمناسبة ${customGoal}، يسرنا تقديم عرض استثنائي بأسعار حصرية لفترة محدودة. تصفح متجرنا الآن: https://mazn.app/store/${store.slug} ودلل نفسك بأرقى المنتجات!"\n\n` +
        `📌 *نصيحة الذكاء الاصطناعي:* قم بنشر الرابط في ستوري واتساب وانستغرام في أوقات الذروة (بين 8 مساءً و 11 مساءً).`
      );
      setIsGenerating(false);
    }, 800);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
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

        {generatedCampaign && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-teal-800/80 space-y-3 animate-fadeIn text-xs">
            <textarea
              className="w-full h-40 bg-transparent text-slate-200 font-sans leading-relaxed outline-none border-none resize-y"
              value={generatedCampaign}
              onChange={(e) => setGeneratedCampaign(e.target.value)}
            />
            <button
              onClick={() => handleCopy(generatedCampaign, 999)}
              className="px-3 py-1.5 rounded-lg bg-teal-600/30 text-teal-300 hover:bg-teal-600/50 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
            >
              {copiedIndex === 999 ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedIndex === 999 ? 'تم النسخ!' : 'نسخ نص الحملة'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Pre-built Ready Strategies */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          حملات تسويقية جاهزة ومثبتة النجاح 🚀
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickStrategies.map((strat, idx) => {
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

                  <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 font-mono whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                    {strat.whatsappTemplate}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopy(strat.whatsappTemplate, idx)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedIndex === idx ? 'تم النسخ!' : 'نسخ الرسالة'}</span>
                  </button>

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(strat.whatsappTemplate)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>إرسال WhatsApp</span>
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
