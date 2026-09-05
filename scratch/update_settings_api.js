const fs = require('fs');

const settingsPath = 'app/merchant/[slug]/settings/page.tsx';
let content = fs.readFileSync(settingsPath, 'utf8');

// 1. Add imports
content = content.replace(
  "import { getStoreBySlugAction, updateStoreAction } from '@/app/actions/store';",
  "import { getStoreBySlugAction, updateStoreAction } from '@/app/actions/store';\nimport { generateApiKeyAction, getApiKeysAction, deleteApiKeyAction } from '@/app/actions/apiKey';"
);

// 2. Change state from single apiKey string to an array of objects
content = content.replace(
  "const [apiKey, setApiKey] = useState('');",
  "const [apiKeys, setApiKeys] = useState<any[]>([]);"
);

// 3. Update useEffect to fetch API keys
content = content.replace(
  "setShippingMethods(s.shippingMethods || []);",
  "setShippingMethods(s.shippingMethods || []);\n          const keys = await getApiKeysAction(s.id);\n          setApiKeys(keys);"
);

// 4. Update generateApiKey function
const newGenerateCode = `
  const generateApiKey = async () => {
    if (!store) return;
    setIsGeneratingKey(true);
    try {
      const newKey = await generateApiKeyAction(store.id, 'مفتاح جديد ' + new Date().toLocaleDateString('ar-EG'));
      setApiKeys([...apiKeys, newKey]);
    } catch (e) {
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
`;

content = content.replace(
  /const generateApiKey = \(\) => \{[\s\S]*?setTimeout\(\(\) => setIsCopied\(false\), 2000\);\n  \};/,
  newGenerateCode
);

// 5. Update UI to render multiple keys
const newUI = `
                 {apiKeys.length > 0 && (
                   <div className="mt-4 space-y-2 w-full animate-fadeIn">
                     {apiKeys.map((k) => (
                       <div key={k.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded-xl">
                         <div className="flex-1 min-w-0">
                           <div className="text-[10px] text-slate-500 mb-1">{k.label} - أنشئ في {new Date(k.createdAt).toLocaleDateString('ar-EG')}</div>
                           <div className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate">{k.key}</div>
                         </div>
                         <div className="flex items-center gap-2 shrink-0">
                           <button type="button" onClick={() => copyApiKey(k.key)} className="p-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-600 transition-colors">
                             نسخ
                           </button>
                           <button type="button" onClick={() => handleRevokeApiKey(k.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                             حذف
                           </button>
                         </div>
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
                 ) : 'إنشاء مفتاح جديد'}
               </button>
`;

content = content.replace(
  /\{apiKey && \([\s\S]*?\} : apiKey \? 'توليد مفتاح جديد' : 'إنشاء مفتاح API'\}\n               <\/button>/,
  newUI
);

fs.writeFileSync(settingsPath, content, 'utf8');
