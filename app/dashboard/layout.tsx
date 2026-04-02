"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wrench, FileText, Settings, LogOut, Search, Sparkles, Users } from "lucide-react";
import { logout } from "../../services/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  };

  // Đã bổ sung thêm trang "Khách hàng" vào menu
  const menuItems = [
    { name: "Tổng quan", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Kho thiết bị", icon: Wrench, path: "/dashboard/equipment" },
    { name: "Khách hàng", icon: Users, path: "/dashboard/customers" }, 
    { name: "Lệnh cho thuê", icon: FileText, path: "/dashboard/rentals" },
    { name: "AI OCR Scanner", icon: Sparkles, path: "/dashboard/ai-settings" },
    { name: "Hệ thống", icon: Settings, path: "/dashboard/settings" },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-indigo-500/30 overflow-hidden relative">
      
      {/* Ambient Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Glassmorphic Sidebar */}
      <aside className="w-64 bg-white/[0.02] border-r border-white/5 flex flex-col backdrop-blur-2xl z-10">
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <h1 className="text-2xl font-medium tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            Space Vietnam<sup className="text-xs ml-1 text-zinc-500">®</sup>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                    ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10" 
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
                }`}>
                  <item.icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                  <span className="font-medium text-sm tracking-wide">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400/80 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col z-10">
        <header className="h-20 bg-transparent border-b border-white/5 flex items-center justify-between px-10 backdrop-blur-md">
          <div className="relative w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm bằng AI..." 
              className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/5 rounded-full text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-zinc-400 hover:text-white transition-colors">
              <Sparkles className="w-5 h-5" />
            </button>
            <Link href="/dashboard/settings">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-semibold text-sm cursor-pointer hover:scale-105 transition-transform shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                AD
              </div>
            </Link>
          </div>
        </header>

        {/* Nội dung các trang con sẽ lọt vào đây (animate-in giúp trang load mượt hơn) */}
        <main className="flex-1 overflow-y-auto p-10 relative">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}