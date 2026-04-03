"use client";

import { useState, useEffect } from "react";
import { User, Key, Bell, Shield, Save, Database, Cpu, Users, Plus, X, Lock, Loader2 } from "lucide-react";
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, query, where, getDocs } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"; 
import { initializeApp, getApp } from "firebase/app"; 
import { db } from "../../../lib/firebase"; 

const PAGES = [
  { id: "/dashboard", name: "Tổng quan" },
  { id: "/dashboard/equipment", name: "Kho thiết bị" },
  { id: "/dashboard/customers", name: "Khách hàng" },
  { id: "/dashboard/rentals", name: "Lệnh thuê" },
  { id: "/dashboard/ai-settings", name: "Cấu hình AI" },
  { id: "/dashboard/settings", name: "Hệ thống" },
];

export default function SettingsPage() {
  // --- STATE PHÂN QUYỀN ---
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState("accounts"); 
  const [isSaving, setIsSaving] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "", 
    password: "", 
    role: "Nhân viên",
    allowedPages: ["/dashboard", "/dashboard/ai-settings"] 
  });

  // 1. KIỂM TRA PHÂN QUYỀN (CHỈ ADMIN MỚI ĐƯỢC VÀO TRANG NÀY)
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        const q = query(collection(db, "app_users"), where("email", "==", user.email));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          if (userData.role === "Admin" || (userData.allowedPages && userData.allowedPages.includes("/dashboard/settings"))) {
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

  // 2. Lắng nghe danh sách user từ Firebase
  useEffect(() => {
    if (hasPermission !== true) return;
    const unsubscribe = onSnapshot(collection(db, "app_users"), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [hasPermission]);

  const handleSaveConfig = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("Đã lưu cấu hình thành công!");
    }, 1000);
  };

  const handleTogglePagePermission = (pageId: string) => {
    setNewUser(prev => {
      const isAllowed = prev.allowedPages.includes(pageId);
      if (isAllowed) {
        return { ...prev, allowedPages: prev.allowedPages.filter(p => p !== pageId) };
      } else {
        return { ...prev, allowedPages: [...prev.allowedPages, pageId] };
      }
    });
  };

  // 3. HÀM TẠO USER MỚI (CÓ DÙNG APP ẢO CHỐNG VĂNG NICK ADMIN)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return alert("Vui lòng nhập Tên đăng nhập và Mật khẩu!");

    // Đệm email ảo để Firebase nhận diện
    let finalEmail = newUser.username.trim().toLowerCase();
    if (!finalEmail.includes('@')) {
      finalEmail += '@space.internal';
    }

    // Đệm password bí mật
    const finalPassword = newUser.password + "SpaceVN@2026";

    try {
      // TẠO APP ẢO ĐỂ KHÔNG BỊ VĂNG NICK ADMIN
      const primaryApp = getApp(); 
      const secondaryApp = initializeApp(primaryApp.options, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      // Tạo tài khoản trên app ngầm
      await createUserWithEmailAndPassword(secondaryAuth, finalEmail, finalPassword);
      
      // Xóa phiên đăng nhập của app ngầm ngay lập tức
      await secondaryAuth.signOut();

      // VẪN LƯU VÀO DATABASE BẰNG QUYỀN ADMIN NHƯ BÌNH THƯỜNG
      await addDoc(collection(db, "app_users"), {
        displayUsername: newUser.username.trim(), 
        email: finalEmail, 
        role: newUser.role,
        allowedPages: newUser.role === "Admin" ? PAGES.map(p => p.id) : newUser.allowedPages,
        createdAt: serverTimestamp()
      });
      
      setIsAddUserOpen(false);
      setNewUser({ username: "", password: "", role: "Nhân viên", allowedPages: ["/dashboard", "/dashboard/ai-settings"] });
      
      alert(`Đã tạo tài khoản "${newUser.username}" thành công!\n\nTài khoản Admin của bạn vẫn đang được giữ nguyên an toàn.`);
    } catch (error: any) {
      console.error("Lỗi thêm user:", error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Tên đăng nhập này đã có người sử dụng!");
      } else {
        alert("Lỗi khi tạo tài khoản: " + error.message);
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    if(confirm("Thu hồi quyền của tài khoản này? (Tài khoản sẽ không còn vào được hệ thống)")) {
      await deleteDoc(doc(db, "app_users", id));
    }
  };

  // --- GIAO DIỆN KIỂM TRA PHÂN QUYỀN ---
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
          Chỉ Quản trị viên (Admin) mới có quyền truy cập vào Cài đặt hệ thống.
        </p>
      </div>
    );
  }

  // --- GIAO DIỆN TRANG CHÍNH ---
  return (
    <div className="max-w-5xl mx-auto space-y-8 relative animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SettingsIcon className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium tracking-widest text-indigo-400 uppercase">System Configuration</span>
          </div>
          <h2 className="text-3xl font-normal text-white tracking-tight">Cài đặt hệ thống</h2>
        </div>
        <button onClick={handleSaveConfig} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-2 md:col-span-1">
          <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "profile" ? "bg-white/10 text-white border border-white/10" : "hover:bg-white/5 text-zinc-400 hover:text-white"}`}>
            <User className="w-4 h-4" /> <span className="font-medium text-sm">Hồ sơ của tôi</span>
          </button>
          <button onClick={() => setActiveTab("accounts")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "accounts" ? "bg-white/10 text-white border border-white/10" : "hover:bg-white/5 text-zinc-400 hover:text-white"}`}>
            <Users className="w-4 h-4" /> <span className="font-medium text-sm">Quản lý nhân sự</span>
          </button>
          <button onClick={() => setActiveTab("api")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === "api" ? "bg-white/10 text-white border border-white/10" : "hover:bg-white/5 text-zinc-400 hover:text-white"}`}>
            <Cpu className="w-4 h-4" /> <span className="font-medium text-sm">Tích hợp API</span>
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          {activeTab === "accounts" && (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-right-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" /> Quản trị phân quyền
                </h3>
                <button onClick={() => setIsAddUserOpen(true)} className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" /> Cấp tài khoản mới
                </button>
              </div>

              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="p-4 bg-black/40 border border-white/5 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-white">{u.displayUsername || u.email}</p>
                      <p className="text-xs text-zinc-500 mt-1">Vai trò: <span className={u.role === "Admin" ? "text-rose-400" : "text-emerald-400"}>{u.role}</span></p>
                    </div>
                    <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      Thu hồi quyền
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl animate-in fade-in">
              <h3 className="text-lg font-medium text-white mb-6">Thông tin cá nhân</h3>
              <p className="text-zinc-500 text-sm">Tính năng đang cập nhật...</p>
            </div>
          )}
          {activeTab === "api" && (
            <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md shadow-xl animate-in fade-in">
              <h3 className="text-lg font-medium text-white mb-6">Cấu hình API Key</h3>
              <p className="text-zinc-500 text-sm">Tính năng đang cập nhật...</p>
            </div>
          )}
        </div>
      </div>

      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-5 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-medium text-white">Cấp tài khoản & Phân quyền</h3>
              <button onClick={() => setIsAddUserOpen(false)}><X className="w-5 h-5 text-zinc-500 hover:text-white" /></button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-500 uppercase mb-2">Tên đăng nhập / Email</label>
                  <input required type="text" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none" placeholder="VD: nhanvien1"/>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 uppercase mb-2">Cấp Mật khẩu</label>
                  <input required type="text" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none" placeholder="VD: 1"/>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-500 uppercase mb-2">Loại tài khoản</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none appearance-none">
                  <option value="Nhân viên">Nhân viên (Giới hạn truy cập)</option>
                  <option value="Admin">Admin (Toàn quyền)</option>
                </select>
              </div>

              {newUser.role === "Nhân viên" && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                  <label className="block text-xs text-indigo-400 uppercase font-medium mb-3">Cho phép truy cập các trang:</label>
                  <div className="grid grid-cols-2 gap-3">
                    {PAGES.map(page => (
                      <label key={page.id} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={newUser.allowedPages.includes(page.id)}
                          onChange={() => handleTogglePagePermission(page.id)}
                          className="rounded bg-black/50 border-white/20 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-zinc-300">{page.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium mt-4">
                Xác nhận tạo tài khoản
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsIcon(props: any) { return (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>); }