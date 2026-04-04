"use client";

import { useState, useEffect } from "react";
import { 
  Bot, 
  FileSpreadsheet, 
  Play, 
  Copy, 
  CheckCircle2, 
  Trash2, 
  Loader2, 
  ListChecks, 
  Globe,
  Sparkles,
  Check,
  Calendar,
  Clock
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function CfsReviewPage() {
  const [config, setConfig] = useState({ sheetId: "", startNumber: 3789, builtIds: [] as string[] });
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalStatus, setFinalStatus] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const timeSlots = ["10:00", "12:00", "16:00", "20:00"];
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); 
  const [selectedSlot, setSelectedSlot] = useState("10:00");

  useEffect(() => {
    const fetchConfig = async () => {
      const docRef = doc(db, "system_configs", "cfs_bot");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setConfig({
          sheetId: data.sheetId || "",
          startNumber: data.startNumber || 3789,
          builtIds: data.builtIds || [],
        });
      }
    };
    fetchConfig();
  }, []);

  const generateUniqueId = (content: string) => {
    if (!content) return "";
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash &= hash; 
    }
    return Math.abs(hash).toString(36); 
  };

  const scanSheet = async () => {
    setErrorMsg("");
    if (!config.sheetId) {
      setErrorMsg("Vui lòng nhập Sheet ID trước khi quét.");
      return;
    }
    
    await setDoc(doc(db, "system_configs", "cfs_bot"), config, { merge: true });
    setIsLoading(true);

    try {
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${config.sheetId}/export?format=csv`;
      const res = await fetch(sheetUrl);
      if (!res.ok) throw new Error("Không thể truy cập Sheet");
      
      const csvText = await res.text();
      const rows = csvText.split("\n").slice(1);
      
      const parsedItems = rows.map((row) => {
        const cols = row.split(","); 
        const content = cols[3]?.replace(/"/g, "").trim();
        return {
          id: generateUniqueId(content),
          grade: cols[1]?.replace(/"/g, "").trim(),
          topic: cols[2]?.replace(/"/g, "").trim(),
          content: content,
        };
      }).filter(it => it.content && it.id); 

      const pendingItems = parsedItems.filter(it => !config.builtIds.includes(it.id));
      setItems(pendingItems); 
    } catch (error) {
      setErrorMsg("Lỗi kết nối. Hãy đảm bảo Sheet đã được Share công khai.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (idToReject: string) => {
    setItems(prev => prev.filter(it => it.id !== idToReject));
    const updatedBuiltIds = [...config.builtIds, idToReject];
    const newConfig = { ...config, builtIds: updatedBuiltIds };
    setConfig(newConfig);
    await setDoc(doc(db, "system_configs", "cfs_bot"), newConfig);
  };

  const buildStatus = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);
    
    const itemsToBuild = items.slice(0, 10);
    const newBuiltIds = itemsToBuild.map(it => it.id);
    
    let currentId = config.startNumber;
    if (currentId % 10 !== 0) currentId += (10 - (currentId % 10));

    let itemsText = "";
    itemsToBuild.forEach((it) => {
      itemsText += `#${currentId} ${it.topic} #hsl${it.grade}\n${it.content}\n\n`;
      currentId++;
    });

    // CẬP NHẬT Ở ĐÂY: Đảo lại biến 'm' và 'd' để đồng bộ với giao diện DatePicker của trình duyệt (MM/DD/YYYY)
    const [y, m, d] = selectedDate.split("-");
    const formattedDateTime = `${selectedSlot} | ${m}/${d}/${y}`;
    
    const template = `[ BOT ] ${formattedDateTime}
________________________________________
${itemsText.trim()}
----------------
Vấn đề liên quan về duyệt confession bằng BOT hãy báo cáo với team admin page ❤️
Link form gửi cfs: forms.gle/jgizR3XZeXdn3hDE7`;

    setFinalStatus(template);
    
    const updatedBuiltIds = [...config.builtIds, ...newBuiltIds];
    const newConfig = { ...config, startNumber: currentId, builtIds: updatedBuiltIds };
    setConfig(newConfig);
    
    await setDoc(doc(db, "system_configs", "cfs_bot"), newConfig);
    setItems(prev => prev.filter(it => !newBuiltIds.includes(it.id)));
    setIsProcessing(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(finalStatus);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); 
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in zoom-in-95 duration-700 px-4">
      
      {/* HEADER SECTION */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[28px] blur opacity-15 group-hover:opacity-25 transition duration-1000"></div>
        <div className="relative bg-[#09090b] border border-white/10 p-6 md:p-8 rounded-[28px] grid grid-cols-1 lg:grid-cols-3 gap-8 shadow-2xl">
          
          {/* Cấu hình cơ bản */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-r border-white/5 pr-0 lg:pr-8">
            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" /> Google Sheet ID
              </label>
              <input 
                value={config.sheetId} 
                onChange={e => setConfig({...config, sheetId: e.target.value})} 
                onBlur={() => setDoc(doc(db, "system_configs", "cfs_bot"), config, { merge: true })} 
                className="w-full bg-[#121214] border border-white/5 focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all" 
                placeholder="Dán ID Sheet..." 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> STT Bắt Đầu
              </label>
              <input 
                type="number" 
                value={config.startNumber} 
                onChange={e => setConfig({...config, startNumber: Number(e.target.value)})} 
                className="w-full bg-[#121214] border border-white/5 focus:border-pink-500/50 rounded-xl px-4 py-3 text-sm text-pink-400 font-bold outline-none" 
              />
            </div>
            <div className="md:col-span-2">
              <button 
                onClick={scanSheet} 
                disabled={isLoading} 
                className="w-full h-[46px] bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border border-white/5 shadow-inner"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <ListChecks className="w-4 h-4 text-indigo-400" />} 
                {isLoading ? "Đang quét..." : "Lấy Dữ Liệu Từ Sheet"}
              </button>
            </div>
          </div>

          {/* Cấu hình thời gian Build */}
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Chọn ngày đăng
              </label>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#121214] border border-white/5 focus:border-emerald-500/50 rounded-xl px-4 py-2.5 text-sm text-zinc-200 outline-none [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400" /> Chọn mốc giờ
              </label>
              <div className="grid grid-cols-4 gap-2">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2 text-xs font-bold rounded-lg transition-all border ${
                      selectedSlot === slot 
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]" 
                      : "bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CỘT 1: DANH SÁCH CHỜ DUYỆT */}
        <div className="bg-[#09090b] border border-white/10 rounded-[28px] overflow-hidden flex flex-col h-[650px] shadow-2xl relative">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center backdrop-blur-md">
            <h3 className="font-bold text-white flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg"><Globe className="w-4 h-4 text-emerald-400"/></div>
              Hàng chờ ({items.length})
            </h3>
            <div className="text-[10px] text-zinc-500 italic">Tự động chọn 10 bài đầu tiên</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {items.map((it, index) => (
              <div 
                key={`${it.id}-${index}`} 
                className={`p-5 rounded-2xl border transition-all group/item ${
                  index < 10 
                    ? "bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5" 
                    : "bg-[#121214] border-white/5 opacity-60"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${index < 10 ? 'text-indigo-400' : 'text-zinc-500'}`}>
                    #{it.topic} • Khối {it.grade}
                  </span>
                  <button 
                    onClick={() => handleReject(it.id)}
                    className="text-zinc-600 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-all opacity-0 group-hover/item:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm text-zinc-300 line-clamp-3">{it.content}</p>
              </div>
            ))}
          </div>

          <div className="p-5 bg-[#09090b] border-t border-white/5">
            <button 
              onClick={buildStatus} 
              disabled={isProcessing || items.length === 0} 
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Play className="w-5 h-5" /> Build Status
            </button>
          </div>
        </div>

        {/* CỘT 2: KẾT QUẢ BUILD */}
        <div className="bg-[#09090b] border border-white/10 rounded-[28px] overflow-hidden flex flex-col h-[650px] shadow-2xl relative">
          <div className="p-5 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
            <h3 className="font-bold text-white flex items-center gap-2.5">
              <div className="p-1.5 bg-rose-500/20 rounded-lg"><Bot className="w-4 h-4 text-rose-400"/></div>
              Kết quả Build
            </h3>
          </div>

          <div className="flex-1 p-6 relative">
            <textarea 
              readOnly 
              value={finalStatus} 
              placeholder="Nội dung sẽ xuất hiện ở đây..."
              className="w-full h-full bg-transparent border-none outline-none text-zinc-200 font-mono text-[13px] leading-relaxed resize-none custom-scrollbar"
            />
          </div>

          <div className="p-5 bg-[#09090b] border-t border-white/5">
            <button 
              onClick={copyToClipboard}
              disabled={!finalStatus}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                isCopied ? "bg-emerald-600 text-white" : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {isCopied ? "Đã copy!" : "Copy nội dung"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}