"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, addDoc, doc, getDoc, query, where, deleteDoc } from "firebase/firestore";
import { FolderGit2, Plus, ChevronLeft, Loader2, Calendar, Trash2, ArrowRight, LayoutGrid, Clock, FolderOpen, DownloadCloud, Lock } from "lucide-react";
import Link from "next/link";

export default function CustomerProjectsPage() {
  const { customerId } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Thêm allowDownload vào state tạo dự án
  const [newProject, setNewProject] = useState({ name: "", date: "", allowDownload: false });

  useEffect(() => {
    const fetchData = async () => {
      if (!customerId) return;
      try {
        const custSnap = await getDoc(doc(db, "customers", customerId as string));
        if (custSnap.exists()) setCustomer(custSnap.data());

        const q = query(collection(db, "projects"), where("customerId", "==", customerId));
        const projSnap = await getDocs(q);
        const list = projSnap.docs.map(d => ({ id: d.id, ...d.data() }))
                     .sort((a: any, b: any) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setProjects(list);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [customerId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name: newProject.name,
        date: newProject.date,
        customerId: customerId,
        customerName: customer?.name || "Khách hàng",
        status: "Mới tạo",
        allowDownload: newProject.allowDownload, // Lưu trạng thái tải về
        createdAt: new Date().toISOString()
      });
      setProjects([{ id: docRef.id, name: newProject.name, date: newProject.date, status: "Mới tạo", allowDownload: newProject.allowDownload }, ...projects]);
      setIsModalOpen(false);
      setNewProject({ name: "", date: "", allowDownload: false });
    } catch (error) {
      alert("Lỗi tạo dự án");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); 
    if (confirm("Hành động này không thể hoàn tác. Xóa dự án này?")) {
      await deleteDoc(doc(db, "projects", id));
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
      <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest animate-pulse">Đang tải dữ liệu dự án...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      <button onClick={() => router.back()} className="group flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-all bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 px-4 py-2 rounded-xl w-fit">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
        Trở về Hồ sơ Khách hàng
      </button>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-[24px] backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <FolderGit2 className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Quản lý Dự án</h1>
            </div>
          </div>
          <p className="text-sm text-zinc-500 mt-2 flex items-center gap-2">
            Khách hàng: <span className="text-white font-medium bg-white/10 px-2 py-0.5 rounded-md">{customer?.name}</span>
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all hover:scale-105 active:scale-95">
          <Plus className="w-4 h-4" /> Tạo dự án mới
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-6">
          <LayoutGrid className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Danh sách dự án ({projects.length})</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/[0.01] border border-dashed border-white/10 rounded-[24px]">
              <FolderOpen className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-400 font-medium">Khách hàng này chưa có dự án nào</p>
            </div>
          ) : null}

          {projects.map((project) => (
            <Link 
              href={`/dashboard/project/detail/${project.id}`} 
              key={project.id} 
              className="group relative p-6 rounded-[24px] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 hover:border-indigo-500/40 transition-all duration-500 hover:shadow-[0_10px_40px_-10px_rgba(99,102,241,0.15)] overflow-hidden block"
            >
              <div className="absolute top-5 right-5 z-20" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(project.id, e); }}>
                <button className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] group-hover:bg-indigo-500/20 transition-colors" />

              <div className="relative z-10">
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-zinc-400 font-medium">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" /> {project.date || "Chưa cập nhật"}
                  </div>
                  {/* Badge hiển thị quyền tải */}
                  {project.allowDownload ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium">
                      <DownloadCloud className="w-3.5 h-3.5" /> Cho phép tải
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 font-medium">
                      <Lock className="w-3.5 h-3.5" /> Khóa tải
                    </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors pr-8 line-clamp-2">{project.name}</h3>
                <div className="flex items-center gap-2 mt-8 text-sm font-medium text-zinc-500 group-hover:text-indigo-400 transition-colors">
                  Cấu hình & Duyệt ảnh <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
              <h2 className="text-xl font-bold text-white">Khởi tạo Dự án mới</h2>
              <p className="text-xs text-zinc-500 mt-1">Khách hàng: <span className="text-indigo-400">{customer?.name}</span></p>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              <div>
                <label className="block text-xs text-zinc-500 uppercase font-medium mb-2">Tên dự án</label>
                <input type="text" required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="VD: Chụp Lookbook Mùa Thu..." className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm" autoFocus />
              </div>

              <div>
                <label className="block text-xs text-zinc-500 uppercase font-medium mb-2">Ngày thực hiện</label>
                <input type="date" required value={newProject.date} onChange={e => setNewProject({...newProject, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-all text-sm" style={{colorScheme: 'dark'}} />
              </div>

              {/* TÙY CHỌN QUYỀN TẢI CHO KHÁCH */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between cursor-pointer" onClick={() => setNewProject({...newProject, allowDownload: !newProject.allowDownload})}>
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <DownloadCloud className="w-4 h-4 text-indigo-400" /> Cấp quyền tải ảnh gốc
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Cho phép khách hàng tải ảnh chất lượng cao về máy.</p>
                </div>
                <div className={`w-10 h-6 rounded-full flex items-center transition-colors p-1 ${newProject.allowDownload ? 'bg-indigo-500' : 'bg-white/10'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${newProject.allowDownload ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl text-sm transition-all">Hủy bỏ</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">Xác nhận Tạo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}