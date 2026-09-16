const fs = require('fs');
let content = fs.readFileSync('app/seenayhq7x/page.tsx', 'utf8');

// 1. Add isRefreshing state
if (!content.includes('const [isRefreshing, setIsRefreshing]')) {
  content = content.replace(
    'const [activeTab, setActiveTab] = useState',
    'const [isRefreshing, setIsRefreshing] = useState(false);\n  const [activeTab, setActiveTab] = useState'
  );
}

// 2. Add handleRefresh function
const refreshFunc = `
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    await new Promise(r => setTimeout(r, 400));
    setIsRefreshing(false);
  };
`;
if (!content.includes('const handleRefresh = async () =>')) {
  content = content.replace(
    '  const refreshData = async () => {',
    refreshFunc + '\n  const refreshData = async () => {'
  );
}

// 3. Remove the global refresh button
content = content.replace(
  /\{\/\* Global Refresh Button \*\/\}\s*<div className=\"flex justify-end -mb-4\">\s*<button[\s\S]*?<\/button>\s*<\/div>/g,
  ''
);

// 4. Create RefreshTabButton component
const refreshButtonComponent = `
  const RefreshTabButton = () => (
    <button 
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slateDark-800 dark:hover:bg-slateDark-700 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
      title="تحديث البيانات"
    >
      <RefreshCw className={\`w-4 h-4 \${isRefreshing ? 'animate-spin' : ''}\`} />
      <span className="hidden sm:inline">تحديث</span>
    </button>
  );
`;
if (!content.includes('const RefreshTabButton = () =>')) {
  content = content.replace(
    '  const TabButton = ({ id, label, icon: Icon',
    refreshButtonComponent + '\n\n  const TabButton = ({ id, label, icon: Icon'
  );
}

// 5. Inject <RefreshTabButton /> into headers
// Owner
content = content.replace(
  '                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">\n                    بيانات المالك\n                  </h1>',
  '                  <div className="flex items-center justify-between w-full">\n                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">\n                      بيانات المالك\n                    </h1>\n                    <RefreshTabButton />\n                  </div>'
);

// Reports
content = content.replace(
  '                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">\n                    التقارير والإحصائيات\n                  </h1>',
  '                  <div className="flex items-center justify-between w-full">\n                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">\n                      التقارير والإحصائيات\n                    </h1>\n                    <RefreshTabButton />\n                  </div>'
);

// Broadcasts
content = content.replace(
  '                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">\n                    لوحة التنبيهات العامة\n                  </h1>',
  '                  <div className="flex items-center justify-between w-full">\n                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">\n                      لوحة التنبيهات العامة\n                    </h1>\n                    <RefreshTabButton />\n                  </div>'
);

fs.writeFileSync('app/seenayhq7x/page.tsx', content);
console.log('Successfully updated the file.');
