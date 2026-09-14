const fs = require('fs');

let content = fs.readFileSync('app/store/[slug]/page.tsx', 'utf8');

content = content.replace(
  `const [deliveryType: storeType === 'DIGITAL' ? 'digital' : deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');`,
  `const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');`
);

fs.writeFileSync('app/store/[slug]/page.tsx', content, 'utf8');
console.log('Fixed syntax error in array destructuring.');
