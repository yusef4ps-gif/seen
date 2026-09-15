const fs = require('fs');

function patchThemeBuilder() {
  const filePath = 'app/merchant/[slug]/theme-builder/page.tsx';
  let c = fs.readFileSync(filePath, 'utf8');
  
  if (!c.includes('isSaving')) {
    c = c.replace('const [isSaved, setIsSaved] = useState(false);', 'const [isSaved, setIsSaved] = useState(false);\n  const [isSaving, setIsSaving] = useState(false);');
  }

  c = c.replace(`const handleSaveTheme = async () => {`, `const handleSaveTheme = async () => {\n    if (isSaving) return;\n    setIsSaving(true);`);

  c = c.replace(/setIsSaved\(true\);/g, 'setIsSaving(false);\n      setIsSaved(true);');
  
  c = c.replace(/alert\('فشل/g, "setIsSaving(false);\n      alert('فشل");
  c = c.replace(/alert\("فشل/g, "setIsSaving(false);\n      alert(\"فشل");
  
  // Patch button
  const regex = /<button([^>]*)onClick=\{handleSaveTheme\}([^>]*)>([\s\S]*?)<\/button>/g;
  
  c = c.replace(regex, (match, p1, p2, inner) => {
    let newInner = inner;
    newInner = newInner.replace(/'حفظ التغييرات'/g, "{isSaving ? 'جاري الحفظ...' : isSaved ? 'تم الحفظ ✓' : 'حفظ التغييرات'}");
    newInner = newInner.replace(/\{isSaved \? 'تم الحفظ ✓' : 'حفظ التغييرات'\}/g, "{isSaving ? 'جاري الحفظ...' : isSaved ? 'تم الحفظ ✓' : 'حفظ التغييرات'}");
    
    let newP1 = p1, newP2 = p2;
    if (match.includes('className="')) {
      newP1 = p1.replace(/className="([^"]+)"/, `className="$1 \${isSaving ? 'opacity-60 cursor-not-allowed' : ''}"`);
      newP2 = p2.replace(/className="([^"]+)"/, `className="$1 \${isSaving ? 'opacity-60 cursor-not-allowed' : ''}"`);
    } else if (match.includes('className={`')) {
       newP1 = p1.replace(/className=\{`([^`]+)`\}/, `className={\`$1 \${isSaving ? 'opacity-60 cursor-not-allowed' : ''}\`}`);
       newP2 = p2.replace(/className=\{`([^`]+)`\}/, `className={\`$1 \${isSaving ? 'opacity-60 cursor-not-allowed' : ''}\`}`);
    }
    
    return `<button${newP1}onClick={handleSaveTheme} disabled={isSaving}${newP2}>${newInner}</button>`;
  });
  
  fs.writeFileSync(filePath, c);
  console.log('Patched theme-builder');
}

patchThemeBuilder();
