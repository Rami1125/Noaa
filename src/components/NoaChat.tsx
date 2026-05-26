import React, { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { Send, FileText, Image as ImageIcon, Sparkles, Paperclip, X, RefreshCw } from "lucide-react";

interface NoaChatProps {
  messages: Message[];
  onSendMessage: (text: string, fileAttachment?: any, senderOverride?: string) => void;
  isProcessing: boolean;
  onExecuteHtmlAction: (actionData: { action: string; driver?: string; orderId?: string; special?: boolean }) => void;
  activeUser: string;
  onChangeActiveUser: (user: string) => void;
}

const PRESET_FILES = [
  {
    name: "סריקת_חשבונית_חמאדה_חומרי_בניין.pdf",
    type: "application/pdf",
    size: "184 KB",
    content: "חשבונית עסקה לוגיסטית להקמה:\nלקוח: חמאדה קבלנות שלד וגמר\nכתובת אספקה: טייבה, שכונת אל-בוסתאן (ליד המכון הציבורי החדש)\nמוצרים מבוקשים:\n1. מלט שחור מחצבי (שק 50 ק\"ג) - כמות 30 שקים\n2. חול ים נקי משובח - כמות 5 קוב\nהערות: נא לתאם אספקה מהירה עם הנהג עלי, לקבלן יש מנוף פריקה פנימי."
  },
  {
    name: "דוח_אספקה_דחוף_ברזל.png",
    type: "image/png",
    size: "420 KB",
    content: "צילום הexport default function NoaChat({
  messages,
  onSendMessage,
  isProcessing,
  onExecuteHtmlAction,
  activeUser,
  onChangeActiveUser
}: NoaChatProps) {
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto Scroll to Bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Click interceptor inside Noa's HTML messages to trigger logistics state updates
  const handleChatContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const button = target.closest("button");
    if (button) {
      const action = button.getAttribute("data-action");
      const driver = button.getAttribute("data-driver");
      const orderId = button.getAttribute("data-order-id");
      const isPlaceholder = button.getAttribute("data-order-placeholder");

      if (action) {
        e.preventDefault();
        onExecuteHtmlAction({
          action,
          driver: driver || undefined,
          orderId: orderId || undefined,
          special: isPlaceholder === "true"
        });
      }
    }
  };

  const handleSend = () => {
    if (!inputText.trim() && !selectedFile) return;
    onSendMessage(inputText, selectedFile, activeUser);
    setInputText("");
    setSelectedFile(null);
  };

  const handleSelectPresetFile = (file: any) => {
    setSelectedFile(file);
    setShowFileMenu(false);
    
    // Customize preset text dynamically depending on selected user
    if (activeUser === "ראמי") {
      setInputText(`נועה אהובה שלי, נתחי בבקשה את הקובץ המצורף "${file.name}" ותקימי הזמנה מתאימה במערכת.`);
    } else if (activeUser === "הראל") {
      setInputText(`נועה, אנא נתחי את קובץ האספקה המצורף "${file.name}" ודווחי סטטוס פריטים סופי.`);
    } else {
      setInputText(`נועה, קיבלנו קובץ דחוף "${file.name}". נא להקים מיידית הזמנה ולבדוק מלאי ופיקדונוות.`);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col h-full shadow-2xl overflow-hidden">
      {/* Branded Banner Header */}
      <div className="relative h-20 bg-cover bg-center overflow-hidden flex items-center p-3 border-b border-indigo-950" style={{ backgroundImage: `linear-gradient(to left, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.4)), url('https://i.postimg.cc/qqWtk5qr/Gemini-Generated-Image-6z6qts6z6qts6z6q.png')` }}>
        <div className="flex items-center gap-3 relative z-10 w-full justify-between flex-row-reverse">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h2 className="text-sm font-black text-white">נועה הסדרנית המבצעית</h2>
              <p className="text-[10px] text-emerald-400 font-bold flex items-center justify-end gap-1">
                מחוברת ומסונכרנת למלאי ולנהגים <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              </p>
            </div>
            <div className="relative">
              <img
                src="https://i.postimg.cc/qqWtk5qr/Gemini-Generated-Image-6z6qts6z6qts6z6q.png"
                alt="Noa AI Logo"
                className="w-12 h-12 rounded-full border-2 border-emerald-400 object-cover pointer-events-none"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <div className="text-left">
            <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-900 font-extrabold uppercase">
              ח. סבן לוגיסטיקה
            </span>
          </div>
        </div>
      </div>

      {/* Identity Switcher Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 flex flex-col md:flex-row items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 font-extrabold select-none">🎭 בחר זהות עבור שיחה ודוחות:</span>
        <div className="flex flex-wrap gap-1 justify-center">
          {[
            { id: "ראמי", label: "ראמי המפקד", activeStyle: "border-indigo-600 bg-indigo-950 text-indigo-400" },
            { id: "הראל", label: "הראל המנכ\"ל", activeStyle: "border-white bg-slate-800 text-white" },
            { id: "איציק", label: "איציק מנהל משרד", activeStyle: "border-sky-600 bg-sky-950 text-sky-400" },
            { id: "עלי", label: "עלי נהג", activeStyle: "border-amber-600 bg-amber-950 text-amber-400" },
            { id: "היקמת", label: "היקמת נהג", activeStyle: "border-emerald-600 bg-emerald-950 text-emerald-400" }
          ].map(user => (
            <button
              key={user.id}
              onClick={() => onChangeActiveUser(user.id)}
              className={`px-2 py-0.5 rounded text-[9.5px] font-black border transition ${
                activeUser === user.id
                  ? user.activeStyle + " ring-1 ring-offset-1 ring-offset-slate-950 scale-105"
                  : "bg-slate-900 border-slate-850 text-slate-500 hover:bg-slate-850 hover:text-slate-300"
              }`}
            >
              {user.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div
        ref={chatContainerRef}
        onClick={handleChatContainerClick}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/80 custom-scrollbar"
      >
        {messages.map((msg) => {
          const isUser = !msg.isNoa;
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 items-start ${isUser ? "justify-start flex-row" : "justify-end flex-row-reverse"}`}
            >
              {/* Avatar Tag */}
              <div className="flex-shrink-0 text-center">
                {isUser ? (
                  <div className="w-20 h-7 rounded-lg bg-indigo-950 border border-indigo-800 shadow flex items-center justify-center font-black text-[10px] text-indigo-300">
                    {msg.sender || "מבקר"}
                  </div>
                ) : (
                  <img
                    src="https://i.postimg.cc/qqWtk5qr/Gemini-Generated-Image-6z6qts6z6qts6z6q.png"
                    alt="Noa"
                    className="w-7 h-7 rounded-full border border-emerald-500 object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              {/* Message Content Bubble */}
              <div className="max-w-[85%] text-right">
                <div className="flex items-center gap-1.5 mb-1.5 justify-end">
                  <span className="text-[9px] text-slate-500 font-mono">
                    {new Date(msg.createdAt).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="text-xs font-black text-slate-300">{msg.sender}</span>
                </div>

                <div
                  className={`rounded-xl px-3 py-2 text-sm leading-relaxed border ${
                    isUser
                      ? "bg-indigo-950/20 text-indigo-200 border-indigo-900/60"
                      : "bg-slate-900 text-slate-200 border-slate-800"
                  }`}
                >
                  {/* Attached file visual indicator inside message bubbles */}
                  {msg.attachment && (
                    <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded border border-slate-800 mb-2 text-right">
                      <FileText className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="text-[10px] font-black text-slate-300">{msg.attachment.name}</p>
                        <p className="text-[8px] text-slate-500 font-mono">{msg.attachment.size}</p>
                      </div>
                    </div>
                  )}

                  {/* HTML render for Noa's formatted logistics cards */}
                  {msg.html ? (
                    <div dangerouslySetInnerHTML={{ __html: msg.html }} />
                  ) : (
                    <p className="whitespace-pre-line font-bold" dangerouslySetInnerHTML={{ __html: msg.text }} />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex gap-2.5 items-start justify-end flex-row-reverse">
            <div className="flex-shrink-0 text-center">
              <img
                src="https://i.postimg.cc/qqWtk5qr/Gemini-Generated-Image-6z6qts6z6qts6z6q.png"
                alt="Noa"
                className="w-7 h-7 rounded-full border border-emerald-500 object-cover animate-spin-slow"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="max-w-[80%] text-right">
              <div className="flex items-center gap-1.5 mb-1 justify-end">
                <span className="text-[9.5px] text-slate-500">נועה מעבדת נתונים...</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 text-slate-400 rounded-xl px-3.5 py-2.5 text-xs inline-flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span className="font-extrabold text-[#38bdf8] animate-pulse">
                  אהוב שלי, אני בודקת את זמינות המלאי במגרש ומסדרת את העבודה...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Fast Operations Command Tags */}
      <div className="bg-slate-950 px-3 py-1.5 border-t border-slate-900 flex justify-end gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none-horizontal">
        <button
          onClick={() => setInputText("נועה נשמה שלי, תעשי לי דוח זריז של כל ההזמנות המיוחדות שממתינות לרכישה במגרש")}
          className="text-[9.5px] font-black bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850 px-2 py-1 rounded border border-slate-800 transition"
        >
          🔍 דוח הזמנות מיוחדות
        </button>
        <button
          onClick={() => setInputText("מי הנהגים הפנויים כרגע לביצוע הובלה דחופה?")}
          className="text-[9.5px] font-black bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850 px-2 py-1 rounded border border-slate-800 transition"
        >
          🚚 נהגים פנויים כעת
        </button>
        <button
          onClick={() => setInputText("האם חסרים כרגע מוצרים קריטיים במלאי של העסק?")}
          className="text-[9.5px] font-black bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-850 px-2 py-1 rounded border border-slate-800 transition"
        >
          📦 בדיקת חוסרי מלאי דחופה
        </button>
      </div>

      {/* Input Commands Composer */}
      <div className="p-3 bg-slate-900 border-t border-slate-850 space-y-2 relative">
        {selectedFile && (
          <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-right">
            <button
              onClick={() => setSelectedFile(null)}
              className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-[10px] font-black text-emerald-400">קובץ מצורף לניתוח מהיר</p>
                <p className="text-[9px] text-slate-400 font-mono">{selectedFile.name}</p>
              </div>
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {/* File attachment upload trigger */}
          <div className="relative">
            <button
              onClick={() => setShowFileMenu(!showFileMenu)}
              title="צרף קובץ הזמנה / חשבונית מס"
              className={`p-2.5 rounded-xl border transition ${
                showFileMenu
                  ? "bg-indigo-950 hover:bg-indigo-900 text-indigo-400 border-indigo-800"
                  : "bg-slate-950 hover:bg-slate-850 text-slate-400 border-slate-850"
              }`}
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {showFileMenu && (
              <div className="absolute bottom-12 right-0 w-64 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-2.5 z-40 text-right">
                <p className="text-[10.5px] font-black text-slate-400 border-b border-slate-900 pb-1.5 mb-1.5 uppercase">
                  📁 שלח קובץ לניתוח צ'אט (נועה)
                </p>
                <p className="text-[9px] text-slate-500 mb-2 leading-relaxed">
                  נועה בודקת ומחלצת פריטים, כמויות, כתובת וקבלן באופן אוטומטי מתוך הקובץ.
                </p>
                <div className="space-y-1">
                  {PRESET_FILES.map((file) => (
                    <button
                      key={file.name}
                      onClick={() => handleSelectPresetFile(file)}
                      type="button"
                      className="w-full bg-slate-900/60 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 rounded p-1.5 text-right flex items-center justify-between transition gap-2"
                    >
                      <span className="text-[8.5px] text-slate-500 font-mono">{file.size}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-200 truncate max-w-[150px] font-bold">
                          {file.name}
                        </span>
                        {file.type.includes("pdf") ? (
                          <FileText className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="שלח הודעה / פקודה מבצעית לנועה (בעברית בלבד)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl pr-3 pl-10 py-2 text-xs text-white text-right focus:outline-none focus:border-indigo-600 font-black placeholder-slate-600 placeholder-right"
              dir="rtl"
            />
            {inputText && (
              <span className="absolute left-3.5 top-2.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={isProcessing || (!inputText.trim() && !selectedFile)}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white p-2.5 rounded-xl flex items-center justify-center transition focus:ring-1 focus:ring-indigo-700 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
