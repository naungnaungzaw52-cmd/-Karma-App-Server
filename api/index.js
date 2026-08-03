const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
  // CORS Headers တွေ ထည့်ပေးခြင်း (App ကနေ လှမ်းခေါ်လို့ရအောင်)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`📥 ဝင်လာသော မေးခွန်း: ${prompt}`);

    // Gemini API ကို ခေါ်ဆိုခြင်း (Google Search Grounding ပါ)
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are Karma AI Companion. Fluent in Myanmar and English. Respond naturally and accurately in Myanmar when asked in Myanmar.",
      },
    });

    const replyText = response.text || "အဖြေ မရရှိပါ။";

    console.log(`📤 AI ၏ အဖြေ: ${replyText}`);
    return res.status(200).json({ response: replyText });

  } catch (error) {
    console.error("❌ Gemini Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};