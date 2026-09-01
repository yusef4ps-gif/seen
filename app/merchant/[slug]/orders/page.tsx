'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  ShoppingBag, Search, Filter, Eye, CheckCircle2, 
  Clock, AlertTriangle, Printer, Phone, MessageSquare, 
  X, Check, DollarSign, Image as ImageIcon, ArrowLeft
} from 'lucide-react';
import { Store, Order, OrderStatus } from '@/lib/types';
import { getStoreBySlugAction, getOrdersByStoreAction } from '@/app/actions/store';
import { updateOrderStatusAction, verifyPaymentProofAction } from '@/app/actions/order';
import { formatCurrency } from '@/lib/currency-engine';

export default function MerchantOrdersPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Order for detail / receipt inspection / printing
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printFormat, setPrintFormat] = useState<'80mm' | 'A4'>('80mm');

  const loadOrders = async (storeId: string) => {
    const ords = await getOrdersByStoreAction(storeId);
    setOrders(ords as any);
    if (selectedOrder) {
      setSelectedOrder(ords.find((o: any) => o.id === selectedOrder.id) || null);
    }
  };

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          await loadOrders(s.id);
        }
      }
    }
    init();
  }, [slug]);

  const refreshOrders = async () => {
    if (store) {
      await loadOrders(store.id);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    await updateOrderStatusAction(orderId, newStatus);
    await refreshOrders();
  };

  const handleVerifyProof = async (orderId: string, status: 'verified' | 'rejected') => {
    await verifyPaymentProofAction(orderId, status);
    setIsReceiptModalOpen(false);
    await refreshOrders();
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!store) return null;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand-600" />
            <span>إدارة ومعالجة الطلبات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            متابعة دورة حياة الطلبات، تدقيق إشعارات التحويل، وطباعة الفواتير الحرارية
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-3">
        
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-3">
          {[
            { id: 'all', label: 'كافة الطلبات', count: orders.length },
            { id: 'pending_payment', label: 'بانتظار التحويل', count: orders.filter(o => o.status === 'pending_payment').length },
            { id: 'new', label: 'جديدة', count: orders.filter(o => o.status === 'new').length },
            { id: 'processing', label: 'قيد التجهيز', count: orders.filter(o => o.status === 'processing').length },
            { id: 'shipped', label: 'تم الشحن', count: orders.filter(o => o.status === 'shipped').length },
            { id: 'delivered', label: 'مكتملة', count: orders.filter(o => o.status === 'delivered').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث برقم الطلب، اسم العميل، أو الهاتف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">رقم الطلب والتاريخ</th>
                <th className="py-3 px-4">العميل والهاتف</th>
                <th className="py-3 px-4">طريقة الدفع والإشعار</th>
                <th className="py-3 px-4">قيمة الطلب</th>
                <th className="py-3 px-4">حالة الطلب</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  
                  {/* Order Number & Date */}
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    <div>{order.orderNumber}</div>
                    <div className="text-[10px] text-slate-400 font-sans font-normal">
                      {new Date(order.createdAt).toLocaleDateString('ar-YE', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{order.customerName}</div>
                    <div className="text-[10px] text-slate-500 font-mono" dir="ltr">{order.customerPhone}</div>
                  </td>

                  {/* Payment & Receipt */}
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {order.paymentMethod === 'kuraimi' ? 'الكريمي (حاسب)' :
                       order.paymentMethod === 'jawali' ? 'محفظة جوالي' :
                       order.paymentMethod === 'onecash' ? 'محفظة ون كاش' :
                       order.paymentMethod === 'floosak' ? 'محفظة فلوسك' :
                       order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : order.paymentMethod}
                    </div>

                    {order.paymentProofUrl && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsReceiptModalOpen(true);
                        }}
                        className={`mt-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          order.paymentProofStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                        }`}
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>{order.paymentProofStatus === 'verified' ? 'تم تدقيق الإشعار ✓' : 'تدقيق إشعار التحويل ⚠️'}</span>
                      </button>
                    )}
                  </td>

                  {/* Total */}
                  <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(order.total, order.currency)}
                  </td>

                  {/* Status Dropdown */}
                  <td className="py-3.5 px-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border outline-none ${
                        order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400' :
                        order.status === 'processing' ? 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-400' :
                        order.status === 'pending_payment' ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400' :
                        'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <option value="pending_payment">بانتظار التحويل</option>
                      <option value="new">طلب جديد</option>
                      <option value="processing">قيد التجهيز</option>
                      <option value="shipped">تم الشحن</option>
                      <option value="delivered">تم التسليم بنجاح</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      
                      {/* View Details */}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                        title="تفاصيل الطلب"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* WhatsApp Direct */}
                      <a
                        href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً أخي/أختي ${order.customerName}، بخصوص طلبك رقم ${order.orderNumber} من متجر ${store.name}...`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title="مراسلة عبر WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>

                      {/* Print Invoice */}
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsPrintModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                        title="طباعة الفاتورة"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && !isReceiptModalOpen && !isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  تفاصيل الطلب #{selectedOrder.orderNumber}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {new Date(selectedOrder.createdAt).toLocaleString('ar-YE')}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              
              {/* Customer Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white">بيانات العميل والتوصيل:</div>
                <div className="text-slate-600 dark:text-slate-300">👤 <strong>الاسم:</strong> {selectedOrder.customerName}</div>
                <div className="text-slate-600 dark:text-slate-300 font-mono" dir="ltr">📞 <strong>الهاتف:</strong> {selectedOrder.customerPhone}</div>
                <div className="text-slate-600 dark:text-slate-300">📍 <strong>العنوان:</strong> {selectedOrder.city} - {selectedOrder.address}</div>
                {selectedOrder.notes && (
                  <div className="text-amber-600 dark:text-amber-400 pt-1">📝 <strong>ملاحظة:</strong> {selectedOrder.notes}</div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">المنتجات المطلوبة:</div>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover bg-white" />
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{item.productName}</div>
                        {item.variantName && (
                          <div className="text-[10px] text-slate-400">الخيار: {item.variantName}</div>
                        )}
                        <div className="text-[10px] text-slate-500">الكمية: {item.quantity} × {formatCurrency(item.price, selectedOrder.currency)}</div>
                      </div>
                    </div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(item.total, selectedOrder.currency)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total breakdown */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 space-y-1 font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-500">المجموع الفرعي:</span>
                  <span>{formatCurrency(selectedOrder.subtotal, selectedOrder.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">رسوم التوصيل:</span>
                  <span>{formatCurrency(selectedOrder.shippingCost, selectedOrder.currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>الإجمالي الكلي:</span>
                  <span>{formatCurrency(selectedOrder.total, selectedOrder.currency)}</span>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between gap-2">
              <button
                onClick={() => {
                  setIsPrintModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة</span>
              </button>

              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Payment Receipt Proof Modal */}
      {isReceiptModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تدقيق إشعار التحويل البنكي
              </h3>
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                <img 
                  src={selectedOrder.paymentProofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600'} 
                  alt="Receipt" 
                  className="w-full h-64 object-contain" 
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 space-y-1">
                <div><strong>العميل:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone})</div>
                <div><strong>طريقة التحويل:</strong> {selectedOrder.paymentMethod}</div>
                <div><strong>المبلغ المطلوب:</strong> {formatCurrency(selectedOrder.total, selectedOrder.currency)}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleVerifyProof(selectedOrder.id, 'verified')}
                  className="py-2.5 px-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد التحويل ✓</span>
                </button>
                <button
                  onClick={() => handleVerifyProof(selectedOrder.id, 'rejected')}
                  className="py-2.5 px-4 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>رفض الإشعار</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Printable Invoice Modal (A4 & 80mm POS Receipt) */}
      {isPrintModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between no-print">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  معاينة الفاتورة للطباعة
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintFormat('80mm')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg ${printFormat === '80mm' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  بوليصة 80mm حرارية
                </button>
                <button
                  onClick={() => setPrintFormat('A4')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg ${printFormat === 'A4' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  فاتورة A4 كاملة
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Invoice Printable View */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className={`printable-invoice bg-white text-black p-6 rounded-2xl border border-slate-200 ${printFormat === '80mm' ? 'max-w-[320px] mx-auto text-xs' : 'max-w-full text-sm'}`}>
                
                {/* Header */}
                <div className="text-center pb-4 border-b border-dashed border-slate-400 space-y-1">
                  <h2 className="text-lg font-black">{store.name}</h2>
                  <p className="text-[11px] text-slate-600">{store.address}</p>
                  <p className="text-[11px] font-mono">هاتف: {store.phone}</p>
                  <div className="pt-2 font-mono font-bold text-sm">فاتورة رقم: #{selectedOrder.orderNumber}</div>
                  <div className="text-[10px] text-slate-500">{new Date(selectedOrder.createdAt).toLocaleString('ar-YE')}</div>
                </div>

                {/* Customer info */}
                <div className="py-3 border-b border-dashed border-slate-400 space-y-0.5 text-xs">
                  <div><strong>العميل:</strong> {selectedOrder.customerName}</div>
                  <div><strong>الهاتف:</strong> {selectedOrder.customerPhone}</div>
                  <div><strong>العنوان:</strong> {selectedOrder.city} - {selectedOrder.address}</div>
                  <div><strong>الدفع:</strong> {selectedOrder.paymentMethod}</div>
                </div>

                {/* Items Table */}
                <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
                  <div className="font-bold text-xs">المنتجات:</div>
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div>
                        <div>{it.productName}</div>
                        <div className="text-[10px] text-slate-500">{it.quantity} × {it.price} {selectedOrder.currency}</div>
                      </div>
                      <div className="font-bold">{it.total} {selectedOrder.currency}</div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="py-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>المجموع الفرعي:</span>
                    <span>{selectedOrder.subtotal} {selectedOrder.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>التوصيل:</span>
                    <span>{selectedOrder.shippingCost} {selectedOrder.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-1 border-t border-black">
                    <span>الإجمالي المستحق:</span>
                    <span>{selectedOrder.total} {selectedOrder.currency}</span>
                  </div>
                </div>

                <div className="text-center pt-4 text-[10px] text-slate-500 border-t border-dashed border-slate-400">
                  شكراً لتسوقكم معنا ✨ نتمنى لكم يوماً سعيداً!
                </div>

              </div>
            </div>

            {/* Print trigger button */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 no-print">
              <button
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>إرسال للطابعة الآن 🖨️</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
