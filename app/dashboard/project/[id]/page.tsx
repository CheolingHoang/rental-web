"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, Save, Plus, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  name: string;
  note: string; // Khách hàng sẽ ghi chú vào đây
}

interface ProjectData {
  name: string;
  customerName: string;
  photos?: Photo[];
}

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "projects", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as ProjectData;
          setProject(data);
          setPhotos(data.photos || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  const addPhotoLink = () => {
    setPhotos([...photos, { id: Date.now().toString(), url: "", name: `IMG_${photos.length + 1}.jpg`, note: "" }]);
  };

  const updatePhoto = (photoId: string, url: string) => {
    setPhotos(photos.map(p => p.id === photoId ? { ...p, url } : p));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "projects", id as string), { photos });
      alert("Đã cập nhật bộ ảnh thành công!");
    } catch (error) {
      alert("Lỗi khi lưu!");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-10 text-white">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white">
        <ChevronLeft className="w-4 h-4" /> Quay lại
      </button>

      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">{project?.name}</h1>
          <p className="text-indigo-400 mt-1">Khách hàng: {project?.customerName}</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium">
          {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg text-white flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Quản lý bộ ảnh</h2>
          <button onClick={addPhotoLink} className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-lg">
            + Thêm link ảnh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {photos.map((photo, index) => (
            <div key={photo.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl">
              <span className="text-zinc-500 font-mono text-xs w-6">{index + 1}.</span>
              {/* Hiện thị ảnh thu nhỏ nếu có link */}
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt="thumb" className="w-10 h-10 object-cover rounded bg-black" />
              ) : (
                <div className="w-10 h-10 rounded bg-black/50 border border-white/10 flex items-center justify-center text-[8px] text-zinc-600">No Img</div>
              )}
              
              <input 
                type="text" value={photo.url} onChange={(e) => updatePhoto(photo.id, e.target.value)}
                placeholder="Dán link ảnh trực tiếp vào đây (VD: link từ imgur, unsplash...)"
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
              />
              <button onClick={() => setPhotos(photos.filter(p => p.id !== photo.id))} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}