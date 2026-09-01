const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/admin/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // Base Layout
  { match: /bg-slate-950/g, replace: 'bg-slate-50 dark:bg-slateDark-950' },
  { match: /text-slate-100/g, replace: 'text-slate-800 dark:text-slate-100' },
  { match: /selection:bg-\[\#14b8a6\]/g, replace: 'selection:bg-brand-500' },
  
  // Headers & Cards base
  { match: /bg-slate-900\/95/g, replace: 'bg-white/95 dark:bg-slateDark-900/95' },
  { match: /bg-slate-900\/90/g, replace: 'bg-slate-50/90 dark:bg-slateDark-900/90' },
  { match: /bg-slate-900\/60/g, replace: 'bg-slate-50/60 dark:bg-slateDark-900/60' },
  { match: /bg-slate-900\/40/g, replace: 'bg-slate-50/40 dark:bg-slateDark-900/40' },
  { match: /bg-slate-900/g, replace: 'bg-white dark:bg-slateDark-900' },
  
  // Borders
  { match: /border-slate-800/g, replace: 'border-slate-200 dark:border-slateDark-800' },
  { match: /border-slate-700/g, replace: 'border-slate-200 dark:border-slateDark-700' },
  
  // Text colors
  { match: /text-white/g, replace: 'text-slate-900 dark:text-white' },
  { match: /text-slate-400/g, replace: 'text-slate-500 dark:text-slate-400' },
  { match: /text-slate-300/g, replace: 'text-slate-600 dark:text-slate-300' },
  { match: /text-slate-200/g, replace: 'text-slate-700 dark:text-slate-200' },
  
  // Custom brand colors replacement
  { match: /bg-\[\#0f2b48\]/g, replace: 'bg-brand-600 dark:bg-brand-900' },
  { match: /hover:bg-\[\#144b7a\]/g, replace: 'hover:bg-brand-700 dark:hover:bg-brand-800' },
  { match: /border-\[\#14b8a6\]\/30/g, replace: 'border-brand-200 dark:border-brand-800' },
  { match: /border-\[\#14b8a6\]\/40/g, replace: 'border-brand-200 dark:border-brand-800' },
  { match: /border-\[\#14b8a6\]/g, replace: 'border-brand-500 dark:border-brand-600' },
  { match: /text-\[\#5eead4\]/g, replace: 'text-brand-600 dark:text-brand-300' },
  { match: /text-\[\#2dd4bf\]/g, replace: 'text-brand-600 dark:text-brand-400' },
  { match: /bg-\[\#14b8a6\]\/20/g, replace: 'bg-brand-50 dark:bg-brand-950/40' },
  { match: /bg-\[\#14b8a6\]/g, replace: 'bg-brand-100 dark:bg-brand-900' },
  
  // Specific Button backgrounds
  { match: /bg-slate-800/g, replace: 'bg-slate-100 dark:bg-slateDark-800' },
  { match: /hover:bg-slate-700/g, replace: 'hover:bg-slate-200 dark:hover:bg-slateDark-700' },
  
  // Executive card gradient
  { match: /bg-gradient-to-r from-\[\#0f2b48\] via-\[\#091e33\] to-\[\#0f2b48\]/g, replace: 'bg-white dark:bg-slateDark-900' },
  
  // Table rows
  { match: /hover:bg-slate-800\/50/g, replace: 'hover:bg-slate-50 dark:hover:bg-slateDark-800/50' },
];

let newContent = content;
for (const rule of replacements) {
  newContent = newContent.replace(rule.match, rule.replace);
}

// Special fixes for where 'text-slate-900 dark:text-white' might conflict with actual hardcoded white text on buttons
newContent = newContent.replace(/text-slate-900 dark:text-white text-xs/g, 'text-white text-xs');
newContent = newContent.replace(/text-slate-900 dark:text-white transition-all/g, 'text-white transition-all');

fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated colors in app/admin/page.tsx');
