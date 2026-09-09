'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateCampaignAction(prompt: string, storeName: string, storeSlug: string, storeCity: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY_MISSING');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `
      أنت مستشار ذكاء اصطناعي متخصص في كتابة حملات تسويقية وإعلانات جذابة لمتاجر إلكترونية.
      اسم المتجر: ${storeName}
      رابط المتجر: https://seen.app/store/${storeSlug}
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

export async function generateAdDesignAction(prompt: string, storeName: string, imageBase64?: string, mimeType?: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY_MISSING');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `
      You are an expert AI Marketing Designer for e-commerce.
      Store Name: ${storeName}
      User Request: ${prompt}
      
      Your job is to generate a highly compelling, short, and punchy Arabic ad copy for a promotional banner/image overlay.
      If an image is provided, analyze the product in the image and make the copy relevant to it.
      
      Respond STRICTLY in JSON format with the following keys:
      - "headline": (string) Short, bold, catchy Arabic headline (2-4 words max).
      - "subheadline": (string) A persuasive, engaging Arabic subheadline (5-8 words).
      - "badge": (string) A short promotional badge (e.g., "خصم 20%", "وصل حديثاً", "تصفية", "عرض حصري").
      - "colorTheme": (string) Either "dark" (if the text should be light) or "light" (if the text should be dark), or "brand" to use brand colors. Just guess the best contrast.
      
      No markdown, no backticks, ONLY pure JSON object.
    `;

    const content: any[] = [systemPrompt];

    if (imageBase64 && mimeType) {
      content.push({
        inlineData: {
          data: imageBase64.split(',')[1] || imageBase64,
          mimeType
        }
      });
    }

    const result = await model.generateContent(content);
    const response = await result.response;
    let text = response.text().trim();
    
    // Clean JSON if model returned markdown backticks
    if (text.startsWith('\`\`\`json')) {
      text = text.replace('\`\`\`json', '').replace('\`\`\`', '').trim();
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace('\`\`\`', '').replace('\`\`\`', '').trim();
    }

    const parsed = JSON.parse(text);

    return { success: true, data: parsed };
  } catch (error: any) {
    console.error('Error generating Ad Design:', error);
    if (error.message === 'GEMINI_API_KEY_MISSING') {
      return { success: false, error: 'MISSING_KEY' };
    }
    return { success: false, error: error.message || 'FAILED' };
  }
}
