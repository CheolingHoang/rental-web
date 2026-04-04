"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Camera, 
  Box, 
  Settings, 
  ChevronRight, 
  Activity,
  ShieldCheck,
  Zap
} from "lucide-react";

// ĐÃ CẬP NHẬT LẠI CHỈ CÒN 3 MODULE CHÍNH
const SYSTEM_MODULES = [
  {
    id: "rental-workspace",
    title: "Rental Workspace",
    description: "Quản lý kho thiết bị, điều phối lệnh thuê, khách hàng và hệ thống AI.",
    icon: Box,
    href: "/dashboard/overview", // Trỏ thẳng vào trang Tổng quan của mảng Rental
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "group-hover:border-blue-500/50",
    glowColor: "group-hover:bg-blue-500/20",
    stats: "Nghiệp vụ cốt lõi"
  },
  {
    id: "client-proofing",
    title: "Client Proofing",
    description: "Nền tảng duyệt ảnh mẫu, chia sẻ file và nhận phản hồi trực tiếp từ khách hàng.",
    icon: Camera,
    href: "/dashboard/project", // Trỏ thẳng vào trang Dự án duyệt ảnh
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "group-hover:border-amber-500/50",
    glowColor: "group-hover:bg-amber-500/20",
    stats: "Tích hợp G-Drive"
  },
  {
    id: "system-settings",
    title: "System Config",
    description: "Cấu hình bảo mật, phân quyền tài khoản quản trị và API của hệ thống.",
    icon: Settings,
    href: "/dashboard/settings",
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/10",
    borderColor: "group-hover:border-zinc-500/50",
    glowColor: "group-hover:bg-zinc-500/20",
    stats: "Bảo mật cấp cao"
  }
];

export default function DashboardHubPage() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Chào buổi sáng");
    else if (hour < 18) setGreeting("Chào buổi chiều");
    else setGreeting("Chào buổi tối");
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto min-h-[80vh] flex flex-col relative animate-in fade-in duration-700">
      
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-xs font-medium text-zinc-400 tracking-widest uppercase mb-4">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Hệ sinh thái phân mảnh
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Quản trị viên</span>
          </h1>
          <p className="text-zinc-400 text-lg">Chào mừng trở lại trung tâm điều khiển CHEOLING SYSTEM.</p>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 backdrop-blur-md flex items-center gap-4">
             <div className="p-3 bg-emerald-500/10 rounded-xl">
               <ShieldCheck className="w-6 h-6 text-emerald-400" />
             </div>
             <div>
               <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Trạng thái máy chủ</p>
               <p className="text-emerald-400 font-bold flex items-center gap-2 mt-0.5">
                 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Đang trực tuyến
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* CHỈNH LẠI GRID CHO 3 MODULE NHÌN CÂN ĐỐI HƠN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {SYSTEM_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <Link 
              href={module.href} 
              key={module.id}
              className={`group relative overflow-hidden bg-white/[0.02] border border-white/5 rounded-[32px] p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] ${module.borderColor}`}
            >
              <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[50px] transition-colors duration-500 opacity-0 group-hover:opacity-100 ${module.glowColor}`} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-12">
                  <div className={`p-4 rounded-2xl border border-white/5 backdrop-blur-md ${module.bgColor}`}>
                    <Icon className={`w-8 h-8 ${module.color}`} />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-white/10 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-4">
                    {module.stats}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">
                    {module.title}
                  </h2>
                  <p className="text-sm text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
                    {module.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-16 bg-white/[0.01] border border-white/5 rounded-[32px] p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Luồng hoạt động gần đây
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-white/[0.02] transition-colors cursor-default">
              <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">Hoàng Trọng Tín đã đăng nhập</p>
                <p className="text-xs text-zinc-500 mt-1">Giao thức bảo mật Firebase • Vừa xong</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}