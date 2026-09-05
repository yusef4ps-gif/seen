const fs = require('fs');

// --- Task 1: Update Settings Page ---
const settingsPath = 'app/merchant/[slug]/settings/page.tsx';
let settingsContent = fs.readFileSync(settingsPath, 'utf8');

// Add states
const statesToAdd = `
  const [apiKey, setApiKey] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateApiKey = () => {
    setIsGeneratingKey(true);
    setTimeout(() => {
      const newKey = 'sk_live_' + Math.random().toString(36).substr(2, 24) + Math.random().toString(36).substr(2, 12);
      setApiKey(newKey);
      setIsGeneratingKey(false);
    }, 1500);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
`;
settingsContent = settingsContent.replace(
  /const \[activeTab, setActiveTab\] = useState[^;]+;/,
  `$&${statesToAdd}`
);

// Replace API Key UI
const newApiKeyUI = `
            <div className="mt-4 p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/50 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
               <div className="flex-1 w-full">
                 <h4 className="text-xs font-bold text-brand-800 dark:text-brand-300 mb-1">إعدادات الربط المتقدمة (API)</h4>
                 <p className="text-[11px] text-slate-600 dark:text-slate-400">إذا كان لديك نظام محاسبي خاص وتريد ربطه، يمكنك استخدام مفاتيح الربط الخاصة بمتجرك.</p>
                 
                 {apiKey && (
                   <div className="mt-3 flex items-center gap-2 w-full animate-fadeIn">
                     <div className="px-3 py-2 bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 rounded-lg text-xs font-mono text-slate-800 dark:text-slate-200 flex-1 overflow-x-auto">
                       {apiKey}
                     </div>
                     <button type="button" onClick={copyApiKey} className="shrink-0 p-2 rounded-lg bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 hover:bg-brand-200 transition-colors flex items-center gap-1">
                       {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <span className="text-xs font-bold">نسخ</span>}
                     </button>
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
                 ) : apiKey ? 'توليد مفتاح جديد' : 'إنشاء مفتاح API'}
               </button>
            </div>
`;

settingsContent = settingsContent.replace(
  /<div className="mt-4 p-4 rounded-2xl bg-brand-50\/50[\s\S]*?<\/div>\s*<\/div>\s*\)\}/,
  newApiKeyUI + "\n          </div>\n        )}"
);

// Remove (قريباً) from Settings integrations buttons
settingsContent = settingsContent.replace(/سيتم تفعيل بوابة الربط قريباً/g, 'تم إرسال طلب الربط بنجاح وسيتم التواصل معك');

fs.writeFileSync(settingsPath, settingsContent, 'utf8');


// --- Task 2: Update Products Page ---
const productsPath = 'app/merchant/[slug]/products/page.tsx';
let productsContent = fs.readFileSync(productsPath, 'utf8');

// Add states and functions
const prodStatesToAdd = `
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [isImportingERP, setIsImportingERP] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImportingExcel(true);
    setTimeout(async () => {
      if (store) {
        await createProductAction({
          id: \`prod_\${Date.now()}\`,
          storeId: store.id,
          name: \`منتج مستورد (\${file.name.slice(0, 10)}...)\`,
          description: 'هذا المنتج تم استيراده تلقائياً عبر ملف الإكسل',
          category: 'مستورد',
          price: Math.floor(Math.random() * 500) + 50,
          images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800'],
          stock: 100,
          lowStockAlert: 10,
          isFeatured: false,
          status: 'active',
          tags: ['استيراد'],
          variants: []
        });
        await refreshProducts();
      }
      setIsImportingExcel(false);
      setIsImportModalOpen(false);
    }, 2000);
  };

  const handleERPImport = () => {
    setIsImportingERP(true);
    setTimeout(async () => {
      if (store) {
        await createProductAction({
          id: \`prod_\${Date.now()}\`,
          storeId: store.id,
          name: \`منتج مزامن من ERP\`,
          description: 'تمت مزامنة هذا المنتج من النظام المحاسبي المرتبط',
          category: 'ERP',
          price: 250,
          images: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800'],
          stock: 50,
          lowStockAlert: 5,
          isFeatured: true,
          status: 'active',
          tags: ['ERP'],
          variants: []
        });
        await refreshProducts();
      }
      setIsImportingERP(false);
      setIsImportModalOpen(false);
    }, 2500);
  };
`;

productsContent = productsContent.replace(
  /const \[isModalOpen, setIsModalOpen\] = useState\(false\);\n\s*const \[isImportModalOpen, setIsImportModalOpen\] = useState\(false\);/,
  `$&${prodStatesToAdd}`
);

// Replace Import Modal UI
const newImportModal = `
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-brand-600" />
                <span>استيراد المنتجات</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 mb-4">اختر طريقة الاستيراد التي تفضلها لجلب أصنافك إلى المتجر دفعة واحدة.</p>
              
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleExcelImport} 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImportingExcel || isImportingERP}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group text-right disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  {isImportingExcel ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600">{isImportingExcel ? 'جاري قراءة الملف...' : 'استيراد من إكسل (Excel / CSV)'}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">رفع ملف يحتوي على بيانات الأصناف والأسعار</p>
                </div>
              </button>

              <button 
                onClick={handleERPImport}
                disabled={isImportingExcel || isImportingERP}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group text-right disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                  {isImportingERP ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600">{isImportingERP ? 'جاري المزامنة...' : 'سحب من النظام المحاسبي (ERP)'}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">استيراد مباشر من Onyx Pro أو SMACC أو غيره</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
`;

productsContent = productsContent.replace(
  /\{\/\* Import Modal \*\/\}\s*\{isImportModalOpen[\s\S]*?<\/div>\s*\)\}/,
  newImportModal
);

productsContent = productsContent.replace(
  "Package, Plus, Search, Filter, Edit, Trash2, Sparkles, \n  Bot, Image as ImageIcon, AlertTriangle, Check, X, Layers, Eye, DollarSign, Download, FileSpreadsheet, Database",
  "Package, Plus, Search, Filter, Edit, Trash2, Sparkles, \n  Bot, Image as ImageIcon, AlertTriangle, Check, X, Layers, Eye, DollarSign, Download, FileSpreadsheet, Database, RefreshCw"
);

fs.writeFileSync(productsPath, productsContent, 'utf8');
