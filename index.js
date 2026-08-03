const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { GoogleGenAI } = require('@google/genai');

// Firebase ကို စတင်ချိတ်ဆက်ခြင်း
const serviceAccount = require('./serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
// Gemini API Key ကိုတော့ Vercel (သို့) Environment ထဲမှာ ထည့်ရပါမယ်
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startListening() {
  console.log("🚀 Karma AI Backend စတင် အလုပ်လုပ်နေပါပြီ...");

  // Firestore ထဲက gemini_chats ကို Realtime စောင့်နေမည်
  db.collection('gemini_chats').doc('current_user_ai_session')
    .onSnapshot(async (doc) => {
      if (!doc.exists) return;
      
      const data = doc.data();
      // App ဘက်က status က pending ဖြစ်မှ အလုပ်လုပ်မည်
      if (data.status === 'pending') {
        const prompt = data.prompt;
        console.log(`📥 မေးခွန်းဝင်လာပါပြီ: ${prompt}`);

        try {
          // Gemini API ကို Google Search Grounding (Real-time data) နဲ့ ခေါ်မည်
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              systemInstruction: "You are Karma AI Companion. Fluent in Myanmar and English. Respond naturally and accurately in Myanmar when asked in Myanmar.",
            },
          });

          const replyText = response.text || "အဖြေ မရရှိပါ။";

          // ရလာတဲ့ အဖြေကို Firestore ထဲ completed ဆိုပြီး ပြန်တင်မည်
          await db.collection('gemini_chats').doc('current_user_ai_session').update({
            response: replyText,
            status: 'completed'
          });

          console.log("📤 အဖြေကို Firestore သို့ အောင်မြင်စွာ ပြန်ပို့ပြီးပါပြီ။");
        } catch (error) {
          console.error("❌ Gemini Error:", error);
          await db.collection('gemini_chats').doc('current_user_ai_session').update({
            response: "ချိတ်ဆက်မှု အမှားအယွင်း ရှိနေပါသည်။",
            status: 'error'
          });
        }
      }
    });
}

startListening();