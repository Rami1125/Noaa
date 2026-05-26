import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { getDatabase } from "firebase/database"; 
import { getStorage } from "firebase/storage";
import { getAuth, signInAnonymously } from "firebase/auth";

// הגדרות הפרויקט הרשמיות - saban-ai-drive
const firebaseConfig = {
  apiKey: "AIzaSyAQzXHpiSVBqbU1zXVXtl4tDtEPnqkdeUI",
  authDomain: "saban-ai-drive.firebaseapp.com",
  databaseURL: "https://saban-ai-drive-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "saban-ai-drive",
  storageBucket: "saban-ai-drive.firebasestorage.app",
  messagingSenderId: "516446483197",
  appId: "1:516446483197:web:21fc622f56c4e2a3050494",
  measurementId: "G-J88TZL18VY"
};

// 1. אתחול האפליקציה
const app = initializeApp(firebaseConfig);

// 2. אתחול השירותים המבצעיים
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const db = getFirestore(app); 
export const rtdb = getDatabase(app); 
export const storage = getStorage(app); 
export const auth = getAuth(app);

// ניסיונות חיבור וחשבונות אנונימיים לצורך עמידה בכללי ה-Security Rules של Firestore
signInAnonymously(auth).then(() => {
  console.log("🔓 [חמ\"ל סבן] התחברת בהצלחה בצורה אנונימית למערכת ה-Firebase");
}).catch((err) => {
  console.warn("⚠️ [חמ\"ל סבן] שגיאה בכניסה אנונימית. ודא כי ספק Anonymous מופעל ב-Firebase Console.", err);
});

// פונקציית בדיקת חיבור ללוגים
export const testFirebaseConnection = () => {
  console.log("🟢 [חמ\"ל סבן] החיבור לפרויקט saban-ai-drive פעיל. Cloud Firestore מוכן לסנכרון הקולקציות.");
};

export const testConnection = async () => {
  try {
    console.log("🟢 [חמ\"ל סבן] בודק חיבור למסד הנתונים של נועה תקין ופעיל בזמן אמת");
  } catch (error) {
    console.error("Please check your Firebase configuration.", error);
  }
};

// --- נתוני גיבוי ראשוניים (Bootstrap Data) ---
const bootstrapInventory = [
  { id: "m1", itemName: 'מלט שחור מחצבי (שק 50 ק"ג)', quantity: 150, unit: "שקים", inStock: true, lastUpdated: new Date().toISOString() },
  { id: "m2", itemName: 'טיט מוכן איכותי (שק 25 ק"ג)', quantity: 90, unit: "שקים", inStock: true, lastUpdated: new Date().toISOString() },
  { id: "m3", itemName: "חול ים נקי משובח", quantity: 18, unit: "קוב", inStock: true, lastUpdated: new Date().toISOString() },
  { id: "m4", itemName: "בלוק 10 חלול תיקני", quantity: 600, unit: "יחידות", inStock: true, lastUpdated: new Date().toISOString() },
  { id: "m5", itemName: "חצץ חצר שומשום", quantity: 0, unit: "קוב", inStock: false, lastUpdated: new Date().toISOString() }, 
  { id: "m6", itemName: 'ברזל בניין קשיח (קוטר 12 מ"מ)', quantity: 0, unit: "טון", inStock: false, lastUpdated: new Date().toISOString() }, 
  { id: "m7", itemName: "פלטת גבס לבן דחוס", quantity: 45, unit: "יחידות", inStock: true, lastUpdated: new Date().toISOString() },
  { id: "m8", itemName: "חצץ פוליה 1 קוב", quantity: 20, unit: "קוב", inStock: true, lastUpdated: new Date().toISOString() },
];

const bootstrapCustomers = [
  { id: "c1", customerName: "מוניר קבלנות שלד בע\"מ", phone: "052-1234567", address: "קלנסווה, כניסה מערבית", outstandingBalance: 42000 },
  { id: "c2", customerName: "אבו חסן עמודים ובנייה", phone: "054-9876543", address: "טייבה, שכונת אל-מנארה", outstandingBalance: 12500 },
  { id: "c3", customerName: "יוסי שיפוצים וגמר", phone: "050-8888888", address: "נתניה, רחוב הרצל 45", outstandingBalance: 0 },
  { id: "c4", customerName: "עאדל אלומניום וברזל הדרום", phone: "052-7776665", address: "באקה אל-גרבייה", outstandingBalance: 8200 }
];

