import React from "react";
import { Driver } from "../types";
import { Truck, Phone, CheckCircle, Navigation, AlertTriangle } from "lucide-react";

interface DriversListProps {
  drivers: Driver[];
  onUpdateDriverStatus: (name: string, status: 'פנוי' | 'במשלוח' | 'בהפסקה') => void;
}

export default function DriversList({ drivers, onUpdateDriverStatus }: DriversListProps) {
  const getStatusBadge = (status: Driver["status"]) => {
    switch (status) {
      case "פנוי":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> פנוי להובלה
          </span>
        );
      case "במשלוח":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black bg-blue-950 text-blue-400 px-2 py-0.5 rounded border border-blue-900">
            <Navigation className="w-3 h-3 animate-pulse text-blue-400" /> בדרך ליעד
          </span>
        );
      case "בהפסקה":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-900">
            <AlertTriangle className="w-3 h-3 text-amber-400" /> בהפסקה
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col h-full shadow-lg">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
        <h3 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-emerald-500" /> נהגי המערך פעילים
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">זמן אמת</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 overflow-y-auto max-h-[170px] pr-1">
        {drivers.map((driver) => (
          <div
            key={driver.name}
            className="bg-slate-950 border border-slate-850 rounded-lg p-2 flex flex-col justify-between hover:border-slate-700 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-extrabold text-xs text-white">{driver.name}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">משאית: {driver.truckNumber}</p>
              </div>
              {getStatusBadge(driver.status)}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900 gap-1.5">
              <span className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-500" /> {driver.phone}
              </span>
              
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdateDriverStatus(driver.name, "פנוי")}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border transition ${
                    driver.status === "פנוי"
                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-800"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  פנוי
                </button>
                <button
                  onClick={() => onUpdateDriverStatus(driver.name, "במשלוח")}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border transition ${
                    driver.status === "במשלוח"
                      ? "bg-blue-950/40 text-blue-400 border-blue-800"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  בייעוד
                </button>
                <button
                  onClick={() => onUpdateDriverStatus(driver.name, "בהפסקה")}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border transition ${
                    driver.status === "בהפסקה"
                      ? "bg-amber-950/40 text-amber-400 border-amber-800"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800"
                  }`}
                >
                  הפסקה
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
