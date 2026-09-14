const fs = require('fs');

let content = fs.readFileSync('app/store/[slug]/page.tsx', 'utf8');

// 1. Add storeType reading around line 245
if (!content.includes('const storeType = parsedThemeConfigForType')) {
  const replacement1 = `
  const parsedThemeConfigForType = React.useMemo(() => {
    if (!store?.themeConfig) return {};
    try { return typeof store.themeConfig === 'string' ? JSON.parse(store.themeConfig) : store.themeConfig; } catch { return {}; }
  }, [store?.themeConfig]);
  const storeType = parsedThemeConfigForType.storeType || 'PHYSICAL';
  
  const [customerEmail, setCustomerEmail] = useState('');
`;
  content = content.replace(`  const [customerEmail, setCustomerEmail] = useState('');`, replacement1);
}

// 2. Patch shipping cost calculation
content = content.replace(
  `const selectedShipping = store.shippingMethods.find(m => m.isActive && (deliveryType === 'pickup' ? m.isPickup : !m.isPickup));`,
  `const selectedShipping = storeType === 'DIGITAL' ? null : store.shippingMethods.find(m => m.isActive && (deliveryType === 'pickup' ? m.isPickup : !m.isPickup));`
);

content = content.replace(
  `let shippingCostConverted = deliveryType === 'pickup' ? 0 : (selectedShipping?.cost || 3000);`,
  `let shippingCostConverted = storeType === 'DIGITAL' ? 0 : (deliveryType === 'pickup' ? 0 : (selectedShipping?.cost || 3000));`
);

// 3. Patch checkout payload
content = content.replace(
  `city: city || store.city,`,
  `city: storeType === 'DIGITAL' ? 'تسليم رقمي' : (city || store.city),`
);
content = content.replace(
  `address: deliveryType === 'pickup' ? 'استلام من الفرع' : address,`,
  `address: storeType === 'DIGITAL' ? 'تسليم إلكتروني (لا يوجد عنوان)' : (deliveryType === 'pickup' ? 'استلام من الفرع' : address),`
);
content = content.replace(
  `deliveryType,`,
  `deliveryType: storeType === 'DIGITAL' ? 'digital' : deliveryType,`
);

// 4. Hide Delivery section
const deliveryRegex = /<div className="font-bold text-slate-900 dark:text-white text-xs">[\s\S]*?1\. معلومات الاستلام والتوصيل:[\s\S]*?<\/div>[\s\S]*?<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">/g;

content = content.replace(deliveryRegex, match => {
  if (match.includes('{storeType !== \'DIGITAL\' && (')) return match;
  return match.replace(
    `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">`,
    `{storeType !== 'DIGITAL' && (\n                  <>\n                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">`
  );
});

// Close the tag after the address block
const addressEndRegex = /<\/div>\n\s*\)\}\n\s*<\/div>/g;
if (content.match(addressEndRegex)) {
  content = content.replace(addressEndRegex, `</div>\n                )}\n                  </>\n                )}\n              </div>`);
}

// 5. Filter payment methods
content = content.replace(
  `{store.paymentAccounts.filter(a => a.isActive).map((acc) => (`,
  `{store.paymentAccounts.filter(a => a.isActive && !(storeType === 'DIGITAL' && a.type === 'cod')).map((acc) => (`
);


fs.writeFileSync('app/store/[slug]/page.tsx', content, 'utf8');
console.log('Patched storefront successfully.');
