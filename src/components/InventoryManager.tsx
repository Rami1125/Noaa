import React, { useState } from "react";
import { InventoryItem } from "../types";
import { Package, Plus, Minus, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateStock: (id: string, quantity: number, inStock: boolean) => void;
  onAddNewInventoryItem: (itemName: string, quantity: number, unit: string, inStock: boolean) => void;
}

export default function InventoryManager({ inventory, onUpdateStock, onAddNewInventoryItem }: InventoryManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("שקים");

  const handleQtyChange = (item: InventoryItem, diff: number) => {
    const newQty = Math.max(0, item.quantity + diff);
    // If quantity is 0, item is out of stock automatically
    const inStock = newQty > 0;
    onUpdateStock(item.id, newQty, inStock);
  };

  const handleToggleStock = (item: InventoryItem) => {
    const newInStock = !item.inStock;
    const newQty = newInStock ? (item.quantity === 0 ? 10 : item.quantity) : 0;
    onUpdateStock(item.id, newQty, newInStock);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    onAddNewInventoryItem(newItemName.trim(), newItemQty, newItemUnit, newItemQty > 0);
    setNewItemName("");
    setNewItemQty(1);
    setShowAddForm(false);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col h-full shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <h3 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
          <Package className="w-4 h-4 text-emerald-500" /> בקרת מלאי חומרי בניין
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-[10px] bg-emerald-950 text-emerald-400 hover:bg-emerald-900 font-bold px-2 py-1 rounded inline-flex items-center gap-1 transition-colors"
        >
          {showAddForm ? "סגור" : "+ הוסף פריט"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateItem} className="bg-slate-950 border border-slate-800 p-2 rounded-lg mb-2 text-right">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">כמות התחלתית</label>
              <input
                type="number"
                min="0"
                value={newItemQty}
                onChange={(e) => setNewItemQty(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">שם הפריט במלאי</label>
              <input
                type="text"
                placeholder="לדוגמה: בלוק 15..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-slate-700"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">יחידת מידה</label>
              <select
                value={newItemUnit}
                onChange={(e) => setNewItemUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-slate-700 font-bold"
              >
                <option value="שקים">שקים</option>
                <option value="קוב">קוב</option>
                <option value="יחידות">יחידות</option>
                <option value="טון">טון</option>
                <option value="מטרים">מטרים</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-1 rounded mt-2 transition"
          >
            אשר והוסף לקטלוג המלאי
          </button>
        </form>
      )}

      {/* High Density Table */}
      <div className="flex-1 overflow-y-auto max-h-[300px] pr-1">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-wider">
              <th className="pb-1 right-text">פריט</th>
              <th className="pb-1 text-center">מלאי זמין</th>
              <th className="pb-1 text-center">סטטוס</th>
              <th className="pb-1 text-left">שינוי מהיר</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-950/60 transition group">
                <td className="py-1.5 font-bold text-white text-[11px]">
                  {item.itemName}
                </td>
                <td className="py-1.5 text-center text-slate-300 font-mono text-[11px]">
                  <span className={item.quantity === 0 ? "text-amber-500 font-bold" : "text-slate-300"}>
                    {item.quantity} {item.unit}
                  </span>
                </td>
                <td className="py-1.5 text-center">
                  <button
                    onClick={() => handleToggleStock(item)}
                    title="לחץ לשינוי זמינות מהיר"
                    className="cursor-pointer focus:outline-none"
                  >
                    {item.inStock ? (
                      <span className="inline-flex items-center gap-0.5 bg-emerald-950/30 text-emerald-400 text-[10px] font-black px-1.5 py-0.5 rounded border border-emerald-950">
                        <CheckCircle className="w-2.5 h-2.5 text-emerald-400" /> במלאי
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 bg-amber-950/30 text-amber-500 text-[10px] font-black px-1.5 py-0.5 rounded border border-amber-950 animate-pulse">
                        <XCircle className="w-2.5 h-2.5 text-amber-500" /> חסר (הזמנה מיוחדת)
                      </span>
                    )}
                  </button>
                </td>
                <td className="py-1.5 text-left">
                  <div className="inline-flex bg-slate-950 border border-slate-800 rounded overflow-hidden">
                    <button
                      onClick={() => handleQtyChange(item, 5)}
                      title="הוסף 5 יחידות"
                      className="px-1 text-emerald-400 hover:bg-slate-800 text-[10px] font-bold border-l border-slate-850"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleQtyChange(item, 1)}
                      className="p-1 hover:bg-slate-800 text-slate-300 border-l border-slate-850"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleQtyChange(item, -1)}
                      className="p-1 hover:bg-slate-800 text-slate-300 border-l border-slate-850"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleQtyChange(item, -item.quantity)}
                      title="אפס מלאי"
                      className="px-1 text-amber-500 hover:bg-slate-800 text-[10px]"
                    >
                      רוקן
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
