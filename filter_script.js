const fs = require('fs');

let content = fs.readFileSync('app/merchant/[slug]/layout.tsx', 'utf8');

const idMapping = {
  'نظرة عامة والتحليلات': 'dashboard',
  'المنتجات والتصنيفات': 'products',
  'المخزون': 'inventory',
  'إدارة وتدقيق الطلبات': 'orders',
  'إدارة المرتجعات': 'returns',
  'الآراء والتقييمات': 'reviews',
  'استعادة السلات المتروكة': 'abandoned_carts',
  'قاعدة بيانات العملاء (CRM)': 'crm',
  'فريق العمل والصلاحيات': 'staff',
  'مستشار الذكاء الاصطناعي': 'ai_advisor',
  'تخصيص الواجهة والمحتوى': 'theme_builder',
  'إعدادات المتجر والمحافظ': 'settings',
  'الاشتراكات والباقات': 'subscription',
  'كوبونات التخفيض': 'coupons',
  'العروض الخاصة': 'offers',
  'التقارير': 'reports',
  'سجل الحركات (Audit)': 'audit'
};

for (const [title, id_val] of Object.entries(idMapping)) {
  content = content.replace(`title: '${title}'`, `id: '${id_val}', title: '${title}'`);
}

content = content.replace('const navItems = [', 'const allNavItems = [');

const filterLogic = `
  const storePlan = storeEngine.getPlans().find(p => p.id === store.planTier);
  const activeFeatures = storePlan?.features || [];
  const navItems = allNavItems.filter(item => activeFeatures.includes(item.id));
`;

if (content.includes('];\n\n  const [mobileMenuOpen')) {
  content = content.replace('];\n\n  const [mobileMenuOpen', '];\n' + filterLogic + '\n  const [mobileMenuOpen');
} else if (content.includes('];\n\n  const [isSidebarOpen')) {
  content = content.replace('];\n\n  const [isSidebarOpen', '];\n' + filterLogic + '\n  const [isSidebarOpen');
} else {
  // Find where the array ends
  const parts = content.split('  ];\n');
  if (parts.length > 1) {
    content = parts[0] + '  ];\n' + filterLogic + '\n' + parts.slice(1).join('  ];\n');
  }
}

fs.writeFileSync('app/merchant/[slug]/layout.tsx', content);
console.log('Successfully updated layout.tsx');
