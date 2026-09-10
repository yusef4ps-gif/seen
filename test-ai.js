require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const systemPrompt = `
      You are an expert AI Marketing Designer for e-commerce.
      Store Name: SEEN
      User Request: ايفون 16 برو
      
      Your job is to generate a highly compelling, short, and punchy Arabic ad copy for a promotional banner/image overlay.
      
      Respond STRICTLY in JSON format with the following keys:
      - "headline": (string) Short, bold, catchy Arabic headline (2-4 words max).
      - "subheadline": (string) A persuasive, engaging Arabic subheadline (5-8 words).
      - "badge": (string) A short promotional badge.
      - "colorTheme": (string) Either "dark" or "light".
      
      No markdown, no backticks, ONLY pure JSON object.
    `;

    try {
        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        console.log(response.text());
    } catch (e) {
        console.error("ERROR:", e);
    }
}
test();
