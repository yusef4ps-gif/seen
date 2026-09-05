import re

file_path = "app/store/[slug]/page.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Category Parsing Logic
parsing_logic = """
  // Parse categories from products
  const categoryMap = new Map<string, Set<string>>();
  products.forEach(p => {
    const parts = p.category.split(' > ');
    const mainCat = parts[0]?.trim();
    const subCat = parts[1]?.trim();
    if (mainCat) {
      if (!categoryMap.has(mainCat)) categoryMap.set(mainCat, new Set());
      if (subCat) categoryMap.get(mainCat).add(subCat);
    }
  });

  const parsedCategories = Array.from(categoryMap.entries()).map(([main, subs]) => ({
    main,
    subs: Array.from(subs)
  }));

  const getBrandLogo = (brandName: string) => {
    const n = brandName.toLowerCase();
    if (n.includes('samsung') || n.includes('سامسونج')) return 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg';
    if (n.includes('apple') || n.includes('ابل') || n.includes('آبل') || n.includes('ايفون')) return 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg';
    if (n.includes('xiaomi') || n.includes('شاومي')) return 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg';
    if (n.includes('huawei') || n.includes('هواوي')) return 'https://upload.wikimedia.org/wikipedia/commons/0/00/Huawei_Logo.svg';
    return null;
  };
"""

content = re.sub(
    r"  const categories = Array\.from\(new Set\(products\.map\(\(p\) => p\.category\)\)\);",
    parsing_logic,
    content
)

# 2. Update filteredProducts logic to use startsWith
old_filter = "const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;"
new_filter = "const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory || p.category.startsWith(selectedCategory + ' > ');"
content = content.replace(old_filter, new_filter)


# 3. Replace features_strip with dynamic categories bar
features_strip_pattern = r"// --- SECTION: FEATURES STRIP ---.*?if \(section\.type === 'features_strip'\) \{.*?\n\s*\}\n"
dynamic_categories_bar = """
            // --- SECTION: FEATURES STRIP (Replaced by Dynamic Categories Navigation) ---
            if (section.type === 'features_strip') {
              return (
                <section key={section.id} className="max-w-7xl mx-auto px-3 sm:px-8 mt-4 sm:mt-6">
                  <div className={`p-2 sm:p-4 rounded-2xl flex items-center gap-4 overflow-x-auto no-scrollbar shadow-sm ${
                    presetId === 'tech-modern'
                      ? 'bg-slate-900 border border-slate-800 text-slate-200'
                      : presetId === 'yemen-roastery'
                      ? 'bg-[#f8f4eb] border border-amber-900/10 text-[#451a03]'
                      : presetId === 'minimal-clean'
                      ? 'border-2 border-black bg-white rounded-none text-black'
                      : 'bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800'
                  }`}>
                    {parsedCategories.length === 0 && <div className="text-xs opacity-50 p-2">لا توجد أقسام مضافة بعد</div>}
                    {parsedCategories.map((cat, idx) => (
                      <div key={idx} className="relative group shrink-0">
                        <button
                          onClick={() => setSelectedCategory(cat.main)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                            selectedCategory === cat.main || selectedCategory.startsWith(cat.main + ' > ')
                              ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                          }`}
                          style={{
                            backgroundColor: selectedCategory === cat.main || selectedCategory.startsWith(cat.main + ' > ') ? (presetId === 'minimal-clean' ? '#000' : `${primaryColor}15`) : undefined,
                            color: selectedCategory === cat.main || selectedCategory.startsWith(cat.main + ' > ') ? (presetId === 'minimal-clean' ? '#fff' : primaryColor) : undefined,
                            borderRadius: presetId === 'minimal-clean' ? '0px' : '12px'
                          }}
                        >
                          <span>{cat.main}</span>
                          {cat.subs.length > 0 && <ChevronDown className="w-3 h-3 opacity-50" />}
                        </button>

                        {/* Dropdown for Subcategories */}
                        {cat.subs.length > 0 && (
                          <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden translate-y-2 group-hover:translate-y-0"
                            style={{ borderRadius: presetId === 'minimal-clean' ? '0px' : '16px' }}
                          >
                            <div className="py-2">
                              {cat.subs.map(sub => {
                                const logo = getBrandLogo(sub);
                                const fullCat = `${cat.main} > ${sub}`;
                                const isSelected = selectedCategory === fullCat;
                                return (
                                  <button
                                    key={sub}
                                    onClick={() => setSelectedCategory(fullCat)}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                                      isSelected ? 'text-brand-600 bg-brand-50/50 dark:bg-brand-900/10' : 'text-slate-600 dark:text-slate-300'
                                    }`}
                                  >
                                    <span>{sub}</span>
                                    {logo && (
                                      <img src={logo} alt={sub} className="w-5 h-5 object-contain opacity-70" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            }
"""
content = re.sub(features_strip_pattern, dynamic_categories_bar, content, flags=re.DOTALL)


# 4. Remove the old Category Pills from featured_categories since we moved them to the main bar
# Search Box is fine, we just remove the pills
old_pills = r"\{/\* Category Pills \*/\}.*?\{categories\.map.*?\n\s*\)\)\}\n\s*</div>"
content = re.sub(old_pills, "", content, flags=re.DOTALL)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
