const fs = require('fs');

let content = fs.readFileSync('app/store/[slug]/page.tsx', 'utf8');

const regex = /(<div className="grid grid-cols-1 sm:grid-cols-2 gap-[^"]*">[\s\S]*?<label className="block text-\[11px\] font-bold text-slate-600 dark:text-slate-400 mb-1">\s*المدينة[\s\S]*?\{deliveryType === 'delivery' && \([\s\S]*?<\/div>\n\s*\)\})/g;

content = content.replace(regex, match => {
  if (match.includes("{storeType !== 'DIGITAL' && (")) return match;
  return `{storeType !== 'DIGITAL' && (\n                  <>\n${match}\n                  </>\n                )}`;
});

fs.writeFileSync('app/store/[slug]/page.tsx', content, 'utf8');
console.log('Fixed UI block correctly.');
