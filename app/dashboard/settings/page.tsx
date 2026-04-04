"use client";

import { useState, useEffect } from "react";
import { 
  User, Key, Bell, Shield, Save, Database, Cpu, Users, Plus, X, Lock, 
  Loader2, Settings, Box, Camera, CheckCircle2, AlertTriangle, UserPlus, 
  LogIn, KeySquare, Check, Pencil, Bot, Zap, LayoutDashboard, FolderKanban, IdCard, AlertOctagon
} from "lucide-react";
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, query, where, getDocs, updateDoc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth"; 
import { initializeApp, getApp } from "firebase/app"; 
import { db } from "../../../lib/firebase"; 

const ICON_MAP: Record<string, any> = {
  Box, Camera, Bot, Settings, Users, Database, Shield, Zap, LayoutDashboard, FolderKanban
};

const DEFAULT_MODULES = [
  {
    id: "rental_workspace",
    name: "Rental Workspace",
    icon: "Box",
    pages: [
      { id: "/dashboard/overview", name: "Tổng quan Rental" },
      { id: "/dashboard/rentals", name: "Quản lý Lệnh thuê" },
      { id: "/dashboard/equipment", name: "Kho thiết bị" },
      { id: "/dashboard/customers", name: "Dữ liệu Khách hàng" },
      { id: "/dashboard/ai-settings", name: "Cấu hình AI Core" },
    ]
  },
  {
    id: "client_proofing",
    name: "Client Proofing",
    icon: "Camera",
    pages: [
      { id: "/dashboard/customers", name: "Dữ liệu Khách hàng" },
      { id: "/dashboard/project", name: "Dự án Duyệt ảnh" },
    ]
  },
  {
    id: "automation_bot",
    name: "Automation Core",
    icon: "Bot",
    pages: [
      { id: "/dashboard/cfs-bot", name: "Bot Duyệt CFS" },
    ]
  }
];

