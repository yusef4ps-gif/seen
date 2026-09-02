export type ComparisonFeature = {
  id: string;
  name: string;
  starter: string;
  marketing: string;
  pro: string;
};

export type ComparisonCategory = {
  id: string;
  title: string;
  features: ComparisonFeature[];
};

export const defaultComparisonData: ComparisonCategory[] = [
  {
    id: "cat_1",
    title: "1. الأساسيات والمنتجات",
    features: [
      { id: "f1_1", name: "عدد المنتجات والتصنيفات المسموح بها", starter: "غير محدود ∞", marketing: "غير محدود ∞", pro: "غير محدود ∞" },
      { id: "f1_2", name: "عدد الطلبات والمبيعات الشهرية", starter: "غير محدود ∞", marketing: "غير محدود ∞", pro: "غير محدود ∞" },
      { id: "f1_3", name: "محرر القوالب المرئي وتخصيص الأقسام", starter: "✓", marketing: "✓", pro: "✓ كامل مع كل القوالب" },
    ]
  },
  {
    id: "cat_2",
    title: "2. الهوية والتسويق الرقمي",
    features: [
      { id: "f2_1", name: "ربط اسم نطاق مخصص (yourstore.com)", starter: "✗", marketing: "✓", pro: "✓ مجاناً" },
      { id: "f2_2", name: "إدارة الكوبونات وقسائم الخصم الترويجية", starter: "✗", marketing: "✓", pro: "✓ متقدم" },
      { id: "f2_3", name: "استعادة السلات المتروكة الذكية", starter: "✗", marketing: "✗", pro: "✓ عبر WhatsApp Bot" },
    ]
  },
  {
    id: "cat_3",
    title: "3. المدفوعات والعملات في اليمن",
    features: [
      { id: "f3_1", name: "محرك أسعار الصرف المزدوج (عدن / صنعاء / SAR)", starter: "أساسي", marketing: "✓", pro: "✓ تحويل آلي مباشر" },
      { id: "f3_2", name: "ربط محافظ جوالي، ون كاش، فلوسك، والكريمي", starter: "يدوي", marketing: "✓", pro: "✓ فوري مع QR Code" },
    ]
  },
  {
    id: "cat_4",
    title: "4. الفريق والذكاء الاصطناعي",
    features: [
      { id: "f4_1", name: "حسابات موظفي المتجر والأذونات (RBAC)", starter: "حساب مالك فقط", marketing: "حسابين", pro: "حتى 10 موظفين" },
      { id: "f4_2", name: "إدارة مناديب الشحن والتوصيل الميدانيين", starter: "✗", marketing: "✗", pro: "✓ إسناد وتتبع مباشر" },
      { id: "f4_3", name: "مستشار الذكاء الاصطناعي (AI Inventory Advisor)", starter: "✗", marketing: "✗", pro: "✓ توصيات تسعير ذكية" },
    ]
  }
];
