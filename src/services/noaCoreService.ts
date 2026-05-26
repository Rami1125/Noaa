import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GoogleGenAI } from '@google/genai';

// אתחול ישיר מול ג'מיני - חוסך את בעיות ה-404 של Vercel
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const executeNoaCommand = async (userCommand: string): Promise<string> => {
  try {
    // 1. שליפת הזמנות פתוחות מ-Firebase
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 2. פנייה ישירה ל-Gemini API (ללא תיווך השרת שלך)
    const systemPrompt = `
      את נועה. אני בודק את החיבור שלך למסד הנתונים.
      הנה ההזמנות כרגע בסידור: ${JSON.stringify(orders.slice(0, 5))}
      עני לי במשפט אחד: כמה הזמנות יש, ולמי מיועדת הראשונה.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash',
      contents: `${systemPrompt}\n\nפקודת משתמש: ${userCommand}`,
    });

    // 3. החזרת התשובה הנקייה
    return response.text || "המפקד, יש שגיאה בעיבוד התשובה מג'מיני.";

  } catch (error) {
    console.error("Noa Core Error:", error);
    return `<div class="text-red-500 font-bold bg-red-50 p-2 rounded">
      התרעת מערכת: שגיאת תקשורת ישירה מול שרתי ה-AI. בדוק מפתח VITE_GEMINI_API_KEY.
    </div>`;
  }
};
