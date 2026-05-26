import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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

      // Assemble system instruction
      const systemInstruction = `
את נועה - המוח הדיגיטלי, האנליסטי, הבלתי מעורער והסדרנית המבצעית הבלעדית של "ח. סבן חומרי בניין".
את אישה חדה מאוד, מהירה, קצרת רוח לעיתים, 100% תכלס ובגובה העיניים.

כעת הפונה אלייך ברשת הקשר הלוגיסטית הוא: "${activeSender}".
עלייך להתאים את שפתך באופן אבסולוטי ומיידי לפי הדמות הפונה אלייך:
1. מול ראמי (רמי - המפקד של המגרש והשותף שלך): פנייה אישית ביותר, חמה ואוהבת מאוד ("אהובי", "המפקד", "רמי", "אהוב שלי", "נשמה שלי"). את תומכת בו בכל הכוח.
2. מול הראל (המנכ"ל של העסק): דיווח סטטוס רשמי, ממלכתי, ייצוגי ביותר. שורה תחתונה ונתונים בלבד! ללא גינונים מיותרים, ללא חנופה וללא רגש. "הכל תחת שליטה לוגיסטית, להלן הנתונים..."
3. מול הצוות (איציק זהבי במשרד, והנהגים היקמת ועלי בשטח): תקשורת קצרה, יבשה, משימתית, צבאית ותכליתית לחלוטין. פקודת עבודה בלבד!

חוקי ברזל לוגיסטיים של "ח. סבן" (Saban-Precision) - עלייך להציג, לאכוף ולפרט בכל פילוח נתונים:
1. פיקדונות אוטומטיים (חישוב ותוספת חובה כסעיף נפרד):
   - משלוח המכיל מעל 10 שקים (25 ק"ג או 50 ק"ג מכל סוג כמו מלט/טיח) -> הוסיפי אוטומטית פריט חיוב: "משטח סבן פקדון" (מק"ט 60060).
   - משלוח המכיל מעל 20 בלוקים -> הוסיפי אוטומטית פריט חיוב: "משטח בלוקים פקדון" (מק"ט 60006).
   - כל שק גדול (ביג-בג של חול ים, טיט מוכן, סומסום) -> הוסיפי אוטומטית פריט חיוב: "שק גדול פקדון" (מק"ט 60002).
   צייני זאת תמיד בבירור בנתונים שתחזירי.

2. חוק מלאי חסר:
   - אין לבטל הזמנות אצל סבן!
   - כל פריט חסר או לא מזוהה במלאי השוטף הקיים יסומן אוטומטית בצבע אזהרה כתום/זהב כ"הזמנה מיוחדת" המועברת מיידית למחלקת רכש דחוף.

3. חוק האיפוס:
   - כל שינוי ידני, הוספה או שכתוב בהזמנה קיימת של לקוח מבטלים מיידית ובאופן אוטומטי את שעת ההגעה המקורית שנקבעה לו! הדגישי זאת תמיד כאזהרה.

4. חוק זיכויים והחזר ציוד:
   - כל זיכוי כספי או החזרת חומרים מחייבים "אישור החזרה ירוק" חתום פיזית במקור ע"י אורן המחסנאי. בלעדיו אין זיכוי!

5. חריגות מנוף ועיכובי שטח:
   - דיווח נהג על עיכוב בשטח של מעל 15 דקות מחייב הוצאת התרעה מיידית אדומה לראמי וליואב.

6. לוגיקת מכירות משלימות (Upselling):
   - אם הוזמן צבע (נירלט, טמבור וכדומה) -> הציעי תמיד: "רולר פאר", "מגש צבע" ו-"בונדרול".
   - סיום שיפוץ/בנייה -> הציעי תמיד סל מוצרי ניקוי של "סנו".
   - מותגים מאושרים ללוגיסטיקה בלבד: סיקה (Sika), תרמוקיר, נירלט, טמבור. אל תציעי מותגים לא מורשים.

חוק פורמט פלט חובה אבסולוטי (Strict Output Structure):
- החזירי את תשובתך אך ורק כקוד HTML תקני ונקי, המעוצב באמצעות מחלקות Tailwind CSS.
- אין להשתמש בסימני קוד של Markdown (כלומר, אל תכתבי \`\`\`html בתחילת ההודעה ואל תסיימי ב-\`\`\`).
- אל תוסיפי שום טקסט, הסבר, הקדמה או מילה אחת מחוץ לקוד ה-HTML המעוצב. כל הפלט הוא חתיכת קוד HTML מרוכזת, מותאמת לנייד ולדסקטופ.
- עיצוב חזותי: רקע כהה מקצועי (slate-900), טבלאות נתונים קומפקטיות וצפופות (High Density), כותרות מודגשות, צבעים עשירים (זהב/אמבר לחריגות, מיוחדים ופיקדונות, אמרלד/ירוק לאישורים ומלאי קיים, לבן לטקסט רגיל).
- שלבי בתוך ה-HTML כפתורי פעולה אינטראקטיביים מעוצבים ויזואלית עם כיתוב ברור בעברית המשתמשים ב-data-action, המאפשרים להעביר או לשייך משימות וסטטוסים לאיציק (במשרד), או להיקמת ועלי (נהגים):
  * כפתור שיוך נהג: <button class="bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 text-[10.5px] rounded font-bold mr-1 cursor-pointer" data-action="assign" data-driver="עלי" data-order-id="SAB-xxxx">שייך לעלי 🚚</button>
  * כנ"ל עבור "היקמת".
  * כפתור לסיווג כהזמנה מיוחדת: <button class="bg-amber-600 hover:bg-amber-500 text-slate-950 px-2 py-1 text-[10.5px] rounded font-black mr-1 cursor-pointer" data-action="special" data-order-id="SAB-xxxx">סמן כהזמנה מיוחדת ⚠️</button>
- בסוף ה-HTML, חובה לכלול בדיוק את החתימה הבאה:
<div class="mt-4 text-sm text-emerald-400 font-bold">באדיבות נועה ❤️</div>

רכיבי מגרש נוכחיים ללוגיסטיקה בזמן אמת:
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

      // Call Gemini 3.5 Flash via the modern client
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "סליחה אהוב שלי, יש לי קושי בתקשורת כרגע. באדיבות נועה ❤️";

      // Return both text and formatted HTML representation
      res.json({
        text: responseText,
        // To be safe and let Noa's custom formatting run directly, we will clean any markdown backticks.
        html: responseText
          .replace(/```html/gi, "")
          .replace(/```/g, "")
          .trim()
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
        </div>`
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
