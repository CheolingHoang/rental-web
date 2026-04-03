"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { collection, getDocs, addDoc, doc, getDoc, query, where, deleteDoc } from "firebase/firestore";
import { FolderGit2, Plus, ChevronLeft, Loader2, Calendar, Trash2 } from "lucide-react";
import Link from "next/link";

export default function CustomerProjectsPage() {
  const { customerId } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", date: "" });

  useEffect(() => {
    const fetchData = async () => {
      if (!customerId) return;
      try {
        // Lấy tên khách
        const custSnap = await getDoc(doc(db, "customers", customerId as string));
        if (custSnap.exists()) setCustomer(custSnap.data());

        // Lấy dự án CHỈ CỦA KHÁCH NÀY
        const q = query(collection(db, "projects"), where("customerId", "==", customerId));
        const projSnap = await getDocs(q);
        // Lọc và sắp xếp mới nhất lên đầu bằng JS để tránh lỗi thiếu Index của Firebase
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
        createdAt: new Date().toISOString()
      });
      setProjects([{ id: docRef.id, name: newProject.name, date: newProject.date, status: "Mới tạo" }, ...projects]);
      setIsModalOpen(false);
      setNewProject({ name: "", date: "" });
    } catch (error) {
      alert("Lỗi tạo dự án");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); // Ngăn không cho click nhảy trang
    if (confirm("Xóa dự án này?")) {
      await deleteDoc(doc(db, "projects", id));
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm"><ChevronLeft className="w-4 h-4"/> Quay lại Danh sách Khách</button>
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FolderGit2 className="w-6 h-6 text-indigo-500" /> Lịch sử Dự án</h1>
          <p className="text-sm text-zinc-400 mt-1">Khách hàng: <span className="text-white font-medium">{customer?.name}</span></p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" /> Tạo dự án mới</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? <p className="text-zinc-500 text-sm p-4">Khách hàng này chưa có dự án nào.</p> : null}
        {projects.map((project) => (
          <Link href={`/dashboard/project/detail/${project.id}`} key={project.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/30 block relative group">
            <h3 className="text-lg font-semibold text-white mb-2">{project.name}</h3>
            <p className="text-xs text-zinc-500 flex items-center gap-2 mb-4"><Calendar className="w-3.5 h-3.5" /> {project.date}</p>
            <div className="text-sm text-indigo-400 font-medium">👉 Bấm vào để Nhập link & Xem kết quả</div>
            
            <button onClick={(e) => handleDelete(project.id, e)} className="absolute top-4 right-4 p-2 text-red-400 hover:bg-red-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4" />
            </button>
          </Link>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-white mb-4">Tạo dự án cho {customer?.name}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" required value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="Tên dự án..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
              <input type="date" required value={newProject.date} onChange={e => setNewProject({...newProject, date: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" style={{colorScheme: 'dark'}} />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-white bg-white/10 rounded-xl text-sm">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">Tạo ngay</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}