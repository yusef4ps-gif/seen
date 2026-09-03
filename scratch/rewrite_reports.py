import re
import os

filepath = r"c:\Users\yusef\.gemini\antigravity-ide\scratch\SEEN\SEEN\app\merchant\[slug]\reports\page.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import getOrdersByStoreAction
content = content.replace("import { getStoreBySlugAction, getProductsByStoreAction } from '@/app/actions/store';",
                          "import { getStoreBySlugAction, getProductsByStoreAction, getOrdersByStoreAction } from '@/app/actions/store';")

# 2. Add orders state
content = content.replace("const [products, setProducts] = useState<Product[]>([]);",
                          "const [products, setProducts] = useState<Product[]>([]);\n  const [orders, setOrders] = useState<any[]>([]);")

# 3. Fetch orders
content = content.replace("const prods = await getProductsByStoreAction(s.id);\n          setProducts(prods as any);",
                          "const prods = await getProductsByStoreAction(s.id);\n          setProducts(prods as any);\n          const ords = await getOrdersByStoreAction(s.id);\n          setOrders(ords);")

# 4. Calculate dynamic stats right before return
stats_logic = """
  // Dynamic Calculations
  const totalSalesVolume = products.reduce((sum, p) => sum + (p.price * p.salesCount), 0);
  const netRevenue = totalSalesVolume * 0.75; // Assuming 25% cost/fees
  const totalOrdersCount = orders.length > 0 ? orders.filter(o => o.status === 'delivered' || o.status === 'processing').length : Math.floor(products.reduce((sum, p) => sum + p.salesCount, 0) / 2);
  const avgOrderValue = totalOrdersCount > 0 ? totalSalesVolume / totalOrdersCount : 0;

  // Dynamic Categories for Pie Chart
  const categorySales: Record<string, number> = {};
  products.forEach(p => {
    if (!categorySales[p.category]) categorySales[p.category] = 0;
    categorySales[p.category] += (p.price * p.salesCount);
  });
  
  const sortedCategories = Object.entries(categorySales).sort((a, b) => b[1] - a[1]);
  const totalCatSales = sortedCategories.reduce((sum, [_, val]) => sum + val, 0);
  
  const topCategories = sortedCategories.slice(0, 3).map(([name, val], idx) => {
    const colors = ['bg-brand-500', 'bg-purple-500', 'bg-amber-500'];
    return { name, color: colors[idx], perc: totalCatSales > 0 ? Math.round((val / totalCatSales) * 100) + '%' : '0%' };
  });
  
  const otherSales = sortedCategories.slice(3).reduce((sum, [_, val]) => sum + val, 0);
  if (otherSales > 0) {
    topCategories.push({ name: 'أخرى', color: 'bg-slate-300', perc: Math.round((otherSales / totalCatSales) * 100) + '%' });
  }

  return (
"""
content = content.replace("  return (\n    <div className=\"space-y-6 animate-fadeIn\">", stats_logic + "    <div className=\"space-y-6 animate-fadeIn\">")

# 5. Update KPI Overview with dynamic values
kpi_old = """      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المبيعات', value: formatCurrency(124500, store.baseCurrency), trend: '+15%' },
          { label: 'صافي الإيرادات', value: formatCurrency(38200, store.baseCurrency), trend: '+8%' },
          { label: 'متوسط قيمة الطلب', value: formatCurrency(450, store.baseCurrency), trend: '+2%' },
          { label: 'الطلبات المكتملة', value: '342 طلب', trend: '+12%' },
        ]"""
kpi_new = """      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المبيعات', value: formatCurrency(totalSalesVolume, store.baseCurrency), trend: '+15%' },
          { label: 'صافي الإيرادات (تقديري)', value: formatCurrency(netRevenue, store.baseCurrency), trend: '+8%' },
          { label: 'متوسط قيمة الطلب', value: formatCurrency(avgOrderValue, store.baseCurrency), trend: '+2%' },
          { label: 'الطلبات المكتملة', value: `${totalOrdersCount} طلب`, trend: '+12%' },
        ]"""
content = content.replace(kpi_old, kpi_new)

# 6. Update Pie chart rendering
pie_old = """              {[
                { name: 'إلكترونيات', color: 'bg-brand-500', perc: '45%' },
                { name: 'ملابس', color: 'bg-purple-500', perc: '30%' },
                { name: 'عطور', color: 'bg-amber-500', perc: '15%' },
                { name: 'أخرى', color: 'bg-slate-300', perc: '10%' }
              ].map((c, i) => ("""
pie_new = """              {topCategories.map((c, i) => ("""
content = content.replace(pie_old, pie_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done replacing.")
