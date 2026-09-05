const fs = require('fs');

// --- Task 3: Fix Coupon Creation Bug ---
const couponPath = 'app/actions/coupon.ts';
let couponContent = fs.readFileSync(couponPath, 'utf8');

// The issue is likely that expiry is passed as string, and discount/maxUses as string, leading to NaN if empty, or Invalid Date.
// Let's modify createCouponAction
couponContent = couponContent.replace(
  "...data,",
  "...data,\n        expiry: data.expiry ? new Date(data.expiry) : null,\n        discount: Number(data.discount) || 0,\n        maxUses: Number(data.maxUses) || 0,"
);
fs.writeFileSync(couponPath, couponContent, 'utf8');


// --- Task 2: Settings Freeze/Delete ---
const settingsPath = 'app/merchant/[slug]/settings/page.tsx';
let settingsContent = fs.readFileSync(settingsPath, 'utf8');

// 1. Payment accounts: remove acc.id.startsWith('custom_') condition for delete
settingsContent = settingsContent.replace(
  "{acc.id.startsWith('custom_') && (",
  "{" + "true" + " && ("
);
settingsContent = settingsContent.replace(
  "{acc.id.startsWith('custom_') ? (",
  "{" + "true" + " ? ("
);

// 2. Shipping methods: remove m.id.startsWith('ship_') condition for delete
settingsContent = settingsContent.replace(
  "{m.id.startsWith('ship_') && (",
  "{" + "true" + " && ("
);

// 3. Shipping methods: add toggle isActive
// Add handleToggleShipping function
const handleToggleShippingCode = `
  const handleToggleShipping = (id: string) => {
    setShippingMethods(
      shippingMethods.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    );
  };
`;
settingsContent = settingsContent.replace(
  "const handleRemoveShippingMethod",
  handleToggleShippingCode + "\n  const handleRemoveShippingMethod"
);

// Add toggle UI for shipping
const shippingToggleUI = `
                      <label className="relative inline-flex items-center cursor-pointer ml-3">
                        <input
                          type="checkbox"
                          checked={m.isActive !== false}
                          onChange={() => handleToggleShipping(m.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
`;
settingsContent = settingsContent.replace(
  "className=\"text-red-500 hover:bg-red-50 p-1.5 rounded-lg\"",
  "className=\"text-red-500 hover:bg-red-50 p-1.5 rounded-lg ml-2\"\n                      >"
);
// Insert toggle before delete button
settingsContent = settingsContent.replace(
  "{true && (",
  shippingToggleUI + "\n                    {true && ("
);

// Add opacity to inactive shipping methods
settingsContent = settingsContent.replace(
  "className=\"p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs\"",
  "className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${m.isActive !== false ? 'border-brand-200 dark:border-brand-800 bg-slate-50 dark:bg-slate-800/40' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20 opacity-60'}`}"
);


fs.writeFileSync(settingsPath, settingsContent, 'utf8');


// --- Task 1: AI Advisor ---
const aiPath = 'app/merchant/[slug]/ai-advisor/page.tsx';
let aiContent = fs.readFileSync(aiPath, 'utf8');

// Add Edit2 import
aiContent = aiContent.replace("Copy, Check, MessageSquare,", "Copy, Check, MessageSquare, Edit2,");

// Add state for custom campaigns list and editing mode
const aiStateCode = `
  const [customCampaigns, setCustomCampaigns] = useState<{title: string, text: string, date: string, isEditing?: boolean}[]>([]);
`;
aiContent = aiContent.replace(
  "const [editableTemplates, setEditableTemplates] = useState<Record<number, string>>({});",
  "const [editableTemplates, setEditableTemplates] = useState<Record<number, string>>({});\n" + aiStateCode
);

// Update handleGenerateCustom
const newHandleGenerateCode = `
  const handleGenerateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal) return;

    setIsGenerating(true);
    setTimeout(() => {
      const newText = \`🎯 *خطة مقترحة لحملة: \${customGoal}*\\n\` +
        \`━━━━━━━━━━━━━━━━━━━━━\\n\` +
        \`💡 *الفكرة التسويقية:* تركيز العرض على شعور التميز والسرعة في التوصيل لعملاء \${store.city}.\\n\\n\` +
        \`📱 *نص رسالة الواتساب المقترح:*\\n\` +
        \`"مرحباً بكم في \${store.name}! بمناسبة \${customGoal}، يسرنا تقديم عرض استثنائي بأسعار حصرية لفترة محدودة. تصفح متجرنا الآن: https://mazn.app/store/\${store.slug} ودلل نفسك بأرقى المنتجات!"\\n\\n\` +
        \`📌 *نصيحة الذكاء الاصطناعي:* قم بنشر الرابط في ستوري واتساب وانستغرام في أوقات الذروة.\`;
      
      setGeneratedCampaign(newText);
      setCustomCampaigns([{title: customGoal, text: newText, date: new Date().toLocaleDateString('ar-YE'), isEditing: false}, ...customCampaigns]);
      setCustomGoal('');
      setIsGenerating(false);
    }, 800);
  };
`;
aiContent = aiContent.replace(
  /const handleGenerateCustom =.*?setIsGenerating\(false\);\n    }, 800\);\n  };/s,
  newHandleGenerateCode
);

// Replace generatedCampaign display area and add the custom campaigns list
const newCampaignsSection = `
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
                      className={\`w-full p-3 rounded-xl text-[11px] font-mono whitespace-pre-line leading-relaxed h-48 resize-y outline-none transition-all \${camp.isEditing ? 'bg-white dark:bg-slate-800 border-2 border-teal-500 shadow-inner text-slate-900 dark:text-white' : 'bg-transparent border border-transparent text-slate-700 dark:text-slate-300'}\`}
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
                    className={\`py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 \${camp.isEditing ? 'bg-teal-600 text-white' : 'bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 hover:bg-teal-200'}\`}
                  >
                    {camp.isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                    <span>{camp.isEditing ? 'حفظ التعديل' : 'تعديل النص'}</span>
                  </button>
                  
                  <div className="flex gap-2">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
`;

// Replace the single generatedCampaign display block
const oldGeneratedCampaignBlock = /\{generatedCampaign && \(\s*<div className="p-4 rounded-2xl bg-slate-950.*?<\/div>\s*\)\}/s;
aiContent = aiContent.replace(oldGeneratedCampaignBlock, "");

// Insert newCampaignsSection above "Pre-built Ready Strategies"
aiContent = aiContent.replace(
  "{/* Pre-built Ready Strategies */}",
  newCampaignsSection + "\n      {/* Pre-built Ready Strategies */}"
);

fs.writeFileSync(aiPath, aiContent, 'utf8');
