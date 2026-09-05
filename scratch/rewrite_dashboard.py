import re

with open('app/merchant/[slug]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add recharts import
import_recharts = "import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';\nimport { useMemo } from 'react';"
content = content.replace("import { useParams } from 'next/navigation';", f"import {{ useParams }} from 'next/navigation';\n{import_recharts}")

# Add Calendar icon import
content = content.replace("Plus, Bot, Eye, Sparkles, ExternalLink, Printer, ChevronLeft", "Plus, Bot, Eye, Sparkles, ExternalLink, Printer, ChevronLeft, Calendar, CalendarDays")

# Add date state
date_state = """
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'custom' | 'all'>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(o => {
      if (!o.createdAt) return true;
      const orderDate = new Date(o.createdAt);
      if (dateFilter === 'today') {
        return orderDate >= today;
      }
      if (dateFilter === 'week') {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        return orderDate >= lastWeek;
      }
      if (dateFilter === 'custom' && dateRange.start && dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        return orderDate >= new Date(dateRange.start) && orderDate <= end;
      }
      return true;
    });
  }, [orders, dateFilter, dateRange]);

  const chartData = useMemo(() => {
    const dataByDate: Record<string, number> = {};
    filteredOrders.forEach(o => {
      if (o.status === 'cancelled') return;
      const d = o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      dataByDate[d] = (dataByDate[d] || 0) + o.total;
    });
    
    return Object.entries(dataByDate)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([date, total]) => ({
        date: new Date(date).toLocaleDateString('ar-YE', { month: 'short', day: 'numeric' }),
        total
      }));
  }, [filteredOrders]);
"""
content = content.replace("if (!store) return null;", f"if (!store) return null;\n{date_state}")

# Modify KPI calculations
content = content.replace("orders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0)", "filteredOrders.reduce((sum, o) => sum + (o.status !== 'cancelled' ? o.total : 0), 0)")
content = content.replace("orders.filter((o) => o.status === 'delivered').length", "filteredOrders.filter((o) => o.status === 'delivered').length")
content = content.replace("orders.filter((o) => o.status === 'new' || o.status === 'pending_payment' || o.status === 'processing').length", "filteredOrders.filter((o) => o.status === 'new' || o.status === 'pending_payment' || o.status === 'processing').length")

# Remove KPI 3 (Active Visitors) and make Grid 3 cols
content = content.replace("grid-cols-2 lg:grid-cols-4", "grid-cols-1 md:grid-cols-3")

kpi3_block = """        {/* KPI 3 */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">الزوار المتصلون الآن</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-sm sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>{store.activeVisitorsNow} متسوق</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">يتصفحون المتجر</div>
          </div>
        </div>"""
content = content.replace(kpi3_block, "")


date_filters_ui = """
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slateDark-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'today' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >اليوم</button>
            <button 
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'week' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >هذا الأسبوع</button>
            <button 
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${dateFilter === 'all' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >الكل</button>
            <button 
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${dateFilter === 'custom' ? 'bg-white dark:bg-slateDark-900 shadow-sm text-brand-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            ><Calendar className="w-3 h-3"/> مخصص</button>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))} className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none font-mono" />
              <span className="text-slate-400 text-xs">إلى</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))} className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none font-mono" />
            </div>
          )}
        </div>
        
        <Link
          href={`/merchant/${slug}/orders`}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>استعراض كل الطلبات</span>
        </Link>
      </div>

      {/* Chart Section */}
      <div className="bg-white dark:bg-slateDark-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">أداء المبيعات</h3>
          <p className="text-xs text-slate-500">حركة المبيعات خلال الفترة المحددة</p>
        </div>
        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} ${store.baseCurrency}`, 'المبيعات']}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="total" stroke="#0d9488" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
              <span className="text-xs mt-2">لا توجد بيانات مبيعات في هذه الفترة</span>
            </div>
          )}
        </div>
      </div>
"""

content = content.replace("      {/* KPI Cards Grid (2 cols on Mobile, 4 on Desktop) */}", date_filters_ui + "\n      {/* KPI Cards Grid */}")

content = content.replace("{orders.map((ord)", "{filteredOrders.slice(0, 5).map((ord)")

with open('app/merchant/[slug]/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
