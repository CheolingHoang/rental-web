"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Wrench, FileText, Settings, 
  LogOut, Search, Sparkles, Users, Menu, X, Image as ImageIcon
} from "lucide-react";
import { logout } from "../../services/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  // Danh sách menu đồng bộ với các trang bạn đang làm
  const menuItems = [
    { name: "Tổng quan", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Kho thiết bị", icon: Wrench, path: "/dashboard/equipment" },
    { name: "Khách hàng", icon: Users, path: "/dashboard/customers" },
    { name: "Lệnh thuê", icon: FileText, path: "/dashboard/rentals" },
    { name: "Cấu hình AI", icon: Sparkles, path: "/dashboard/ai-settings" },
    { name: "Duyệt ảnh mẫu", icon: ImageIcon, path: "/dashboard/project" },
    { name: "Hệ thống", icon: Settings, path: "/dashboard/settings" },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* Glow nền (Ambient Light) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* SIDEBAR (Chỉ hiện trên Desktop - màn hình md trở lên) */}
      <aside className="hidden md:flex w-64 bg-white/[0.02] border-r border-white/5 flex-col backdrop-blur-3xl z-30 shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <h1 className="text-xl font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Space Vietnam<sup className="text-[10px] ml-1 opacity-50">®</sup>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive 
                    ? "bg-white/10 text-white border border-white/10 shadow-lg" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
                }`}>
                  <item.icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110 text-indigo-400" : "group-hover:scale-110"}`} />
                  <span className="text-sm font-medium tracking-wide">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* TOPBAR (Tối ưu cho cả Mobile & Desktop) */}
        <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 md:px-10 backdrop-blur-md bg-black/20 z-20 shrink-0">
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Nút Menu cho Mobile */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Thanh tìm kiếm trên Desktop */}
            <div className="hidden md:block relative w-64 lg:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
              <input type="text" placeholder="Tìm kiếm nhanh..." className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-full text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all" />
            </div>

            {/* Logo thu gọn trên Mobile (Nằm giữa) */}
            <h1 className="md:hidden flex-1 text-center text-lg font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              Space<sup className="text-[8px] ml-0.5 opacity-50">®</sup>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Sparkles className="w-5 h-5 text-indigo-400 hidden sm:block" />
            <Link href="/dashboard/settings">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] md:text-xs font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer hover:scale-105 transition-transform">
                AD
              </div>
            </Link>
          </div>
        </header>

        {/* CONTENT AREA (Có padding bottom thêm cho mobile để không bị đè bởi Bottom Nav) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>

        {/* BOTTOM NAVIGATION (Chỉ hiện trên Mobile) - Lấy 4 menu quan trọng nhất */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/10 flex justify-around items-center py-2 px-2 z-40 pb-safe">
          {menuItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path} className="flex flex-col items-center gap-1.5 p-2 w-full">
                <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                <span className={`text-[9px] ${isActive ? "text-indigo-400 font-medium" : "text-zinc-500"}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* MOBILE OVERLAY MENU (Hiện ra khi bấm Hamburger) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 md:hidden p-6 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-xl font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
              Space Vietnam<sup className="text-[10px] ml-1 opacity-50">®</sup>
            </h1>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-400 hover:text-white bg-white/5 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-2 flex-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.name} href={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                  <div className={`flex items-center gap-4 text-lg font-medium py-4 px-4 rounded-2xl transition-all ${
                    isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
                  }`}>
                    <item.icon className={`w-6 h-6 ${isActive ? "text-indigo-400" : ""}`} />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>

          <button onClick={handleLogout} className="flex items-center justify-center gap-3 py-4 w-full text-red-400 bg-red-500/10 rounded-2xl font-medium mt-auto">
            <LogOut className="w-5 h-5" /> Đăng xuất khỏi hệ thống
          </button>
        </div>
      )}
    </div>
  );
}