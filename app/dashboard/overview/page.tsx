"use client";

import { Activity, Box, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function RentalOverviewPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-bold text-indigo-400 tracking-widest uppercase mb-2">
            <Activity className="w-3.5 h-3.5" /> Hệ thống phân tích
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tổng quan hệ thống</h1>
        </div>
        <button className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-medium transition-colors">
          Xuất báo cáo PDF
        </button>
      </div>

      {/* 4 THẺ THỐNG KÊ (CARDS) GIỐNG HỆT ẢNH CŨ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1 */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[24px]">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-zinc-400">Tổng tài sản</p>
            <div className="p-2 bg-indigo-500/10 rounded-lg"><Box className="w-5 h-5 text-indigo-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">6</p>
          <p className="text-xs text-zinc-500">Thiết bị trong hệ thống</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[24px]">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-zinc-400">Đang cho thuê</p>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><CheckCircle className="w-5 h-5 text-emerald-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">0</p>
          <p className="text-xs text-zinc-500">Lệnh đang chạy</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[24px]">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-zinc-400">Cần bảo trì</p>
            <div className="p-2 bg-red-500/10 rounded-lg"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">0</p>
          <p className="text-xs text-zinc-500">Cần kiểm tra kỹ thuật</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[24px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex justify-between items-start mb-4">
            <p className="text-sm font-medium text-zinc-400">Dự phóng doanh thu</p>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-2 relative z-10">223.950.004 đ</p>
          <p className="text-xs text-zinc-500 relative z-10">Tổng giá trị ghi nhận</p>
        </div>
      </div>

      {/* BẢNG LUỒNG CHO THUÊ GẦN ĐÂY */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Luồng cho thuê gần đây</h3>
          <Link href="/dashboard/rentals" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
            Xem toàn bộ hệ thống →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-zinc-500">
                <th className="pb-4 font-medium px-4">Mã định danh</th>
                <th className="pb-4 font-medium px-4">Khách hàng</th>
                <th className="pb-4 font-medium px-4">Hệ máy</th>
                <th className="pb-4 font-medium text-right px-4">Tình trạng lệnh</th>
              </tr>
            </thead>
            <tbody className="text-sm text-zinc-300">
              {/* Dữ liệu mẫu giống hình của bạn */}
              {[
                { id: "RN-8813", name: "Hoàng Trọng Tín", gear: "Blackmagic Design ATEM Television Studio Pro 4K" },
                { id: "RN-1597", name: "Hoàng Trọng Tín", gear: "se 5s + Sony A74M" },
                { id: "RN-4167", name: "Hoàng Trọng Tín", gear: "Radiomaster TX16S + DJI Matrice M300 RTK Drone..." },
                { id: "RN-2943", name: "Hoàng Trọng Tín", gear: "DJI Matrice M300 RTK Drone + Sony A74M + Sony..." },
                { id: "RN-9935", name: "Hoàng Trọng Tín", gear: "se 5s + Sony Alpha a7 III + Sony A74M + DJI Matric..." },
              ].map((item, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 font-mono text-indigo-400">{item.id}</td>
                  <td className="py-4 px-4 font-medium">{item.name}</td>
                  <td className="py-4 px-4 text-zinc-400 truncate max-w-[300px]">{item.gear}</td>
                  <td className="py-4 px-4 text-right">
                    <button className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                      Hoàn tất
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}