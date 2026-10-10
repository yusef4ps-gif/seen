const fs = require('fs');

let file = fs.readFileSync('app/page.tsx', 'utf8');

// Update imports
if (!file.includes('AVAILABLE_FEATURES')) {
  file = file.replace(
    /import { Store, SubscriptionPlan, PlatformStats } from '@\/lib\/types';/,
    "import { Store, SubscriptionPlan, PlatformStats, AVAILABLE_FEATURES } from '@/lib/types';"
  );
}

// Ensure content parsing for exchange rate
if (!file.includes('const usdYer')) {
  file = file.replace(
    /const isPro = plan.id === 'pro' \|\| plan.id === 'vip' \|\| plan.badge;/,
    `const isPro = plan.id === 'pro' || plan.id === 'vip' || plan.badge;
              
              const usdYer = parseInt(content['rate_usd_yer'] || '1910') || 1910;
              const sarYer = parseInt(content['rate_sar_yer'] || '535') || 535;
              const yerPrice = plan.priceMonthlyUSD * usdYer;
              const sarPrice = Math.round(yerPrice / sarYer);
              const yerPriceYearly = plan.priceYearlyUSD * usdYer;
              const sarPriceYearly = Math.round(yerPriceYearly / sarYer);`
  );
}

// Update Price display
file = file.replace(
  /\{plan\.priceMonthlyUSD > 0 \? \`\$\$\{plan\.priceMonthlyUSD\}\` : 'مجاناً'\} <span className=\{`text-xs font-normal \$\{isPro \? 'text-slate-300' : 'text-slate-500'\}`\}>\/ شهر<\/span>/,
  "{plan.priceMonthlyUSD > 0 ? yerPrice.toLocaleString() : 'مجاناً'} <span className={`text-xs font-normal ${isPro ? 'text-slate-300' : 'text-slate-500'}`}>{plan.priceMonthlyUSD > 0 ? `ر.ي / ${sarPrice.toLocaleString()} ر.س` : ''}</span>"
);

file = file.replace(
  /\{plan\.priceYearlyUSD > 0 \? \`أو \$\$\{plan\.priceYearlyUSD\} سنوياً\` : 'بدون رسوم خفية'\}/,
  "{plan.priceYearlyUSD > 0 ? `أو ${yerPriceYearly.toLocaleString()} ر.ي سنوياً` : 'بدون رسوم خفية'}"
);

// Update features text
file = file.replace(
  /<span>\{feature\}<\/span>/g,
  "<span>{AVAILABLE_FEATURES.find(f => f.id === feature)?.name || feature}</span>"
);

fs.writeFileSync('app/page.tsx', file, 'utf8');
console.log('Updated app/page.tsx completely.');
