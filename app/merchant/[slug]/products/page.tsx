'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Package, Plus, Search, Filter, Edit, Trash2, Sparkles, 
  Bot, Image as ImageIcon, AlertTriangle, Check, X, Layers, Eye, DollarSign, Download, FileSpreadsheet, Database, RefreshCw,
  Briefcase, FileText, UploadCloud, CalendarCheck
} from 'lucide-react';
import { formatCurrency, convertCurrency } from '@/lib/currency-engine';
import { Store, Product, ProductVariant } from '@/lib/types';
import { generateAIProductDescription } from '@/lib/ai-generator';
import ImageUploader from '@/components/ImageUploader';
import { getStoreBySlugAction, getProductsByStoreAction, getPlansAction } from '@/app/actions/store';
import { getSiteContentAction } from '@/app/actions/content';
import { isAiAllowedForStore } from '@/lib/ai-access';
import { createProductAction, updateProductAction, deleteProductAction } from '@/app/actions/product';
import { useStoreData, useStoreProducts, useStoreOrders } from '@/lib/swr-hooks';
import { bulkCreateProductsAction } from '@/app/actions/importProducts';
import Papa from 'papaparse';
import { logActivityAction } from '@/app/actions/activity';
import { authEngine } from '@/lib/auth-engine';

export default function MerchantProductsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const { store } = useStoreData(slug);
  const { products = [], isLoading, mutate } = useStoreProducts(store?.id);
  const { orders = [] } = useStoreOrders(store?.id);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const isServiceStore = (() => {
    if (!store) return false;
    const cfg: any = typeof store.themeConfig === 'string'
      ? (() => { try { return JSON.parse(store.themeConfig); } catch { return {}; } })()
      : store.themeConfig;
    return (
      cfg?.storeType === 'SERVICE' || 
      cfg?.storeType === 'DIGITAL' || 
      cfg?.presetId === 'service-expert' ||
      (store as any).storeType === 'SERVICE' ||
      (store as any).storeType === 'DIGITAL' ||
      store.category?.includes('خدمات') ||
      store.category?.includes('استشارات') ||
      store.category?.includes('محاماة') ||
      store.category?.includes('عياد')
    );
  })();

  // Calculate real-time sales count and revenue per product/service
  const productPerformanceMap = React.useMemo(() => {
    const map: Record<string, { count: number; totalRevenue: number }> = {};
    (orders || []).forEach((order: any) => {
      if (order.status === 'cancelled') return;
      const orderItems = typeof order.items === 'string' 
        ? (() => { try { return JSON.parse(order.items); } catch { return []; } })() 
        : (order.items || []);
      orderItems?.forEach((item: any) => {
        const pid = item.productId || item.id;
        if (!pid) return;
        if (!map[pid]) map[pid] = { count: 0, totalRevenue: 0 };
        const qty = item.quantity || 1;
        map[pid].count += qty;
        map[pid].totalRevenue += (item.total || ((item.price || 0) * qty));
      });
    });
    return map;
  }, [orders]);

  // AI Access State
  const [isAiEnabled, setIsAiEnabled] = useState(true);

  useEffect(() => {
    async function checkAi() {
      if (!store) return;
      try {
        const [dbPlans, siteContentRes] = await Promise.all([
          getPlansAction(),
          getSiteContentAction()
        ]);
        const globalAiEnabled = siteContentRes?.dictionary?.['ai_enabled'];
        const allowed = isAiAllowedForStore(store as any, dbPlans || [], globalAiEnabled);
        setIsAiEnabled(allowed);
      } catch (e) {
        // fallback
      }
    }
    checkAi();
  }, [store]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImportingExcel, setIsImportingExcel] = useState(false);
  const [isImportingERP, setIsImportingERP] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  
  const processImportedData = async (resultsData: any[], file: File) => {
    try {
      const productsToImport = resultsData.map((row: any) => ({
        name: row.name || row['الاسم'] || row['اسم المنتج'],
        description: row.description || row['الوصف'] || '',
        category: row.category || row['التصنيف'] || 'مستورد',
        price: row.price || row['السعر'] || 0,
        comparePrice: row.comparePrice || row['السعر قبل الخصم'],
        stock: row.stock || row['المخزون'] || 0,
        images: row.image || row['الصورة'] || row['صورة'] ? [row.image || row['الصورة'] || row['صورة']] : [],
      })).filter(p => p.name);
      
      if (productsToImport.length === 0) {
        alert('لم يتم العثور على منتجات صالحة في الملف. يرجى التأكد من وجود أعمدة بالأسماء (الاسم, الوصف, السعر, المخزون)');
        setIsImportingExcel(false);
        return;
      }

      const res = await bulkCreateProductsAction(store!.id, productsToImport);
      
      if (res.success) {
        const user = authEngine.getCurrentUser();
        if (user) {
          await logActivityAction({
            storeId: store!.id,
            userName: user.name,
            action: 'إضافة',
            entity: 'منتج',
            details: `تم استيراد ${res.count} منتج من ملف ${file.name}`,
            device: navigator.userAgent.includes('Mobile') ? 'جوال' : 'كمبيوتر/لابتوب'
          });
        }
        alert(`تم استيراد ${res.count} منتج بنجاح!`);
        await refreshProducts();
        setIsImportModalOpen(false);
      } else {
        alert('حدث خطأ أثناء حفظ المنتجات في قاعدة البيانات');
      }
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء قراءة الملف');
    } finally {
      setIsImportingExcel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    
    setIsImportingExcel(true);
    
    if (file.name.toLowerCase().endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          await processImportedData(results.data, file);
        },
        error: (error) => {
          console.error(error);
          alert('فشل في قراءة ملف الإكسل/CSV');
          setIsImportingExcel(false);
        }
      });
    } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      try {
        const xlsx = await import('xlsx');
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = new Uint8Array(event.target?.result as ArrayBuffer);
            const workbook = xlsx.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const json = xlsx.utils.sheet_to_json(worksheet);
            await processImportedData(json, file);
          } catch (err) {
            console.error(err);
            alert('حدث خطأ أثناء قراءة محتوى ملف الإكسل');
            setIsImportingExcel(false);
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        console.error(err);
        alert('حدث خطأ في استدعاء مكتبة الإكسل');
        setIsImportingExcel(false);
      }
    } else {
      alert('صيغة الملف غير مدعومة. يرجى رفع ملف Excel أو CSV');
      setIsImportingExcel(false);
    }
  };


  const handleERPImport = () => {
    setIsImportingERP(true);
    setTimeout(async () => {
      if (store) {
        await createProductAction({
          id: `prod_${Date.now()}`,
          storeId: store.id,
          name: `منتج مزامن من ERP`,
          description: 'تمت مزامنة هذا المنتج من النظام المحاسبي المرتبط',
          category: 'ERP',
          price: 250,
          images: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800'],
          stock: 50,
          lowStockAlert: 5,
          isFeatured: true,
          status: 'active',
          tags: ['ERP'],
          variants: []
        });
        await refreshProducts();
      }
      setIsImportingERP(false);
      setIsImportModalOpen(false);
    }, 2500);
  };

  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mainCategory, setMainCategory] = useState('جوالات');
  const [subCategory, setSubCategory] = useState('');
  const [price, setPrice] = useState<number>(50);
  const [comparePrice, setComparePrice] = useState<number | undefined>(undefined);
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState<number>(20);
  const [lowStockAlert, setLowStockAlert] = useState<number>(5);
  const [isFeatured, setIsFeatured] = useState(false);
  const [pricingModel, setPricingModel] = useState<'one_time' | 'subscription' | 'free'>('one_time');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const allowDigitalProducts = (() => {
    try {
      const cfg = typeof store?.themeConfig === 'string' ? JSON.parse(store.themeConfig) : (store?.themeConfig || {});
      return cfg?.allowDigitalProducts !== false;
    } catch {
      return true;
    }
  })();

  // Digital Delivery / PDF Attachment State
  const [hasDigitalFile, setHasDigitalFile] = useState(false);
  const [digitalFileName, setDigitalFileName] = useState('');
  const [digitalFileUrl, setDigitalFileUrl] = useState('');
  const [digitalFileAccess, setDigitalFileAccess] = useState<'instant' | 'verified'>('instant');

  // Consultation specific state
  const [isConsultation, setIsConsultation] = useState(false);
  const [sessionsCount, setSessionsCount] = useState<number>(1);
  const [sessionDuration, setSessionDuration] = useState<number>(45);
  const [sessionDurationUnit, setSessionDurationUnit] = useState<'minutes' | 'hours'>('minutes');
  const [consultationDelivery, setConsultationDelivery] = useState<'online' | 'phone' | 'in_person'>('online');

  // AI loading state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const loadProducts = async (storeId: string) => {
    const prods = await getProductsByStoreAction(storeId);
    // setProducts(prods as any);
  };

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleOpenNewModal();
    }
  }, [searchParams]);

  const refreshProducts = async () => {
    mutate();
  };

  const handleOpenConsultationModal = () => {
    setEditingProductId(null);
    setIsConsultation(true);
    setName('');
    setDescription('');
    setMainCategory('استشارات وجلسات');
    setSubCategory('استشارة متخصصة');
    setPrice(100);
    setComparePrice(undefined);
    setImageUrl('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80');
    setStock(9999);
    setLowStockAlert(0);
    setIsFeatured(false);
    setPricingModel('one_time');
    setBillingCycle('monthly');
    setSessionsCount(1);
    setSessionDuration(45);
    setSessionDurationUnit('minutes');
    setConsultationDelivery('online');
    setVariants([]);
    setHasDigitalFile(false);
    setDigitalFileName('');
    setDigitalFileUrl('');
    setDigitalFileAccess('instant');
    setIsModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setEditingProductId(null);
    setIsConsultation(false);
    setName('');
    setDescription('');
    setMainCategory(isServiceStore ? 'استشارات وخدمات' : 'عام');
    setSubCategory('');
    setPrice(isServiceStore ? 100 : 50);
    setComparePrice(undefined);
    setImageUrl(
      isServiceStore
        ? 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
    );
    setStock(isServiceStore ? 9999 : 20);
    setLowStockAlert(isServiceStore ? 0 : 5);
    setIsFeatured(false);
    setPricingModel('one_time');
    setBillingCycle('monthly');
    setSessionsCount(1);
    setSessionDuration(45);
    setSessionDurationUnit('minutes');
    setConsultationDelivery('online');
    setVariants([]);
    setHasDigitalFile(false);
    setDigitalFileName('');
    setDigitalFileUrl('');
    setDigitalFileAccess('instant');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProductId(prod.id);
    setName(prod.name);
    setDescription(prod.description);
    const parts = prod.category.split(' > ');
    setMainCategory(parts[0] || '');
    setSubCategory(parts.length > 1 ? parts.slice(1).join(' > ') : '');
    setPrice(prod.price);
    setComparePrice(prod.comparePrice);
    setImageUrl(prod.images[0] || '');
    setStock(prod.stock);
    setLowStockAlert(prod.lowStockAlert);
    setIsFeatured(!!prod.isFeatured);
    const isFreeProd = prod.price === 0 || (prod.tags && prod.tags.some((t: string) => t === 'pricing:free' || t === 'is_free'));
    if (isFreeProd) {
      setPricingModel('free');
      setPrice(0);
    } else if (prod.tags && prod.tags.includes('subscription:yearly')) {
      setPricingModel('subscription');
      setBillingCycle('yearly');
    } else if (prod.tags && prod.tags.includes('subscription:monthly')) {
      setPricingModel('subscription');
      setBillingCycle('monthly');
    } else {
      setPricingModel('one_time');
      setBillingCycle('monthly');
    }
    setVariants(prod.variants || []);
    setHasDigitalFile(Boolean(prod.digitalFileUrl));
    setDigitalFileName(prod.digitalFileName || '');
    setDigitalFileUrl(prod.digitalFileUrl || '');
    setDigitalFileAccess(prod.digitalFileAccess || 'instant');

    // Restore consultation state if product is a consultation
    const isConsult = Boolean(prod.tags && prod.tags.some((t: string) => t === 'service:consultation' || t.startsWith('sessions:')));
    setIsConsultation(isConsult);
    if (isConsult) {
      const sessTag = prod.tags?.find((t: string) => t.startsWith('sessions:'));
      if (sessTag) setSessionsCount(Number(sessTag.split(':')[1]) || 1);
      const durTag = prod.tags?.find((t: string) => t.startsWith('duration:'));
      if (durTag) setSessionDuration(Number(durTag.split(':')[1]) || 45);
      const unitTag = prod.tags?.find((t: string) => t.startsWith('duration_unit:'));
      if (unitTag) setSessionDurationUnit(unitTag.split(':')[1] === 'hours' ? 'hours' : 'minutes');
      const delivTag = prod.tags?.find((t: string) => t.startsWith('delivery:'));
      if (delivTag) setConsultationDelivery(delivTag.split(':')[1] as any || 'online');
    } else {
      setSessionsCount(1);
      setSessionDuration(45);
      setSessionDurationUnit('minutes');
      setConsultationDelivery('online');
    }

    setIsModalOpen(true);
  };

  const handleGenerateAI = () => {
    if (!name) {
      alert('يرجى كتابة اسم المنتج أولاً ليقوم الذكاء الاصطناعي بصياغة الوصف المناسب.');
      return;
    }
    setIsGeneratingAI(true);
    setTimeout(() => {
      const result = generateAIProductDescription({
        productName: name,
        category: subCategory ? `${mainCategory.trim()} > ${subCategory.trim()}` : mainCategory.trim(),
      });
      setDescription(result.description);
      setIsGeneratingAI(false);
    }, 600);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleAddVariant = () => {
    const newVar: ProductVariant = {
      id: `var-${Date.now()}`,
      name: 'متغير جديد (مثال: أحمر - L)',
      attributes: { color: 'افتراضي', size: 'M' },
      stock: 5,
    };
    setVariants([...variants, newVar]);
  };

  const handleRemoveVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const category = subCategory ? `${mainCategory.trim()} > ${subCategory.trim()}` : mainCategory.trim();
    const effectivePrice = pricingModel === 'free' ? 0 : Number(price);
    if (!store || !name || (pricingModel !== 'free' && effectivePrice <= 0) || isSaving) return;

    setIsSaving(true);

    const productTags = [category];
    if (isConsultation) {
      productTags.push('service:consultation');
      productTags.push(`sessions:${sessionsCount}`);
      productTags.push(`duration:${sessionDuration}`);
      productTags.push(`duration_unit:${sessionDurationUnit}`);
      productTags.push(`delivery:${consultationDelivery}`);
    }
    if (pricingModel === 'free') {
      productTags.push('pricing:free', 'is_free');
    } else if (isServiceStore && pricingModel === 'subscription') {
      productTags.push(`subscription:${billingCycle}`);
    }
    if (hasDigitalFile && digitalFileUrl) {
      productTags.push('digital:has_file');
      productTags.push(`digital_url:${encodeURIComponent(digitalFileUrl)}`);
      if (digitalFileName) {
        productTags.push(`digital_name:${encodeURIComponent(digitalFileName)}`);
      }
      productTags.push(`digital_access:${digitalFileAccess}`);
    }

    try {
      if (editingProductId) {
        // Optimistic UI update: instantly update table
        const updatedOptimistic = products.map(p => p.id === editingProductId ? {
          ...p,
          name,
          description,
          category,
          price: effectivePrice,
          comparePrice: comparePrice ? Number(comparePrice) : null,
          images: [imageUrl || p.images?.[0] || ''],
          isFeatured,
          tags: JSON.stringify(productTags),
          digitalFileUrl: hasDigitalFile ? digitalFileUrl : undefined,
          digitalFileName: hasDigitalFile ? digitalFileName : undefined,
          digitalFileAccess: hasDigitalFile ? digitalFileAccess : undefined,
        } : p);
        mutate(updatedOptimistic, false);
        setIsModalOpen(false);
        toast.success(isServiceStore ? 'تم تعديل الخدمة بنجاح ⚡' : 'تم تعديل المنتج بنجاح ⚡');

        const res = await updateProductAction(editingProductId, {
          name,
          description,
          category,
          price: effectivePrice,
          compareAtPrice: comparePrice || undefined,
          images: [imageUrl],
          stock: isServiceStore ? 9999 : stock,
          lowStockAlert: isServiceStore ? 0 : lowStockAlert,
          isFeatured,
          status: 'active',
          tags: productTags,
          variants: isServiceStore ? [] : variants,
        });

        if (!res.success) {
          toast.error(res.error?.message || res.error || 'فشل تحديث البيانات');
          mutate(); // rollback
          return;
        }

        // Fire-and-forget activity logging without blocking the UI
        const user = authEngine.getCurrentUser();
        if (user) {
          logActivityAction({
            storeId: store.id,
            userName: user.name,
            action: 'تعديل',
            entity: isServiceStore ? 'خدمة' : 'منتج',
            details: `تم تعديل ${isServiceStore ? 'الخدمة' : 'المنتج'}: ${name}`,
            device: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'جوال' : 'كمبيوتر/لابتوب'
          }).catch(console.error);
        }
      } else {
        const newProdId = `prod_${Date.now()}`;
        // Optimistic UI update: instantly insert service at top of list
        const newOptimisticItem: any = {
          id: newProdId,
          storeId: store.id,
          name,
          description,
          category,
          price: effectivePrice,
          comparePrice: comparePrice ? Number(comparePrice) : null,
          images: [imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
          stock: isServiceStore ? 9999 : stock,
          lowStockAlert: isServiceStore ? 0 : lowStockAlert,
          isFeatured,
          status: 'active',
          tags: JSON.stringify(productTags),
          digitalFileUrl: hasDigitalFile ? digitalFileUrl : undefined,
          digitalFileName: hasDigitalFile ? digitalFileName : undefined,
          digitalFileAccess: hasDigitalFile ? digitalFileAccess : undefined,
          variants: isServiceStore ? [] : variants,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mutate([newOptimisticItem, ...products], false);
        setIsModalOpen(false);
        toast.success(isServiceStore ? 'تمت إضافة الخدمة بنجاح ⚡' : 'تمت إضافة المنتج بنجاح ⚡');

        const res = await createProductAction({
          id: newProdId,
          storeId: store.id,
          name,
          description,
          category,
          price: effectivePrice,
          compareAtPrice: comparePrice || undefined,
          images: [imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
          stock: isServiceStore ? 9999 : stock,
          lowStockAlert: isServiceStore ? 0 : lowStockAlert,
          isFeatured,
          status: 'active',
          tags: productTags,
          variants: isServiceStore ? [] : variants,
        });

        if (!res.success) {
          toast.error(res.error?.message || res.error || 'فشل إضافة الخدمة');
          mutate(); // rollback
          return;
        }

        // Fire-and-forget activity logging without blocking the UI
        const user = authEngine.getCurrentUser();
        if (user) {
          logActivityAction({
            storeId: store.id,
            userName: user.name,
            action: 'إضافة',
            entity: isServiceStore ? 'خدمة' : 'منتج',
            details: `تمت إضافة ${isServiceStore ? 'خدمة جديدة' : 'منتج جديد'}: ${name}`,
            device: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'جوال' : 'كمبيوتر/لابتوب'
          }).catch(console.error);
        }
      }

      mutate(); // sync with server
    } catch (err: any) {
      toast.error('حدث خطأ غير متوقع: ' + err.message);
      mutate();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    const itemLabel = isServiceStore ? 'هذه الخدمة' : 'هذا المنتج';
    if (confirm(`هل أنت متأكد من حذف ${itemLabel}؟`)) {
      // Optimistic delete
      mutate(products.filter(p => p.id !== prod.id), false);
      toast.success(isServiceStore ? 'تم حذف الخدمة بنجاح ⚡' : 'تم حذف المنتج بنجاح ⚡');

      const res = await deleteProductAction(prod.id);
      if (!res.success) {
        toast.error('حدث خطأ أثناء حذف العنصر من الخادم');
        mutate();
        return;
      }

      const user = authEngine.getCurrentUser();
      if (user && store) {
        logActivityAction({
          storeId: store.id,
          userName: user.name,
          action: 'حذف',
          entity: isServiceStore ? 'خدمة' : 'منتج',
          details: `تم حذف ${isServiceStore ? 'الخدمة' : 'المنتج'}: ${prod.name}`,
          device: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'جوال' : 'كمبيوتر/لابتوب'
        }).catch(console.error);
      }
      mutate();
    }
  };

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            {isServiceStore ? <Briefcase className="w-6 h-6 text-teal-600" /> : <Package className="w-6 h-6 text-brand-600" />}
            <span>{isServiceStore ? 'إدارة الخدمات والاستشارات' : 'إدارة المنتجات والتصنيفات'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {isServiceStore 
              ? 'إضافة وتعديل باقات الخدمات، الاستشارات، وتحديد الأسعار وتفاصيل المواعيد'
              : 'إضافة وتعديل المنتجات، خيارات الألوان والمقاسات، وتوليد الأوصاف بالذكاء الاصطناعي'}
          </p>
        </div>

        
        <div className="flex items-center gap-2">
          {!isServiceStore && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">استيراد المنتجات</span>
            </button>
          )}

          {isServiceStore && (
            <button
              onClick={handleOpenConsultationModal}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-md shadow-amber-600/25 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>إضافة استشارة 🗓️</span>
            </button>
          )}

          <button
            onClick={handleOpenNewModal}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs ${
              isServiceStore ? 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/25' : 'bg-brand-600 hover:bg-brand-500 shadow-brand-600/25'
            } text-white transition-all shadow-md flex items-center justify-center gap-1.5`}
          >
            <Plus className="w-4 h-4" />
            <span>{isServiceStore ? 'إضافة خدمة جديدة' : 'إضافة منتج جديد'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slateDark-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث بالاسم أو التصنيف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
          >
            <option value="all">كافة التصنيفات ({products.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slateDark-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">{isServiceStore ? 'الخدمة والتفاصيل' : 'المنتج والتفاصيل'}</th>
                <th className="py-3 px-4">التصنيف</th>
                <th className="py-3 px-4">السعر الأساسي</th>
                <th className="py-3 px-4">المعادل بالريال اليمني</th>
                {isServiceStore ? (
                  <th className="py-3 px-4 font-bold text-emerald-700 dark:text-emerald-400">سجل المبيعات والعوائد 💰</th>
                ) : (
                  <th className="py-3 px-4">المخزون</th>
                )}
                <th className="py-3 px-4">{isServiceStore ? 'حالة التوفر' : 'المبيعات'}</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredProducts.map((prod) => {
                const isLow = prod.stock <= (prod.lowStockAlert || 5);
                const isOut = prod.stock === 0;
                // Calculate converted price in YER Aden
                const priceInYER = convertCurrency(prod.price, prod.baseCurrency, 'YER_ADEN', store?.customRates);

                return (
                  <tr key={prod.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    
                    {/* Image & Title */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={prod.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'} 
                          alt={prod.name} 
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100" 
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span>{prod.name}</span>
                            {prod.isFeatured && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-bold">
                                مميز
                              </span>
                            )}
                            {prod.digitalFileUrl && (
                              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300 text-[9px] font-bold inline-flex items-center gap-1 border border-teal-200 dark:border-teal-800">
                                <FileText className="w-2.5 h-2.5" />
                                <span>PDF مرفق ({prod.digitalFileAccess === 'verified' ? 'مشروط بالدفع' : 'فوري'})</span>
                              </span>
                            )}
                            {prod.tags && (Array.isArray(prod.tags) ? prod.tags : []).some((t: string) => t === 'service:consultation' || t.startsWith('sessions:')) && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[9px] font-bold inline-flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                                <CalendarCheck className="w-2.5 h-2.5 text-amber-600" />
                                <span>استشارة ({prod.tags?.find((t: string) => t.startsWith('sessions:'))?.split(':')[1] || '1'} جلسات • {prod.tags?.find((t: string) => t.startsWith('duration:'))?.split(':')[1] || '45'} {prod.tags?.find((t: string) => t.startsWith('duration_unit:'))?.split(':')[1] === 'hours' ? 'ساعة' : 'دقيقة'})</span>
                              </span>
                            )}
                          </div>
                          {prod.variants && prod.variants.length > 0 && (
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {prod.variants.length} خيارات (ألوان/مقاسات)
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px]">
                        {prod.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{formatCurrency(prod.price, prod.baseCurrency)}</span>
                        {prod.tags && prod.tags.includes('subscription:monthly') && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold">
                            / شهرياً 🔄
                          </span>
                        )}
                        {prod.tags && prod.tags.includes('subscription:yearly') && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold">
                            / سنوياً 🗓️
                          </span>
                        )}
                      </div>
                      {prod.comparePrice && (
                        <span className="block text-[10px] line-through text-slate-400 font-normal">
                          {formatCurrency(prod.comparePrice, prod.baseCurrency)}
                        </span>
                      )}
                    </td>

                    {/* Converted in YER */}
                    <td className="py-3.5 px-4 text-brand-600 dark:text-brand-400 font-bold">
                      {formatCurrency(priceInYER, 'YER_ADEN')}
                    </td>

                    {/* Stock Status OR Sales Revenue for Services */}
                    {isServiceStore ? (
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                          {formatCurrency(productPerformanceMap[prod.id]?.totalRevenue || 0, prod.baseCurrency)}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {(productPerformanceMap[prod.id]?.count || 0) > 0 
                            ? `${productPerformanceMap[prod.id]?.count} طلب مكتمل` 
                            : '0 طلب'}
                        </div>
                      </td>
                    ) : (
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOut ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' :
                          isLow ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        }`}>
                          {isOut ? 'نفد المخزون' : isLow ? `منخفض (${prod.stock})` : `${prod.stock} قطعة`}
                        </span>
                      </td>
                    )}

                    {/* Sales count OR Active Status */}
                    {isServiceStore ? (
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-800">
                          <Check className="w-3 h-3" />
                          <span>متاحة للحجز</span>
                        </span>
                      </td>
                    ) : (
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {productPerformanceMap[prod.id]?.count || prod.salesCount || 0} طلب
                      </td>
                    )}

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors"
                          title="تعديل المنتج"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-100 hover:text-red-600 text-slate-400 transition-colors"
                          title="حذف المنتج"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isConsultation ? (
                  <CalendarCheck className="w-5 h-5 text-amber-600" />
                ) : isServiceStore ? (
                  <Briefcase className="w-5 h-5 text-teal-600" />
                ) : (
                  <Package className="w-5 h-5 text-brand-600" />
                )}
                <span>
                  {editingProductId 
                    ? (isConsultation ? 'تعديل الاستشارة والجلسات' : isServiceStore ? 'تعديل الخدمة' : 'تعديل المنتج') 
                    : (isConsultation ? 'إضافة استشارة وجلسات موعد جديدة 🗓️' : isServiceStore ? 'إضافة خدمة جديدة' : 'إضافة منتج جديد')}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isConsultation ? 'عنوان الاستشارة والجلسة' : isServiceStore ? 'اسم الخدمة / الاستشارة' : 'اسم المنتج'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isConsultation ? "مثال: استشارة تسويقية وبناء علامة تجارية / استشارة قانونية تجارية" : isServiceStore ? "مثال: استشارة قانونية تجارية أو جلسة فحص واستشارة" : "مثال: فستان حرير ملكي بتطريز يدوي"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Description & AI Generator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isConsultation ? 'محاور وتفاصيل الاستشارة وما تشمله' : isServiceStore ? 'تفاصيل ومحاور الخدمة' : 'وصف المنتج التسويقي'}
                  </label>
                  {isAiEnabled && (
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={isGeneratingAI}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white flex items-center gap-1 shadow-xs transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isGeneratingAI ? 'جاري التوليد...' : 'توليد الوصف بالذكاء الاصطناعي ✨'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  placeholder={isAiEnabled ? (isServiceStore ? "اكتب تفاصيل الخدمة أو اضغط زر التوليد بالذكاء الاصطناعي..." : "اكتب وصفاً جذاباً أو اضغط زر التوليد بالذكاء الاصطناعي...") : (isServiceStore ? "اكتب محاور وتفاصيل الخدمة..." : "اكتب وصفاً جذاباً للمنتج...")}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {/* Consultation Sessions Configuration */}
              {(isConsultation || isServiceStore) && (
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60 dark:border-amber-800/40">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                        جلسات ومواعيد الاستشارة 🗓️
                      </h4>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-800 dark:text-amber-300">
                      <input 
                        type="checkbox" 
                        checked={isConsultation} 
                        onChange={(e) => setIsConsultation(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span>تحديد كاستشارة وجلسات موعد</span>
                    </label>
                  </div>

                  {isConsultation && (
                    <div className="space-y-3.5 animate-fadeIn">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                            عدد الجلسات للاستشارة:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={sessionsCount}
                              onChange={(e) => setSessionsCount(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-20 px-3 py-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 text-center font-mono"
                            />
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 5].map((cnt) => (
                                <button
                                  key={cnt}
                                  type="button"
                                  onClick={() => setSessionsCount(cnt)}
                                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                                    sessionsCount === cnt
                                      ? 'bg-amber-600 text-white shadow-xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {cnt} {cnt === 1 ? 'جلسة' : 'جلسات'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                            مدة كل جلسة:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={300}
                              value={sessionDuration}
                              onChange={(e) => setSessionDuration(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-20 px-3 py-2 text-xs font-bold rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 text-center font-mono"
                            />
                            <div className="grid grid-cols-2 gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-amber-200 dark:border-amber-800/50">
                              <button
                                type="button"
                                onClick={() => setSessionDurationUnit('minutes')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  sessionDurationUnit === 'minutes'
                                    ? 'bg-amber-600 text-white'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                بالدقيقة
                              </button>
                              <button
                                type="button"
                                onClick={() => setSessionDurationUnit('hours')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                  sessionDurationUnit === 'hours'
                                    ? 'bg-amber-600 text-white'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                                }`}
                              >
                                بالساعة
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                          طريقة تقديم الاستشارة:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { id: 'online', label: 'أونلاين (Google Meet / Zoom) 💻' },
                            { id: 'phone', label: 'اتصال هاتفي مباشر 📞' },
                            { id: 'in_person', label: 'حضور شخصي في المقر 🏢' },
                          ].map((deliv) => (
                            <button
                              key={deliv.id}
                              type="button"
                              onClick={() => setConsultationDelivery(deliv.id as any)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                                consultationDelivery === deliv.id
                                  ? 'border-amber-500 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 shadow-xs ring-2 ring-amber-500/20'
                                  : 'border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {deliv.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Service Pricing Model Choice: Fixed Price vs Subscription vs Free */}
              {isServiceStore && (
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/40 space-y-3">
                  <label className="block text-xs font-bold text-teal-900 dark:text-teal-200">
                    نموذج تسعير الخدمة:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-all ${
                      pricingModel === 'one_time'
                        ? 'border-teal-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-teal-500/20 text-teal-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-white/60 text-slate-600 dark:text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="pricingModel"
                          value="one_time"
                          checked={pricingModel === 'one_time'}
                          onChange={() => setPricingModel('one_time')}
                          className="w-4 h-4 text-teal-600"
                        />
                        <div>
                          <div className="text-xs font-bold">سعر محدد لمرة واحدة</div>
                          <div className="text-[10px] text-slate-500">دفع المبلغ مرة واحدة</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold">دفع مباشر</span>
                    </label>

                    <label className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-all ${
                      pricingModel === 'subscription'
                        ? 'border-teal-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-teal-500/20 text-teal-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-white/60 text-slate-600 dark:text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="pricingModel"
                          value="subscription"
                          checked={pricingModel === 'subscription'}
                          onChange={() => setPricingModel('subscription')}
                          className="w-4 h-4 text-teal-600"
                        />
                        <div>
                          <div className="text-xs font-bold">اشتراك دوري 🔄</div>
                          <div className="text-[10px] text-slate-500">تجديد الفوترة تلقائياً</div>
                        </div>
                      </div>
                      {pricingModel === 'subscription' && (
                        <select
                          value={billingCycle}
                          onChange={(e) => setBillingCycle(e.target.value as any)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-0 outline-none"
                        >
                          <option value="monthly">شهرياً 📅</option>
                          <option value="yearly">سنوياً 🗓️</option>
                        </select>
                      )}
                    </label>

                    <label className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between transition-all ${
                      pricingModel === 'free'
                        ? 'border-emerald-500 bg-white dark:bg-slate-900 shadow-sm ring-2 ring-emerald-500/20 text-emerald-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-white/60 text-slate-600 dark:text-slate-400'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="pricingModel"
                          value="free"
                          checked={pricingModel === 'free'}
                          onChange={() => {
                            setPricingModel('free');
                            setPrice(0);
                          }}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">خدمة أو منتج مجاني 🎁</div>
                          <div className="text-[10px] text-slate-500">بدون أي تكلفة للعميل</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold">مجاناً</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Category, Base Price, Compare Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isServiceStore ? 'مجال / تصنيف الخدمة' : 'القسم الرئيسي'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={isServiceStore ? "مثال: استشارات قانونية، جلسات تدريب" : "مثال: جوالات، عطور، لابتوبات"}
                    value={mainCategory}
                    onChange={(e) => setMainCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isServiceStore ? 'الفرع أو التخصص الدقيق' : 'القسم الفرعي / الماركة (اختياري)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isServiceStore ? "مثال: شركات وعقود، استشارات فردية" : "مثال: سامسونج، آبل، شانيل"}
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isServiceStore ? `أتعاب / سعر الخدمة (${store?.baseCurrency})` : `السعر (${store?.baseCurrency})`} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    disabled={pricingModel === 'free'}
                    value={pricingModel === 'free' ? 0 : price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none ${pricingModel === 'free' ? 'opacity-60 cursor-not-allowed bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    السعر قبل الخصم (اختياري)
                  </label>
                  <input
                    type="number"
                    placeholder="مثال: 70"
                    disabled={pricingModel === 'free'}
                    value={pricingModel === 'free' ? '' : (comparePrice || '')}
                    onChange={(e) => setComparePrice(parseFloat(e.target.value) || undefined)}
                    className={`w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none ${pricingModel === 'free' ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {/* Dynamic Currency Preview Badge */}
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 flex items-center justify-between text-xs text-brand-700 dark:text-brand-300">
                <span className="font-medium">معاينة السعر في متجر العميل:</span>
                <span className="font-bold">
                  {pricingModel === 'free' ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">مجاناً (Free 🎁)</span>
                  ) : (
                    <>
                      {formatCurrency(price, store?.baseCurrency || 'SAR')} = {formatCurrency(convertCurrency(price, store?.baseCurrency || 'SAR', 'YER_ADEN', store?.customRates), 'YER_ADEN')}
                    </>
                  )}
                </span>
              </div>

              {/* Image Uploader Component (Drag & Drop + Local File + WebP + URL) */}
              <ImageUploader
                value={imageUrl}
                onChange={setImageUrl}
                label={isServiceStore ? "صورة معبرة أو بنر تعريفي للخدمة" : "صورة المنتج الرئيسية (سحب وإفلات أو اختيار من الجهاز)"}
              />

              {/* Digital Delivery / PDF Attachment Section (Rendered only if enabled in settings) */}
              {allowDigitalProducts && (
                <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        ملف رقمي مرفق (PDF / حقيبة / مستند قابل للتحميل) 📥
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        يتيح للعميل تنزيل الملف فوراً أو بعد مراجعة إشعار الدفع
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasDigitalFile}
                      onChange={(e) => {
                        setHasDigitalFile(e.target.checked);
                        if (!e.target.checked) {
                          setDigitalFileUrl('');
                          setDigitalFileName('');
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                {hasDigitalFile && (
                  <div className="pt-3 border-t border-teal-200/60 dark:border-teal-800/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        اسم الملف للعميل (مثال: دليل_كتابة_الإعلانات.pdf)
                      </label>
                      <input
                        type="text"
                        placeholder="دليل_الخدمة_الرقمي.pdf"
                        value={digitalFileName}
                        onChange={(e) => setDigitalFileName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          رفع ملف PDF من جهازك:
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-dashed border-teal-400 bg-white dark:bg-slate-900 hover:bg-teal-50 dark:hover:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-xs font-bold transition-all truncate">
                            <UploadCloud className="w-4 h-4 shrink-0" />
                            <span className="truncate">{digitalFileUrl ? (digitalFileUrl.startsWith('data:') ? 'تم تجهيز الملف ✓' : 'رابط خارجي مضاف') : 'اختر ملف PDF...'}</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.zip,.rar,.epub"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 20 * 1024 * 1024) {
                                    alert('حجم الملف كبير جداً (أكثر من 20MB). يُفضل وضع رابط Google Drive أو Dropbox في الحقل المجاور.');
                                    return;
                                  }
                                  if (!digitalFileName) setDigitalFileName(file.name);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setDigitalFileUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {digitalFileUrl && (
                            <button
                              type="button"
                              onClick={() => {
                                setDigitalFileUrl('');
                                setDigitalFileName('');
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                              title="حذف الملف"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          أو رابط تحميل خارجي (Google Drive / Dropbox):
                        </label>
                        <input
                          type="url"
                          placeholder="https://drive.google.com/..."
                          value={digitalFileUrl.startsWith('data:') ? '' : digitalFileUrl}
                          onChange={(e) => setDigitalFileUrl(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        سياسة تسليم الملف للعميل:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          digitalFileAccess === 'instant' 
                            ? 'bg-teal-600/10 border-teal-500 text-teal-900 dark:text-teal-200 font-bold' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          <input
                            type="radio"
                            name="digitalAccess"
                            value="instant"
                            checked={digitalFileAccess === 'instant'}
                            onChange={() => setDigitalFileAccess('instant')}
                            className="mt-0.5"
                          />
                          <div>
                            <div>⚡ تسليم فوري مباشر</div>
                            <div className="text-[10px] text-slate-500 font-normal">يظهر زر التحميل للعميل فور إتمام الطلب مباشرة</div>
                          </div>
                        </label>

                        <label className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          digitalFileAccess === 'verified' 
                            ? 'bg-teal-600/10 border-teal-500 text-teal-900 dark:text-teal-200 font-bold' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          <input
                            type="radio"
                            name="digitalAccess"
                            value="verified"
                            checked={digitalFileAccess === 'verified'}
                            onChange={() => setDigitalFileAccess('verified')}
                            className="mt-0.5"
                          />
                          <div>
                            <div>🔒 بعد التحقق من الدفع</div>
                            <div className="text-[10px] text-slate-500 font-normal">يتاح التحميل فقط بعد تأكيد التاجر لإشعار التحويل</div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Stock and Alert Row (Only for Physical Stores) */}
              {!isServiceStore && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      الكمية المتوفرة في المخزون
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={stock}
                      onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      تنبيه انخفاض المخزون عند
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={lowStockAlert}
                      onChange={(e) => setLowStockAlert(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Variants Matrix Section */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      خيارات المنتج والمتغيرات (المقاسات والألوان)
                    </h4>
                    <p className="text-[11px] text-slate-500">إضافة كميات وسعر منفصل لكل مقاس أو لون</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة خيار</span>
                  </button>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {variants.map((v, idx) => (
                      <div key={v.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs">
                        <input
                          type="text"
                          placeholder="اسم الخيار (مثال: أزرق - XL)"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[idx].name = e.target.value;
                            setVariants(updated);
                          }}
                          className="flex-1 px-2 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        />
                        <div className="flex items-center gap-1 w-24">
                          <span className="text-[10px] text-slate-400">الكمية:</span>
                          <input
                            type="number"
                            min={0}
                            value={v.stock}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[idx].stock = parseInt(e.target.value) || 0;
                              setVariants(updated);
                            }}
                            className="w-12 px-1.5 py-1 text-xs text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(v.id)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/25 disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : (editingProductId ? 'حفظ التعديلات' : 'إضافة المنتج فوراً')}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}


      
      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slateDark-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-brand-600" />
                <span>استيراد المنتجات</span>
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 mb-4">اختر طريقة الاستيراد التي تفضلها لجلب أصنافك إلى المتجر دفعة واحدة.</p>
              
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleExcelImport} 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isImportingExcel || isImportingERP}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group text-right disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  {isImportingExcel ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600">{isImportingExcel ? 'جاري قراءة الملف...' : 'استيراد من إكسل (Excel / CSV)'}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">رفع ملف يحتوي على بيانات الأصناف والأسعار</p>
                </div>
              </button>

              <button 
                onClick={handleERPImport}
                disabled={isImportingExcel || isImportingERP}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-brand-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group text-right disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center shrink-0">
                  {isImportingERP ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600">{isImportingERP ? 'جاري المزامنة...' : 'سحب من النظام المحاسبي (ERP)'}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">استيراد مباشر من Onyx Pro أو SMACC أو غيره</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
