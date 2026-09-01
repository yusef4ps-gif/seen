'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Settings, Wallet, RefreshCw, Truck, Store as StoreIcon, 
  Save, CheckCircle2, Plus, Trash2, Building2, Phone, MapPin, Image as ImageIcon
} from 'lucide-react';
import { storeEngine } from '@/lib/store-engine';
import { Store, CurrencyCode, PaymentAccountConfig, ShippingMethod } from '@/lib/types';

export default function MerchantSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'currencies' | 'shipping'>('general');
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

  useEffect(() => {
    if (slug) {
      const s = storeEngine.getStoreBySlug(slug);
      if (s) {
        setStore(s);
        setName(s.name);
        setDescription(s.description);
        setPhone(s.phone);
        setWhatsapp(s.whatsapp);
        setCity(s.city);
        setAddress(s.address);
        setLogo(s.logo);
        setBanner(s.banner);
        setBaseCurrency(s.baseCurrency);
        setCustomRates(s.customRates || { YER_ADEN: 1910, YER_SANAA: 535, SAR: 3.75, USD: 1 });
        setPaymentAccounts(s.paymentAccounts || []);
        setShippingMethods(s.shippingMethods || []);
      }
    }
  }, [slug]);

  if (!store) return null;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    storeEngine.updateStore(store.id, {
      name,
      description,
      phone,
      whatsapp,
      city,
      address,
      logo,
      banner,
      baseCurrency,
      customRates,
      paymentAccounts,
      shippingMethods,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTogglePayment = (id: string) => {
    setPaymentAccounts(
      paymentAccounts.map((acc) => (acc.id === id ? { ...acc, isActive: !acc.isActive } : acc))
    );
  };

  const handleUpdatePaymentField = (id: string, field: 'accountNumber' | 'accountName' | 'instructions', value: string) => {
    setPaymentAccounts(
      paymentAccounts.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
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
                  رابط شعار المتجر (Logo URL)
                </label>
                <input
                  type="url"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  رابط بانر المتجر (Banner URL)
                </label>
                <input
                  type="url"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payments & Wallets */}
        {activeTab === 'payments' && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                تفعيل حسابات المحافظ وطرق الدفع المحلية
              </h3>
              <p className="text-xs text-slate-500">
                أدخل أرقام حساباتك لتظهر للزبون مباشرة في شاشة الدفع مع تعليمات التحويل
              </p>
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
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{acc.name}</span>
                    </div>
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
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                خيارات الشحن والتوصيل المحلي
              </h3>
              <p className="text-xs text-slate-500">
                تحديد تكلفة ومدة التوصيل لزبائن المتجر
              </p>
            </div>

            <div className="space-y-3">
              {shippingMethods.map((m, idx) => (
                <div key={m.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                    <div className="text-[11px] text-slate-500">{m.estimatedDelivery}</div>
                  </div>
                  <div className="font-bold text-brand-600 dark:text-brand-400">
                    {m.cost === 0 ? 'مجاني / استلام فرع' : `${m.cost.toLocaleString()} ر.ي`}
                  </div>
                </div>
              ))}
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
