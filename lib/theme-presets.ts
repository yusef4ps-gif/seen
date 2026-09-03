import { ThemeConfig, ThemePreset, ThemeSection } from './types';

export const DEFAULT_THEME_SECTIONS: ThemeSection[] = [
  {
    id: 'sec-announcement',
    type: 'announcement_bar',
    title: 'شريط الإعلانات الترويجي',
    isVisible: true,
    order: 1,
    settings: {
      bannerTitle: 'توصيل سريع لجميع المحافظات | الدفع عند الاستلام وبالمحافظ المحلية',
      backgroundColor: '#0f172a',
      textColor: '#ffffff',
    },
  },
  {
    id: 'sec-hero',
    type: 'hero_slider',
    title: 'البانر الترويجي الرئيسي',
    isVisible: true,
    order: 2,
    settings: {
      bannerTitle: 'تشكيلة الموسم الفاخرة 2026',
      bannerSubtitle: 'أرقى المنتجات بتصاميم حصرية وجودة فائقة تلبي ذوقك الرفيع',
      bannerImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      ctaText: 'استكشف التشكيلة الآن',
    },
  },
  {
    id: 'sec-features',
    type: 'features_strip',
    title: 'شريط مميزات وثقة المتجر',
    isVisible: true,
    order: 3,
    settings: {
      bannerTitle: 'لماذا تتسوق منا؟',
    },
  },
  {
    id: 'sec-categories',
    type: 'featured_categories',
    title: 'تصفح حسب الأقسام',
    isVisible: true,
    order: 4,
    settings: {
      bannerTitle: 'الأقسام والتصنيفات',
    },
  },
  {
    id: 'sec-products',
    type: 'products_grid',
    title: 'المنتجات المميزة الأكثر طلباً',
    isVisible: true,
    order: 5,
    settings: {
      bannerTitle: 'المنتجات المميزة',
      itemsCount: 8,
    },
  },
  {
    id: 'sec-promo',
    type: 'promo_banner',
    title: 'بانر العرض الترويجي والخصومات',
    isVisible: true,
    order: 6,
    settings: {
      bannerTitle: 'خصم خاص 20% لفترة محدودة!',
      bannerSubtitle: 'استخدم كود الخصم عند إتمام الطلب واحصل على توفير فوري',
      discountCode: 'MAZN20',
      bannerImageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&auto=format&fit=crop&q=80',
      ctaText: 'تسوق العرض الآن',
    },
  },
  {
    id: 'sec-testimonials',
    type: 'testimonials',
    title: 'تجارب وآراء عملائنا',
    isVisible: true,
    order: 7,
    settings: {
      bannerTitle: 'ماذا يقول عملاؤنا عنا؟',
    },
  },
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'fashion-luxury',
    name: 'بوتيك الأزياء الملكي (Aden Luxury)',
    category: 'أزياء وعبايات وجمال',
    description: 'شكل مجلة أزياء فاخرة (Lookbook): هيدر سنترال، بطاقات منتجات بإطارات عصرية، دوائر تصنيفات انسيابية، وبنرات كاملة العرض.',
    thumbnail: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=400&auto=format&fit=crop&q=80',
    config: {
      presetId: 'fashion-luxury',
      colors: {
        primary: '#0d9488', // Emerald Teal
        secondary: '#d97706', // Amber Gold
        background: '#f8fafc',
        surface: '#ffffff',
        textMain: '#0f172a',
        textMuted: '#64748b',
      },
      typography: {
        fontFamily: 'Tajawal',
        headingWeight: 'black',
      },
      layout: {
        borderRadius: 'pill',
        cardShadow: 'subtle',
        productCardStyle: 'classic',
      },
      sections: DEFAULT_THEME_SECTIONS,
    },
  },
  {
    id: 'tech-modern',
    name: 'المصفوفة التقنية (Sanaa Neo Cyber Tech)',
    category: 'إلكترونيات وهواتف وجيمنج',
    description: 'شكل دارك مود تقني سيبراني: كروت مواصفات ذكية مع شارات تقنية (5G / 4K / الضمان)، هيدر إلكتروني متقدم، وأزرار زجاجية نيون.',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=80',
    config: {
      presetId: 'tech-modern',
      colors: {
        primary: '#2563eb', // Electric Blue
        secondary: '#06b6d4', // Cyan Neon
        background: '#0a0f18', // Deep Cyber Navy
        surface: '#111827',
        textMain: '#f9fafb',
        textMuted: '#9ca3af',
      },
      typography: {
        fontFamily: 'Readex Pro',
        headingWeight: 'bold',
      },
      layout: {
        borderRadius: 'curved',
        cardShadow: 'elevated',
        productCardStyle: 'bordered',
      },
      sections: [
        {
          ...DEFAULT_THEME_SECTIONS[0],
          settings: { ...DEFAULT_THEME_SECTIONS[0].settings, bannerTitle: '⚡ أقوى العروض التقنية | ضمان رسمي معتمد وشحن سريع' },
        },
        {
          ...DEFAULT_THEME_SECTIONS[1],
          settings: { 
            bannerTitle: 'الجيل الجديد من الهواتف والأجهزة الذكية',
            bannerSubtitle: 'أحدث معالجات 2026، شاشات OLED، وأداء فائق للألعاب والأعمال',
            bannerImageUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80',
            ctaText: 'اكتشف المواصفات والأسعار',
          },
        },
        ...DEFAULT_THEME_SECTIONS.slice(2),
      ],
    },
  },
  {
    id: 'yemen-roastery',
    name: 'المحمص الحرفي والتراث (Yemeni Roastery & Food)',
    category: 'بن يماني وأغذية ومقاهي',
    description: 'شكل دافئ حرفي (Artisanal Craft): بطاقات بن محددة بدرجات التحميص (خفيف/وسط/داكن)، خلفيات كريمية دافئة، وبار مميزات التحضير.',
    thumbnail: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&auto=format&fit=crop&q=80',
    config: {
      presetId: 'yemen-roastery',
      colors: {
        primary: '#78350f', // Roasted Coffee Brown
        secondary: '#d97706', // Warm Amber
        background: '#fefcf8', // Warm Cream Paper
        surface: '#ffffff',
        textMain: '#451a03',
        textMuted: '#78716c',
      },
      typography: {
        fontFamily: 'Cairo',
        headingWeight: 'bold',
      },
      layout: {
        borderRadius: 'curved',
        cardShadow: 'subtle',
        productCardStyle: 'classic',
      },
      sections: [
        {
          ...DEFAULT_THEME_SECTIONS[0],
          settings: { ...DEFAULT_THEME_SECTIONS[0].settings, bannerTitle: '☕ محاصيل بن يماني نادرة 100% من مزارع حراز وبني مطر' },
        },
        {
          ...DEFAULT_THEME_SECTIONS[1],
          settings: { 
            bannerTitle: 'أصالة البن اليماني من المزرعة إلى فنجانك',
            bannerSubtitle: 'محمصة طازجة أسبوعياً ومعبأة بأعلى معايير الحفظ لتستمتع بنكهة فريدة',
            bannerImageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1200&auto=format&fit=crop&q=80',
            ctaText: 'اختر محصولك المفضل',
          },
        },
        ...DEFAULT_THEME_SECTIONS.slice(2),
      ],
    },
  },
  {
    id: 'minimal-clean',
    name: 'النمط السويسري العصري (Swiss Minimalist)',
    category: 'تصميم فني ومتاجر متنوعة',
    description: 'شكل معماري نقي وحاد (Brutalist Minimal): خطوط هندسية بيضاء وسوداء نقية، بطاقات بدون هوامش مبالغة، وأرقام تصنيفات بارزة.',
    thumbnail: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&auto=format&fit=crop&q=80',
    config: {
      presetId: 'minimal-clean',
      colors: {
        primary: '#09090b', // Pure Charcoal
        secondary: '#71717a', // Zinc
        background: '#ffffff',
        surface: '#ffffff',
        textMain: '#09090b',
        textMuted: '#71717a',
      },
      typography: {
        fontFamily: 'Almarai',
        headingWeight: 'black',
      },
      layout: {
        borderRadius: 'sharp',
        cardShadow: 'none',
        productCardStyle: 'bordered',
      },
      sections: DEFAULT_THEME_SECTIONS,
    },
  },
  {
    id: 'perfume-beauty',
    name: 'الجمال والعطور الفاخرة (Glamour & Scents)',
    category: 'عطور ومستحضرات تجميل',
    description: 'شكل ناعم وجذاب: يعتمد على ألوان الباستيل الهادئة والمساحات البيضاء المريحة للعين مع خطوط رقيقة لإبراز تفاصيل العطور.',
    thumbnail: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&auto=format&fit=crop&q=80',
    config: {
      presetId: 'perfume-beauty',
      colors: {
        primary: '#be185d', // Rose
        secondary: '#fbcfe8', // Pink
        background: '#fff1f2', // Soft Rose Background
        surface: '#ffffff',
        textMain: '#4c0519',
        textMuted: '#9f1239',
      },
      typography: {
        fontFamily: 'Tajawal',
        headingWeight: 'bold',
      },
      layout: {
        borderRadius: 'curved',
        cardShadow: 'elevated',
        productCardStyle: 'classic',
      },
      sections: [
        {
          ...DEFAULT_THEME_SECTIONS[0],
          settings: { ...DEFAULT_THEME_SECTIONS[0].settings, bannerTitle: '✨ شحن مجاني للعطور المختارة | تغليف هدايا مجاني' },
        },
        {
          ...DEFAULT_THEME_SECTIONS[1],
          settings: { 
            bannerTitle: 'عطرك يعبر عن هويتك',
            bannerSubtitle: 'اكتشف مجموعتنا الجديدة من العطور الفرنسية والشرقية المصممة خصيصاً لك',
            bannerImageUrl: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1200&auto=format&fit=crop&q=80',
            ctaText: 'تسوق المجموعة الجديدة',
          },
        },
        ...DEFAULT_THEME_SECTIONS.slice(2),
      ],
    },
  },
  {
    id: 'sweets-bakery',
    name: 'الحلويات والمخبوزات (Sweet Treats)',
    category: 'حلويات، مخبوزات وضيافة',
    description: 'تصميم مرح وشهي: ألوان دافئة ومبهجة (الوردي المشمشي والبني الشوكولاتي) مع تركيز عالي على صور المنتجات لجذب الشهية.',
    thumbnail: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&auto=format&fit=crop&q=80',
    config: {
      presetId: 'sweets-bakery',
      colors: {
        primary: '#ea580c', // Orange/Caramel
        secondary: '#fef08a', // Yellow
        background: '#fffbeb', // Amber Background
        surface: '#ffffff',
        textMain: '#451a03',
        textMuted: '#92400e',
      },
      typography: {
        fontFamily: 'Almarai',
        headingWeight: 'black',
      },
      layout: {
        borderRadius: 'pill',
        cardShadow: 'subtle',
        productCardStyle: 'classic',
      },
      sections: [
        {
          ...DEFAULT_THEME_SECTIONS[0],
          settings: { ...DEFAULT_THEME_SECTIONS[0].settings, bannerTitle: '🍰 اطلب الآن واستلم طازجاً في نفس اليوم!' },
        },
        {
          ...DEFAULT_THEME_SECTIONS[1],
          settings: { 
            bannerTitle: 'ألذ الحلويات والمخبوزات لمناسباتك',
            bannerSubtitle: 'نخبز يومياً بحب باستخدام أجود المكونات الطبيعية',
            bannerImageUrl: 'https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=1200&auto=format&fit=crop&q=80',
            ctaText: 'اطلب تشكيلة اليوم',
          },
        },
        ...DEFAULT_THEME_SECTIONS.slice(2),
      ],
    },
  },
];
