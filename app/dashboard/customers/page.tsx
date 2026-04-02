"use client";

import { useState, useRef } from "react";
import { 
  Users, Search, ScanFace, Plus, X, MapPin, Link as LinkIcon, 
  CreditCard, Phone, Calendar, UserCheck, Loader2, Trash2, 
  History, Clock, AlertCircle, ChevronRight 
} from "lucide-react";

// Dữ liệu mẫu bổ sung lịch sử thuê
const mockCustomers = [
  {
    id: "1",
    name: "Nguyễn Văn A",
    cccd: "079099001234",
    phone: "0901234567",
    address: "Quận 1, TP. Hồ Chí Minh",
    dob: "15/05/1995",
    socialLink: "facebook.com/nguyenvana",
    status: "good",
    totalRentals: 2,
    history: [
      { id: "R1", item: "Sony A7 IV", date: "20/03/2026", status: "Đã trả" },
      { id: "R2", item: "Lens 24-70mm GM II", date: "28/03/2026", status: "Đang thuê" },
    ]
  },
  {
    id: "2",
    name: "Trần Thị B",
    cccd: "079095009876",
    phone: "0987654321",
    address: "Bình Thạnh, TP. Hồ Chí Minh",
    dob: "22/10/1998",
    socialLink: "tiktok.com/@tranthib",
    status: "warning",
    totalRentals: 1,
    history: [
      { id: "R3", item: "Đèn Nanlite 60B", date: "15/02/2026", status: "Đã trả" },
    ]
  }
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState(mockCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xóa khách hàng
  const handleDeleteCustomer = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khách hàng này khỏi hệ thống?")) {
      setCustomers(customers.filter(c => c.id !== id));
      setSelectedCustomer(null);
    }
  };

  // Giả lập Quét AI (Cần nối API Gemini thật như trang OCR)
  const handleScanCCCD = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setAiError(null);

    // Giả lập xử lý
    setTimeout(() => {
      // Tỉ lệ giả lập: 80% thành công, 20% lỗi nhận diện
      const isSuccess = Math.random() > 0.2;

      if (isSuccess) {
        const newCustomer = {
          id: Date.now().toString(),
          name: "LÊ HOÀNG C",
          cccd: "001099008888",
          phone: "Chưa cập nhật",
          address: "Cầu Giấy, Hà Nội",
          dob: "01/01/1999",
          socialLink: "Chưa có",
          status: "good",
          totalRentals: 0,
          history: []
        };
        setCustomers([newCustomer, ...customers]);
        setSelectedCustomer(newCustomer);
      } else {
        setAiError("AI không thể nhận diện được thông tin trên thẻ này. Vui lòng chụp rõ nét hơn hoặc nhập thủ công.");
      }
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Thông báo lỗi AI */}
      {aiError && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400 animate-in fade-in zoom-in">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm flex-1">{aiError}</p>
          <button onClick={() => setAiError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header & ToolBar (Giữ như cũ) */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-normal text-white tracking-tight">Quản lý Khách hàng</h2>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleScanCCCD} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2">
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
            Quét CCCD (AI)
          </button>
        </div>
      </div>

      {/* Grid Khách hàng (Giữ giao diện Card của bạn) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map((customer) => (
          <div key={customer.id} onClick={() => setSelectedCustomer(customer)} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all cursor-pointer">
            <h3 className="text-xl font-medium text-white">{customer.name}</h3>
            <p className="text-zinc-500 text-sm mt-1">{customer.phone}</p>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-zinc-500">
              <span>{customer.cccd}</span>
              <span className="text-indigo-400">Xem hồ sơ</span>
            </div>
          </div>
        ))}
      </div>

      {/* POPUP CHI TIẾT (2 CỘT) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            <div className="p-8 flex justify-between items-start border-b border-white/5">
              <div className="flex gap-5 items-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-2xl font-bold text-indigo-400">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedCustomer.name}</h2>
                  <p className="text-indigo-400 text-sm tracking-widest uppercase">Thành viên Space Vietnam</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                  className="p-3 text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-all"
                  title="Xóa khách hàng"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button onClick={() => setSelectedCustomer(null)} className="p-3 text-zinc-500 hover:text-white bg-white/5 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-5 divide-x divide-white/5">
              
              {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN (60%) */}
              <div className="lg:col-span-3 p-8 space-y-6">
                <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-4">Thông tin cơ bản</h4>
                <div className="grid grid-cols-2 gap-6">
                  <InfoBox label="Số CCCD" value={selectedCustomer.cccd} icon={CreditCard} mono />
                  <InfoBox label="Số điện thoại" value={selectedCustomer.phone} icon={Phone} />
                  <InfoBox label="Ngày sinh" value={selectedCustomer.dob} icon={Calendar} />
                  <InfoBox label="Mạng xã hội" value={selectedCustomer.socialLink} icon={LinkIcon} isLink />
                  <div className="col-span-2">
                    <InfoBox label="Địa chỉ thường trú" value={selectedCustomer.address} icon={MapPin} />
                  </div>
                </div>
              </div>

              {/* CỘT PHẢI: LỊCH SỬ THUÊ (40%) */}
              <div className="lg:col-span-2 p-8 bg-white/[0.01]">
                <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <History className="w-4 h-4" /> Lịch sử thuê gần đây
                </h4>
                
                <div className="space-y-4">
                  {selectedCustomer.history.length > 0 ? (
                    selectedCustomer.history.map((item: any) => (
                      <div key={item.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.08] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Clock className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{item.item}</p>
                            <p className="text-[10px] text-zinc-500 uppercase">{item.date}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-md ${
                          item.status === 'Đang thuê' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 opacity-30">
                      <p className="text-sm italic">Chưa có lịch sử giao dịch</p>
                    </div>
                  )}
                  
                  <button className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-xs text-zinc-500 hover:text-indigo-400 hover:border-indigo-400/50 transition-all flex items-center justify-center gap-2">
                    Tạo đơn thuê mới cho {selectedCustomer.name.split(' ').pop()} <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Component phụ trợ cho InfoBox
function InfoBox({ label, value, icon: Icon, mono = false, isLink = false }: any) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <div className={`p-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-zinc-200 text-sm ${mono ? 'font-mono text-indigo-400' : ''}`}>
        {isLink ? <a href="#" className="text-blue-400 hover:underline">{value}</a> : value}
      </div>
    </div>
  );
}