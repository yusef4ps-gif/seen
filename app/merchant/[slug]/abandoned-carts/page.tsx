'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  ShoppingCart, MessageSquare, Sparkles, Clock, 
  ArrowLeft, CheckCircle2, DollarSign, Send, Ticket
} from 'lucide-react';
import { Store, AbandonedCart } from '@/lib/types';
import { formatCurrency } from '@/lib/currency-engine';
import { getStoreBySlugAction } from '@/app/actions/store';

export default function MerchantAbandonedCartsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
        // Realistic mock abandoned carts for demo
        setCarts([
          {
            id: 'cart-1',
            storeId: s.id,
            customerName: 'أميرة عبد الله',
            customerPhone: '+967 774 556 778',
            items: [
              {
                productId: 'prod-1',
                productName: 'فستان حرير ملكي بتطريز يدوي فاخر',
                productImage: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=200',
                price: 180,
                quantity: 1,
                total: 180,
              },
            ],
            total: 180,
            currency: 'SAR',
            abandonedAt: new Date(Date.now() - 3600000 * 3).toISOString(), // 3 hours ago
            recovered: false,
          },
          {
            id: 'cart-2',
            storeId: s.id,
            customerName: 'ياسر محمد صالح',
            customerPhone: '+967 735 990 112',
            items: [
              {
                productId: 'prod-3',
                productName: 'حقيبة يد جلد إيطالي فاخر',
                productImage: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=200',
                price: 95,
                quantity: 1,
                total: 95,
              },
            ],
            total: 95,
            currency: 'SAR',
            abandonedAt: new Date(Date.now() - 3600000 * 8).toISOString(), // 8 hours ago
            recovered: false,
          }
        ]);
      }
    }
    }
    init();
  }, [slug]);

  if (!store) return null;

  const generateRecoveryMessage = (cart: AbandonedCart) => {
    const itemsList = cart.items.map(i => i.productName).join(' و ');
    
    let text = `مرحباً ${cart.customerName || 'عزيزنا العميل'} ✨\n`;
    text += `لاحظنا أنك تركت سلة مشترياتك في متجر *${store.name}* وتحتوي على (${itemsList}).\n\n`;

    if (discountPercent > 0) {
      const discountedTotal = Math.round(cart.total * (1 - discountPercent / 100));
      text += `🎁 تقديراً لاهتمامك، يسرنا إهداؤك كوبون خصم خاص بقيمة *${discountPercent}%*!\n`;
      text += `استخدم الكود التالي عند الدفع: *RECOVER${discountPercent}*\n`;
      text += `💰 الإجمالي بعد الخصم سيكون تقريباً: *${discountedTotal} ${cart.currency}*\n\n`;
      text += `لإتمام طلبك، اضغط الرابط التالي (يمكنك استخدام الكود أو المتابعة بدونه):\n`;
    } else {
      text += `هل واجهتك أي مشكلة أثناء الدفع؟ أو تحتاج مساعدة بخصوص المنتجات؟ نحن هنا للإجابة على استفساراتك! 💬\n\n`;
      text += `بإمكانك العودة لإتمام طلبك متى ما أحببت عبر الرابط التالي:\n`;
    }

    text += `http://localhost:3000/store/${store.slug}`;

    return encodeURIComponent(text);
  };

  const handleMarkRecovered = (cartId: string) => {
    setCarts(carts.map(c => c.id === cartId ? { ...c, recovered: true } : c));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-brand-600" />
            <span>استعادة السلات المتروكة (Abandoned Carts)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            إعادة استهداف الزبائن الذين أضافوا منتجات للسلة ولم يكملوا الطلب عبر رسائل WhatsApp مخصصة
          </p>
        </div>
      </div>

      {/* Recovery Offer Settings Strip */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-brand-50 to-teal-50 dark:from-brand-950/40 dark:to-teal-950/40 border border-brand-200 dark:border-brand-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              حافز الاستعادة التلقائي بالخصم التشجيعي
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              نسبة الخصم المقترحة لإقناع العميل بالعودة وإتمام الشراء فوراً:
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[0, 5, 10, 15, 20].map((pct) => (
            <button
              key={pct}
              onClick={() => setDiscountPercent(pct)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                discountPercent === pct
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {pct === 0 ? 'بدون خصم (نقاش)' : `خصم ${pct}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Abandoned Carts Table */}
      <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">العميل والهاتف</th>
                <th className="py-3 px-4">المنتجات في السلة</th>
                <th className="py-3 px-4">قيمة السلة</th>
                <th className="py-3 px-4">وقت المغادرة</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">إجراء الاستعادة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {carts.map((cart) => (
                <tr key={cart.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    <div>{cart.customerName || 'زائر المتجر'}</div>
                    <div className="text-[10px] text-slate-500 font-mono font-normal" dir="ltr">
                      {cart.customerPhone}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {cart.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        <span>{it.productName} ({it.quantity})</span>
                      </div>
                    ))}
                  </td>

                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {formatCurrency(cart.total, cart.currency)}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 flex items-center gap-1 mt-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(cart.abandonedAt).toLocaleTimeString('ar-YE', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      cart.recovered
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {cart.recovered ? 'تمت الاستعادة بنجاح ✓' : 'متروكة'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href={`https://wa.me/${cart.customerPhone.replace(/[^0-9]/g, '')}?text=${generateRecoveryMessage(cart)}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleMarkRecovered(cart.id)}
                        className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all text-[11px]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>إرسال عرض {discountPercent}% عبر WhatsApp</span>
                      </a>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
