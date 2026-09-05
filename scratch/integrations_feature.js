const fs = require('fs');

// --- Task 1: Accounting Integration Settings ---
const settingsPath = 'app/merchant/[slug]/settings/page.tsx';
let settingsContent = fs.readFileSync(settingsPath, 'utf8');

// Update lucide-react imports
settingsContent = settingsContent.replace(
  "Settings, Wallet, RefreshCw, Truck, Store as StoreIcon,",
  "Settings, Wallet, RefreshCw, Truck, Store as StoreIcon, Database,"
);

// Add accounting tab to the state type
settingsContent = settingsContent.replace(
  "const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'currencies' | 'shipping' | 'marketing'>('general');",
  "const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'currencies' | 'shipping' | 'marketing' | 'accounting'>('general');"
);

// Add accounting tab to the tab buttons map
settingsContent = settingsContent.replace(
  "{ id: 'marketing', label: 'التسويق والبكسلات', icon: Target },",
  "{ id: 'marketing', label: 'التسويق والبكسلات', icon: Target },\n          { id: 'accounting', label: 'الربط المحاسبي (ERP)', icon: Database },"
);

// Add accounting tab content
const accountingTabContent = `
        {/* Tab 6: Accounting Integrations */}
        {activeTab === 'accounting' && (
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
                  <button type="button" onClick={() => alert('سيتم تفعيل بوابة الربط قريباً')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:text-brand-600 group-hover:border-brand-300 transition-colors">
                    ربط النظام
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                 <h4 className="text-xs font-bold text-brand-800 dark:text-brand-300 mb-1">إعدادات الربط المتقدمة (API)</h4>
                 <p className="text-[11px] text-slate-600 dark:text-slate-400">إذا كان لديك نظام محاسبي خاص وتريد ربطه، يمكنك استخدام مفاتيح الربط الخاصة بمتجرك.</p>
               </div>
               <button type="button" onClick={() => alert('سيتم توليد مفتاح API')} className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-sm hover:bg-brand-500 transition-colors">إنشاء مفتاح API</button>
            </div>
          </div>
        )}
`;

settingsContent = settingsContent.replace(
  "{/* Submit */}",
  accountingTabContent + "\n        {/* Submit */}"
);

fs.writeFileSync(settingsPath, settingsContent, 'utf8');


// --- Task 2: Products Import ---
const productsPath = 'app/merchant/[slug]/products/page.tsx';
let productsContent = fs.readFileSync(productsPath, 'utf8');

productsContent = productsContent.replace(
  "Package, Plus, Search, Filter, Edit, Trash2, Sparkles, \n  Bot, Image as ImageIcon, AlertTriangle, Check, X, Layers, Eye, DollarSign",
  "Package, Plus, Search, Filter, Edit, Trash2, Sparkles, \n  Bot, Image as ImageIcon, AlertTriangle, Check, X, Layers, Eye, DollarSign, Download, FileSpreadsheet, Database"
);

// Add state for Import Modal
productsContent = productsContent.replace(
  "const [isModalOpen, setIsModalOpen] = useState(false);",
  "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [isImportModalOpen, setIsImportModalOpen] = useState(false);"
);

// Add Import button
const importButtonCode = `
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">استيراد المنتجات</span>
          </button>
`;
productsContent = productsContent.replace(
  /<button\n\s*onClick=\{handleOpenNewModal\}/g,
  importButtonCode + "\n          <button\n            onClick={handleOpenNewModal}"
);
// close the div
productsContent = productsContent.replace(
  /<span>إضافة منتج جديد<\/span>\n\s*<\/button>\n\s*<\/div>/g,
  "<span>إضافة منتج جديد</span>\n          </button>\n        </div>\n      </div>"
);

// Add Import Modal UI at the end
const importModalCode = `
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
              
              <button 
                onClick={() => { alert('سيتم فتح نافذة اختيار ملف الإكسل (قريباً)'); setIsImportModalOpen(false); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600">استيراد من إكسل (Excel / CSV)</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">رفع ملف يحتوي على بيانات الأصناف والأسعار</p>
                </div>
              </button>

              <button 
                onClick={() => { alert('جاري الاتصال بالنظام المحاسبي المرتبط (قريباً)'); setIsImportModalOpen(false); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group text-right"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600">سحب من النظام المحاسبي (ERP)</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">استيراد مباشر من Onyx Pro أو SMACC أو غيره</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
`;

productsContent = productsContent.replace(
  "    </div>\n  );\n}\n",
  importModalCode + "\n    </div>\n  );\n}\n"
);

fs.writeFileSync(productsPath, productsContent, 'utf8');
