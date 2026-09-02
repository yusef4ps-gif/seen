export interface AICopywriteRequest {
  productName: string;
  category: string;
  keyFeatures?: string;
  tone?: 'luxurious' | 'energetic' | 'practical' | 'traditional';
}

export function generateAIProductDescription(req: AICopywriteRequest): { description: string; tags: string[]; seoSnippet: string } {
  const { productName, category, keyFeatures, tone = 'luxurious' } = req;

  let desc = '';
  let tags: string[] = [category, 'تسوق_أونلاين', 'اليمن', 'أفضل_سعر'];
  
  if (category.includes('أزياء') || category.includes('عبايات') || category.includes('فساتين')) {
    desc = `تألقي بأرقى إطلالة مع ${productName}، المصنوع بعناية فائقة من أجود الخامات المختارة لتمنحك الأناقة والراحة المطلقة في كل لحظة. ${keyFeatures ? `يتميز بـ ${keyFeatures}.` : 'تصميم انسيابي يواكب أحدث صيحات الموضة العصرية مع الحفاظ على الفخامة والأصالة.'} مناسب لجميع مناسباتك الراقية. اطلبيه الآن واستمتعي بشحن فوري وسريع!`;
    tags.push('موضة', 'أناقة', 'تصاميم_حصرية', 'عبايات_راقية');
  } else if (category.includes('إلكترونيات') || category.includes('هواتف') || category.includes('صوتيات')) {
    desc = `ارتقِ بتجربتك الرقمية مع ${productName}! جهاز استثنائي يجمع بين أحدث التقنيات العالمية والأداء الفائق والاعتمادية العالية. ${keyFeatures ? `مزود بـ ${keyFeatures}.` : 'بطارية طويلة الأمد واستجابة فائقة السرعة مع ضمان حقيقي.'} احصل عليه الآن بأفضل سعر قبل نفاد الكمية!`;
    tags.push('تقنية', 'إلكترونيات', 'أصلي', 'ضمان_رسمي');
  } else if (category.includes('عطور') || category.includes('بخور')) {
    desc = `انعم برائحة تأسر الحواس مع ${productName} الأصيل، الممزوج بأفخر أنواع الزيوت العطرية المعتقة التي تمنحك ثباتاً مبهراً يدوم لأيام. مناسب للإهداء والاستخدام الشخصي الراقي.`;
    tags.push('عطور_فاخرة', 'بخور_عدني', 'أصالة', 'ثبات_عالي');
  } else {
    desc = `اكتشف الجودة الفائقة مع ${productName}. منتج مصمم ليلبي أعلى معايير الجودة والعملية، يمنحك القيمة الحقيقية التي تبحث عنها. ${keyFeatures ? `مواصفات: ${keyFeatures}.` : 'خامات ممتازة وضمان رضا 100%.'}`;
    tags.push('جودة_عالية', 'عروض_خاصة');
  }

  const seoSnippet = `${productName} بأفضل سعر في اليمن. اطلب الآن من متجرنا مع خيارات الدفع عند الاستلام والشحن السريع لجميع المحافظات.`;

  return {
    description: desc,
    tags: Array.from(new Set(tags)),
    seoSnippet,
  };
}

export function generateWhatsAppOrderMessage(orderData: {
  storeName: string;
  orderNumber: string;
  customerName: string;
  items: { name: string; quantity: number; priceFormatted: string }[];
  totalFormatted: string;
  discountFormatted?: string;
  paymentMethodName: string;
  city: string;
  address: string;
}): string {
  let text = `🛍️ *طلب جديد من متجر ${orderData.storeName}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📄 *رقم الطلب:* #${orderData.orderNumber}\n`;
  text += `👤 *اسم العميل:* ${orderData.customerName}\n`;
  text += `📍 *العنوان:* ${orderData.city} - ${orderData.address}\n`;
  text += `💳 *طريقة الدفع:* ${orderData.paymentMethodName}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📦 *المنتجات المطلوبة:*\n`;
  
  orderData.items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.name} × ${item.quantity} (${item.priceFormatted})\n`;
  });

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  if (orderData.discountFormatted) {
    text += `🏷️ *الخصم:* -${orderData.discountFormatted}\n`;
  }
  text += `💰 *الإجمالي الكلي:* *${orderData.totalFormatted}*\n\n`;
  text += `شكراً لتسوقكم معنا! يرجى تأكيد الطلب للبدء في التجهيز فوراً. ✨`;

  return encodeURIComponent(text);
}
