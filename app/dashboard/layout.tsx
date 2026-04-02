"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Wrench, FileText, Settings, 
  LogOut, Search, Sparkles, Users, Menu, X 
} from "lucide-react";
import { logout } from "../../services/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const menuItems = [
    { name: "Tổng quan", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Thiết bị", icon: Wrench, path: "/dashboard/equipment" },
    { name: "Khách hàng", icon: Users, path: "/dashboard/customers" },
    { name: "Lệnh thuê", icon: FileText, path: "/dashboard/rentals" },
    { name: "Cấu hình AI", icon: Sparkles, path: "/dashboard/ai-settings" },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 overflow-hidden relative">
      
      {/* Glow nền (Ambient Light) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* SIDEBAR (Chỉ hiện trên Desktop - từ md trở lên) */}
      <aside className="hidden md:flex w-64 bg-white/[0.02] border-r border-white/5 flex-col backdrop-blur-3xl z-30">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <h1 className="text-xl font-bold tracking-tighter bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Space Vietnam<sup className="text-[10px] ml-1 opacity-50">®</sup>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive ? "bg-white/10 text-white border border-white/10 shadow-lg" : "text-zinc-500 hover:text-zinc-200"
                }`}>
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-red-400/70 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* TOPBAR (Tối ưu cho cả Mobile & Desktop) */}
        <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-6 md:px-10 backdrop-blur-md bg-black/20 z-20">
          <div className="flex items-center gap-4">
            {/* Nút Menu cho Mobile */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
            <div className="hidden md:block relative w-64 lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input type="text" placeholder="Tìm kiếm..." className="w-full pl-11 pr-4 py-2 bg-white/5 border border-white/5 rounded-full text-sm focus:outline-none focus:border-indigo-500/50" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Sparkles className="w-5 h-5 text-indigo-400 hidden sm:block" />
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shadow-indigo-500/20 shadow-lg">
              AD
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>

        {/* BOTTOM NAVIGATION (Chỉ hiện trên Mobile) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-white/10 flex justify-around items-center py-3 px-2 z-40">
          {menuItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path} className="flex flex-col items-center gap-1">
                <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                <span className={`text-[10px] ${isActive ? "text-white font-bold" : "text-zinc-600"}`}>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* MOBILE OVERLAY MENU (Hiện ra khi bấm Hamburger) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 md:hidden p-8 flex flex-col animate-in slide-in-from-left duration-300">
          <button onClick={() => setIsMobileMenuOpen(false)} className="self-end p-2 text-white mb-8">
            <X className="w-8 h-8" />
          </button>
          <div className="space-y-6">
            {menuItems.map((item) => (
              <Link key={item.name} href={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                <div className="flex items-center gap-4 text-2xl font-medium text-white py-2">
                  <item.icon className="w-6 h-6 text-indigo-400" />
                  {item.name}
                </div>
              </Link>
            ))}
            <button onClick={handleLogout} className="flex items-center gap-4 text-2xl font-medium text-red-400 py-2">
              <LogOut className="w-6 h-6" /> Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
