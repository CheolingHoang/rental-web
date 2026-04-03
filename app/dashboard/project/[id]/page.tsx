"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase"; // Nhớ check lại đường dẫn này nhé
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, Save, Link as LinkIcon, Loader2, Folder } from "lucide-react";

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [driveLink, setDriveLink] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "projects", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject(data);
          // Lấy link Drive đã lưu (nếu có) để hiện ra ô input
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
  }, [id]);

  const handleSave = async () => {
    if (!driveLink) {
      alert("Tín chưa dán link Drive kìa!");
      return;
    }

    setIsSaving(true);
    try {
      // Lưu đúng cấu trúc mà trang Khách hàng đang chờ đợi
      await updateDoc(doc(db, "projects", id as string), { 
        folders: [
          {
            id: "folder-1",
            name: "Thư mục ảnh Drive",
            driveLink: driveLink
          }
        ]
      });
      alert("Đã cập nhật Link Google Drive thành công! Khách đã có thể xem ảnh.");
    } catch (error) {
      alert("Lỗi khi lưu!");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-10 text-white flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-500" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white">
        <ChevronLeft className="w-4 h-4" /> Quay lại danh sách
      </button>

      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{project?.name}</h1>
          <p className="text-indigo-400 mt-1">Khách hàng: {project?.customerName}</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-all">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu Link Drive
        </button>
      </div>

      {/* KHU VỰC DÁN LINK DRIVE */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 md:p-8">
        <h2 className="text-lg text-white font-medium flex items-center gap-2 mb-6">
          <Folder className="w-5 h-5 text-indigo-400" /> Kết nối Thư mục Google Drive
        </h2>
        
        <div className="space-y-4">
          <label className="block text-sm text-zinc-400">Dán đường dẫn (Link) thư mục Drive chứa ảnh dự án vào đây:</label>
          <div className="relative">
            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input 
              type="text" 
              value={driveLink} 
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="VD: https://drive.google.com/drive/folders/1aBcDeFg..."
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-white focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <p className="text-xs text-amber-500 mt-2">
            *Lưu ý: Thư mục Drive phải được cài đặt quyền <b>"Bất kỳ ai có liên kết" (Anyone with the link)</b>.
          </p>
        </div>
      </div>
    </div>
  );
}
