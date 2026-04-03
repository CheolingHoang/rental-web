"use client";

import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Thêm Auth để lấy email user
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, where, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Plus, Search, Wrench, Loader2, X, Trash2, Camera, Check, Edit2, Lock } from "lucide-react"; // Đã thêm icon Lock

export interface Equipment {
  id: string;
  name: string;
  category: string;
  status: string;
  serialNumber: string;
  pricePerDay: number;
}

const formatCurrency = (amount: number) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function EquipmentPage() {
  // --- STATE PHÂN QUYỀN (RBAC) ---
  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // null = đang kiểm tra

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const [defaultCategories, setDefaultCategories] = useState(["Máy ảnh", "Ống kính", "Ánh sáng", "Phụ kiện"]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    category: "Máy ảnh",
    serialNumber: "",
    pricePerDay: 0,
    status: "Rảnh",
  });

  const [displayPrice, setDisplayPrice] = useState("");

  // 0. KIỂM TRA PHÂN QUYỀN TRƯỚC KHI TẢI DỮ LIỆU
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        // Quét trong bảng app_users xem email này có quyền không
        const q = query(collection(db, "app_users"), where("email", "==", user.email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          // Kiểm tra xem Role là Admin hoặc trong danh sách allowedPages có chứa link trang này không
          if (userData.role === "Admin" || (userData.allowedPages && userData.allowedPages.includes("/dashboard/equipment"))) {
            setHasPermission(true);
          } else {
            setHasPermission(false);
          }
        } else {
          // Fallback: Nếu không tìm thấy trong danh sách (có thể là tk của bạn lúc mới dev), cứ cho qua
          setHasPermission(true);
        }
      } else {
        setHasPermission(false); // Chưa đăng nhập
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 1. Fetch Dữ liệu Thiết bị
  useEffect(() => {
    // Chỉ tải dữ liệu nếu đã có quyền (tiết kiệm số lượt đọc Firebase)
    if (hasPermission !== true) return; 

    const q = query(collection(db, "equipments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const equipData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Equipment[];
      
      setEquipments(equipData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [hasPermission]);

  const allCategories = Array.from(new Set([...defaultCategories, ...equipments.map(eq => eq.category)]));

  // --- XỬ LÝ DANH MỤC ---
  const handleAddNewCategory = () => {
    if (newCategory.trim() !== "") {
      const addedCategory = newCategory.trim();
      if (!defaultCategories.includes(addedCategory)) {
        setDefaultCategories([...defaultCategories, addedCategory]);
      }
      setFormData({ ...formData, category: addedCategory });
    }
    setIsAddingCategory(false);
    setNewCategory("");
  };

  const handleDeleteCategory = () => {
    const currentCategory = formData.category;
    const isUsed = equipments.some(eq => eq.category === currentCategory);
    if (isUsed) {
      alert(`Không thể xóa danh mục "${currentCategory}" vì đang có thiết bị trong kho thuộc danh mục này!`);
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${currentCategory}"?`)) {
      const newCategories = defaultCategories.filter(cat => cat !== currentCategory);
      setDefaultCategories(newCategories);
      const remainingCategories = Array.from(new Set([...newCategories, ...equipments.map(eq => eq.category)]));
      setFormData({ ...formData, category: remainingCategories[0] || "Khác" });
    }
  };

  // --- XỬ LÝ FORM ---
  const handleManualPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ""); 
    const numValue = rawValue ? parseInt(rawValue, 10) : 0;
    
    setFormData(prev => ({ ...prev, pricePerDay: numValue }));
    setDisplayPrice(rawValue ? formatCurrency(numValue) : "");
  };

  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "equipments", editingId), { ...formData });
      } else {
        await addDoc(collection(db, "equipments"), {
          ...formData,
          createdAt: serverTimestamp()
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Lỗi khi lưu thiết bị:", error);
      alert("Có lỗi xảy ra khi lưu dữ liệu!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: "", category: allCategories[0] || "Máy ảnh", serialNumber: "", pricePerDay: 0, status: "Rảnh" });
    setDisplayPrice("");
  };

  const handleEditClick = (item: Equipment) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      serialNumber: item.serialNumber,
      pricePerDay: item.pricePerDay,
      status: item.status,
    });
    setDisplayPrice(formatCurrency(item.pricePerDay));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thiết bị này khỏi hệ thống?")) {
      await deleteDoc(doc(db, "equipments", id));
    }
  };

  const filteredEquipments = equipments.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Rảnh': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Đang thuê': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Bảo trì': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default: return 'text-zinc-300 bg-white/10 border-white/10';
    }
  };

  // --- GIAO DIỆN KIỂM TRA PHÂN QUYỀN ---
  
  // 1. Màn hình Loading khi đang check DB
  if (hasPermission === null) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm uppercase tracking-widest animate-pulse">Đang kiểm tra dữ liệu định danh...</p>
      </div>
    );
  }

  // 2. Màn hình cấm truy cập
  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 animate-in fade-in zoom-in-95">
        <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">Truy cập bị từ chối</h2>
        <p className="text-zinc-400 max-w-md mb-8">
          Tài khoản của bạn không có đặc quyền để xem và chỉnh sửa "Kho thiết bị". 
          Vui lòng liên hệ Quản trị viên (Admin) để được cấp thêm phân quyền.
        </p>
      </div>
    );
  }

  // 3. Nếu qua ải kiểm tra -> Hiển thị trang bình thường
  return (
    <div className="max-w-7xl mx-auto space-y-8 relative animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium tracking-widest text-indigo-400 uppercase">Quản lý kho</span>
          </div>
          <h2 className="text-3xl font-normal text-white tracking-tight">Thiết bị & Tài sản</h2>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-sm text-white rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
        >
          <Plus className="w-4 h-4" />
          Thêm thiết bị mới
        </button>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className="flex gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Tìm theo tên, serial..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white/[0.02] border border-white/5 rounded-xl text-sm text-white placeholder-zinc-600 focus:bg-white/5 focus:border-indigo-500/30 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all"
          />
        </div>
        <div className="relative min-w-[200px]">
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-white/5 rounded-xl text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/30 cursor-pointer appearance-none"
          >
            <option value="all">Tất cả danh mục</option>
            {allCategories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">▼</div>
        </div>
      </div>

      {/* Danh sách thiết bị */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 backdrop-blur-md overflow-hidden min-h-[400px] shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-32 text-zinc-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-sm uppercase tracking-widest animate-pulse">Đang tải dữ liệu từ máy chủ...</p>
          </div>
        ) : filteredEquipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-32 text-zinc-500">
            <Camera className="w-12 h-12 mb-4 opacity-20" />
            <p>Kho thiết bị hiện đang trống hoặc không tìm thấy kết quả.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-black/40 text-zinc-500 border-b border-white/5 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-6 py-4">Thiết bị</th>
                <th className="px-6 py-4">Serial / Mã vạch</th>
                <th className="px-6 py-4">Danh mục</th>
                <th className="px-6 py-4">Đơn giá (Ngày)</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEquipments.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-300">{item.serialNumber}</td>
                  <td className="px-6 py-4">{item.category}</td>
                  <td className="px-6 py-4 font-medium text-indigo-300">
                    {item.pricePerDay ? item.pricePerDay.toLocaleString('vi-VN') : 0} đ
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(item)} className="text-zinc-500 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-indigo-500/10" title="Sửa thiết bị">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10" title="Xóa thiết bị">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Thêm/Sửa thiết bị */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-xl font-medium text-white">
                {editingId ? "Cập nhật tài sản" : "Thêm tài sản mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEquipment} className="p-6 space-y-5">
              <div>
                <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2 font-medium">Tên thiết bị</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all" placeholder="VD: Bàn trộn hình ATEM Mini Pro" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2 font-medium">Danh mục</label>
                  {isAddingCategory ? (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                      <input 
                        autoFocus
                        type="text" 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Nhập loại mới..." 
                        className="w-full px-3 py-2.5 bg-black/40 border border-indigo-500/50 rounded-xl text-white focus:outline-none text-sm"
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddNewCategory(); } }}
                      />
                      <button type="button" onClick={handleAddNewCategory} className="px-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setIsAddingCategory(false)} className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-zinc-400 hover:text-white transition-colors flex items-center justify-center shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative w-full">
                        <select 
                          value={formData.category} 
                          onChange={e => setFormData({...formData, category: e.target.value})} 
                          className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:outline-none appearance-none transition-all"
                        >
                          {allCategories.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">▼</div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setIsAddingCategory(true)}
                        className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-indigo-400 hover:text-indigo-300 transition-colors flex items-center justify-center shrink-0"
                        title="Tạo danh mục mới"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      {/* Nút XÓA Danh mục */}
                      <button 
                        type="button" 
                        onClick={handleDeleteCategory}
                        className="px-3 py-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-xl text-zinc-500 hover:text-red-400 transition-colors flex items-center justify-center shrink-0"
                        title="Xóa danh mục hiện tại"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2 font-medium">Số Serial / Mã vạch</label>
                  <input required type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none font-mono text-sm transition-all" placeholder="SN-123456" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2 font-medium">Giá thuê / Ngày (VNĐ)</label>
                  <div className="relative">
                    <input 
                      required 
                      type="text" 
                      value={displayPrice} 
                      onChange={handleManualPriceChange} 
                      className="w-full pl-4 pr-8 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all" 
                      placeholder="VD: 500.000" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm pointer-events-none">đ</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2 font-medium">Trạng thái đầu vào</label>
                  <div className="relative">
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:border-indigo-500/50 focus:outline-none appearance-none transition-all">
                      <option>Rảnh</option>
                      <option>Đang thuê</option>
                      <option>Bảo trì</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 text-xs">▼</div>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-2 border-t border-white/5 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors">Hủy bỏ</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium text-white rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
                  {editingId ? "Cập nhật thay đổi" : "Lưu thiết bị"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}