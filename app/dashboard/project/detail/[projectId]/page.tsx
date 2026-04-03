"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, Save, Link as LinkIcon, Loader2, Folder, ExternalLink, Image as ImageIcon, MessageSquare, CheckCircle2 } from "lucide-react";

export default function ProjectDetailsAndFeedbackPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [driveLink, setDriveLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        const docSnap = await getDoc(doc(db, "projects", projectId as string));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject(data);
          if (data.folders && data.folders.length > 0) {
            setDriveLink(data.folders[0].driveLink || "");
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  const handleSaveLink = async () => {
    if (!driveLink) return alert("Chưa có link Drive!");
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "projects", projectId as string), { 
        folders: [{ id: "folder-1", name: "Thư mục ảnh Drive", driveLink: driveLink }]
      });
      alert("Đã lưu Link Drive thành công!");
    } catch (error) {
      alert("Lỗi khi lưu");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500 w-8 h-8" /></div>;

  // Lọc ra các ảnh khách đã chọn (có cờ selected = true) HOẶC có ghi chú
  const feedbackPhotos = project?.photos?.filter((p: any) => p.selected || p.note) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm"><ChevronLeft className="w-4 h-4" /> Quay lại dự án</button>

      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-bold text-white mb-2">{project?.name}</h1>
        <div className="flex justify-between items-center">
          <p className="text-indigo-400 font-medium">Khách hàng: {project?.customerName}</p>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/p/${projectId}`);
              alert("Đã copy link gửi khách!");
            }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> Copy Link Gửi Khách
          </button>
        </div>
      </div>

      {/* 1. KHU VỰC NHẬP LINK DRIVE */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg text-white font-medium flex items-center gap-2 mb-4"><Folder className="w-5 h-5 text-indigo-400" /> Cập nhật Link Google Drive</h2>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input type="text" value={driveLink} onChange={(e) => setDriveLink(e.target.value)} placeholder="Dán link thư mục Drive vào đây..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-indigo-500 outline-none text-sm" />
          </div>
          <button onClick={handleSaveLink} disabled={isSaving} className="px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium whitespace-nowrap">
            {isSaving ? "Đang lưu..." : "Lưu Link"}
          </button>
        </div>
      </div>

      {/* 2. KHU VỰC XEM ẢNH KHÁCH YÊU CẦU FIX (MỤC ĐÍCH CHÍNH CỦA TÍN) */}
      <div className="pt-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6"><ImageIcon className="w-6 h-6 text-amber-500" /> Ảnh khách hàng yêu cầu chỉnh sửa ({feedbackPhotos.length})</h2>
        
        {feedbackPhotos.length === 0 ? (
          <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-12 text-center text-zinc-500">
            Khách hàng chưa chọn ảnh nào hoặc chưa có ghi chú phản hồi.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {feedbackPhotos.map((photo: any, index: number) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                <div className="aspect-[4/3] bg-black relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                  {photo.selected && <div className="absolute top-3 left-3 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> Đã Chốt</div>}
                </div>
                <div className="p-4 flex-1">
                  <p className="text-xs text-zinc-500 font-mono mb-2">{photo.name}</p>
                  <div className="bg-black/50 p-3 rounded-xl border border-white/5">
                    <p className="text-sm text-zinc-300 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      {photo.note || <span className="text-zinc-600 italic">Khách chốt ảnh này nhưng không ghi chú gì thêm.</span>}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}