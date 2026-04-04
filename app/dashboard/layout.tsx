"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Wrench, FileText, Settings, 
  LogOut, Search, Sparkles, Users, Menu, X, Image as ImageIcon, Box, Camera, BrainCircuit, Activity
} from "lucide-react";
import { logout } from "../../services/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // BỘ NHỚ TẠM THỜI: Ghi nhớ xem bạn đang ở Workspace nào
  const lastWorkspace = useRef("HUB");

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  // ==========================================
  // THUẬT TOÁN NHẬN DIỆN WORKSPACE THÔNG MINH
  // ==========================================
  let currentWorkspace = lastWorkspace.current;

  // 1. Nếu đang ở các trang chỉ thuộc về PROOFING
  if (pathname.includes("/project")) {
    currentWorkspace = "PROOFING";
  } 
  // 2. Nếu đang ở các trang chỉ thuộc về RENTAL
  else if (pathname.includes("/overview") || pathname.includes("/rentals") || pathname.includes("/equipment") || pathname.includes("/ai-settings")) {
    currentWorkspace = "RENTAL";
  } 
  // 3. Nếu đang ở trang SETTINGS
  else if (pathname.includes("/settings")) {
    currentWorkspace = "SETTINGS";
  } 
  // 4. Nếu đang ở trang HUB
  else if (pathname === "/dashboard") {
    currentWorkspace = "HUB";
  } 
  // 5. NẾU LÀ TRANG DÙNG CHUNG (KHÁCH HÀNG)
  else if (pathname.includes("/customers")) {
    // Giữ nguyên currentWorkspace (Không bắt ép đổi sang Rental nữa)
    // Chỉ khi bạn vừa bật máy tính lên, dán thẳng link /customers vào (Lúc này Hub là mặc định), thì mới ép sang Rental
    if (currentWorkspace === "HUB") {
      currentWorkspace = "RENTAL";
    }
  }

  // Cập nhật lại bộ nhớ cho lần chuyển trang tiếp theo
  lastWorkspace.current = currentWorkspace;


  // ==========================================
  // XUẤT RA MENU TƯƠNG ỨNG VỚI WORKSPACE
  // ==========================================
  let workspaceName = "CHEOLING HUB";
  let WorkspaceIcon = LayoutDashboard;
  let menuToRender: any[] = [];

  if (currentWorkspace === "PROOFING") {
    workspaceName = "CLIENT PROOFING";
    WorkspaceIcon = Camera;
    menuToRender = [
      { name: "Trở về Hub", icon: LayoutDashboard, path: "/dashboard", isBackBtn: true },
      { name: "Khách hàng", icon: Users, path: "/dashboard/customers" },
      { name: "Duyệt ảnh mẫu", icon: ImageIcon, path: "/dashboard/project" },
    ];
  } 
  else if (currentWorkspace === "RENTAL") {
    workspaceName = "RENTAL WORKSPACE";
    WorkspaceIcon = Box;
    menuToRender = [
      { name: "Trở về Hub", icon: LayoutDashboard, path: "/dashboard", isBackBtn: true },
      { name: "Tổng quan", icon: Activity, path: "/dashboard/overview" },
      { name: "Lệnh thuê", icon: FileText, path: "/dashboard/rentals" },
      { name: "Kho thiết bị", icon: Wrench, path: "/dashboard/equipment" },
      { name: "Khách hàng", icon: Users, path: "/dashboard/customers" },
      { name: "Cấu hình AI", icon: BrainCircuit, path: "/dashboard/ai-settings" },
    ];
  } 
  else if (currentWorkspace === "SETTINGS") {
    workspaceName = "SYSTEM SETTINGS";
    WorkspaceIcon = Settings;
    menuToRender = [
      { name: "Trở về Hub", icon: LayoutDashboard, path: "/dashboard", isBackBtn: true },
      { name: "Cài đặt hệ thống", icon: Settings, path: "/dashboard/settings" },
    ];
  } 
  else {
    workspaceName = "CHEOLING HUB";
    WorkspaceIcon = LayoutDashboard;
    menuToRender = [
      { name: "Tổng quan Hub", icon: LayoutDashboard, path: "/dashboard" },
      { name: "Rental Workspace", icon: Box, path: "/dashboard/overview" },
      { name: "Client Proofing", icon: Camera, path: "/dashboard/project" },
      { name: "Cài đặt hệ thống", icon: Settings, path: "/dashboard/settings" },
    ];
  }

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* SIDEBAR */}
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
                    <span className="text-sm font-medium tracking-wide">{item.name}</span>
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
        <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-10 backdrop-blur-md bg-black/20 z-20 shrink-0">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"><Menu className="w-6 h-6" /></button>
            <div className="hidden md:block relative w-64 lg:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input type="text" placeholder="Tìm kiếm trong hệ thống..." className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-full text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all font-medium" />
            </div>
            <h1 className="md:hidden flex-1 text-center text-lg font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              CHEOLING<sup className="text-[8px] ml-0.5 opacity-50">OS</sup>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Sparkles className="w-5 h-5 text-indigo-400 hidden sm:block" />
            <Link href="/dashboard/settings">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] md:text-xs font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer hover:scale-105 transition-transform">AD</div>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}