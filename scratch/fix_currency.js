const fs = require('fs');
const targetPath = 'lib/currency-engine.ts';

let content = fs.readFileSync(targetPath, 'utf8');

const oldFormatCode = `  const isWhole = currencyCode.startsWith('YER');
  const formattedNum = new Intl.NumberFormat('ar-YE', {
    maximumFractionDigits: isWhole ? 0 : 2,
    minimumFractionDigits: isWhole ? 0 : 2,
  }).format(amount);`;

const newFormatCode = `  const formattedNum = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);`;

content = content.replace(oldFormatCode, newFormatCode);

fs.writeFileSync(targetPath, content, 'utf8');
