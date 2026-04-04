"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Wrench, FileText, Settings, 
  LogOut, Search, Users, Image as ImageIcon, Box, Camera, BrainCircuit, Activity, Bot, Lock
} from "lucide-react";
import { logout } from "../../services/auth";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const lastWorkspace = useRef("HUB");
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Tránh lỗi Hydration Mismatch của Next.js
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.email) {
        try {
          const q = query(collection(db, "app_users"), where("email", "==", user.email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setCurrentUser(snap.docs[0].data());
          } else {
            setCurrentUser({ email: user.email, role: "Guest", allowedPages: [] });
          }
        } catch (error) {
          console.error("Lỗi tải thông tin user:", error);
        }
      } else {
        setCurrentUser(null);
      }
      setIsLoadingUser(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  const displayName = currentUser?.fullName || currentUser?.displayUsername || currentUser?.email?.split('@')[0] || "Đang tải...";
  const avatarText = displayName !== "Đang tải..." ? displayName.substring(0, 2).toUpperCase() : "AD";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  let currentWorkspace = lastWorkspace.current;

  if (pathname.includes("/project")) {
    currentWorkspace = "PROOFING";
  } else if (pathname.includes("/overview") || pathname.includes("/rentals") || pathname.includes("/equipment") || pathname.includes("/ai-settings") || pathname.includes("/ai-ocr") || pathname.includes("/customers")) {
    currentWorkspace = "RENTAL";
  } else if (pathname.includes("/settings")) {
    currentWorkspace = "SETTINGS";
  } else if (pathname.includes("/cfs-bot")) { 
    currentWorkspace = "AUTOMATION";
  } else if (pathname === "/dashboard") {
    currentWorkspace = "HUB";
  }

  lastWorkspace.current = currentWorkspace;

  let workspaceName = "CHEOLING HUB";
  let WorkspaceIcon = LayoutDashboard;
  let menuToRender: any[] = [];

  if (currentWorkspace === "PROOFING") {
    workspaceName = "CLIENT PROOFING";
    WorkspaceIcon = Camera;
    menuToRender = [
      { name: "Hub", icon: LayoutDashboard, path: "/dashboard", isBackBtn: true },
      { name: "Khách hàng", icon: Users, path: "/dashboard/customers" },
      { name: "Duyệt ảnh", icon: ImageIcon, path: "/dashboard/project" },
    ];
  } else if (currentWorkspace === "RENTAL") {
    workspaceName = "RENTAL WORKSPACE";
    WorkspaceIcon = Box;
    // ĐÃ XÓA MỤC AI OCR KHỎI ĐÂY
    menuToRender = [
      { name: "Hub", icon: LayoutDashboard, path: "/dashboard", isBackBtn: true },
      { name: "Tổng quan", icon: Activity, path: "/dashboard/overview" },
      { name: "Lệnh thuê", icon: FileText, path: "/dashboard/rentals" },
      { name: "Thiết bị", icon: Wrench, path: "/dashboard/equipment" },
      { name: "Khách hàng", icon: Users, path: "/dashboard/customers" },
      { name: "Cấu hình AI", icon: BrainCircuit, path: "/dashboard/ai-settings" },
    ];
  } else if (currentWorkspace === "AUTOMATION") { 
    workspaceName = "AUTOMATION CORE";
    WorkspaceIcon = Bot;
    menuToRender = [
      { name: "Hub", icon: LayoutDashboard, path: "/dashboard", isBackBtn: true },
      { name: "CFS Bot", icon: Bot, path: "/dashboard/cfs-bot" },
    ];
  } else if (currentWorkspace === "SETTINGS") {
    workspaceName = "SYSTEM SETTINGS";
    WorkspaceIcon = Settings;
    menuToRender = [
      { name: "Hub", icon: LayoutDashboard, path: "/dashboard", isBackBtn: true },
      { name: "Cài đặt", icon: Settings, path: "/dashboard/settings" },
    ];
  } else {
    workspaceName = "CHEOLING HUB";
    WorkspaceIcon = LayoutDashboard;
    menuToRender = [
      { name: "Hub", icon: LayoutDashboard, path: "/dashboard" },
      { name: "Rental", icon: Box, path: "/dashboard/overview" },
      { name: "Proofing", icon: Camera, path: "/dashboard/project" },
      { name: "Auto Bot", icon: Bot, path: "/dashboard/cfs-bot" }, 
      { name: "Cài đặt", icon: Settings, path: "/dashboard/settings" },
    ];
  }

  const checkAccess = () => {
    if (isLoadingUser) return true; 
    if (pathname === "/dashboard") return true; 
    if (currentUser?.role === "Admin") return true; 
    return currentUser?.allowedPages?.some((p: string) => pathname === p || pathname.startsWith(p + "/"));
  };

  const hasAccess = checkAccess();

  return (
    <>
      <div className="flex h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

        {/* SIDEBAR BÊN TRÁI CHO PC */}
        <aside className="hidden md:flex w-64 bg-white/[0.02] border-r border-white/5 flex-col backdrop-blur-3xl z-30 shrink-0">
          <Link href="/dashboard" className="h-20 flex items-center px-8 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
            <h1 className="text-xl font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              CHEOLING<sup className="text-[10px] ml-1 opacity-50 text-indigo-400">OS</sup>
            </h1>
          </Link>

          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-2">
              <WorkspaceIcon className="w-3.5 h-3.5" /> {workspaceName}
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-1.5 mt-2 overflow-y-auto custom-scrollbar">
            {menuToRender.map((item, index) => {
              const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== "/dashboard");
              
              if (item.isBackBtn) {
                return (
                  <div key="back-btn" className="mb-6 border-b border-white/5 pb-4">
                    <Link href={item.path} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:bg-white/5 hover:text-white transition-colors border border-transparent">
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="text-sm font-medium tracking-wide">Trở về trung tâm</span>
                    </Link>
                  </div>
                );
              }

              return (
                <Link key={item.name + index} href={item.path} className="block">
                  <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors border border-transparent ${
                    isActive ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`}>
                    <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                    <span className="text-sm font-medium tracking-wide">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors font-medium">
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-sm">Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          
          <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-5 md:px-10 backdrop-blur-md bg-black/20 z-30 shrink-0 relative">
            <div className="flex items-center w-full md:w-auto">
              
              <Link href="/dashboard" className="md:hidden flex items-center">
                 <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center mr-3 border border-indigo-500/30">
                    <Activity className="w-4 h-4 text-indigo-400" />
                 </div>
                 <h1 className="text-lg font-bold tracking-tighter text-white">
                  CHEOLING<sup className="text-[8px] ml-0.5 opacity-50 text-indigo-400">OS</sup>
                 </h1>
              </Link>

              <div className="hidden md:block relative w-64 lg:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <input type="text" placeholder="Tìm kiếm trong hệ thống..." className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-full text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden sm:flex flex-col items-end mr-1 animate-in fade-in duration-500">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/80">{getGreeting()}</span>
                <span className="text-sm font-bold text-white tracking-wide">{displayName}</span>
              </div>
              
              <Link href="/dashboard/settings">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs md:text-sm font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer hover:scale-105 transition-transform border border-white/10">
                  {avatarText}
                </div>
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8"> 
            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 h-full">
              {!hasAccess ? (
                <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4 animate-in zoom-in-95 duration-500">
                  <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative">
                    <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping opacity-50"></div>
                    <Lock className="w-10 h-10 text-red-400 relative z-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-3">Truy cập bị từ chối</h2>
                  <p className="text-zinc-400 max-w-md mb-8 leading-relaxed text-sm md:text-base">Tài khoản của bạn chưa được cấp quyền tính năng này. Vui lòng liên hệ Admin hệ thống.</p>
                  <Link href="/dashboard">
                    <button className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/10 hover:border-white/20 shadow-lg">
                      Trở về Hub
                    </button>
                  </Link>
                </div>
              ) : (
                children
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 🚀 BOTTOM NAVIGATION MOBILE (Đã fix Hydration) 🚀 */}
      {/* ========================================================= */}
      {mounted && (
        <div suppressHydrationWarning className="md:hidden fixed bottom-0 left-0 right-0 h-[76px] bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 z-40 overflow-x-auto overscroll-x-contain snap-x snap-mandatory shadow-[0_-10px_40px_rgba(0,0,0,0.5)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center h-full px-2 w-max min-w-full">
            {menuToRender.map((item, index) => {
              const isActive = pathname === item.path || (pathname.startsWith(item.path) && item.path !== "/dashboard");
              
              // Đã fix lỗi lệch width giữa các nút (đều là w-[76px])
              if (item.isBackBtn) {
                return (
                   <Link key={index} href={item.path} className="flex flex-col items-center justify-center w-[76px] shrink-0 h-full gap-1.5 transition-colors snap-center pb-2">
                    <div className="p-1.5 rounded-full transition-all bg-white/5">
                      <LayoutDashboard className="w-5 h-5 text-zinc-300" />
                    </div>
                    <span className="text-[10px] font-medium tracking-wide truncate max-w-full px-1 text-center text-zinc-400">
                      Hub
                    </span>
                  </Link>
                );
              }

              return (
                <Link key={index} href={item.path} className="flex flex-col items-center justify-center w-[76px] shrink-0 h-full gap-1.5 transition-colors snap-center pb-2">
                  <div className={`p-1.5 rounded-full transition-all ${isActive ? "bg-indigo-500/10" : ""}`}>
                    <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide truncate max-w-full px-1 text-center ${isActive ? "text-indigo-400 font-bold" : "text-zinc-500"}`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}

            <div className="w-[1px] h-8 bg-white/10 mx-1 shrink-0 pb-2" />

            <button onClick={handleLogout} className="flex flex-col items-center justify-center w-[76px] shrink-0 h-full gap-1.5 transition-colors snap-center text-red-500/80 hover:text-red-400 pb-2 pr-4">
               <div className="p-1.5 rounded-full bg-red-500/10">
                  <LogOut className="w-5 h-5" />
               </div>
               <span className="text-[10px] font-medium tracking-wide text-center">Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}