export default function SettingsPage() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState("accounts"); 
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  
  const [permissionGroups, setPermissionGroups] = useState<any[]>([]);
  const [allPages, setAllPages] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalError, setModalError] = useState(""); 
  const [formData, setFormData] = useState({
    id: "",
    username: "", 
    fullName: "", 
    password: "", 
    role: "Nhân viên",
    allowedPages: ["/dashboard/overview"] 
  });

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

  useEffect(() => {
    if (hasPermission !== true) return;
    
    const unsubUsers = onSnapshot(collection(db, "app_users"), (snapshot) => {
      const sortedUsers = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (a.role === 'Admin' ? -1 : 1));
      setUsers(sortedUsers);
    });

    const unsubModules = onSnapshot(doc(db, "system_configs", "permission_modules"), (docSnap) => {
      if (docSnap.exists()) {
        const modules = docSnap.data().groups || DEFAULT_MODULES;
        setPermissionGroups(modules);
        setAllPages(Array.from(new Set(modules.flatMap((g: any) => g.pages.map((p: any) => p.id)) as string[])));
      } else {
        setDoc(doc(db, "system_configs", "permission_modules"), { groups: DEFAULT_MODULES });
        setPermissionGroups(DEFAULT_MODULES);
        setAllPages(Array.from(new Set(DEFAULT_MODULES.flatMap(g => g.pages.map(p => p.id)))));
      }
    });

    return () => {
      unsubUsers();
      unsubModules();
    };
  }, [hasPermission]);

  const handleSaveConfig = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const handleTogglePagePermission = (pageId: string) => {
    setFormData(prev => {
      const isAllowed = prev.allowedPages.includes(pageId);
      if (isAllowed) {
        return { ...prev, allowedPages: prev.allowedPages.filter(p => p !== pageId) };
      } else {
        return { ...prev, allowedPages: [...prev.allowedPages, pageId] };
      }
    });
  };

  const handleOpenAdd = () => {
    setModalError(""); 
    setModalMode("add");
    setFormData({ id: "", username: "", fullName: "", password: "", role: "Nhân viên", allowedPages: ["/dashboard/overview"] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: any) => {
    setModalError(""); 
    setModalMode("edit");
    setFormData({
      id: u.id,
      username: u.displayUsername || u.email.split("@")[0],
      fullName: u.fullName || "", 
      password: "••••••••", 
      role: u.role,
      allowedPages: u.allowedPages || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(""); 

    if (modalMode === "add") {
      if (!formData.username || !formData.password) return;
      let finalEmail = formData.username.trim().toLowerCase();
      if (!finalEmail.includes('@')) finalEmail += '@space.internal';
      const finalPassword = formData.password + "SpaceVN@2026";

      try {
        const primaryApp = getApp(); 
        const secondaryApp = initializeApp(primaryApp.options, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        await createUserWithEmailAndPassword(secondaryAuth, finalEmail, finalPassword);
        await secondaryAuth.signOut();

        await addDoc(collection(db, "app_users"), {
          displayUsername: formData.username.trim(), 
          fullName: formData.fullName.trim(), 
          email: finalEmail, 
          role: formData.role,
          allowedPages: formData.role === "Admin" ? allPages : formData.allowedPages,
          createdAt: serverTimestamp()
        });
        
        setIsModalOpen(false);
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          setModalError(`Tên đăng nhập "${formData.username}" đã tồn tại trong lõi hệ thống. Vui lòng chọn tên khác!`);
        } else {
          setModalError("Lỗi hệ thống: " + error.message);
        }
      }
    } 
    else {
      // XỬ LÝ CẬP NHẬT TÀI KHOẢN (EDIT)
      try {
        const userRef = doc(db, "app_users", formData.id);
        
        // Cập nhật thông tin trên Database (Firestore)
        await updateDoc(userRef, {
          displayUsername: formData.username.trim(), 
          fullName: formData.fullName.trim(), 
          role: formData.role,
          allowedPages: formData.role === "Admin" ? allPages : formData.allowedPages
        });

        // NẾU NGƯỜI DÙNG CỐ TÌNH NHẬP MẬT KHẨU MỚI THAY VÌ DẤU ••••••••
        if (formData.password !== "••••••••") {
          setModalError("Đã lưu Phân quyền và Tên! Nhưng Mật khẩu & ID cốt lõi không thể tự đổi trên web. Bạn cần cấu hình Firebase Admin ở Server để đổi pass.");
          return; // Giữ modal lại để họ đọc thông báo
        }
        
        setIsModalOpen(false);
      } catch (error: any) {
        setModalError("Lỗi cập nhật: " + error.message);
      }
    }
  };

  const handleDeleteUser = async (id: string, role: string) => {
    if (role === "Admin") return;
    if(confirm("Xác nhận xóa hồ sơ nhân sự này?\nLƯU Ý: Nút này chỉ xóa dữ liệu hệ thống, tài khoản đăng nhập lõi vẫn sẽ bị kẹt lại do bảo mật của Firebase. Nếu muốn tạo lại, hãy dùng Tên đăng nhập khác.")) {
      await deleteDoc(doc(db, "app_users", id));
    }
  };

  if (hasPermission === null) return (
    <div className="flex flex-col items-center justify-center h-[70vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" /><p className="text-xs uppercase tracking-widest animate-pulse text-zinc-500 font-medium">Đang xác thực bảo mật...</p></div>
  );

  if (hasPermission === false) return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 animate-in fade-in zoom-in-95">
      <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6"><Lock className="w-10 h-10 text-red-400" /></div>
      <h2 className="text-3xl font-bold text-white mb-3">Truy cập bị từ chối</h2>
      <p className="text-zinc-400 max-w-md">Chỉ Quản trị viên (Admin) mới có quyền truy cập vào khu vực Cấu hình hệ thống.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative animate-in fade-in duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-[24px] backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase">System Configuration</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Cài đặt hệ thống</h1>
          <p className="text-sm text-zinc-500 mt-1">Quản lý phân quyền nhân sự và các tích hợp lõi.</p>
        </div>
        <button onClick={handleSaveConfig} disabled={isSaving} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:opacity-50">
          <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} /> {isSaving ? "Đang đồng bộ..." : "Lưu thay đổi"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2 md:col-span-1">
          {[
            { id: "accounts", label: "Quản lý nhân sự", icon: Users },
            { id: "profile", label: "Hồ sơ của tôi", icon: User },
            { id: "api", label: "Tích hợp API", icon: Cpu },
            { id: "security", label: "Bảo mật", icon: Shield },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-medium text-sm ${activeTab === tab.id ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent"}`}>
              <tab.icon className="w-4 h-4 shrink-0" /> <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="md:col-span-3">
          {activeTab === "accounts" && (
            <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 md:p-8 backdrop-blur-md shadow-2xl animate-in slide-in-from-right-4 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    Danh sách Nhân sự ({users.length})
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">Quản lý quyền truy cập của các thành viên trong hệ thống.</p>
                </div>
                <button onClick={handleOpenAdd} className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shrink-0 shadow-lg shadow-white/10">
                  <UserPlus className="w-4 h-4" /> Cấp tài khoản mới
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {users.map(u => (
                  <div key={u.id} className={`p-5 rounded-[20px] border transition-all ${u.role === 'Admin' ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-black/40 border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${u.role === 'Admin' ? 'bg-gradient-to-tr from-indigo-500 to-purple-500 text-white' : 'bg-white/10 text-zinc-300'}`}>
                          {(u.displayUsername || u.email).substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-base font-bold text-white">{u.fullName || u.displayUsername || u.email}</p>
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${u.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-zinc-400'}`}>
                            {u.role === 'Admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />} {u.role}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleOpenEdit(u)} className="p-2 text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-colors" title="Sửa phân quyền">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.role !== 'Admin' && (
                          <button onClick={() => handleDeleteUser(u.id, u.role)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors" title="Thu hồi quyền">
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium mb-2">Quyền truy cập Module</p>
                      <div className="flex flex-wrap gap-1.5">
                        {u.role === 'Admin' ? (
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Full Access (Tất cả tính năng)
                          </span>
                        ) : (
                          u.allowedPages?.map((path: string, i: number) => {
                            const pageName = allPages.includes(path) ? permissionGroups.flatMap(g => g.pages).find(p => p.id === path)?.name : path;
                            return (
                              <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-zinc-300">
                                {pageName}
                              </span>
                            )
                          }) || <span className="text-xs text-zinc-600 italic">Chưa cấp quyền nào</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === "profile" || activeTab === "api" || activeTab === "security") && (
            <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-12 text-center flex flex-col items-center justify-center animate-in fade-in">
              <Settings className="w-12 h-12 text-zinc-700 mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">Module đang hoàn thiện</h3>
              <p className="text-zinc-500 text-sm max-w-sm">Tính năng này sẽ được cập nhật trong phiên bản tiếp theo.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {modalMode === "add" ? <><UserPlus className="w-5 h-5 text-indigo-400"/> Cấp tài khoản mới</> : <><Pencil className="w-5 h-5 text-indigo-400"/> Cập nhật tài khoản</>}
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  {modalMode === "add" ? "Tạo thông tin đăng nhập và phân vùng hệ thống." : "Thay đổi thông tin và quyền truy cập."}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <form id="userForm" onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              
              <div>
                <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2"><KeySquare className="w-4 h-4 text-zinc-400" /> 1. Định danh nhân sự</h4>
                </div>
                
                {modalMode === "edit" && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
                    <AlertOctagon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200/80 leading-relaxed">
                      Lưu ý bảo mật: Bạn có thể đổi tên hiển thị. Nhưng để đổi <strong className="text-blue-400">Tên đăng nhập lõi</strong> hoặc <strong className="text-blue-400">Mật khẩu</strong>, hệ thống yêu cầu tích hợp Server Backend bằng Firebase Admin.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase mb-2">Tên đăng nhập (Username)</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        required 
                        type="text" 
                        value={formData.username} 
                        onChange={e => setFormData({...formData, username: e.target.value})} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white outline-none transition-all text-sm focus:border-indigo-500 focus:bg-white/[0.02]" 
                        placeholder="VD: nv_sale01" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 uppercase mb-2">Mã bảo mật (Password)</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input 
                        required 
                        type="text" 
                        value={formData.password} 
                        onChange={e => setFormData({...formData, password: e.target.value})} 
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white outline-none transition-all text-sm focus:border-indigo-500 focus:bg-white/[0.02]" 
                        placeholder="Cấp mật khẩu"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-500 uppercase mb-2">Tên hiển thị (Tên thật)</label>
                  <div className="relative">
                    <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      value={formData.fullName} 
                      onChange={e => setFormData({...formData, fullName: e.target.value})} 
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white outline-none transition-all text-sm focus:border-indigo-500 focus:bg-white/[0.02]" 
                      placeholder="VD: Nguyễn Văn A (Tùy chọn)" 
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                  <Shield className="w-4 h-4 text-zinc-400" /> 2. Cấp độ bảo mật
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    onClick={() => setFormData({...formData, role: "Nhân viên"})}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.role === "Nhân viên" ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-sm">Nhân viên</p>
                      {formData.role === "Nhân viên" && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <p className="text-xs opacity-70">Phân quyền tùy chỉnh từng Module.</p>
                  </div>

                  <div 
                    onClick={() => setFormData({...formData, role: "Admin"})}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.role === "Admin" ? "bg-rose-500/10 border-rose-500 text-rose-400" : "bg-white/5 border-white/10 text-zinc-400 hover:border-white/20"}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-sm">Admin</p>
                      {formData.role === "Admin" && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <p className="text-xs opacity-70">Toàn quyền kiểm soát hệ thống.</p>
                  </div>
                </div>
              </div>

              {formData.role === "Nhân viên" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
                    <Database className="w-4 h-4 text-zinc-400" /> 3. Cấp quyền phân vùng (Workspace)
                  </h4>
                  
                  <div className="space-y-4">
                    {permissionGroups.map((group, gIndex) => {
                      const GroupIcon = ICON_MAP[group.icon] || Box;
                      return (
                        <div key={gIndex} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-4">
                            <GroupIcon className="w-4 h-4" /> {group.name}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {group.pages.map((page: any) => {
                              const isAllowed = formData.allowedPages.includes(page.id);
                              return (
                                <div 
                                  key={page.id}
                                  onClick={() => handleTogglePagePermission(page.id)}
                                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isAllowed ? "bg-white/10 border-white/20" : "bg-black/40 border-white/5 hover:border-white/10"}`}
                                >
                                  <span className={`text-sm ${isAllowed ? "text-white font-medium" : "text-zinc-500"}`}>{page.name}</span>
                                  <div className={`w-10 h-6 rounded-full flex items-center transition-colors p-1 ${isAllowed ? 'bg-indigo-500' : 'bg-black/50 border border-white/10'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${isAllowed ? 'translate-x-4' : 'translate-x-0'}`} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </form>

            <div className="p-6 border-t border-white/5 bg-black/40 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex-1">
                {modalError && (
                  <p className="text-xs text-red-400 font-medium flex items-start gap-2 animate-in fade-in slide-in-from-left-2 max-w-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {modalError}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">Hủy bỏ</button>
                <button form="userForm" type="submit" className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-white/10">
                  <Check className="w-4 h-4" /> Lưu thông tin
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}