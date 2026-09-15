const fs = require('fs');

const path = 'app/store/[slug]/track/[orderId]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add imports
if (!code.includes('requestOrderReturnAction')) {
  code = code.replace(
    'customerConfirmDeliveryAction } from \'@/app/actions/order\';',
    'customerConfirmDeliveryAction, requestOrderReturnAction } from \'@/app/actions/order\';'
  );
  
  if (!code.includes('RotateCcw')) {
    code = code.replace(
      'Receipt, CreditCard, MapPin, Phone, Package',
      'Receipt, CreditCard, MapPin, Phone, Package, RotateCcw, X'
    );
  }
}

// 2. Add State Variables
if (!code.includes('isReturnModalOpen')) {
  const stateHooks = `
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [selectedReturnItems, setSelectedReturnItems] = useState<any[]>([]);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  
  const handleOpenReturnModal = () => {
    if (!order || !order.items) return;
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    setSelectedReturnItems(items.map((it: any) => ({ ...it, selected: false })));
    setReturnReason('');
    setIsReturnModalOpen(true);
  };

  const handleToggleReturnItem = (idx: number) => {
    setSelectedReturnItems(prev => prev.map((it, i) => i === idx ? { ...it, selected: !it.selected } : it));
  };

  const handleSubmitReturn = async () => {
    const itemsToReturn = selectedReturnItems.filter(it => it.selected);
    if (itemsToReturn.length === 0) {
      alert('الرجاء اختيار منتج واحد على الأقل للاسترجاع');
      return;
    }
    
    setIsSubmittingReturn(true);
    const res = await requestOrderReturnAction({
      orderId: order!.id,
      reason: returnReason,
      items: itemsToReturn.map(it => ({ id: it.id, quantity: it.quantity })) // or allow changing quantity later
    });
    
    if (res.success) {
      alert('تم إرسال طلب الاسترجاع بنجاح');
      setIsReturnModalOpen(false);
      // Reload order to reflect new status
      const s = await getStoreBySlugAction(slug);
      if (s) {
        const o = await getOrderByIdAction(orderId, s.id);
        if (o && o.success) setOrder(o.order);
      }
    } else {
      alert(res.error || 'حدث خطأ أثناء إرسال الطلب');
    }
    setIsSubmittingReturn(false);
  };
`;

  code = code.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n' + stateHooks);
}

// 3. Add the UI Button (if status is delivered)
if (!code.includes('handleOpenReturnModal')) {
  // we will insert the button in the Actions section (near receipt or customerConfirmDelivery)
  // Let's find a good spot, maybe in the top Header next to "تفاصيل الطلب"
  // or bottom. Let's find "customerConfirmDelivery" button. Wait, is there one?
  // Let's insert the button at the bottom of the page or in the order summary.
  const buttonHtml = `
              {order.status === 'delivered' && (
                <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 flex flex-col items-center justify-center gap-3">
                  <p className="text-sm text-slate-500">هل يوجد مشكلة في الطلب؟</p>
                  <button
                    onClick={handleOpenReturnModal}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>طلب استرجاع المنتجات</span>
                  </button>
                </div>
              )}
`;
  // Insert it before {/* Invoice Totals */}
  code = code.replace('{/* Invoice Totals */}', buttonHtml + '\n              {/* Invoice Totals */}');
}

// 4. Add the Modal JSX at the end, before the last </div>
if (!code.includes('نافذة طلب الاسترجاع')) {
  const modalHtml = `
      {/* نافذة طلب الاسترجاع */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-brand-600" />
                طلب استرجاع
              </h3>
              <button 
                onClick={() => setIsReturnModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-3">اختر المنتجات المراد إرجاعها:</p>
                <div className="space-y-3">
                  {selectedReturnItems.map((it, idx) => (
                    <label key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700/50 cursor-pointer transition-colors">
                      <div className="pt-1">
                        <div className={\`w-5 h-5 rounded border flex items-center justify-center transition-colors \${it.selected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-700'}\`}>
                          {it.selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{it.productName || it.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">الكمية: {it.quantity}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">سبب الاسترجاع (اختياري)</label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="اكتب سبب رغبتك في إرجاع المنتجات..."
                  className="w-full h-24 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={isSubmittingReturn || !selectedReturnItems.some(it => it.selected)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmittingReturn ? 'جاري الإرسال...' : 'تأكيد الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}
`;
  // find last closing div
  const lastDivIndex = code.lastIndexOf('</div>\n  );\n}');
  if (lastDivIndex !== -1) {
    code = code.substring(0, lastDivIndex) + modalHtml + '\n' + code.substring(lastDivIndex);
  }
}

fs.writeFileSync(path, code);
console.log('Frontend patched!');
