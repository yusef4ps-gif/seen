const fs = require('fs');

function patchFile(filePath, saveFnName, oldText, newText) {
  if (!fs.existsSync(filePath)) return;
  let c = fs.readFileSync(filePath, 'utf8');
  
  if (c.includes('isSaving')) return; // already patched

  c = c.replace('const [isSaved, setIsSaved] = useState(false);', 'const [isSaved, setIsSaved] = useState(false);\n  const [isSaving, setIsSaving] = useState(false);');

  // Patch function start
  c = c.replace(`const ${saveFnName} = async (e: React.FormEvent) => {`, `const ${saveFnName} = async (e: React.FormEvent) => {\n    if (isSaving) return;\n    setIsSaving(true);`);
  c = c.replace(`const ${saveFnName} = async (e?: React.FormEvent) => {`, `const ${saveFnName} = async (e?: React.FormEvent) => {\n    if (isSaving) return;\n    setIsSaving(true);`);
  c = c.replace(`const ${saveFnName} = async () => {`, `const ${saveFnName} = async () => {\n    if (isSaving) return;\n    setIsSaving(true);`);

  // Patch function end (success)
  c = c.replace(/setIsSaved\(true\);/g, 'setIsSaving(false);\n      setIsSaved(true);');
  
  // Patch function end (error)
  c = c.replace(/alert\('فشل/g, "setIsSaving(false);\n      alert('فشل");
  c = c.replace(/alert\("فشل/g, "setIsSaving(false);\n      alert(\"فشل");
  
  // Patch button
  const regex = new RegExp(`<button([^>]*)onClick=\\{${saveFnName}\\}([^>]*)>([\\s\\S]*?)<\\/button>`, 'g');
  
  c = c.replace(regex, (match, p1, p2, inner) => {
    let newInner = inner;
    if (newInner.includes(oldText)) {
      newInner = newInner.replace(oldText, newText);
    } else {
      // Try to replace just the text
      newInner = newInner.replace(/'حفظ التعديلات'/g, "{isSaving ? 'جاري الحفظ...' : isSaved ? 'تم الحفظ ✓' : 'حفظ التعديلات'}");
      newInner = newInner.replace(/'حفظ'/g, "{isSaving ? 'جاري الحفظ...' : isSaved ? 'تم الحفظ ✓' : 'حفظ'}");
    }
    
    let newP1 = p1, newP2 = p2;
    if (match.includes('className="')) {
      newP1 = p1.replace(/className="([^"]+)"/, `className="$1 \${isSaving ? 'opacity-60 cursor-not-allowed' : ''}"`);
      newP2 = p2.replace(/className="([^"]+)"/, `className="$1 \${isSaving ? 'opacity-60 cursor-not-allowed' : ''}"`);
    } else if (match.includes('className={`')) {
       newP1 = p1.replace(/className=\{`([^`]+)`\}/, `className={\`$1 \${isSaving ? 'opacity-60 cursor-not-allowed' : ''}\`}`);
       newP2 = p2.replace(/className=\{`([^`]+)`\}/, `className={\`$1 \${isSaving ? 'opacity-60 cursor-not-allowed' : ''}\`}`);
    }
    
    return `<button${newP1}onClick={${saveFnName}} disabled={isSaving}${newP2}>${newInner}</button>`;
  });
  
  fs.writeFileSync(filePath, c);
  console.log('Patched ' + filePath);
}

// 1. Settings page
patchFile(
  'app/merchant/[slug]/settings/page.tsx', 
  'handleSaveSettings', 
  "{isSaved ? 'تم حفظ الإعدادات بنجاح ✓' : 'حفظ التعديلات'}", 
  "{isSaving ? 'جاري الحفظ...' : isSaved ? 'تم حفظ الإعدادات بنجاح ✓' : 'حفظ التعديلات'}"
);
patchFile(
  'app/merchant/[slug]/settings/page.tsx', 
  'handleSaveSettings', 
  "{isSaved ? 'تم حفظ التعديلات بنجاح ✓' : 'حفظ جميع الإعدادات'}", 
  "{isSaving ? 'جاري الحفظ...' : isSaved ? 'تم حفظ التعديلات بنجاح ✓' : 'حفظ جميع الإعدادات'}"
);

// 2. Staff page
patchFile(
  'app/merchant/[slug]/staff/page.tsx', 
  'handleSave', 
  "{isEditModalOpen ? 'حفظ التعديلات' : 'إضافة الموظف'}", 
  "{isSaving ? 'جاري الحفظ...' : (isEditModalOpen ? 'حفظ التعديلات' : 'إضافة الموظف')}"
);

// 3. Theme builder page
patchFile(
  'app/merchant/[slug]/theme-builder/page.tsx', 
  'handleSave', 
  "{isSaved ? 'تم الحفظ ✓' : 'حفظ التغييرات'}", 
  "{isSaving ? 'جاري الحفظ...' : isSaved ? 'تم الحفظ ✓' : 'حفظ التغييرات'}"
);

// 4. Products page (if applicable)
patchFile(
  'app/merchant/[slug]/products/page.tsx', 
  'handleSaveProduct', 
  "{editingProductId ? 'حفظ التعديلات' : 'إضافة المنتج فوراً'}", 
  "{isSaving ? 'جاري الحفظ...' : (editingProductId ? 'حفظ التعديلات' : 'إضافة المنتج فوراً')}"
);

// 5. Offers page
patchFile(
  'app/merchant/[slug]/offers/page.tsx', 
  'handleSaveOffer', 
  "{editingOfferId ? 'حفظ التعديلات' : 'إضافة العرض'}", 
  "{isSaving ? 'جاري الحفظ...' : (editingOfferId ? 'حفظ التعديلات' : 'إضافة العرض')}"
);

// 6. Coupons page
patchFile(
  'app/merchant/[slug]/coupons/page.tsx', 
  'handleSaveCoupon', 
  "{editingCouponId ? 'حفظ التعديلات' : 'إضافة الكوبون'}", 
  "{isSaving ? 'جاري الحفظ...' : (editingCouponId ? 'حفظ التعديلات' : 'إضافة الكوبون')}"
);
