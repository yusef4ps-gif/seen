const fs = require('fs');

const targetPath = 'app/merchant/[slug]/ai-advisor/page.tsx';
let content = fs.readFileSync(targetPath, 'utf8');

// Remove the erroneous block
content = content.replace(
  /const initialStrategies = \[[\s\S]*?\}\, \[store\]\)\;/g,
  ''
);

// Move states to the top
const statesCode = `
  const [customCampaigns, setCustomCampaigns] = useState<{title: string, text: string, date: string, isEditing?: boolean}[]>([]);
  const [savedStrategies, setSavedStrategies] = useState<any[]>([]);

  const getTemplateContent = (idx: number, defaultTemplate: string) => {
    return editableTemplates[idx] !== undefined ? editableTemplates[idx] : defaultTemplate;
  };

  useEffect(() => {
    async function init() {
      if (slug) {
        const s = await getStoreBySlugAction(slug);
        if (s) setStore(s as any);
      }
    }
    init();
  }, [slug]);

  useEffect(() => {
    if (store && savedStrategies.length === 0) {
      const initialStrategies = [
        {
          title: 'حملة نهاية الأسبوع (Flash Sale)',
          type: 'عطلة نهاية الأسبوع',
          icon: Zap,
          description: 'خصم 15% على القطع الأكثر طلباً مع شحن سريع خلال 24 ساعة لزيادة المبيعات يومي الخميس والجمعة.',
          whatsappTemplate: \`🔥 *عروض نهاية الأسبوع الكبرى من \${store.name}!* 🔥\\n\\nاستمتعوا بخصم خاص *15%* على كافة المنتجات + توصيل فوري لعنوانك في \${store.city}!\\n\\n🛍️ للطلب السريع تصفح المتجر الآن:\\nhttps://mazn.app/store/\${store.slug}\\n\\n*العرض سارٍ حتى مساء السبت فقط.* ⏳\`,
          isEditing: false
        },
        {
          title: 'عرض الشحن والتوصيل المجاني',
          type: 'زيادة حجم السلة AOV',
          icon: Gift,
          description: 'تقديم توصيل مجاني عند شراء منتجين أو أكثر أو عند تجاوز قيمة السلة 100 ر.س لرفع متوسط الطلب.',
          whatsappTemplate: \`🚚 *بشرى سارة لزبائن \${store.name} الكرام!* ✨\\n\\nاحصل على *توصيل مجاني بالكامل* عند طلب منتجين أو أكثر اليوم!\\n\\n📦 تسوق الآن تشكيلتنا الجديدة:\\nhttps://mazn.app/store/\${store.slug}\\n\\nالدفع عند الاستلام أو عبر المحافظ متاح بكل سهولة. 💳\`,
          isEditing: false
        },
        {
          title: 'حملة العيد والمناسبات الخاصة',
          type: 'موسمي وتراثي',
          icon: Sparkles,
          description: 'باقة مخصصة للهدايا والتجهيز للمناسبات مع تغليف مجاني وبطاقة إهداء.',
          whatsappTemplate: \`🎉 *أناقتك وفرحتك تكتمل مع \${store.name}!* ✨\\n\\nاخترنا لكم أجمل التشكيلات الفاخرة مع *تغليف هدايا مجاني فاخر* لكل طلب!\\n\\n👑 تصفح التشكيلة الحصرية واطلب الآن قبل نفاد الكميات:\\nhttps://mazn.app/store/\${store.slug}\`,
          isEditing: false
        }
      ];
      setSavedStrategies(initialStrategies);
    }
  }, [store]);
`;

content = content.replace(
  /const \[customCampaigns, setCustomCampaigns\] = useState[\s\S]*?\}\, \[slug\]\)\;/,
  statesCode
);

fs.writeFileSync(targetPath, content, 'utf8');
