const fs = require('fs');
let file = fs.readFileSync('app/seenayhq7x/page.tsx', 'utf8');

// 1. Update activeTab type
file = file.replace(
  /useState<'owner' \| 'reports' \| 'packages' \| 'stores' \| 'requests' \| 'broadcasts' \| 'texts'([^>]*)>/,
  "useState<'owner' | 'reports' | 'packages' | 'stores' | 'requests' | 'broadcasts' | 'texts' | 'ai'$1>"
);

// 2. Add TabButton
file = file.replace(
  /<TabButton id="texts" label="نصوص الموقع" icon={Type} \/>/,
  `<TabButton id="texts" label="نصوص الموقع" icon={Type} />\n             <TabButton id="ai" label="إعدادات الذكاء الاصطناعي" icon={Cpu} />`
);

// 3. Add AI Tab Content
const aiTabBlock = `
        {/* Tab: AI Settings */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-6 h-6 text-brand-600" />
                <span>إعدادات مستشار الذكاء الاصطناعي</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">اختر مزود الذكاء الاصطناعي الذي ترغب في استخدامه في المنصة وأدخل مفاتيح الربط (API Keys).</p>
            </div>

            {textsSaveSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                {textsSaveSuccess}
              </div>
            )}

            <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slateDark-800">
              <div className="space-y-6 max-w-2xl">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    المزود (AI Provider)
                  </label>
                  <select
                    value={siteTexts['ai_provider'] || 'gemini'}
                    onChange={(e) => setSiteTexts({...siteTexts, ai_provider: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slateDark-700 bg-slate-50 dark:bg-slateDark-800 text-slate-900 dark:text-white text-xs outline-none"
                  >
                    <option value="gemini">Google Gemini (مجاني وسريع)</option>
                    <option value="openai">OpenAI ChatGPT (متقدم)</option>
                  </select>
                </div>

                <div className={siteTexts['ai_provider'] === 'openai' ? 'opacity-50 grayscale' : ''}>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    مفتاح Google Gemini (API Key)
                  </label>
                  <input
                    type="password"
                    value={siteTexts['ai_gemini_api_key'] || ''}
                    onChange={(e) => setSiteTexts({...siteTexts, ai_gemini_api_key: e.target.value})}
                    placeholder="AIzaSy..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slateDark-700 bg-slate-50 dark:bg-slateDark-800 text-slate-900 dark:text-white text-xs outline-none dir-ltr font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-2">احصل عليه مجاناً من <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-brand-500 underline">Google AI Studio</a></p>
                </div>

                <div className={siteTexts['ai_provider'] !== 'openai' ? 'opacity-50 grayscale' : ''}>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    مفتاح OpenAI (API Key)
                  </label>
                  <input
                    type="password"
                    value={siteTexts['ai_openai_api_key'] || ''}
                    onChange={(e) => setSiteTexts({...siteTexts, ai_openai_api_key: e.target.value})}
                    placeholder="sk-..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slateDark-700 bg-slate-50 dark:bg-slateDark-800 text-slate-900 dark:text-white text-xs outline-none dir-ltr font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-2">احصل عليه من <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-brand-500 underline">OpenAI Dashboard</a></p>
                </div>

                <button
                  onClick={handleSaveTexts}
                  disabled={isSavingTexts}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/25 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingTexts ? 'جاري الحفظ...' : 'حفظ الإعدادات'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
`;

file = file.replace(
  /{activeTab === 'texts' && \(/,
  aiTabBlock + "\n        {activeTab === 'texts' && ("
);

fs.writeFileSync('app/seenayhq7x/page.tsx', file, 'utf8');
console.log('Done modifying HQ page');
