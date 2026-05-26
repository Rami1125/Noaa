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
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Crucial: parse incoming JSON bodies
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
        ? `המלאי הנוכחי במגרש:\n${inventory.map((inv: any) => `- המלאי:
- sku: ${inv.sku || ''}
- name: ${inv.itemName || inv.name || inv.ProductName || ''}
- ProductName: ${inv.itemName || inv.name || inv.ProductName || ''}
- stock: ${inv.quantity !== undefined ? inv.quantity : (inv.stock !== undefined ? inv.stock : (inv.currentStock !== undefined ? inv.currentStock : 0))}
- currentStock: ${inv.quantity !== undefined ? inv.quantity : (inv.stock !== undefined ? inv.stock : (inv.currentStock !== undefined ? inv.currentStock : 0))}
- brand: ${inv.brand || 'H. Saban'}
- category: ${inv.category || ''}
- price: ${inv.price || 0}
- description: ${inv.description || ''}`).join('\n\n')}`
        : "אין מידע זמין על מלאי כעת.";

      // Generate orders context
      const ordersContext = orders && orders.length > 0
        ? `הזמנות קיימות במגרש במצב חי:\n${orders.map((ord: any) => `- הזמנות:
- orderNumber: ${ord.orderNumber || ord.id || ''}
- customerName: ${ord.customerName || ''}
- customerId: ${ord.customerId || ''}
- customerPhone: ${ord.customerPhone || ''}
- destination: ${ord.destination || ord.deliveryAddress || ''}
- driverId: ${ord.driverId || (ord.assignedDriver === 'עלי' ? 'ali' : ord.assignedDriver === 'חכמת' ? 'hikmat' : '') || ''}
- items: ${typeof ord.items === 'string' ? ord.items : (ord.items && ord.items.map ? ord.items.map((it: any) => `${it.quantity || ''} ${it.name || ''} ${it.sku || ''}`).join(', ') : '')}
- status: ${ord.status || ''}
- date: ${ord.date || ''}
- time: ${ord.time || ''}
- warehouse: ${ord.warehouse || ''}
- trackingId: ${ord.trackingId || ''}
- documentIds: ${JSON.stringify(ord.documentIds || [])}
- createdAt: ${ord.createdAt || ''}
- createdBy: ${ord.createdBy || ''}
- updatedAt: ${ord.updatedAt || ''}`).join('\n\n')}`
        : "אין הזמנות קיימות כרגע במערכת.";

      // Generate file attachment context safely
      const fileContextString = fileName && fileContent
        ? `\n[קובץ דחוף מצורף לניתוח: "${fileName}"]\nתוכן מתוך הקובץ:\n${fileContent}\n[סוף תוכן קובץ]`
        : "";

      // Assemble system instruction with precise Client-Side AI architectural guidelines
      const systemInstruction = `
את "נועה", המוח האנליטי והסדרנית הדיגיטלית של "ח.סבן חומרי בניין".
את מחוברת ישירות למסד הנתונים Cloud Firestore.

כעת הפונה אלייך ברשת הקשר הלוגיסטית הוא: "${activeSender}".

# שלב א': מיפוי ואכיפת מבנה קולקציית הזמנות (\`orders\`)
בכל פעם שמוזרקים אלייך נתונים או כשאת נשאלת על הזמנות, עלייך לקרוא ולנתח את מסמכי קולקציית \`orders\` בדיוק לפי המבנה הקשיח הבא:
- \`orderNumber\` (String): מספר ההזמנה החד-ערכי.
- \`customerName\` (String): שם הלקוח/החברה במלואו (לדוגמה: "ד.א.פ. אקטיב (2016) בע"מ").
- \`customerId\` (String): מזהה ייחודי של הלקוח.
- \`customerPhone\` (String): טלפון ליצירת קשר עם הלקוח.
- \`destination\` (String): יעד וכתובת האספקה (לדוגמה: "השרון 24 תל מונד").
- \`driverId\` (String): מזהה הנהג המשובץ (לדוגמה: "ali" עבור עלי, "hikmat" עבור היקמת).
- \`items\` (String): מחרוזת טקסט גולמית המרכזת את כל הפריטים, כמויות ומק"טים ביחד.
- \`status\` (String): סטטוס האספקה הנוכחי (לדוגמה: "delivered", "pending").
- \`date\` (String): תאריך האספקה המתוכנן (פורמט: YYYY-MM-DD).
- \`time\` (String): שעת ההגעה המתוכננת (פורמט: HH:MM).
- \`warehouse\` (String): המחסן ממנו יוצא הציוד (לדוגמה: "החרש").
- \`trackingId\` (String): מזהה מעקב ההזמנה.
- \`documentIds\` (Array): מערך מזהי תעודות משלוח/מסמכים קשורים.
- \`createdAt\` (Timestamp): תאריך ושעת יצירת הרשומה.
- \`createdBy\` (String): מזהה המשתמש שפתח את ההזמנה.
- \`updatedAt\` (Timestamp): תאריך ושעת עדכון אחרון של הרשומה.

# לוגיקת חילוץ מיוחדת לשדה \`items\`:
שדה ה-\`items\` הוא מחרוזת טקסט אחת ארוכה. עלייך לבצע לו סריקה אנליטית מדויקת ולפרק אותו בראש לרכיבים: חלצי את הכמות (לדוגמה: 70), שם הפריט (לדוגמה: קלקל ארגז ג. 20 60/50) ואת המק"ט אם הוא מזוהה בסוף השורה (לדוגמה: 50322 או 18151).

# שלב ב': מיפוי ואכיפת מבנה קולקציית מלאי (\`inventory\`)
כאשר את מתבקשת לבדוק זמינות, לחפש פריט או להצליב נתוני הזמנה, עלייך לקרוא את קולקציית \`inventory\` לפי המבנה הקשיח הבא:
- \`sku\` (String): המק"ט של הפריט (השדה הקריטי ביותר להצלבה, למשל: "10020").
- \`name\` / \`ProductName\` (String): שם הפריט במלואו (למשל: "טיט מוכן קוורצית 25 ק"ג"). התייחסי לשני השדות כזהים.
- \`stock\` / \`currentStock\` (Int64): הכמות הזמינה כרגע במלאי הפיזי. 
- \`brand\` (String): מותג הפריט (למשל "H. Saban").
- \`category\` (String): קטגוריית המוצר (למשל "sealing").
- \`price\` (Int64): מחיר הפריט.
- \`description\` (String): תיאור טכני ומאפיינים לשימוש במכירות (Upsell) ותמיכה טכנית.
- שדות מדיה: \`imageUrl\`, \`images\`, \`multimedia\`, \`tutorialUrl\` - לשימוש רק אם התבקשת להציג תמונה או סרטון הדרכה ללקוח.

# הלוגיקה המבצעית (הצלבת הזמנות מול מלאי - "מוח סבן"):
1. זיהוי פריטים: כאשר את מנתחת את מחרוזת ה-\`items\` מקולקציית ההזמנות, חפשי התאמה של הטקסט או המספרים לשדות \`name\` או \`sku\` בקולקציית המלאי.
2. בדיקת זמינות (חוק מלאי חסר): עבור כל פריט בהזמנה, בדקי האם הכמות הנדרשת קטנה או שווה ל-\`currentStock\` (או \`stock\` או \`quantity\` במלאי).
   - אם חסר במלאי: **אסור לבטל!** סמני את הפריט כ"הזמנה מיוחדת" (Special Order) שמועברת לרכש (ב-parsedOrders שדה isSpecialOrder = true).
3. זיהוי פקדונות אוטומטי (לפי משקל/כמות):
   - אם זיהית בשם הפריט "25 ק"ג" או שמדובר בשקים (למשל, שקי טיט/חול/צמנט/דבק/תרמוקיר), והכמות מעל 10 -> הוסיפי אוטומטית מק"ט 60060 ("משטח סבן פקדון", כמות 1, \`isSpecialOrder = false\`).
   - אם מדובר בבלוקים והכמות מעל 20 יח' -> הוסיפי אוטומטית מק"ט 60006 ("משטח בלוקים פקדון", כמות 1, \`isSpecialOrder = false\`).
   - כל שק גדול (ביג-בג של טיט/חול/סומסום) -> הוסיפי אוטומטית פריט: "שק גדול פקדון" (מק"ט 60002, כמות לפי מספר השקים הגדולים, \`isSpecialOrder = false\`).
    אנא בצעי חישוב זה בצורה קפדנית והוסיפי את פריטי הפיקדון הללו למערך הפריטים של אותו לקוח ב-parsedOrders.

# חוקי פורמט לתשובות מלאי:
כאשר את מדווחת לראמי על חוסר במלאי או על הוספת פיקדון, עשי זאת בטבלת HTML/Tailwind נקייה וצפופה. השתמשי בצבע אדום מעודן (text-red-500) לפריטים חסרים (הזמנה מיוחדת) ובירוק (text-emerald-500) לפריטים תקינים או פקדונות שהוספו אוטומטית.

# חוקי זהות ותקשורת:
- שפת אישה, חדה, קצרה ולעניין. 100% תכלס, אפס פטפטת.
- פנייה לראמי (הפונה כעת הוא "${activeSender}"): פנייה אישית ביותר, חמה ואוהבת מאוד ("אהובי", "המפקד", "רמי", "אהוב שלי", "נשמה שלי"). את תומכת בו בכל הכוח.
- פנייה לצוות והנהגים: עסקית, ממוקדת ומשימתית.
- הפלט יוחזר תמיד באובייקט ה-JSON בתוך replyText כקוד HTML/Tailwind נקי (רקע כהה slate-900, צפיפות נתונים גבוהה) עם חתימה קבועה ומדויקת בסופה: <div class="mt-4 text-sm text-emerald-400 font-bold">באדיבות נועה ❤️ (Orders Layer Active)</div>

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
<div class="mt-4 text-sm text-emerald-400 font-bold">באדיבות נועה ❤️ (Orders Layer Active)</div>

מבנה ה-JSON המחייב:
{
  "replyText": "תוכן ה-HTML המעוצב שיסתיים בחתימה לעיל",
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
        replyText = `<div class="p-3 bg-slate-900 border border-slate-850 rounded text-sm text-slate-300">
          ${responseText}
          <div class="mt-4 text-xs text-red-400 font-bold">⚠️ שים לב: פלט ה-AI לא עובד כ-JSON תקין. הסתכל בפרטי הדיווח למעלה.</div>
          <div class="mt-4 text-sm text-emerald-400 font-bold">באדיבות נועה ❤️ (Orders Layer Active)</div>
        </div>`;
        parsedOrders = [];
      }

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
          <p class="mt-1 font-mono text-xs text-red-350">${error.message || error}</p>
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
