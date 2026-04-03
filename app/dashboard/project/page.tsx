"use client";

import { useState, useEffect } from "react";
import { FolderGit2, Plus, Trash2, ExternalLink, Calendar, Users, FolderOpen, Loader2 } from "lucide-react";
import Link from "next/link";
// NHỚ KIỂM TRA ĐƯỜNG DẪN IMPORT FIREBASE NÀY XEM CÓ KHỚP VỚI PROJECT CỦA TÍN KHÔNG NHÉ
import { db } from "../../../lib/firebase"; 
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

// 1. Định nghĩa khuôn mẫu dữ liệu
interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Project {
  id: string;
  name: string;
  customerId: string;
  customerName: string;
  date: string;
  status: string;
}

export default function ProjectManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State cho Form tạo dự án
  const [newProject, setNewProject] = useState({ name: "", customerId: "", date: "" });

  // 2. LẤY DỮ LIỆU TỪ FIREBASE KHI MỞ TRANG
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy danh sách Khách Hàng thật
        const customerSnap = await getDocs(collection(db, "customers"));
        const customerList = customerSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Customer[];
        setCustomers(customerList);

        // Lấy danh sách Dự Án thật (Sắp xếp mới nhất lên đầu)
        const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
        const projectSnap = await getDocs(q);
        const projectList = projectSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
        setProjects(projectList);

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 3. HÀM TẠO DỰ ÁN THẬT
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Tìm tên khách hàng từ ID để lưu vào project luôn cho dễ hiện thị
    const customer = customers.find(c => c.id === newProject.customerId);
    
    try {
      // Đẩy lên Firebase
      const docRef = await addDoc(collection(db, "projects"), {
        name: newProject.name,
        customerId: newProject.customerId,
        customerName: customer?.name || "Khách không xác định",
        date: newProject.date,
        status: "Mới tạo",
        createdAt: new Date().toISOString() // Lưu thời gian tạo để sắp xếp
      });

      // Cập nhật giao diện ngay lập tức mà không cần F5
      const createdProject: Project = {
        id: docRef.id,
        name: newProject.name,
        customerId: newProject.customerId,
        customerName: customer?.name || "Khách không xác định",
        date: newProject.date,
        status: "Mới tạo"
      };

      setProjects([createdProject, ...projects]);
      setIsModalOpen(false);
      setNewProject({ name: "", customerId: "", date: "" });
      
    } catch (error) {
      console.error("Lỗi khi tạo dự án:", error);
      alert("Có lỗi xảy ra khi tạo dự án!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. HÀM XÓA DỰ ÁN THẬT
  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa dự án này? Dữ liệu sẽ mất vĩnh viễn!")) {
      try {
        // Xóa trên Firebase
        await deleteDoc(doc(db, "projects", id));
        // Cập nhật lại giao diện
        setProjects(projects.filter(p => p.id !== id));
      } catch (error) {
        console.error("Lỗi khi xóa:", error);
        alert("Không thể xóa dự án lúc này.");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-indigo-500" /> Quản lý Dự án
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Tạo dự án, gắn link Drive và gửi cho khách hàng duyệt.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tạo dự án mới
        </button>
      </div>

      {/* DANH SÁCH DỰ ÁN */}
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
          <FolderOpen className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">Chưa có dự án nào. Hãy tạo dự án đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full font-medium bg-amber-500/10 text-amber-400">
                  {project.status}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-1 truncate">{project.name}</h3>
              
              <div className="space-y-2 mt-4">
                <p className="text-xs text-zinc-400 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-zinc-500" /> {project.customerName}
                </p>
                <p className="text-xs text-zinc-400 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" /> {project.date}
                </p>
              </div>

              {/* Các nút thao tác */}
              <div className="mt-6 flex items-center gap-2 pt-4 border-t border-white/5">
                <Link href={`/dashboard/project/${project.id}`} className="flex-1 text-center py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-medium transition-colors">
                  Cập nhật Link Drive
                </Link>
                
                <button 
  onClick={() => {
    const link = `${window.location.origin}/p/${project.id}`;
    navigator.clipboard.writeText(link);
    alert("Đã copy link: " + link);
  }}
  className="..."
>
  <ExternalLink className="w-4 h-4" />
</button>

                <button 
                  onClick={() => handleDelete(project.id)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL TẠO DỰ ÁN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-white mb-4">Tạo dự án mới</h2>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Tên dự án</label>
                <input 
                  type="text" required
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  placeholder="VD: Chụp sự kiện Year End Party..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Chọn Khách hàng</label>
                {customers.length === 0 ? (
                  <div className="text-sm text-amber-500 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                    Bạn chưa có khách hàng nào trong hệ thống. Hãy sang tab "Khách hàng" để thêm trước nhé!
                  </div>
                ) : (
                  <select 
                    required
                    value={newProject.customerId}
                    onChange={(e) => setNewProject({...newProject, customerId: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none"
                  >
                    <option value="" className="bg-black">-- Bấm để chọn khách hàng --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Ngày thực hiện</label>
                <input 
                  type="date" required
                  value={newProject.date}
                  onChange={(e) => setNewProject({...newProject, date: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">
                  Hủy
                </button>
                <button disabled={isSubmitting || customers.length === 0} type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Tạo dự án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}