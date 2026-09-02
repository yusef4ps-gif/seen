'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Settings, Wallet, RefreshCw, Truck, Store as StoreIcon, 
  Save, CheckCircle2, Plus, Trash2, Building2, Phone, MapPin, Image as ImageIcon,
  Target
} from 'lucide-react';
import { Store, CurrencyCode, PaymentAccountConfig, ShippingMethod } from '@/lib/types';
import { getStoreBySlugAction, updateStoreAction } from '@/app/actions/store';

export default function MerchantSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'currencies' | 'shipping' | 'marketing'>('general');
  const [isSaved, setIsSaved] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('SAR');
  const [customRates, setCustomRates] = useState({
    YER_ADEN: 1910,
    YER_SANAA: 535,
    SAR: 3.75,
    USD: 1,
  });
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccountConfig[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  
  const [marketingPixels, setMarketingPixels] = useState({
    meta: '',
    tiktok: '',
    snapchat: '',
    googleAds: '',
    googleAnalytics: '',
    x: '',
  });

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) {
          setStore(s as any);
          setName(s.name || '');
          setDescription(s.description || '');
          setPhone(s.phone);
          setWhatsapp(s.whatsapp || '');
          setCity(s.city || '');
          setAddress(s.address || '');
          setLogo(s.logo || '');
          setBanner(s.banner || '');
          setBaseCurrency(s.baseCurrency as any);
          setCustomRates(s.customRates || { YER_ADEN: 1910, YER_SANAA: 535, SAR: 3.75, USD: 1 });
          setPaymentAccounts(s.paymentAccounts || []);
          setShippingMethods(s.shippingMethods || []);
          if ((s as any).marketingPixels) {
            try {
              const parsed = JSON.parse((s as any).marketingPixels);
              setMarketingPixels(parsed);
            } catch (e) {
              // ignore
            }
          }
        }
      }
    }
    init();
  }, [slug]);

  if (!store) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store) return;
    
    await updateStoreAction(store.id, {
      name,
      description,
      phone,
      whatsapp,
      city,
      address,
      logo,
      banner,
      baseCurrency,
      customRates: JSON.stringify(customRates),
      paymentAccounts: JSON.stringify(paymentAccounts),
      shippingMethods: JSON.stringify(shippingMethods),
      marketingPixels: JSON.stringify(marketingPixels),
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTogglePayment = (id: string) => {
    setPaymentAccounts(
      paymentAccounts.map((acc) => (acc.id === id ? { ...acc, isActive: !acc.isActive } : acc))
    );
  };

  const handleUpdatePaymentField = (id: string, field: 'accountNumber' | 'accountName' | 'instructions' | 'name', value: string) => {
    setPaymentAccounts(
      paymentAccounts.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
  };

  const handleAddPaymentMethod = () => {
    const newName = prompt('أدخل اسم طريقة الدفع (مثال: محفظة كذا، بنك كذا):');
    if (!newName) return;
    const newId = `custom_${Date.now()}`;
    setPaymentAccounts([
      ...paymentAccounts,
      {
        id: newId,
        type: newId as any,
        name: newName,
        isActive: true,
        accountNumber: '',
        accountName: '',
        instructions: ''
      }
    ]);
  };

  const handleAddShippingMethod = () => {
    const newName = prompt('أدخل اسم شركة/منطقة التوصيل:');
    if (!newName) return;
    const newCostStr = prompt('أدخل تكلفة التوصيل (رقم، مثلا 500 أو 0 للمجاني):', '0');
    const newCost = parseFloat(newCostStr || '0') || 0;
    
    setShippingMethods([
      ...shippingMethods,
      {
        id: `ship_${Date.now()}`,
        name: newName,
        cost: newCost,
        estimatedDelivery: '1-2 أيام',
        isActive: true,
        isPickup: false
      }
    ]);
  };

  const handleRemovePaymentMethod = (id: string) => {
    if(confirm('هل أنت متأكد من حذف طريقة الدفع هذه؟')) {
      setPaymentAccounts(paymentAccounts.filter(acc => acc.id !== id));
    }
  };

  const handleRemoveShippingMethod = (id: string) => {
    if(confirm('هل أنت متأكد من حذف شركة التوصيل هذه؟')) {
      setShippingMethods(shippingMethods.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-600" />
            <span>إعدادات المتجر والهوية والمدفوعات</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            تخصيص الهوية البصرية، ربط المحافظ المحلية والكريمي، وإدارة أسعار الصرف الحية
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-6 py-2.5 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-md shadow-brand-600/25 flex items-center justify-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          <span>{isSaved ? 'تم حفظ الإعدادات بنجاح ✓' : 'حفظ التعديلات'}</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'general', label: 'الهوية العامة والمعلومات', icon: StoreIcon },
          { id: 'payments', label: 'المحافظ وطرق الدفع', icon: Wallet },
          { id: 'currencies', label: 'العملات وأسعار الصرف', icon: RefreshCw },
          { id: 'shipping', label: 'الشحن والتوصيل', icon: Truck },
          { id: 'marketing', label: 'التسويق والبكسلات', icon: Target },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {/* Tab 1: General Branding */}
        {activeTab === 'general' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              بيانات المتجر والهوية البصرية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم المتجر
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  المدينة / المحافظة
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نبذة تعريفية عن المتجر (Bio)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رقم الهاتف الرسمي
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رقم WhatsApp لاستقبال إشعارات الطلبات
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  شعار المتجر (Logo)
                </label>
                <div className="flex items-center gap-3">
                  {logo && logo.trim() !== '' && (
                    <img src={logo} className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0" alt="Logo" />
                  )}
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs font-bold">رفع شعار...</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setLogo(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  بانر المتجر (Banner)
                </label>
                <div className="flex items-center gap-3">
                  {banner && banner.trim() !== '' && (
                    <img src={banner} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0" alt="Banner" />
                  )}
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all bg-slate-50 dark:bg-slate-800 text-slate-500">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs font-bold">رفع بانر...</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setBanner(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payments & Wallets */}
        {activeTab === 'payments' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  تفعيل حسابات المحافظ وطرق الدفع المحلية
                </h3>
                <p className="text-xs text-slate-500">
                  أدخل أرقام حساباتك لتظهر للزبون مباشرة في شاشة الدفع مع تعليمات التحويل
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPaymentMethod}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة طريقة دفع</span>
              </button>
            </div>

            <div className="space-y-4">
              {paymentAccounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    acc.isActive
                      ? 'border-brand-300 dark:border-brand-800 bg-brand-50/30 dark:bg-brand-950/20'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 opacity-70'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {acc.id.startsWith('custom_') ? (
                        <input
                          type="text"
                          value={acc.name}
                          onChange={(e) => handleUpdatePaymentField(acc.id, 'name', e.target.value)}
                          className="font-bold text-xs bg-transparent border-b border-dashed border-slate-400 outline-none w-32 dark:text-white"
                        />
                      ) : (
                        <span className="font-bold text-xs text-slate-900 dark:text-white">{acc.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {acc.id.startsWith('custom_') && (
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentMethod(acc.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acc.isActive}
                          onChange={() => handleTogglePayment(acc.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
                      </label>
                    </div>
                  </div>

                  {acc.type !== 'cod' && acc.isActive && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          رقم الحساب / رقم المحفظة
                        </label>
                        <input
                          type="text"
                          value={acc.accountNumber}
                          onChange={(e) => handleUpdatePaymentField(acc.id, 'accountNumber', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          اسم صاحب الحساب
                        </label>
                        <input
                          type="text"
                          value={acc.accountName}
                          onChange={(e) => handleUpdatePaymentField(acc.id, 'accountName', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Currencies & Exchange Rates */}
        {activeTab === 'currencies' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                محرك العملات وأسعار الصرف الحية
              </h3>
              <p className="text-xs text-slate-500">
                حدد العملة الأساسية لتسعير منتجاتك، واضبط أسعار الصرف لحساب الأسعار المعروضة لزبائن عدن وصنعاء تلقائياً.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                العملة الأساسية لمتجرك
              </label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value as CurrencyCode)}
                className="w-full sm:w-64 px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
              >
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="YER_ADEN">ريال يمني - عدن (YER)</option>
                <option value="YER_SANAA">ريال يمني - صنعاء (YER)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3">
                أسعار الصرف المعتمدة مقابل الدولار الأمريكي ($1 USD =)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    سعر صرف ريال عدن (YER)
                  </label>
                  <input
                    type="number"
                    value={customRates.YER_ADEN}
                    onChange={(e) => setCustomRates({ ...customRates, YER_ADEN: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    سعر صرف ريال صنعاء (YER)
                  </label>
                  <input
                    type="number"
                    value={customRates.YER_SANAA}
                    onChange={(e) => setCustomRates({ ...customRates, YER_SANAA: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    سعر صرف الريال السعودي (SAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={customRates.SAR}
                    onChange={(e) => setCustomRates({ ...customRates, SAR: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Shipping Methods */}
        {activeTab === 'shipping' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  خيارات الشحن والتوصيل المحلي
                </h3>
                <p className="text-xs text-slate-500">
                  تحديد تكلفة ومدة التوصيل لزبائن المتجر
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddShippingMethod}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة شركة توصيل</span>
              </button>
            </div>

            <div className="space-y-3">
              {shippingMethods.map((m, idx) => (
                <div key={m.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                    <div className="text-[11px] text-slate-500">{m.estimatedDelivery}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-bold text-brand-600 dark:text-brand-400">
                      {m.cost === 0 ? 'مجاني / استلام فرع' : `${m.cost.toLocaleString()} ر.ي`}
                    </div>
                    {m.id.startsWith('ship_') && (
                      <button
                        type="button"
                        onClick={() => handleRemoveShippingMethod(m.id)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Tab 5: Marketing & Pixels */}
        {activeTab === 'marketing' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-600" />
                <span>الربط بكسلات والإعلانات</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                قم بربط متجرك مع منصات الإعلانات لتتبع التحويلات وزيارات العملاء بدقة.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Meta Pixel ID (فيسبوك وإنستغرام)</label>
                <input
                  type="text"
                  value={marketingPixels.meta}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, meta: e.target.value })}
                  placeholder="مثال: 123456789012345"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">TikTok Pixel ID</label>
                <input
                  type="text"
                  value={marketingPixels.tiktok}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, tiktok: e.target.value })}
                  placeholder="مثال: C123ABCD..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Snapchat Pixel ID</label>
                <input
                  type="text"
                  value={marketingPixels.snapchat}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, snapchat: e.target.value })}
                  placeholder="مثال: a1b2c3d4-..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Google Analytics (G-XXXX)</label>
                <input
                  type="text"
                  value={marketingPixels.googleAnalytics}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, googleAnalytics: e.target.value })}
                  placeholder="مثال: G-123456789"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">X (Twitter) Pixel ID</label>
                <input
                  type="text"
                  value={marketingPixels.x}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, x: e.target.value })}
                  placeholder="مثال: ab12c"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Google Ads (AW-XXXX)</label>
                <input
                  type="text"
                  value={marketingPixels.googleAds}
                  onChange={(e) => setMarketingPixels({ ...marketingPixels, googleAds: e.target.value })}
                  placeholder="مثال: AW-123456789"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/25 transition-all"
          >
            {isSaved ? 'تم حفظ التعديلات بنجاح ✓' : 'حفظ جميع الإعدادات'}
          </button>
        </div>

      </form>

    </div>
  );
}