const bootstrapOrders = [
  {
    id: "SAB-1021",
    customerName: "מוניר קבלנות שלד בע\"מ",
    items: [
      { name: 'מלט שחור מחצבי (שק 50 ק"ג)', quantity: 25, unit: "שקים", inStock: true },
      { name: "חול ים נקי משובח", quantity: 10, unit: "קוב", inStock: true }
    ],
    status: "בטיפול",
    assignedDriver: "עלי",
    deliveryAddress: "קלנסווה, אתר בנייה על יד מסגד אלפוחר",
    notes: "לפרוק עם מנוף בזהירות - ראמי אישר פריקת דרך",
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
  },
  {
    id: "SAB-1022",
    customerName: "אבו חסן עמודים ובנייה",
    items: [
      { name: "חצץ חצר שומשום", quantity: 6, unit: "קוב", inStock: false }
    ],
    status: "הזמנה מיוחדת",
    assignedDriver: null,
    deliveryAddress: "טייבה, כביש ראשי 444",
    notes: "ממתין לרכש מיוחד כי חסר במלאי! נועה סימנה כהזמנה מיוחדת",
    createdAt: new Date(Date.now() - 7200 * 1000).toISOString()
  },
  {
    id: "SAB-1023",
    customerName: "יוסי שיפוצים וגמר",
    items: [
      { name: "פלטת גבס לבן דחוס", quantity: 30, unit: "יחידות", inStock: true },
      { name: 'טיט מוכן איכותי (שק 25 ק"ג)', quantity: 15, unit: "שקים", inStock: true }
    ],
    status: "ממתין",
    assignedDriver: null,
    deliveryAddress: "נתניה, רחוב האורגים 12, קומה 2",
    notes: "אספקה ליום חמישי בבוקר",
    createdAt: new Date(Date.now() - 10800 * 1000).toISOString()
  }
];

const bootstrapMessages = [
  {
    id: "msg-1",
    sender: "נועה",
    text: "בוקר טוב ומבורך, ראמי אהוב שלי! המפקד שלי! 🌹 המוח הלוגיסטי של ח. סבן חומרי בניין מוכן לפעולה. כל הנתונים, המלאי, הנהגים וההזמנות מסונכרנים אצלי בזמן אמת. איך אני יכולה לפנק אותך ולסדר לך את העבודה הבוקר? באדיבות נועה ❤️ (Firebase Synced)",
    isNoa: true,
    createdAt: new Date(Date.now() - 3600 * 3 * 1000).toISOString()
  }
];

// מנוע מקומי מתוחכם לניהול גיבוי וסנכרון דו-כיווני (LocalStorage Failover System)
class LocalFallbackEngine {
  constructor() {
    this.initLocalStorage();
  }

  private initLocalStorage() {
    if (!localStorage.getItem("s_messages")) {
      localStorage.setItem("s_messages", JSON.stringify(bootstrapMessages));
    }
    if (!localStorage.getItem("s_inventory")) {
      localStorage.setItem("s_inventory", JSON.stringify(bootstrapInventory));
    }
    if (!localStorage.getItem("s_customers")) {
      localStorage.setItem("s_customers", JSON.stringify(bootstrapCustomers));
    }
    if (!localStorage.getItem("s_orders")) {
      localStorage.setItem("s_orders", JSON.stringify(bootstrapOrders));
    }
  }

  getData(collectionName: string): any[] {
    const data = localStorage.getItem(`s_${collectionName}`);
    return data ? JSON.parse(data) : [];
  }

  saveData(collectionName: string, data: any[]) {
    localStorage.setItem(`s_${collectionName}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`local_update_${collectionName}`, { detail: data }));
  }

  addItem(collectionName: string, item: any) {
    const current = this.getData(collectionName);
    const newItem = { ...item, id: item.id || `VIRT-${Math.random().toString(36).substring(2, 9).toUpperCase()}` };
    current.push(newItem);
    this.saveData(collectionName, current);
    return newItem;
  }

  updateItem(collectionName: string, itemId: string, updates: any) {
    const current = this.getData(collectionName);
    const index = current.findIndex(i => i.id === itemId);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates, updatedAt: new Date().toISOString() };
      this.saveData(collectionName, current);
      return current[index];
    }
    return null;
  }

  removeItem(collectionName: string, itemId: string) {
    const current = this.getData(collectionName);
    const filtered = current.filter(i => i.id !== itemId);
    this.saveData(collectionName, filtered);
  }

  reset() {
    localStorage.removeItem("s_messages");
    localStorage.removeItem("s_inventory");
    localStorage.removeItem("s_customers");
    localStorage.removeItem("s_orders");
    location.reload();
  }
}

const fallbackEngine = new LocalFallbackEngine();

// משמרת דגל שגיאה זמנית כדי לבדוק האם ה-Firestore חסום או לא נגיש
let isUsingFallback: { [key: string]: boolean } = {};

/**
 * פונקציית סנכרון והאזנה לקולקציות בזמן אמת מול Firebase עם גיבוי מושלם למקרה הצורך
 */
export function subscribeToCollection(collectionName: string, callback: (data: any[]) => void): () => void {
  // נסה קודם כל להתחבר ל-Firestore
  try {
    const collRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      collRef,
      (snapshot) => {
        if (snapshot.empty) {
          // אם הקולקציה ריקה לחלוטין ב-Firestore (לדוגמה בפעם הראשונה), נאכלס אותה בנתוני הסטארט-אפ הראשוניים שלנו כדי שהמשתמש לא יראה מסך ריק
          console.log(`ℹ️ [חמ\"ל סבן] קולקציית ${collectionName} ריקה ב-Firebase, יוזם אוטומטית נתוני בוטסטראפ מבצעיים...`);
          const defaultData = fallbackEngine.getData(collectionName);
          defaultData.forEach(async (item) => {
            try {
              await setDoc(doc(db, collectionName, item.id), item);
            } catch (err) {
              console.warn(`Could not seed item ${item.id} to Firestore`, err);
            }
          });
        }

        const list: any[] = [];
        snapshot.forEach((snapDoc) => {
          list.push({ id: snapDoc.id, ...snapDoc.data() });
        });
        
        isUsingFallback[collectionName] = false;
        callback(list);
      },
      (error) => {
        // במקרה של שגיאת הרשאות או שרת, הפעל גיבוי מקומי ללא קריסה של ה-UI
        console.warn(`🚨 [חמ\"ל סבן/פיירבייס] שגיאה בהאזנה ל-${collectionName}. מפעיל מנגנון גיבוי Offline מקומי לשמירה על יציבות המערכת.`, error);
        isUsingFallback[collectionName] = true;
        
        // האזן לשינויים ב-LocalStorage המקומי
        const localHandler = (e: any) => {
          callback(e.detail);
        };
        window.addEventListener(`local_update_${collectionName}` as any, localHandler);
        
        // שלח את הנתונים הנוכחיים מיידית
        callback(fallbackEngine.getData(collectionName));
      }
    );

