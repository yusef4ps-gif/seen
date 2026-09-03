'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateCampaignAction(prompt: string, storeName: string, storeSlug: string, storeCity: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY_MISSING');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `
      أنت مستشار ذكاء اصطناعي متخصص في كتابة حملات تسويقية وإعلانات جذابة لمتاجر إلكترونية.
      اسم المتجر: ${storeName}
      رابط المتجر: https://mazn.app/store/${storeSlug}
      المدينة المستهدفة: ${storeCity}

      المطلوب:
      بناءً على الهدف التالي من التاجر: "${prompt}"
      اكتب رسالة واتساب تسويقية احترافية ومقنعة (نص الإعلان فقط بدون مقدمات لك)، مع استخدام الإيموجيز المناسبة، وتنسيقات الواتساب (*للنص العريض*، _للنص المائل_). 
      في نهاية الرسالة أضف رابط المتجر أو عبارة تحث على الشراء (Call to action).
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    return { success: true, text: text.trim() };
  } catch (error: any) {
    console.error('Error generating AI campaign:', error);
    if (error.message === 'GEMINI_API_KEY_MISSING') {
      return { success: false, error: 'MISSING_KEY' };
    }
    return { success: false, error: 'FAILED' };
  }
}
