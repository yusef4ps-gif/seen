const fs = require('fs');

// 1. Update app/page.tsx
let pageFile = fs.readFileSync('app/page.tsx', 'utf8');

// Add plans state
if (!pageFile.includes('const [plans, setPlans] = useState')) {
  pageFile = pageFile.replace(
    /const \[stores, setStores\] = useState<Store\[\]>\(\[\]\);/,
    "const [stores, setStores] = useState<Store[]>([]);\n  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);"
  );
  pageFile = pageFile.replace(
    /setStores\(storeEngine\.getStores\(\)\);/,
    "setStores(storeEngine.getStores());\n    setPlans(storeEngine.getPlans());"
  );
}

// Extract the pricing section
const startPattern = '{/* 3 Main Pricing Cards */}';
const endPattern = '</section>';
const startIndex = pageFile.indexOf(startPattern);
const tempString = pageFile.substring(startIndex);
const endSectionIndex = startIndex + tempString.indexOf(endPattern);

const dynamicPricingBlock = `{/* Dynamic Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {plans.filter(p => p.id !== 'free').map((plan) => {
              const isPro = plan.id === 'pro' || plan.id === 'vip' || plan.badge;
              
              return (
                <div key={plan.id} className={\`relative p-6 sm:p-8 rounded-3xl transition-all duration-300 flex flex-col justify-between \${
                  isPro 
                  ? 'bg-gradient-to-br from-[#0f2b48] via-[#0b1f35] to-[#061220] text-white border-2 border-[#2dd4bf] shadow-2xl shadow-[#14b8a6]/20' 
                  : 'bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-500/40 text-slate-900 dark:text-white'
                }\`}>
                  
                  {plan.badge && (
                    <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-accent text-white text-[11px] font-black shadow-lg shadow-accent/40 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{plan.badge}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className={\`text-xl font-bold flex items-center gap-2 \${isPro ? 'text-white' : 'text-slate-900 dark:text-white'}\`}>
                        <span>{plan.name}</span>
                        {isPro && <Crown className="w-4 h-4 text-amber-400" />}
                      </h3>
                      <p className={\`text-xs mt-1 \${isPro ? 'text-slate-300' : 'text-slate-500'}\`}>
                        {plan.nameAr || 'باقة مصممة لنمو أعمالك'}
                      </p>
                    </div>

                    <div className={\`py-3 border-y \${isPro ? 'border-slate-700' : 'border-slate-100 dark:border-slate-800'}\`}>
                      <div className={\`text-3xl font-black font-mono \${isPro ? 'text-white' : 'text-slate-900 dark:text-white'}\`}>
                        {plan.priceMonthlyUSD > 0 ? \`$\${plan.priceMonthlyUSD}\` : 'مجاناً'} <span className={\`text-xs font-normal \${isPro ? 'text-slate-300' : 'text-slate-500'}\`}>/ شهر</span>
                      </div>
                      <div className={\`text-xs font-bold mt-1 \${isPro ? 'text-accent' : 'text-slate-400'}\`}>
                        {plan.priceYearlyUSD > 0 ? \`أو $\${plan.priceYearlyUSD} سنوياً\` : 'بدون رسوم خفية'}
                      </div>
                    </div>

                    <Link
                      href="/create-store"
                      className={\`w-full py-3 rounded-2xl text-xs font-bold text-center block transition-all shadow-md \${
                        isPro 
                        ? 'bg-white hover:bg-slate-100 text-brand-900 font-black shadow-lg active:scale-95' 
                        : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-600/25'
                      }\`}
                    >
                      {isPro ? 'أنمو واشترك الآن 🌟' : 'ابدأ الآن 🚀'}
                    </Link>

                    <ul className={\`space-y-2.5 text-xs font-medium pt-2 \${isPro ? 'text-slate-200' : 'text-slate-700 dark:text-slate-300'}\`}>
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className={\`w-4 h-4 mt-0.5 shrink-0 \${isPro ? 'text-accent' : 'text-emerald-500'}\`} />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
          `;

if (startIndex !== -1 && endSectionIndex !== -1) {
  const newContent = pageFile.substring(0, startIndex) + dynamicPricingBlock + '\n        ' + pageFile.substring(endSectionIndex);
  fs.writeFileSync('app/page.tsx', newContent, 'utf8');
  console.log('Updated app/page.tsx successfully.');
} else {
  console.log('Could not find pricing block in app/page.tsx');
}


// 2. Update app/seenayhq7x/page.tsx
let hqFile = fs.readFileSync('app/seenayhq7x/page.tsx', 'utf8');
const hqStart = hqFile.indexOf('<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">');
if (hqStart !== -1) {
  const hqEnd = hqFile.indexOf('</div>\n                  </div>\n\n                  <div className="space-y-4 border-b', hqStart);
  if (hqEnd !== -1) {
    const endStr = '</div>';
    const finalEnd = hqEnd + endStr.length;
    const newHqContent = hqFile.substring(0, hqStart) + hqFile.substring(finalEnd);
    fs.writeFileSync('app/seenayhq7x/page.tsx', newHqContent, 'utf8');
    console.log('Updated app/seenayhq7x/page.tsx successfully.');
  } else {
    console.log('Could not find end of HQ pricing block.');
  }
} else {
  console.log('Could not find HQ pricing block.');
}
