const fs = require('fs');

const targetPath = 'app/merchant/[slug]/ai-advisor/page.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add imports
content = content.replace(
  "import { getStoreBySlugAction } from '@/app/actions/store';",
  "import { getStoreBySlugAction } from '@/app/actions/store';\nimport { generateCampaignAction } from '@/app/actions/ai';\nimport { Pin, Trash } from 'lucide-react';"
);

// 2. Change `quickStrategies` to state and modify `handleGenerateCustom`
const initialQuickStrategies = `
  const initialStrategies = [
    {
      title: 'حملة نهاية الأسبوع (Flash Sale)',
      type: 'عطلة نهاية الأسبوع',
      icon: Zap,
      description: 'خصم 15% على القطع الأكثر طلباً مع شحن سريع خلال 24 ساعة لزيادة المبيعات يومي الخميس والجمعة.',
      whatsappTemplate: \`🔥 *عروض نهاية الأسبوع الكبرى من \${store?.name || ''}!* 🔥\\n\\nاستمتعوا بخصم خاص *15%* على كافة المنتجات + توصيل فوري لعنوانك في \${store?.city || ''}!\\n\\n🛍️ للطلب السريع تصفح المتجر الآن:\\nhttps://mazn.app/store/\${store?.slug || ''}\\n\\n*العرض سارٍ حتى مساء السبت فقط.* ⏳\`,
      isEditing: false
    },
    {
      title: 'عرض الشحن والتوصيل المجاني',
      type: 'زيادة حجم السلة AOV',
      icon: Gift,
      description: 'تقديم توصيل مجاني عند شراء منتجين أو أكثر أو عند تجاوز قيمة السلة 100 ر.س لرفع متوسط الطلب.',
      whatsappTemplate: \`🚚 *بشرى سارة لزبائن \${store?.name || ''} الكرام!* ✨\\n\\nاحصل على *توصيل مجاني بالكامل* عند طلب منتجين أو أكثر اليوم!\\n\\n📦 تسوق الآن تشكيلتنا الجديدة:\\nhttps://mazn.app/store/\${store?.slug || ''}\\n\\nالدفع عند الاستلام أو عبر المحافظ متاح بكل سهولة. 💳\`,
      isEditing: false
    },
    {
      title: 'حملة العيد والمناسبات الخاصة',
      type: 'موسمي وتراثي',
      icon: Sparkles,
      description: 'باقة مخصصة للهدايا والتجهيز للمناسبات مع تغليف مجاني وبطاقة إهداء.',
      whatsappTemplate: \`🎉 *أناقتك وفرحتك تكتمل مع \${store?.name || ''}!* ✨\\n\\nاخترنا لكم أجمل التشكيلات الفاخرة مع *تغليف هدايا مجاني فاخر* لكل طلب!\\n\\n👑 تصفح التشكيلة الحصرية واطلب الآن قبل نفاد الكميات:\\nhttps://mazn.app/store/\${store?.slug || ''}\`,
      isEditing: false
    },
  ];

  const [savedStrategies, setSavedStrategies] = useState<any[]>([]);

  useEffect(() => {
    if (store && savedStrategies.length === 0) {
      setSavedStrategies(initialStrategies);
    }
  }, [store]);
`;

// Remove old quickStrategies array
content = content.replace(
  /const quickStrategies = \[[\s\S]*?\}\,\n  \]\;/,
  ''
);

// Insert new initial state before handleGenerateCustom
content = content.replace(
  "const handleGenerateCustom = (e: React.FormEvent) => {",
  initialQuickStrategies + "\n  const handleGenerateCustom = async (e: React.FormEvent) => {"
);

// Replace handleGenerateCustom logic
const newHandleGenerate = `
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
`;
content = content.replace(
  /e\.preventDefault\(\)\;\n    if \(\!customGoal\) return\;[\s\S]*?setIsGenerating\(false\)\;\n    \}\, 800\)\;/,
  newHandleGenerate
);


// 3. Update the mapping of custom campaigns to include Delete and Pin buttons
const customCampaignsButtons = `
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
                      href={\`https://wa.me/?text=\${encodeURIComponent(camp.text)}\`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">إرسال</span>
                    </a>
                  </div>
`;

content = content.replace(
  /<div className="flex gap-2">\s*<button[\s\S]*?<\/a>\s*<\/div>/,
  customCampaignsButtons
);


// 4. Update the mapping of saved strategies (bottom cards) to include explicit Edit button
content = content.replace(
  /quickStrategies\.map\(\(strat, idx\) => \{/g,
  'savedStrategies.map((strat, idx) => {'
);

const savedStrategiesTextarea = `
                  <textarea
                    disabled={!strat.isEditing}
                    className={\`w-full mt-4 p-3 rounded-xl text-[11px] font-mono whitespace-pre-line leading-relaxed h-48 resize-y outline-none transition-all \${strat.isEditing ? 'bg-white dark:bg-slate-800 border-2 border-teal-500 shadow-inner text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}\`}
                    value={strat.whatsappTemplate}
                    onChange={(e) => {
                      const updated = [...savedStrategies];
                      updated[idx].whatsappTemplate = e.target.value;
                      setSavedStrategies(updated);
                    }}
                  />
`;

content = content.replace(
  /<textarea\n\s*className="w-full mt-4 p-3 rounded-xl bg-slate-50[\s\S]*?\/>/,
  savedStrategiesTextarea
);

const savedStrategiesButtons = `
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      const updated = [...savedStrategies];
                      updated[idx].isEditing = !updated[idx].isEditing;
                      setSavedStrategies(updated);
                    }}
                    className={\`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 \${strat.isEditing ? 'bg-teal-600 text-white' : 'bg-teal-50 hover:bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400'}\`}
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
                    href={\`https://wa.me/?text=\${encodeURIComponent(strat.whatsappTemplate)}\`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>إرسال</span>
                  </a>
                </div>
`;

content = content.replace(
  /<div className="pt-2 border-t border-slate-100[\s\S]*?<\/div>/,
  savedStrategiesButtons
);

fs.writeFileSync(targetPath, content, 'utf8');
