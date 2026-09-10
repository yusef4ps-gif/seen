'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateCampaignAction(prompt: string, storeName: string, storeSlug: string, storeCity: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY_MISSING');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

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
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const systemPrompt = `
      You are an expert AI Marketing Designer and Art Director for e-commerce.
      Store Name: ${storeName}
      User Request: ${prompt}
      
      Your job is to act as a data extractor for a graphic design template.
      Analyze the user request and the provided image (if any) to extract key specifications of the product (mobile phone, perfume, food, etc.).
      If the user doesn't provide specific details, make a highly educated guess for the specific product mentioned, or invent compelling marketing values based on the product category.
      
      Respond STRICTLY in JSON format with the following keys:
      - "deviceName": (string) The exact name of the product (e.g., "iPhone 15 Pro Max", "عطر سوفاج", "وجبة برجر").
      - "features": (array of objects) Generate 3 to 5 key features based on the product type. Each object MUST have:
          - "label": (string) Short title (e.g., "السعة", "الرام", "الحجم", "الرائحة", "السعرات").
          - "value": (string) The value (e.g., "256 جيجا", "12 جيجا", "100 مل", "أخشاب وزهور", "500 كالوري").
      - "price": (string) Price in local currency (e.g., "2470 سعودي", "150 درهم").
      - "priceUsd": (string) Price in USD (e.g., "$650", "$40").
      - "badge": (string) A promotional badge or urgency tag (e.g., "خصم خاص", "حصري", "جديد").
      - "primaryColor": (string) A hex color code representing the main theme color of the product/brand (e.g., "#FFB000", "#1E3A8A").
      - "secondaryColor": (string) A contrasting hex color code for accents or text against the primary color (e.g., "#FFFFFF", "#0F172A").
      
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
