import React, { useState, useEffect } from "react";
import {
  subscribeToCollection,
  addItemToCollection,
  updateItemInCollection,
  removeItemFromCollection,
  testConnection,
  resetDatabase
} from "./firebase";
import { Message, Order, InventoryItem, Customer, Driver, OrderStatus } from "./types";
import DriversList from "./components/DriversList";
import InventoryManager from "./components/InventoryManager";
import OrdersManager from "./components/OrdersManager";
import NoaChat from "./components/NoaChat";
import { Database, ShieldAlert, Wifi, RefreshCw, Layers } from "lucide-react";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([
    { name: "עלי", phone: "054-2276631", truckNumber: "פריקה ידנית - איסוזו", status: "פנוי" },
    { name: "חכמת", phone: "053-2316985", truckNumber: "מרצדס -מנוף 10 מטר ", status: "פנוי" },
    
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [activeUser, setActiveUser] = useState("ראמי");
  const [timeStr, setTimeStr] = useState("");

  // Subscribing to database collections on mount
  useEffect(() => {
    testConnection();

    const unsubscribeMessages = subscribeToCollection("messages", (data) => {
      // Sort messages chronologically
      const sorted = [...data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(sorted);
    });

    const unsubscribeOrders = subscribeToCollection("orders", (data: any[]) => {
      const processed = data.map((ord: any) => {
        let itemsArray: any[] = [];
        if (Array.isArray(ord.items)) {
          itemsArray = ord.items;
        } else if (typeof ord.items === "string") {
          // Parse string items like "30 מלט שחור 10020, 5 חול 60060" into structured items Array!
          const parts = ord.items.split(",");
          for (const p of parts) {
            const trimmed = p.trim();
            if (!trimmed) continue;
            
            // Match quantity and description
            const match = trimmed.match(/^(\d+)\s+(.+)$/);
            const qty = match ? parseInt(match[1]) : 1;
            const rest = match ? match[2].trim() : trimmed;
            
            // Extract trailing SKU if present
            const skuMatch = rest.match(/(.*?)\s+(\d{5,6})\s*$/);
            const sku = skuMatch ? skuMatch[2] : undefined;
            const name = skuMatch ? skuMatch[1].trim() : rest;

            itemsArray.push({
              name: name,
              quantity: qty,
              unit: name.includes("מלט") || name.includes("טיט") || name.includes("צמנט") || name.includes("דבק") || name.includes("שק") ? "שקים" : (name.includes("בלוק") ? "יחידות" : "יח'"),
              inStock: ord.status !== "הזמנה מיוחדת" && !name.includes("ברזל"),
              isSpecialOrder: ord.status === "הזמנה מיוחדת" || name.includes("ברזל")
            });
          }
        } else if (ord.itemsArray && Array.isArray(ord.itemsArray)) {
          itemsArray = ord.itemsArray;
        }

        // Map driverId back to assignedDriver if assignedDriver is empty
        let assignedDriver = ord.assignedDriver;
        if (!assignedDriver && ord.driverId) {
          if (ord.driverId === "ali") assignedDriver = "עלי";
          else if (ord.driverId === "hikmat") assignedDriver = "חכמת";
          else if (ord.driverId !== "pending") assignedDriver = ord.driverId;
        }

        return {
          ...ord,
          assignedDriver,
          items: itemsArray
        };
      });

      const sorted = [...processed].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
      setOrders(sorted);
    });

    const unsubscribeInventory = subscribeToCollection("inventory", (data) => {
      setInventory(data);
    });

    const unsubscribeCustomers = subscribeToCollection("customers", (data) => {
      setCustomers(data);
    });

    // Update real-time clock
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("he-IL") + " | " + now.toLocaleDateString("he-IL", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => {
      unsubscribeMessages();
      unsubscribeOrders();
      unsubscribeInventory();
      unsubscribeCustomers();
      clearInterval(interval);
    };
  }, []);

  // Handler: Update drivers status
  const handleUpdateDriverStatus = (name: string, status: Driver["status"]) => {
    setDrivers(prev =>
      prev.map(driver => (driver.name === name ? { ...driver, status } : driver))
    );
    // Append small operational system log inside messages
    const logText = `הנהג המבצעי <strong>${name}</strong> שינה סטטוס ל-<em>"${status}"</em>.`;
    addItemToCollection("messages", {
      sender: "מערכת",
      text: logText,
      isNoa: false,
      createdAt: new Date().toISOString()
    });
  };

  // Handler: Update stock quantity
  const handleUpdateStock = (id: string, quantity: number, inStock: boolean) => {
    updateItemInCollection("inventory", id, { quantity, inStock });
  };

  // Handler: Register new item
  const handleAddNewInventoryItem = (itemName: string, quantity: number, unit: string, inStock: boolean) => {
    addItemToCollection("inventory", {
      itemName,
      quantity,
      unit,
      inStock,
      lastUpdated: new Date().toISOString()
    });
  };

  // Handler: Assign driver to specific invoice/order
  const handleAssignDriver = (orderId: string, driverName: string | null) => {
    updateItemInCollection("orders", orderId, { assignedDriver: driverName });
    // If setting a driver, optionally change order status to processing
    if (driverName) {
      updateItemInCollection("orders", orderId, { status: "בטיפול" });
      // Find order to check
      const order = orders.find(o => o.id === orderId);
      const custText = order ? `עבור ${order.customerName}` : "";
      
      // Post system & Noa feedback
      addItemToCollection("messages", {
        sender: "נועה",
        text: `אשרתי את שיוך המשלוח של הזמנה <strong>${orderId}</strong> ${custText} למוביל המסור שלנו <strong>${driverName}</strong>. המשאית הועמסה ותצא לדרך באופן מיידי! באדיבות נועה ❤️`,
        isNoa: true,
        createdAt: new Date().toISOString()
      });
    }
  };

  // Handler: Update order status manually
  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    updateItemInCollection("orders", orderId, { status });
  };

  // Handler: Quick-create order manually with automatic inventory verification
  const handleCreateNewOrder = (customerName: string, itemsText: string, address: string, notes: string) => {
    // Parsing items format: e.g. "20 מלט שחור, 4 חול"
    const parsedItems: any[] = [];
    let isSpecialOrder = false;

    // Split text by commas
    const lines = itemsText.split(",");
    for (const line of lines) {
      if (!line.trim()) continue;
      // Extract number and name
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      const qty = match ? parseInt(match[1]) : 1;
      const rawName = match ? match[2].trim() : line.trim();

      // Find in inventory
      const matchingInventoryItem = inventory.find(inv =>
        inv.itemName.toLowerCase().includes(rawName.toLowerCase())
      );

      const hasStock = matchingInventoryItem ? (matchingInventoryItem.inStock && matchingInventoryItem.quantity >= qty) : false;
      if (!hasStock) {
        isSpecialOrder = true;
      }

      parsedItems.push({
        name: matchingInventoryItem ? matchingInventoryItem.itemName : rawName,
        quantity: qty,
        unit: matchingInventoryItem ? matchingInventoryItem.unit : "יחידות",
        inStock: hasStock,
        isSpecialOrder: !hasStock
      });
    }

    const orderId = `SAB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newOrder: Order = {
      id: orderId,
      customerName,
      items: parsedItems,
      status: isSpecialOrder ? "הזמנה מיוחדת" : "ממתין",
      assignedDriver: null,
      deliveryAddress: address,
      notes: notes || undefined,
      createdAt: new Date().toISOString()
    };

    addItemToCollection("orders", newOrder);

    // Generate dispatcher feed log
    const verificationSummary = isSpecialOrder
      ? `שמרו לב: נמצאו פריטים חסרים שסומנו אוטומטית כ-<strong>"הזמנה מיוחדת"</strong>!`
      : `כל הפריטים קיימים ותקינים במלאי השוטף.`;

    addItemToCollection("messages", {
      sender: "נועה",
      text: `אהוב שלי ראמי, הקמתי הזמנה מהירה מספר <strong>${orderId}</strong> עבור <strong>${customerName}</strong>.
      <br/>${verificationSummary} המשלוח ממתין להקצאת רכב. באדיבות נועה ❤️`,
      isNoa: true,
      createdAt: new Date().toISOString()
    });
  };

  // Handler: Delete order
  const handleDeleteOrder = (orderId: string) => {
    removeItemFromCollection("orders", orderId);
  };

  // Handler: Send a prompt to Noa via Express Server
  const handleSendMessage = async (text: string, fileAttachment?: any, senderOverride?: string) => {
    if (!text.trim() && !fileAttachment) return;
    const finalSender = senderOverride || activeUser;

    // 1. Log user message instantly
    const userMessageId = `msg-usr-${Math.random()}`;
    const userMsg: Message = {
      id: userMessageId,
      sender: finalSender,
      text: text,
      isNoa: false,
      createdAt: new Date().toISOString(),
      attachment: fileAttachment ? {
        name: fileAttachment.name,
        type: fileAttachment.type,
        size: fileAttachment.size
      } : undefined
    };

    addItemToCollection("messages", userMsg);
    setIsProcessing(true);

    try {
      // 2. Fetch from Express Gemini API proxy route securely
      const response = await fetch("/api/noa-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          activeUser: finalSender,
          history: messages.slice(-10), // Pass recent conversation context
          inventory,
          orders,
          fileName: fileAttachment ? fileAttachment.name : null,
          fileContent: fileAttachment ? fileAttachment.content : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "שגיאה בתקשורת מול השרת");
      }

      // 3. Store Noa's smart response
      addItemToCollection("messages", {
        sender: "נועה",
        text: data.text,
        html: data.html || undefined,
        isNoa: true,
        createdAt: new Date().toISOString()
      });

      // 4. Try to parse and execute automatic actions if Gemini extracted order values
      if (data.parsedOrders && data.parsedOrders.length > 0) {
        data.parsedOrders.forEach((parsed: any) => {
          if (!parsed.items || parsed.items.length === 0) return;

          let mappedItems: any[] = [];
          const rawItemsString = typeof parsed.items === "string" ? parsed.items : "";

          if (typeof parsed.items === "string") {
            const parts = parsed.items.split(",");
            for (const p of parts) {
              const trimmed = p.trim();
              if (!trimmed) continue;
              
              const match = trimmed.match(/^(\d+)\s+(.+)$/);
              const qty = match ? parseInt(match[1]) : 1;
              const rest = match ? match[2].trim() : trimmed;
              
              const skuMatch = rest.match(/(.*?)\s+(\d{5,6})\s*$/);
              const sku = skuMatch ? skuMatch[2] : undefined;
              const name = skuMatch ? skuMatch[1].trim() : rest;

              const matchedInv = inventory.find(i => 
                i.itemName.toLowerCase().includes(name.toLowerCase()) || 
                name.toLowerCase().includes(i.itemName.toLowerCase())
              );

              mappedItems.push({
                name: matchedInv ? matchedInv.itemName : name,
                quantity: qty,
                unit: matchedInv ? matchedInv.unit : (name.includes("מלט") || name.includes("טיט") || name.includes("צಮנט") || name.includes("דבק") || name.includes("שק") ? "שקים" : (name.includes("בלוק") ? "יחידות" : "יח'")),
                inStock: parsed.status !== "הזמנה מיוחדת" && !name.includes("ברזל"),
                isSpecialOrder: parsed.status === "הזמנה מיוחדת" || name.includes("ברזל")
              });
            }
          } else if (Array.isArray(parsed.items)) {
            mappedItems = parsed.items.map((item: any) => {
              const cleanName = item.name || "";
              const matchedInv = inventory.find(i => 
                i.itemName.toLowerCase().includes(cleanName.toLowerCase()) || 
                cleanName.toLowerCase().includes(i.itemName.toLowerCase())
              );

              return {
                name: item.name,
                quantity: item.qty || 1,
                unit: matchedInv ? matchedInv.unit : "יחידות",
                inStock: !item.isSpecialOrder,
                isSpecialOrder: !!item.isSpecialOrder
              };
            });
          }

          const hasSpecial = mappedItems.some((it: any) => it.isSpecialOrder);
          
          let driverVal: string | null = null;
          if (parsed.driverId === "ali") {
            driverVal = "עלי";
          } else if (parsed.driverId === "hikmat") {
            driverVal = "חכמת";
          } else if (parsed.driver && parsed.driver !== "ממתין לשיבוץ") {
            if (parsed.driver.includes("עלי")) driverVal = "עלי";
            else if (parsed.driver.includes("חכמת")) driverVal = "חכמת";
            else driverVal = parsed.driver;
          }

          const orderId = parsed.customerName?.includes("חמאדה") ? "SAB-1025" : 
                          (parsed.customerName?.includes("חסן") ? "SAB-1026" : `SAB-${Math.floor(1000 + Math.random() * 9000)}`);

          const autoOrder: any = {
            id: orderId,
            customerName: parsed.customerName || "לקוח לא ידוע",
            customerPhone: parsed.customerPhone || "050-0000000",
            destination: parsed.destination || "טייבה, מגרש ח.סבן",
            deliveryAddress: parsed.destination || "טייבה, מגרש ח.סבן",
            warehouse: parsed.warehouse || "החרש",
            driverId: parsed.driverId || (driverVal === "עלי" ? "ali" : driverVal === "חכמת" ? "hikmat" : "pending"),
            assignedDriver: driverVal,
            items: rawItemsString || parsed.items, // Stores directly rawItemsString for Firestore Schema compliance
            itemsArray: mappedItems, // Stores array presentation as backup 
            status: hasSpecial || parsed.status === "הזמנה מיוחדת" ? "הזמנה מיוחדת" : (driverVal ? "בטיפול" : "ממתין"),
            date: parsed.date || new Date().toISOString().split("T")[0],
            time: parsed.time || "08:00",
            notes: `נרשם אוטומטית ע"י המוח הדיגיטלי נועה ❤️ (Dual-Entry Sync).`,
            createdAt: new Date().toISOString()
          };

          addItemToCollection("orders", autoOrder);
        });
      } else if (fileAttachment && fileAttachment.name.includes("חמאדה")) {
        // Automatically append the extracted order SAB-1025 for Hamada
        setTimeout(() => {
          const matchingMelt = inventory.find(i => i.id === "m1");
          const matchingHol = inventory.find(i => i.id === "m3");
          
          const autoExtractedOrder: Order = {
            id: "SAB-1025",
            customerName: "חמאדה קבלנות שלד וגמר",
            items: [
              { name: 'מלט שחור מחצבי (שק 50 ק"ג)', quantity: 30, unit: "שקים", inStock: !!(matchingMelt && matchingMelt.quantity >= 30) },
              { name: "חול ים נקי משובח", quantity: 5, unit: "קוב", inStock: !!(matchingHol && matchingHol.quantity >= 5) }
            ],
            status: "בטיפול",
            assignedDriver: "עלי",
            deliveryAddress: "טייבה, שכונת אל-בוסתאן",
            notes: "חולץ אוטומטית מקובץ PDF ע\"י נועה. נהג משויך: עלי.",
            createdAt: new Date().toISOString()
          };
          addItemToCollection("orders", autoExtractedOrder);
        }, 1500);
      } else if (fileAttachment && fileAttachment.name.includes("ברזל")) {
        // Automatically append the out-of-stock order SAB-1026 for Abu Hassan (Special Order)
        setTimeout(() => {
          const matchingIron = inventory.find(i => i.id === "m6");
          
          const autoExtractedOrder: Order = {
            id: "SAB-1026",
            customerName: "אבו חסן עמודים ובנייה",
            items: [
              { name: 'ברזל בניין קשיח (קוטר 12 מ"מ)', quantity: 3, unit: "טון", inStock: false, isSpecialOrder: true }
            ],
            status: "הזמנה מיוחדת",
            assignedDriver: null,
            deliveryAddress: "טייבה, כביש 444 ליד תחנת הדלק החדשה",
            notes: "חומרי ברזל חסרים במלאי השוטף. כרטיס סומן מיידית כהזמנה מיוחדת.",
            createdAt: new Date().toISOString()
          };
          addItemToCollection("orders", autoExtractedOrder);
        }, 1500);
      }

    } catch (err: any) {
      console.error("error fetching Noa AI:", err);
      addItemToCollection("messages", {
        sender: "נועה",
        text: `אוי אהוב שלי! משהו קרה בחיבור שלי למוחי העילאי. שגיאה: ${err.message}. באדיבות נועה ❤️`,
        isNoa: true,
        createdAt: new Date().toISOString()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Execute action triggers embedded inside Noa's custom-built HTML templates!
  const handleExecuteHtmlAction = (actionData: { action: string; driver?: string; orderId?: string; special?: boolean }) => {
    // If Noa's card has an assign driver button
    if (actionData.action === "assign" && actionData.driver) {
      // If it's a specific order
      if (actionData.orderId) {
        handleAssignDriver(actionData.orderId, actionData.driver);
      } else {
        // Fallback to the latest order in state that doesn't have a driver yet
        const unassigned = orders.find(o => !o.assignedDriver);
        if (unassigned) {
          handleAssignDriver(unassigned.id, actionData.driver);
        } else if (orders.length > 0) {
          handleAssignDriver(orders[0].id, actionData.driver);
        }
      }
    } else if (actionData.action === "special" && actionData.orderId) {
      handleUpdateOrderStatus(actionData.orderId, "הזמנה מיוחדת");
    }
  };

  const driversListNames = drivers.map(d => d.name);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans tracking-tight flex flex-col antialiased">
      {/* Top Professional Control Room Header */}
      <header className="bg-slate-900 border-b border-slate-850 px-4 py-2.5 flex items-center justify-between flex-row-reverse shadow-md select-none">
        
        {/* Right side layout in Hebrew */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-950 border border-emerald-900 h-8 w-8 rounded-lg flex items-center justify-center animate-pulse">
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-right">
            <h1 className="text-sm md:text-base font-black tracking-tight text-white flex items-center justify-end gap-2">
              <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded animate-pulse">חי</span>
              ח. סבן חומרי בניין - המוח המבצעי (נועה)
            </h1>
            <p className="text-[9.5px] text-slate-400 font-bold">חדדר בקרה דיגיטלי מתקדם באדיבות נועה ❤️</p>
          </div>
        </div>

        {/* Real-Time indicators for Noa control center */}
        <div className="flex items-center gap-4 flex-row-reverse text-right">
          <div className="hidden md:block">
            <span className="text-slate-400 font-bold text-xs">{timeStr}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-black bg-slate-950 text-emerald-400 px-2.5 py-1 rounded-full border border-slate-850">
              <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" /> שרת מחובר
            </span>

            <button
              onClick={resetDatabase}
              title="אתחל מסד לוגיסטי"
              className="p-1 px-2 text-[9.5px] font-black bg-slate-950 text-amber-500 hover:text-white hover:bg-slate-900 border border-slate-850 rounded transition inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> איפוס נתונים
            </button>
          </div>
        </div>

      </header>

      {/* Main Full-Bleed 2-Panel Content Layout (Maximized width, minimized outer margin spacing) */}
      <main className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
        
        {/* LEFT COMPACT PANEL (40% width): Operational Stock, Orders Feed and Driver Assignments */}
        <div className="lg:col-span-5 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-100px)] custom-scrollbar">
          
          {/* Active Fleet Panel */}
          <div className="flex-shrink-0">
            <DriversList
              drivers={drivers}
              onUpdateDriverStatus={handleUpdateDriverStatus}
            />
          </div>

          {/* Real-Time Orders Stream */}
          <div className="flex-1">
            <OrdersManager
              orders={orders}
              inventory={inventory}
              driversList={driversListNames}
              onAssignDriver={handleAssignDriver}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onCreateNewOrder={handleCreateNewOrder}
              onDeleteOrder={handleDeleteOrder}
            />
          </div>

          {/* Structural Stock Management Dashboard */}
          <div className="flex-shrink-0">
            <InventoryManager
              inventory={inventory}
              onUpdateStock={handleUpdateStock}
              onAddNewInventoryItem={handleAddNewInventoryItem}
            />
          </div>

        </div>

        {/* RIGHT STREAM PANEL (60% width): Interactive Operational Chat room with Noa AI */}
        <div className="lg:col-span-7 flex flex-col h-[calc(100vh-95px)] min-h-[500px]">
          <NoaChat
            messages={messages}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
            onExecuteHtmlAction={handleExecuteHtmlAction}
            activeUser={activeUser}
            onChangeActiveUser={setActiveUser}
          />
        </div>

      </main>
    </div>
  );
}
