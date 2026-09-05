const fs = require('fs');

const targetPath = 'app/merchant/[slug]/page.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// Remove the `if (!store) return null;` from the middle
content = content.replace(
  /\n  if \(\!store\) return null;\n\n  const \[dateFilter, setDateFilter\] = useState/,
  '\n\n  const [dateFilter, setDateFilter] = useState'
);

// Add it before the main return statement
content = content.replace(
  /  const lowStockCount = products.filter\(\(p\) => p\.stock <= \(p\.lowStockAlert \|\| 5\)\)\.length;\n\n  return \(/,
  '  const lowStockCount = products.filter((p) => p.stock <= (p.lowStockAlert || 5)).length;\n\n  if (!store) return null;\n\n  return ('
);

fs.writeFileSync(targetPath, content, 'utf8');
