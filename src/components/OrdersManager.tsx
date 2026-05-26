import React, { useState } from "react";
import { Order, OrderStatus, InventoryItem } from "../types";
import { ShoppingBag, Eye, UserPlus, Trash, MapPin, ClipboardList, CheckCircle2 } from "lucide-react";

interface OrdersManagerProps {
  orders: Order[];
  inventory: InventoryItem[];
  driversList: string[];
  onAssignDriver: (orderId: string, driverName: string | null) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onCreateNewOrder: (customerName: string, itemsText: string, address: string, notes: string) => void;
  onDeleteOrder: (orderId: string) => void;
}

export default function OrdersManager({
  orders,
  inventory,
  driversList,
  onAssignDriver,
  onUpdateOrderStatus,
  onCreateNewOrder,
  onDeleteOrder
}: OrdersManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [custName, setCustName] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !itemsText.trim()) return;
    onCreateNewOrder(custName.trim(), itemsText.trim(), address.trim() || "איסוף עצמי מהמגרש", notes.trim());
    setCustName("");
    setItemsText("");
    setAddress("");
    setNotes("");
    setShowAddForm(false);
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case "ממתין":
        return "bg-slate-800 text-slate-300 border-slate-700";
      case "בטיפול":
        return "bg-sky-950/40 text-sky-400 border-sky-900";
      case "נשלח":
        return "bg-emerald-950/40 text-emerald-400 border-emerald-900";
      case "הזמנה מיוחדת":
        return "bg-amber-950/50 text-amber-500 border-amber-900 animate-pulse";
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col h-full shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <h3 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag className="w-4 h-4 text-emerald-500" /> ניהול הזמנות ולוגיסטיקה
        </h3>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-[10px] bg-emerald-950 text-emerald-400 hover:bg-emerald-900 font-bold px-2 py-1 rounded inline-flex items-center gap-1 transition-colors"
        >
          {showAddForm ? "סגור" : "+ הזמנה מהירה"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateOrderSubmit} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg mb-2 text-right">
          <p className="text-[11px] text-emerald-400 font-extrabold mb-2">
            💫 יצירת הזמנה חדשה - המערכת תבדוק אוטומטית זמינות מול המלאי הקיים
          </p>
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">שם הלקוח / הקבלן</label>
              <input
                type="text"
                placeholder="למשל: סעד חומרי בניין..."
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-slate-700"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                פירוט פריטים (פריט וכמות)
              </label>
              <textarea
                rows={2}
                placeholder="לדוגמה: 50 מלט שחור, 4 קוב חול, 1 חצץ"
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-slate-700 font-bold"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">הערות למשלוח</label>
                <input
                  type="text"
                  placeholder="פריקה עם מנוף..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">כתובת אספקה</label>
                <input
                  type="text"
                  placeholder="קלנסווה, אתר במרכז..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-slate-700"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-1.5 rounded mt-2.5 transition"
          >
            אשר ובצע בדיקת מלאי אוטומטית
          </button>
        </form>
      )}

      {/* High Density Orders Feed */}
      <div className="flex-1 overflow-y-auto max-h-[440px] pr-1 space-y-2">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            אין הזמנות קיימות במשרד. שלח הודעה לנועה כדי ליצור הזמנה.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className={`bg-slate-950 border rounded-lg p-2.5 transition hover:border-slate-700 ${
                order.status === "הזמנה מיוחדת"
                  ? "border-amber-900 bg-amber-950/5"
                  : "border-slate-850"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono font-black">{order.id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-white">{order.customerName}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="bg-slate-900/60 p-1.5 rounded text-right space-y-1 my-1">
                <span className="text-[9px] font-black text-slate-500 block">פירוט הזמנה:</span>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-200 font-bold">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono">{item.quantity} {item.unit}</span>
                      {item.isSpecialOrder ? (
                        <span className="text-[9px] font-extrabold bg-amber-950 text-amber-500 px-1 rounded border border-amber-900">
                          הזמנה מיוחדת
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-500">✓ במלאי</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Addresses & Notes */}
              <div className="text-[10px] text-slate-400 space-y-0.5 mt-2">
                <div className="flex items-center justify-end gap-1 font-bold text-slate-350">
                  <span>{order.deliveryAddress}</span>
                  <MapPin className="w-3 h-3 text-slate-500 ml-0.5" />
                </div>
                {order.notes && (
                  <div className="text-right text-amber-500/80 italic text-[9px] mt-1 pr-1 border-r border-slate-800">
                    הערות: {order.notes}
                  </div>
                )}
              </div>

              {/* Actions, Driver and Delete */}
              <div className="flex items-center justify-between border-t border-slate-900 pt-2 mt-2 gap-2">
                <button
                  onClick={() => onDeleteOrder(order.id)}
                  title="בטל הזמנה"
                  className="bg-slate-900 hover:bg-red-950 text-slate-500 hover:text-red-400 p-1 rounded border border-slate-800 hover:border-red-900 transition"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-1">
                  <select
                    value={order.assignedDriver || ""}
                    onChange={(e) => onAssignDriver(order.id, e.target.value || null)}
                    className="bg-slate-900 text-slate-200 border border-slate-850 rounded px-1 text-[10px] font-black focus:outline-none focus:border-slate-700 h-6 text-right"
                  >
                    <option value="">-- בחר נהג להקצאה --</option>
                    {driversList.map((driver) => (
                      <option key={driver} value={driver}>
                        🚚 משוך לנהג {driver}
                      </option>
                    ))}
                  </select>

                  <select
                    value={order.status}
                    onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                    className="bg-slate-900 text-slate-200 border border-slate-850 rounded px-1 text-[10px] font-black focus:outline-none focus:border-slate-700 h-6 text-right"
                  >
                    <option value="ממתין">ממתין</option>
                    <option value="בטיפול">בטיפול</option>
                    <option value="נשלח">נשלח סופי</option>
                    <option value="הזמנה מיוחדת">הזמנה מיוחדת</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
