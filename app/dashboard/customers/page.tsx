"use client";

import { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../lib/firebase"; // Đảm bảo đường dẫn này đúng
import { 
  Users, Search, ScanFace, Plus, X, MapPin, Link as LinkIcon, 
  CreditCard, Phone, Calendar, UserCheck, Loader2, Trash2, 
  History, Clock, AlertCircle, ChevronRight, Save
} from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // Thêm state loading
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State cho Modal Thêm thủ công
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái đang lưu Firebase
  const [formData, setFormData] = useState({
    name: "", cccd: "", phone: "", address: "", dob: "", socialLinks: [""]
  });

  // 1. Lắng nghe dữ liệu Khách hàng từ Firebase (Real-time)
  useEffect(() => {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const custData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(custData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Xóa khách hàng trên Firebase
  const handleDeleteCustomer = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khách hàng này khỏi hệ thống? Hành động này không thể hoàn tác.")) {
      try {
        await deleteDoc(doc(db, "customers", id));
        if (selectedCustomer?.id === id) {
          setSelectedCustomer(null);
        }
      } catch (error) {
        console.error("Lỗi khi xóa khách hàng:", error);
        alert("Có lỗi xảy ra khi xóa!");
      }
    }
  };

  // Format ngày sinh tự động (DD/MM/YYYY)
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Chỉ giữ lại số
    if (value.length > 8) value = value.slice(0, 8); // Tối đa 8 số
    
    // Tự động chèn dấu '/'
    if (value.length > 4) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    } else if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    
    setFormData({ ...formData, dob: value });
  };

  // Các hàm xử lý Link Mạng Xã Hội
  const handleSocialLinkChange = (index: number, value: string) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index] = value;
    setFormData({ ...formData, socialLinks: newLinks });
  };

  const addSocialLink = () => {
    setFormData({ ...formData, socialLinks: [...formData.socialLinks, ""] });
  };

  const removeSocialLink = (index: number) => {
    const newLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, socialLinks: newLinks });
  };

  // 3. Xử lý Thêm khách hàng lên Firebase
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cccd || !formData.phone) {
      alert("Vui lòng điền ít nhất Tên, CCCD và Số điện thoại!");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "customers"), {
        name: formData.name,
        cccd: formData.cccd,
        phone: formData.phone,
        address: formData.address,
        dob: formData.dob,
        socialLinks: formData.socialLinks.filter(link => link.trim() !== ""),
        status: "good",
        totalRentals: 0,
        history: [],
        createdAt: serverTimestamp() // Lưu thời gian tạo để sắp xếp
      });

      setIsAddModalOpen(false);
      // Reset form
      setFormData({ name: "", cccd: "", phone: "", address: "", dob: "", socialLinks: [""] }); 
    } catch (error) {
      console.error("Lỗi khi lưu khách hàng:", error);
      alert("Có lỗi xảy ra khi lưu lên hệ thống!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Giả lập Quét AI
  const handleScanCCCD = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setAiError(null);

    setTimeout(() => {
      setAiError("Tính năng quét AI đang được nâng cấp. Vui lòng thêm thủ công.");
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 1500);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.cccd.includes(searchTerm)
  );

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

      {/* Header & ToolBar */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-normal text-white tracking-tight">Quản lý Khách hàng</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Ô tìm kiếm khách hàng */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Tìm tên, SĐT, CCCD..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)} 
              className="px-4 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Thêm thủ công
            </button>

            <input type="file" ref={fileInputRef} onChange={handleScanCCCD} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all text-sm whitespace-nowrap">
              {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
              Quét CCCD
            </button>
          </div>
        </div>
      </div>

      {/* Grid Khách hàng */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-white/[0.02] border border-white/5 rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
          <p className="text-sm uppercase tracking-widest animate-pulse">Đang tải dữ liệu khách hàng...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl">
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400">Không tìm thấy khách hàng nào.</p>
          {!searchTerm && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 text-indigo-400 text-sm hover:underline"
            >
              Thêm khách hàng đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => (
            <div 
              key={customer.id} 
              onClick={() => setSelectedCustomer(customer)} 
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all cursor-pointer relative group"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCustomer(customer.id);
                }}
                className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="Xóa khách hàng"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <h3 className="text-xl font-medium text-white pr-8">{customer.name}</h3>
              <p className="text-zinc-500 text-sm mt-1">{customer.phone}</p>
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between text-xs text-zinc-500">
                <span>{customer.cccd}</span>
                <span className="text-indigo-400 group-hover:underline">Xem hồ sơ</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* POPUP THÊM KHÁCH HÀNG THỦ CÔNG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
            <div className="p-6 border-b border-white/5 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-white">Thêm khách hàng mới</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-zinc-500 hover:text-white bg-white/5 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-8">
              <form id="add-customer-form" onSubmit={handleAddCustomer} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase">Họ và Tên *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none" placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase">Số CCCD *</label>
                    <input required type="text" value={formData.cccd} onChange={e => setFormData({...formData, cccd: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none" placeholder="0790..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase">Số điện thoại *</label>
                    <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none" placeholder="090..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase">Ngày sinh</label>
                    <input type="text" value={formData.dob} onChange={handleDobChange} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none placeholder:text-zinc-600" placeholder="DD/MM/YYYY" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-xs font-medium text-zinc-400 uppercase">Địa chỉ</label>
                    <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none" placeholder="Quận/Huyện, Tỉnh/TP" />
                  </div>
                  
                  {/* Khu vực Mạng Xã Hội Động */}
                  <div className="col-span-2 space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-medium text-zinc-400 uppercase">Link Mạng xã hội</label>
                      <button 
                        type="button" 
                        onClick={addSocialLink} 
                        className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-400/10 hover:bg-indigo-400/20 px-2 py-1 rounded-md transition-all"
                      >
                        <Plus className="w-3 h-3" /> Thêm link
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {formData.socialLinks.map((link, index) => (
                        <div key={index} className="flex gap-2">
                          <input 
                            type="text" 
                            value={link} 
                            onChange={e => handleSocialLinkChange(index, e.target.value)} 
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-indigo-500 outline-none" 
                            placeholder="facebook.com/..." 
                          />
                          {formData.socialLinks.length > 1 && (
                            <button 
                              type="button" 
                              onClick={() => removeSocialLink(index)} 
                              className="p-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 bg-white/5 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </form>
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 shrink-0 bg-[#0c0c0e]">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-zinc-400 hover:text-white transition-all">Hủy</button>
              <button form="add-customer-form" type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-all disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                Lưu khách hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP CHI TIẾT */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            
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

            <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
              <div className="lg:col-span-3 p-8 space-y-6">
                <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-4">Thông tin cơ bản</h4>
                <div className="grid grid-cols-2 gap-6">
                  <InfoBox label="Số CCCD" value={selectedCustomer.cccd} icon={CreditCard} mono />
                  <InfoBox label="Số điện thoại" value={selectedCustomer.phone} icon={Phone} />
                  <InfoBox label="Ngày sinh" value={selectedCustomer.dob || "Chưa cập nhật"} icon={Calendar} />
                  <div className="col-span-2">
                    <InfoBox label="Địa chỉ thường trú" value={selectedCustomer.address || "Chưa cập nhật"} icon={MapPin} />
                  </div>
                  <div className="col-span-2">
                    <InfoBox label="Mạng xã hội" value={selectedCustomer.socialLinks} icon={LinkIcon} isLink />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 p-8 bg-white/[0.01]">
                <h4 className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <History className="w-4 h-4" /> Lịch sử thuê
                </h4>
                
                <div className="space-y-4">
                  {selectedCustomer.history && selectedCustomer.history.length > 0 ? (
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
                    <div className="text-center py-10 opacity-30 border border-dashed border-white/10 rounded-2xl">
                      <p className="text-sm italic">Khách hàng mới chưa có lịch sử</p>
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

// Component phụ trợ InfoBox
function InfoBox({ label, value, icon: Icon, mono = false, isLink = false }: any) {
  const isArray = Array.isArray(value);
  const displayValue = isArray ? value.filter(v => v.trim() !== '') : value;
  const hasContent = isArray ? displayValue.length > 0 : !!displayValue && displayValue !== "Chưa cập nhật";

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-wider flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <div className={`p-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-zinc-200 text-sm ${mono ? 'font-mono text-indigo-400' : ''} flex flex-col gap-2`}>
        {isLink ? (
          hasContent ? (
            isArray ? (
              displayValue.map((link: string, i: number) => (
                <a key={i} href={link.includes('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate block">
                  {link}
                </a>
              ))
            ) : (
              <a href={value.includes('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate block">
                {value}
              </a>
            )
          ) : (
            <span className="text-zinc-500">Chưa cập nhật</span>
          )
        ) : (
          <span className="truncate block">{value || <span className="text-zinc-500">Chưa cập nhật</span>}</span>
        )}
      </div>
    </div>
  );
}