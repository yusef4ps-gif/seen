const fs = require('fs');

const targetPath = 'app/merchant/[slug]/products/page.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Replace the single category state with two states
content = content.replace(
  "const [category, setCategory] = useState('فساتين وسهرات');",
  "const [mainCategory, setMainCategory] = useState('جوالات');\n  const [subCategory, setSubCategory] = useState('');"
);

// 2. Update `handleOpenNewModal`
content = content.replace(
  "setCategory('أزياء وموضة');",
  "setMainCategory('جوالات');\n    setSubCategory('');"
);

// 3. Update `handleOpenEditModal`
content = content.replace(
  "setCategory(prod.category);",
  "const parts = prod.category.split(' > ');\n    setMainCategory(parts[0] || '');\n    setSubCategory(parts.length > 1 ? parts.slice(1).join(' > ') : '');"
);

// 4. Update `handleSaveProduct` (we need to construct the `category` string)
// Inside `handleSaveProduct`, we add a derived `category` variable before the check `if (!store || !name || price <= 0)`
// Wait, actually `category` is used in the `generateAIProductDescription` too, so let's derive it where it's needed or just derive it once at the top of the component as a const if it's not going to break anything, OR derive it locally in the functions.
content = content.replace(
  "const handleSaveProduct = async (e: React.FormEvent) => {",
  "const handleSaveProduct = async (e: React.FormEvent) => {\n    const category = subCategory ? `${mainCategory.trim()} > ${subCategory.trim()}` : mainCategory.trim();"
);

// Also need to fix `handleGenerateAI` to use the constructed category
content = content.replace(
  "category,\n      });",
  "category: subCategory ? `${mainCategory.trim()} > ${subCategory.trim()}` : mainCategory.trim(),\n      });"
);

// 5. Replace the JSX form input for Category with the two new inputs
const oldCategoryJSX = `<div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    التصنيف
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: فساتين، هواتف، عطور"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>`;

const newCategoryJSX = `<div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    القسم الرئيسي <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: جوالات، عطور، لابتوبات"
                    value={mainCategory}
                    onChange={(e) => setMainCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    القسم الفرعي / الماركة (اختياري)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: سامسونج، آبل، شانيل"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>`;

content = content.replace(oldCategoryJSX, newCategoryJSX);

// We need to change the grid-cols from 3 to something else because we added one more field, or just let them wrap.
// `grid grid-cols-1 sm:grid-cols-3 gap-3`
content = content.replace(
  'className="grid grid-cols-1 sm:grid-cols-3 gap-3"',
  'className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"'
);

fs.writeFileSync(targetPath, content, 'utf8');
