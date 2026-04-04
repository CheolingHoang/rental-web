"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Plus, Search, Loader2, X, Trash2, Edit2, Sparkles, FileText, ShieldCheck, Lock, AlertCircle, AlertTriangle } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export interface Rental {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  equipmentSummary: string;
  equipmentIds?: string[]; 
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
}

const formatCurrency = (amount: number) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function RentalsPage() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Tất cả");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    equipmentSummary: "",
    equipmentIds: [] as string[],
    startDate: "",
    endDate: "",
    totalAmount: 0,
    status: "Đang thuê", 
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedEquipments, setSelectedEquipments] = useState<any[]>([]);
  const [displayPrice, setDisplayPrice] = useState("");
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState("");

  // NÂNG CẤP: State cho Hộp thoại Xác nhận Custom (Thay thế window.confirm)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "danger", // 'danger' | 'success'
    onConfirm: () => {}
  });

  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const q = query(collection(db, "app_users"), where("email", "==", user.email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          if (userData.role === "Admin" || (userData.allowedPages && userData.allowedPages.includes("/dashboard/rentals"))) {
            setHasPermission(true);
          } else {
            setHasPermission(false);
          }
        } else {
          setHasPermission(true); 
        }
      } else {
        setHasPermission(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (hasPermission !== true) return;
    const q = query(collection(db, "rentals"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rentalData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Rental[];
      setRentals(rentalData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [hasPermission]);

  useEffect(() => {
    if (hasPermission !== true) return;
    const q = query(collection(db, "customers"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
    });
    return () => unsubscribe();
  }, [hasPermission]);

  useEffect(() => {
    if (hasPermission !== true) return;
    const q = query(collection(db, "equipments"), where("status", "==", "Rảnh"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEquipments(data);
    });
    return () => unsubscribe();
  }, [hasPermission]);

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedCustomerId(id);
    const customer = customers.find(c => c.id === id);
    if (customer) {
      setFormData(prev => ({ ...prev, customerName: customer.name, customerPhone: customer.phone }));
    } else {
      setFormData(prev => ({ ...prev, customerName: "", customerPhone: "" }));
    }
  };

  const handleToggleEquipment = (eq: any) => {
    const isAlreadySelected = selectedEquipments.find(item => item.id === eq.id);
    let newSelection = [];
    
    if (isAlreadySelected) {
      newSelection = selectedEquipments.filter(item => item.id !== eq.id);
    } else {
      newSelection = [...selectedEquipments, eq];
    }
    
    setSelectedEquipments(newSelection);
    const newSummary = newSelection.map(item => item.name).join(" + ");
    const newTotal = newSelection.reduce((sum, item) => sum + (Number(item.pricePerDay) || 0), 0);

    setFormData(prev => ({ 
      ...prev, 
      equipmentSummary: newSummary, 
      totalAmount: newTotal,
      equipmentIds: newSelection.map(item => item.id) 
    }));
    setDisplayPrice(formatCurrency(newTotal));
  };

  const handleManualPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ""); 
    const numValue = rawValue ? parseInt(rawValue, 10) : 0;
    
    setFormData(prev => ({ ...prev, totalAmount: numValue }));
    setDisplayPrice(rawValue ? formatCurrency(numValue) : "");
  };

  const handleSaveRental = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName) return toast.error("Vui lòng chọn khách hàng!");
    if (!formData.equipmentSummary) return toast.error("Vui lòng chọn ít nhất 1 thiết bị!");

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);

      if (editingId) {
        const rentalRef = doc(db, "rentals", editingId);
        const { status, ...updateData } = formData; 
        batch.update(rentalRef, { ...updateData });
      } else {
        const newOrderCode = `RN-${Math.floor(1000 + Math.random() * 9000)}`;
        const newRentalRef = doc(collection(db, "rentals"));
        
        batch.set(newRentalRef, {
          orderCode: newOrderCode,
          ...formData,
          createdAt: serverTimestamp()
        });

        selectedEquipments.forEach((eq) => {
          const eqRef = doc(db, "equipments", eq.id);
          batch.update(eqRef, { status: "Đang thuê" }); 
        });
      }

      await batch.commit();
      setIsModalOpen(false);
      resetForm();
      toast.success(editingId ? "Cập nhật lệnh thành công!" : "Tạo lệnh thuê thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu lệnh:", error);
      toast.error("Có lỗi xảy ra khi lưu dữ liệu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NÂNG CẤP: Dùng Hộp thoại Custom thay cho window.confirm
  const handleConfirmReturn = (rental: Rental) => {
    setConfirmDialog({
      isOpen: true,
      type: "success",
      title: "Xác nhận thu hồi máy",
      message: `Bạn xác nhận khách [${rental.customerName}] đã thanh toán đủ và trả lại toàn bộ máy?\n\nHành động này sẽ KHÓA vĩnh viễn lệnh thuê này!`,
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          const rentalRef = doc(db, "rentals", rental.id);
          batch.update(rentalRef, { status: "Hoàn tất" });
  
          if (rental.equipmentIds && rental.equipmentIds.length > 0) {
            rental.equipmentIds.forEach(eqId => {
              const eqRef = doc(db, "equipments", eqId);
              batch.update(eqRef, { status: "Rảnh" });
            });
          }
  
          await batch.commit();
          toast.success("Đã chốt đơn và nhận lại máy thành công!");
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          console.error("Lỗi xác nhận trả máy:", error);
          toast.error("Không thể chốt đơn lúc này!");
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ customerName: "", customerPhone: "", equipmentSummary: "", equipmentIds: [], startDate: "", endDate: "", totalAmount: 0, status: "Đang thuê" });
    setSelectedCustomerId("");
    setSelectedEquipments([]);
    setDisplayPrice("");
    setEquipmentSearchTerm("");
  };

  const handleEditClick = (item: Rental) => {
    setEditingId(item.id);
    setFormData({
      customerName: item.customerName,
      customerPhone: item.customerPhone || "",
      equipmentSummary: item.equipmentSummary,
      equipmentIds: item.equipmentIds || [], 
      startDate: item.startDate || "",
      endDate: item.endDate || "",
      totalAmount: item.totalAmount,
      status: item.status,
    });
    setDisplayPrice(formatCurrency(item.totalAmount));
    setIsModalOpen(true);
  };

  // NÂNG CẤP: Dùng Hộp thoại Custom thay cho window.confirm
  const handleDelete = (id: string, status: string) => {
    const isLocked = status === "Hoàn tất";
    
    setConfirmDialog({
      isOpen: true,
      type: "danger",
      title: "Xóa lệnh thuê",
      message: isLocked 
        ? "Bạn có chắc chắn muốn xóa lịch sử lệnh thuê này?" 
        : "CẢNH BÁO: Lệnh này CHƯA HOÀN TẤT.\n\nXóa lệnh sẽ làm mất dữ liệu công nợ và bạn phải tự chỉnh lại số lượng thiết bị trong kho bằng tay. Vẫn muốn xóa?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "rentals", id));
          toast.success("Đã xóa lệnh thuê!");
        } catch (error) {
          toast.error("Không thể xóa lệnh này!");
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const getDynamicStatus = (item: Rental) => {
    if (item.status === "Hoàn tất") return "Hoàn tất";
    
    if (item.endDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      const endDate = new Date(item.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      if (today > endDate) return "Quá hạn"; 
    }
    return "Đang thuê";
  };

  const filteredRentals = rentals.filter(item => {
    const dynamicStatus = getDynamicStatus(item);
    const matchesSearch = item.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.customerPhone && item.customerPhone.includes(searchTerm));
    
    let matchesStatus = true;
    if (filterStatus === "Đang thuê") matchesStatus = dynamicStatus === "Đang thuê";
    if (filterStatus === "Cảnh báo") matchesStatus = dynamicStatus === "Quá hạn";
    if (filterStatus === "Hoàn tất") matchesStatus = dynamicStatus === "Hoàn tất";
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (dynamicStatus: string) => {
    switch (dynamicStatus) {
      case 'Đang thuê': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border text-emerald-400 bg-emerald-400/10 border-emerald-400/20"><Sparkles className="w-3 h-3"/> Đang thuê</span>;
      case 'Quá hạn': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse"><AlertCircle className="w-3 h-3"/> Quá hạn</span>;
      case 'Hoàn tất': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border text-zinc-300 bg-white/10 border-white/10"><Lock className="w-3 h-3"/> Đã khóa</span>;
      default: 
        return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border text-amber-400 bg-amber-400/10 border-amber-400/20">{dynamicStatus}</span>;
    }
  };

  const filteredModalEquipments = equipments.filter(eq =>
    eq.name.toLowerCase().includes(equipmentSearchTerm.toLowerCase()) ||
    (eq.category && eq.category.toLowerCase().includes(equipmentSearchTerm.toLowerCase()))
  );

  const groupedEquipments = filteredModalEquipments.reduce((acc, eq) => {
    const category = eq.category || "Khác";
    if (!acc[category]) acc[category] = [];
    acc[category].push(eq);
    return acc;
  }, {} as Record<string, any[]>);
  
  if (hasPermission === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm uppercase tracking-widest animate-pulse">Đang kiểm tra dữ liệu định danh...</p>
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 animate-in fade-in zoom-in-95">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Truy cập bị từ chối</h2>
        <p className="text-zinc-400 max-w-md mb-8">
          Tài khoản của bạn không có đặc quyền để xem "Lệnh cho thuê". 
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative animate-in fade-in duration-500">
      <Toaster position="top-right" toastOptions={{
        style: { background: '#18181b', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
      }} />

      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium tracking-widest text-indigo-400 uppercase">Trung tâm điều phối</span>
          </div>
          <h2 className="text-3xl font-normal text-white tracking-tight">Lệnh cho thuê</h2>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-sm text-white rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Tạo lệnh mới
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white/[0.02] p-2 rounded-2xl border border-white/5 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Tìm theo mã lệnh, khách hàng, số điện thoại..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
          />
        </div>
        <div className="h-8 w-px bg-white/10 mx-2"></div>
        <div className="flex gap-2 pr-2">
          {["Tất cả", "Đang thuê", "Cảnh báo", "Hoàn tất"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                filterStatus === tab 
                  ? tab === "Cảnh báo" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" 
                    : tab === "Đang thuê" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : tab === "Hoàn tất" ? "bg-white/20 text-white border border-white/20"
                    : "bg-white/10 text-white border border-white/10"
                  : "text-zinc-500 hover:text-zinc-300 border border-transparent hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/[0.02] rounded-2xl border border-white/5 backdrop-blur-md overflow-hidden min-h-[400px] shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-32 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-sm uppercase tracking-widest animate-pulse">Đang tải dữ liệu từ máy chủ...</p>
          </div>
        ) : filteredRentals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-32 text-zinc-500">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p>Không có lệnh cho thuê nào phù hợp với bộ lọc.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-black/40 text-zinc-500 border-b border-white/5 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-6 py-4">Mã định danh</th>
                <th className="px-6 py-4">Khách hàng</th>
                <th className="px-6 py-4">Hệ thống thiết bị</th>
                <th className="px-6 py-4">Thời gian trả</th>
                <th className="px-6 py-4">Tổng giá trị</th>
                <th className="px-6 py-4">Tình trạng</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRentals.map((item) => {
                const dynamicStatus = getDynamicStatus(item);
                const isLocked = item.status === "Hoàn tất";

                return (
                  <tr key={item.id} className={`hover:bg-white/[0.02] transition-colors group ${isLocked ? 'opacity-60 hover:opacity-100' : ''}`}>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-400 font-medium">{item.orderCode}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{item.customerName}</p>
                      <p className="text-xs text-zinc-500 mt-1">{item.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 max-w-[200px] truncate">{item.equipmentSummary}</td>
                    <td className="px-6 py-4 text-xs font-medium text-white">
                      {item.endDate}
                    </td>
                    <td className="px-6 py-4 font-medium text-emerald-400">
                      {item.totalAmount ? item.totalAmount.toLocaleString('vi-VN') : 0} đ
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(dynamicStatus)}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      
                      {!isLocked && (
                        <>
                          <button onClick={() => handleConfirmReturn(item)} className="text-emerald-500 hover:text-emerald-400 transition-colors p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20" title="Khách trả máy & Chốt đơn">
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEditClick(item)} className="text-zinc-500 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-indigo-500/10" title="Sửa lệnh">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      <button onClick={() => handleDelete(item.id, item.status)} className="text-zinc-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="Xóa lệnh">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL XÁC NHẬN TÙY CHỈNH (THAY THẾ WINDOW.CONFIRM) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                {confirmDialog.type === "danger" ? (
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
                <h3 className="text-lg font-medium text-white">{confirmDialog.title}</h3>
              </div>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed pl-13">
                {confirmDialog.message}
              </p>
            </div>
            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-3 justify-end">
              <button 
                onClick={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-xl transition-all shadow-lg ${
                  confirmDialog.type === "danger" 
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20" 
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-xl font-medium text-white">
                {editingId ? "Cập nhật lệnh thuê" : "Tạo lệnh mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveRental} className="p-6 space-y-6">
              <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-xs text-indigo-400 uppercase tracking-widest font-medium">1. Khách hàng thuê</label>
                </div>
                {!editingId && (
                  <div className="relative">
                    <select 
                      value={selectedCustomerId} 
                      onChange={handleCustomerSelect} 
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="">-- Click để chọn khách hàng từ hồ sơ --</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">▼</div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-5">
                  <input readOnly={!editingId} type="text" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} className="w-full px-4 py-2.5 bg-black/20 border border-white/5 rounded-xl text-zinc-300 focus:outline-none text-sm" placeholder="Tên khách hàng" />
                  <input readOnly={!editingId} type="text" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} className="w-full px-4 py-2.5 bg-black/20 border border-white/5 rounded-xl text-zinc-300 focus:outline-none text-sm" placeholder="Số điện thoại" />
                </div>
              </div>

              <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs text-indigo-400 uppercase tracking-widest font-medium">2. Hệ thống thiết bị</label>
                  {!editingId && (
                    <div className="relative w-48">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input 
                        type="text" 
                        placeholder="Tìm thiết bị..." 
                        value={equipmentSearchTerm}
                        onChange={(e) => setEquipmentSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white text-xs focus:border-indigo-500/50 focus:outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
                
                {!editingId && (
                  <div className="max-h-48 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                    {Object.keys(groupedEquipments).length === 0 ? (
                      <p className="text-zinc-500 text-sm text-center py-4 border border-dashed border-white/10 rounded-xl">Không tìm thấy thiết bị nào đang "Rảnh".</p>
                    ) : (
                      Object.entries(groupedEquipments).map(([category, items]: [string, any]) => (
                        <div key={category} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">{category}</h5>
                            <div className="h-px flex-1 bg-white/5"></div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {(items as any[]).map((eq: any) => {
                              const isSelected = selectedEquipments.some((item: any) => item.id === eq.id);
                              return (
                                <div 
                                  key={eq.id}
                                  onClick={() => handleToggleEquipment(eq)}
                                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                    isSelected ? "bg-indigo-500/10 border-indigo-500/50" : "bg-black/40 border-white/5 hover:border-white/20"
                                  }`}
                                >
                                  <div className="flex flex-col">
                                    <span className={`text-sm ${isSelected ? "text-indigo-300 font-medium" : "text-zinc-300"} truncate max-w-[200px]`} title={eq.name}>{eq.name}</span>
                                    <span className="text-xs text-zinc-500">{formatCurrency(eq.pricePerDay || 0)} đ/ngày</span>
                                  </div>
                                  {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <textarea 
                  readOnly={!editingId}
                  value={formData.equipmentSummary} 
                  onChange={e => setFormData({...formData, equipmentSummary: e.target.value})} 
                  className="w-full px-4 py-3 bg-black/20 border border-white/5 rounded-xl text-white focus:outline-none resize-none h-16 text-sm" 
                  placeholder={editingId ? "Danh sách thiết bị (Chế độ sửa không cho phép đổi thiết bị)..." : "Các thiết bị đã chọn sẽ hiện ở đây..."} 
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Ngày nhận</label>
                      <input required type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Trả dự kiến</label>
                      <input required type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:outline-none text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-emerald-500 uppercase tracking-widest mb-1.5 font-medium">Tổng giá trị (VNĐ)</label>
                      <div className="relative">
                        <input 
                          required 
                          type="text" 
                          value={displayPrice} 
                          onChange={handleManualPriceChange} 
                          className="w-full pl-3 pr-8 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-medium focus:border-emerald-500/50 focus:outline-none text-sm" 
                          placeholder="0" 
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500/50 text-xs">đ</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Tình trạng</label>
                      <div className="w-full px-3 py-2 bg-black/20 border border-white/5 rounded-xl text-zinc-400 text-sm flex items-center gap-2 cursor-not-allowed">
                        <Lock className="w-3.5 h-3.5"/> 
                        {formData.status}
                      </div>
                      <p className="text-[9px] text-zinc-600 mt-1">Được bảo vệ bằng Hệ thống.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-2 border-t border-white/5 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Hủy bỏ</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                  {editingId ? "Cập nhật lệnh" : "Tạo lệnh thuê"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}