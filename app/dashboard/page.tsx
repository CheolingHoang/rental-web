"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Package, CheckCircle, AlertTriangle, TrendingUp, Cpu, Loader2 } from "lucide-react";
import Link from "next/link";

// Định nghĩa khung dữ liệu cho Lệnh thuê để không bị lỗi code
interface RecentOrder {
  id: string;
  orderCode: string;
  customerName: string;
  equipmentSummary: string;
  status: string;
}

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEquipments: 0,
    activeRentals: 0,
    maintenanceAlerts: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    // 1. Lắng nghe dữ liệu Kho thiết bị theo thời gian thực
    const unsubEquipments = onSnapshot(collection(db, "equipments"), (snapshot) => {
      setStats(prev => ({
        ...prev,
        totalEquipments: snapshot.size,
        maintenanceAlerts: snapshot.docs.filter(doc => doc.data().status === 'Bảo trì').length
      }));
    });

    // 2. Lắng nghe dữ liệu Lệnh cho thuê mới nhất
    const rentalsQuery = query(collection(db, "rentals"), orderBy("createdAt", "desc"));
    const unsubRentals = onSnapshot(rentalsQuery, (snapshot) => {
      const active = snapshot.docs.filter(doc => 
        ['Đang hoạt động', 'Đang thuê'].includes(doc.data().status)
      ).length;
      
      const revenue = snapshot.docs.reduce((sum, doc) => sum + (doc.data().totalAmount || 0), 0);

      // Lấy 5 đơn mới nhất cho bảng bên dưới
      const recent = snapshot.docs.slice(0, 5).map(doc => ({
        id: doc.id,
        orderCode: doc.data().orderCode || "RN-UNKNOWN",
        customerName: doc.data().customerName || "Khách hàng",
        equipmentSummary: doc.data().equipmentSummary || "Thiết bị",
        status: doc.data().status || "Đang xử lý",
      }));

      setStats(prev => ({ ...prev, activeRentals: active, totalRevenue: revenue }));
      setRecentOrders(recent);
      setLoading(false);
    });

    return () => {
      unsubEquipments();
      unsubRentals();
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đang hoạt động': 
      case 'Đang thuê': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Cảnh báo trễ': return 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse';
      case 'Chờ AI duyệt': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'Hoàn tất':
      case 'Đã thu hồi': return 'text-zinc-300 bg-white/10 border-white/10';
      default: return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    }
  };

  const statCards = [
    { title: "Tổng tài sản", value: stats.totalEquipments, sub: "Thiết bị trong hệ thống", icon: Package, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
    { title: "Đang cho thuê", value: stats.activeRentals, sub: "Lệnh đang chạy", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { title: "Cần bảo trì", value: stats.maintenanceAlerts, sub: "Cần kiểm tra kỹ thuật", icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
    { title: "Dự phóng doanh thu", value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue), sub: "Tổng giá trị ghi nhận", icon: TrendingUp, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  ];

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-indigo-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="text-zinc-400 font-medium tracking-widest uppercase text-sm animate-pulse">Đang đồng bộ dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 relative print:m-0 print:p-0">
      
      <div className="flex justify-between items-end print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium tracking-widest text-indigo-400 uppercase">Hệ thống phân tích</span>
          </div>
          <h2 className="text-3xl font-normal text-white tracking-tight">Tổng quan hệ thống</h2>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-white rounded-xl transition-all flex items-center gap-2 backdrop-blur-md shadow-lg"
        >
          Xuất báo cáo PDF
        </button>
      </div>

      {/* 4 Thẻ chỉ số */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="group relative bg-white/[0.02] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all overflow-hidden print:border-black print:text-black">
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-zinc-400 print:text-gray-600">{stat.title}</p>
                <p className="text-3xl font-light text-white mt-2 tracking-tight print:text-black">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border print:hidden`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="mt-4 relative z-10 print:hidden">
              <span className="text-xs text-zinc-500 font-medium bg-black/30 px-2 py-1 rounded-md border border-white/5">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bảng hoạt động */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/5 backdrop-blur-md overflow-hidden relative">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20 print:bg-transparent">
          <h3 className="font-medium text-white print:text-black">Luồng cho thuê gần đây</h3>
          <Link href="/dashboard/rentals" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors print:hidden">
            Xem toàn bộ hệ thống &rarr;
          </Link>
        </div>
        <div className="overflow-x-auto">
          {recentOrders.length === 0 ? (
             <div className="p-8 text-center text-zinc-500">Chưa có giao dịch nào được ghi nhận.</div>
          ) : (
            <table className="w-full text-left text-sm text-zinc-400 print:text-black">
              <thead className="bg-black/40 text-zinc-500 border-b border-white/5 uppercase tracking-wider text-[11px] font-semibold print:bg-gray-100 print:text-black">
                <tr>
                  <th className="px-6 py-4">Mã định danh</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Hệ máy</th>
                  <th className="px-6 py-4">Tình trạng lệnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-gray-200">
                {recentOrders.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-indigo-400 print:text-blue-600">{item.orderCode}</td>
                    <td className="px-6 py-4 font-medium text-white print:text-black">{item.customerName}</td>
                    <td className="px-6 py-4 text-zinc-400 truncate max-w-[200px]">{item.equipmentSummary}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${getStatusColor(item.status)} print:border-none print:text-black`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}