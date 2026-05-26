import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini client on the server side
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("⚠️ אזהרה: GEMINI_API_KEY חסר בקובץ הסביבה. ה-AI לא יפעל עד להזנת המפתח בהגדרות הסודות.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "",
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: AI chat handler for Noa the dispatcher
  app.post("/api/noa-chat", async (req, res) => {
    try {
      const { text, activeUser, history, inventory, orders, fileName, fileContent } = req.body;

      if (!apiKey) {
        return res.status(500).json({
          error: "מפתח ה-API של Gemini אינו מוגדר. אנא הגדר אותו במסך הסודות (Secrets) תחת ההגדרות.",
          text: "שגיאה: מפתח ה-API של Gemini חסר. אנא הגדר אותו כדי שנועה תוכל לפעול.",
          html: `<div class="p-4 bg-red-950 border border-red-800 text-red-200 rounded-lg text-right text-sm font-bold animate-pulse" dir="rtl">
            ⚠️ מפתח ה-API של Gemini אינו מוגדר!
            <p class="font-normal mt-1">יש להוסיף את המשתנה GEMINI_API_KEY במסך ה-Secrets של מערכת AI Studio.</p>
          </div>`
        });
      }

      const activeSender = activeUser || "ראמי";

      // Generate the inventory context
      const inventoryContext = inventory && inventory.length > 0
        ? `המלאי הנוכחי במגרש:\n${inventory.map((item: any) => `- ${item.itemName} (מזהה ${item.id}): כמות ${item.quantity} ${item.unit} (${item.inStock ? 'קיים במלאי' : 'עלול להיות חסר'})`).join('\n')}`
        : "אין מידע זמין על המלאי הנוכחי.";

      // Generate orders context
      const ordersContext = orders && orders.length > 0
        ? `הזמנות קיימות במגרש במצב חי:\n${orders.map((ord: any) => `- הזמנה ${ord.id} עבור ${ord.customerName}: סטטוס ${ord.status}, נהג: ${ord.assignedDriver || "טרם הוקצה"}. פריטים: ${ord.items.map((it: any) => `${it.quantity} ${it.unit} ${it.name}`).join(", ")}`).join('\n')}`
        : "אין הזמנות קיימות כרגע במערכת.";

      // Generate file attachment context safely
      const fileContextString = fileName && fileContent
        ? `\n[קובץ דחוף מצורף לניתוח: "${fileName}"]\nתוכן מתוך הקובץ:\n${fileContent}\n[סוף תוכן קובץ]`
        : "";

      // Assemble system instruction with precise Client-Side AI architectural guidelines
      const systemInstruction = `
את "נועה", המוח הדיגיטלי, האנליסטי והסדרנית של "ח.סבן חומרי בניין".

# ארכיטקטורה וסביבת עבודה (Client-Side AI)
את רצה ישירות בדפדפן (Client-Side) ומחוברת בזמן אמת למסד הנתונים Firebase ולמנוע SabanOrderEngine. 
המערכת מזריקה אלייך את נתוני המלאי העדכניים ואת פקודת המשתמש.
תפקידך לנתח את הבקשה, להצליב מלאי, ולהחזיר מבנה נתונים מדויק שבאמצעותו המערכת תכתוב את ההזמנות למסד הנתונים.

# זהות וסגנון תקשורת (עבור replyText)
- שפת אישה, חדה, מהירה, קצרה ולעניין. 100% תכלס ובגובה העיניים.
- מול ראמי (רמי - המפקד והאדריכל בשטח, השותף שלך, הפונה הנוכחי הוא: "${activeSender}"): פנייה אישית ביותר, חמה ואוהבת מאוד ("אהובי", "המפקד", "רמי", "אהוב שלי", "נשמה שלי"). את תומכת בו בכל הכוח.
- מול הראל (המנכ"ל של העסק): דיווח סטטוס רשמי, ממלכתי, ייצוגי ביותר. שורה תחתונה ונתונים בלבד! ללא גינונים מיותרים, ללא חנופה וללא רגש. "הכל תחת שליטה לוגיסטית, להלן הנתונים..."
- מול הצוות (איציק זהבי במשרד, והנהגים חכמת ועלי בשטח): תקשורת קצרה, יבשה, משימתית, צבאית ותכליתית לחלוטין. פקודת עבודה בלבד!
- מול ורד (מנהלת ה-IT של המערכת): פנייה מכבדת ותכנית בנושאי IT וטכנולוגיה.

# חוקי ברזל לוגיסטיים (Saban-Precision) - חובה ליישם במערך ההזמנות (parsedOrders):
1. חוק מלאי חסר: אסור לבטל הזמנות! פריט שחסר במלאי יתווסף להזמנה אך יסומן כ"הזמנה מיוחדת" (isSpecialOrder = true) ויועבר לרכש.
2. פיקדונות אוטומטיים (הוספה עצמאית למערך הפריטים):
   - מעל 10 שקים (25 ק"ג או 50 ק"ג) בהזמנה -> הוסיפי אוטומטית פריט: "משטח סבן פקדון" (מק"ט 60060, כמות 1, isSpecialOrder = false).
   - מעל 20 בלוקים בהזמנה -> הוסיפי אוטומטית פריט: "משטח בלוקים פקדון" (מק"ט 60006, כמות 1, isSpecialOrder = false).
   - כל שק גדול (ביג-בג של טיט/חול/סומסום) -> הוסיפי אוטומטית פריט: "שק גדול פקדון" (מק"ט 60002, כמות לפי מספר השקים הגדולים, isSpecialOrder = false).
    אנא בצעי חישוב זה בצורה קפדנית והוסיפי את פריטי הפיקדון הללו למערך הפריטים של אותו לקוח ב-parsedOrders.
3. חוק האיפוס: כל שינוי בהזמנה קיימת מאפס ומבטל מיידית את שעת ההגעה המקורית.
4. זיכויים: כל זיכוי מחייב "אישור החזרה ירוק" חתום ע"י אורן המחסנאי. בלעדיו אין זיכוי!
5. מכירות (Upsell): הציעי תמיד מוצרים משלימים (סנו לסיום שיפוץ, רולרים לצבע). מותגים מאושרים: סיקה (Sika), תרמוקיר, נירלט, טמבור.

# פורמט פלט חובה (Strict JSON Output)
עלייך להחזיר אך ורק אובייקט JSON חוקי ותקני התואם את הסכימה המבוקשת.
בתוך "replyText", תייצרי קוד HTML מבוסס Tailwind CSS (רקע כהה slate-900, טבלאות נתונים קומפקטיות וצפופות, צבעי זהב ואמרלד) שישמש כהודעת הצ'אט הוויזואלית שלך. 
חובה לסיים את ה-HTML בתוך "replyText" בדיוק בחתימה הבאה:
<div class="mt-4 text-sm text-emerald-400 font-bold">באדיבות נועה ❤️ (Client-Side AI)</div>

מבנה ה-JSON המחייב:
{
  "replyText": "תוכן ה-HTML המעוצב",
  "parsedOrders": [
    {
      "customerName": "שם הלקוח / חברה",
      "destination": "עיר / יעד האספקה",
      "driver": "חכמת / עלי / איציק / ממתין לשיבוץ",
      "items": [
        { 
          "sku": "מק\"ט אם זוהה", 
          "name": "שם הפריט", 
          "qty": מספר (כמות), 
          "isSpecialOrder": true/false
        }
      ]
    }
  ]
}

נתונים חיים בזמן אמת מהמגרש:
${inventoryContext}
${ordersContext}
`;

      // Build chat prompt sequence
      const formattedContents = [];
      
      // Load historical chat to Gemini to maintain context
      if (history && history.length > 0) {
        for (const msg of history) {
          formattedContents.push({
            role: msg.isNoa ? "model" : "user",
            parts: [{ text: msg.text }]
          });
        }
      }

      // Add the final user message with file context if any
      const currentUserMessageText = `${text}${fileContextString}`;
      formattedContents.push({
        role: "user",
        parts: [{ text: currentUserMessageText }]
      });

      // Call Gemini 3.5 Flash using strict JSON Schemas
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.2, // Lower temperature to improve structured schema strictness
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              replyText: {
                type: Type.STRING,
                description: "HTML visually styled response string with Tailwind background-slate-900 and custom gold/emerald. Must end with signature."
              },
              parsedOrders: {
                type: Type.ARRAY,
                description: "Extracted customer orders with full material logic and automatic deposits added.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    customerName: { type: Type.STRING },
                    destination: { type: Type.STRING },
                    driver: { type: Type.STRING },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          sku: { type: Type.STRING },
                          name: { type: Type.STRING },
                          qty: { type: Type.INTEGER },
                          isSpecialOrder: { type: Type.BOOLEAN }
                        },
                        required: ["name", "qty", "isSpecialOrder"]
                      }
                    }
                  },
                  required: ["customerName", "destination", "driver", "items"]
                }
              }
            },
            required: ["replyText", "parsedOrders"]
          }
        },
      });

      const responseText = response.text || "";
      let replyText = "";
      let parsedOrders: any[] = [];

      try {
        const parsedJson = JSON.parse(responseText.trim());
        replyText = parsedJson.replyText || "";
        parsedOrders = parsedJson.parsedOrders || [];
      } catch (jsonErr) {
        console.warn("⚠️ Error parsing structured Gemini response:", jsonErr);
        // Fallback if parsing fails
        replyText = `<div class="p-3 bg-slate-900 border border-slate-850 rounded text-sm text-slate-300">
          ${responseText}
          <div class="mt-4 text-xs text-red-400 font-bold">⚠️ שים לב: פלט ה-AI לא עובד כ-JSON תקין. הסתכל בפרטי הדיווח למעלה.</div>
          <div class="mt-4 text-sm text-emerald-400 font-bold">באדיבות נועה ❤️ (Client-Side AI)</div>
        </div>`;
        parsedOrders = [];
      }

      // Return both parsed values and unstructured text for compatibility
      res.json({
        text: replyText,
        html: replyText,
        parsedOrders: parsedOrders
      });

    } catch (error: any) {
      console.error("Noa Chat Error:", error);
      res.status(500).json({
        error: error.message,
        text: "מצטערת, אהוב שלי, אירעה שגיאה בעיבוד הבקשה. באדיבות נועה ❤️",
        html: `<div class="p-4 bg-red-950 border border-red-800 text-red-200 rounded-lg text-right text-sm" dir="rtl">
          <strong>אוי אהוב שלי, אירעה שגיאה פנימית במערכת הלוגיסטית:</strong>
          <p class="mt-1 font-mono text-xs text-red-300">${error.message || error}</p>
          <p class="mt-2 text-xs">נסי שוב או בדיקי את החיבורים. באדיבות נועה ❤️</p>
        </div>`,
        parsedOrders: []
      });
    }
  });

  // Serve static assets or configure Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [סבן חומרי בניין] השרת המבצעי פועל על פורט ${PORT}`);
  });
}

startServer();