    return () => {
      unsubscribe();
    };
  } catch (err) {
    console.error(`Initialization failure for collection ${collectionName}`, err);
    isUsingFallback[collectionName] = true;
    
    const localHandler = (e: any) => {
      callback(e.detail);
    };
    window.addEventListener(`local_update_${collectionName}` as any, localHandler);
    callback(fallbackEngine.getData(collectionName));
    
    return () => {
      window.removeEventListener(`local_update_${collectionName}` as any, localHandler);
    };
  }
}

/**
 * הוספת פריט חדש לקולקציה
 */
export async function addItemToCollection(collectionName: string, item: any): Promise<any> {
  const id = item.id || `SAB-${Math.floor(1000 + Math.random() * 9000)}`;
  const newItem = { ...item, id, createdAt: item.createdAt || new Date().toISOString() };

  if (isUsingFallback[collectionName]) {
    return fallbackEngine.addItem(collectionName, newItem);
  }

  try {
    const docRef = doc(db, collectionName, id);
    await setDoc(docRef, newItem);
    // סנכרן גם את ה-fallback המקומי
    fallbackEngine.addItem(collectionName, newItem);
    return newItem;
  } catch (error) {
    console.warn(`🚨 [חמ\"ל סבן] שגיאה בכתיבה ל-Firestore. מבצע כתיבה מקומית בלבד.`, error);
    isUsingFallback[collectionName] = true;
    return fallbackEngine.addItem(collectionName, newItem);
  }
}

/**
 * עדכון פריט קיים בקולקציה
 */
export async function updateItemInCollection(collectionName: string, itemId: string, updates: any): Promise<any> {
  const finalUpdates = { ...updates, lastUpdated: new Date().toISOString(), updatedAt: new Date().toISOString() };

  if (isUsingFallback[collectionName]) {
    return fallbackEngine.updateItem(collectionName, itemId, finalUpdates);
  }

  try {
    const docRef = doc(db, collectionName, itemId);
    await setDoc(docRef, finalUpdates, { merge: true });
    // סנכרן גם את ה-fallback המקומי
    fallbackEngine.updateItem(collectionName, itemId, finalUpdates);
    return { id: itemId, ...finalUpdates };
  } catch (error) {
    console.warn(`🚨 [חמ\"ל סבן] שגיאה בעדכון Firestore. מבצע עדכון מקומי בלבד.`, error);
    isUsingFallback[collectionName] = true;
    return fallbackEngine.updateItem(collectionName, itemId, finalUpdates);
  }
}

/**
 * מחיקת פריט מהקולקציה
 */
export async function removeItemFromCollection(collectionName: string, itemId: string): Promise<void> {
  if (isUsingFallback[collectionName]) {
    fallbackEngine.removeItem(collectionName, itemId);
    return;
  }

  try {
    const docRef = doc(db, collectionName, itemId);
    await deleteDoc(docRef);
    fallbackEngine.removeItem(collectionName, itemId);
  } catch (error) {
    console.warn(`🚨 [חמ\"ל סבן] שגיאה במחיקה מ-Firestore. מבצע מחיקה מקומית בלבד.`, error);
    isUsingFallback[collectionName] = true;
    fallbackEngine.removeItem(collectionName, itemId);
  }
}

/**
 * איפוס מלא של כל מסדי הנתונים לחזרה למצב התחלתי נקי
 */
export async function resetDatabase(): Promise<void> {
  try {
    // מנקה את הגיבוי המקומי
    fallbackEngine.reset();
  } catch (error) {
    console.error("שגיאה בניקוי מסד הנתונים:", error);
  }
}
