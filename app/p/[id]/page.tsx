"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore"; // Đã thêm updateDoc
import { CheckCircle2, MessageSquare, Send, X, Check, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  name: string;
  note: string;
  selected?: boolean;
}

export default function ClientProofingPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // State mới quản lý nút gửi
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal State
  const [viewPhoto, setViewPhoto] = useState<Photo | null>(null);
  const [tempNote, setTempNote] = useState("");

  useEffect(() => {
    const fetchProjectAndImages = async () => {
      if (!id) return;
      try {
        // 1. Lấy thông tin dự án từ Firebase
        const docSnap = await getDoc(doc(db, "projects", id as string));
        if (!docSnap.exists()) {
          setErrorMsg("Dự án không tồn tại.");
          setIsLoading(false);
          return;
        }
        
        const data = docSnap.data();
        setProject(data);

        // 2. Lấy link Drive
        const driveLink = data.folders?.[0]?.driveLink;
        
        if (!driveLink) {
          setErrorMsg("Space Vietnam chưa cập nhật thư mục ảnh cho dự án này.");
          setIsLoading(false);
          return;
        }

        // 3. Móc ảnh từ Drive qua API
        const response = await fetch('/api/drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderLink: driveLink })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error);
        
        // BONUS XỊN: Giữ lại ảnh khách đã chọn nếu họ lỡ F5 lại trang
        const savedPhotos = data.photos || [];
        const mergedPhotos = result.photos.map((drivePhoto: any) => {
          const saved = savedPhotos.find((p: any) => p.id === drivePhoto.id);
          return {
            ...drivePhoto,
            selected: saved ? saved.selected : false,
            note: saved ? saved.note : ""
          };
        });

        setPhotos(mergedPhotos);

      } catch (error: any) {
        console.error("Lỗi:", error);
        setErrorMsg(error.message || "Không thể tải ảnh từ Google Drive.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectAndImages();
  }, [id]);

  // Các hàm tương tác
  const toggleSelect = (photoId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPhotos(photos.map(p => p.id === photoId ? { ...p, selected: !p.selected } : p));
  };

  const saveNoteAndClose = () => {
    if (!viewPhoto) return;
    setPhotos(photos.map(p => {
      if (p.id === viewPhoto.id) {
        const shouldSelect = tempNote.trim() !== "" ? true : p.selected;
        return { ...p, note: tempNote, selected: shouldSelect };
      }
      return p;
    }));
    setViewPhoto(null);
  };

  // HÀM XỬ LÝ GỬI DỮ LIỆU LÊN FIREBASE
  const handleSubmit = async () => {
    const selectedPhotos = photos.filter(p => p.selected || p.note);
    
    if (selectedPhotos.length === 0) {
      alert("Bạn chưa chọn ảnh hoặc ghi chú nào!");
      return;
    }

    setIsSubmitting(true);
    try {
      const projectRef = doc(db, "projects", id as string);
      await updateDoc(projectRef, {
        photos: selectedPhotos.map(p => ({
          id: p.id,
          url: p.url,
          name: p.name,
          note: p.note || "",
          selected: p.selected || false
        }))
      });

      alert(`Tuyệt vời! Đã gửi thành công ${selectedPhotos.length} ảnh cho Space Vietnam.`);
    } catch (error) {
      console.error("Lỗi khi lưu lên Firebase:", error);
      alert("Có lỗi xảy ra khi gửi. Vui lòng thử lại nhé!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  if (errorMsg) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-red-400 gap-2"><AlertCircle className="w-5 h-5"/> {errorMsg}</div>;

  const selectedCount = photos.filter(p => p.selected).length;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 pb-24 selection:bg-indigo-500/30">
      {/* HEADER CHO KHÁCH HÀNG */}
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400"/> {project?.name}</h1>
          <p className="text-xs text-zinc-500 mt-1">Khách hàng: {project?.customerName}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-white hidden sm:block">Đã chọn: <span className="text-indigo-400">{selectedCount}</span> / {photos.length}</p>
          
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-sm font-medium flex items-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
            ) : (
              <><Send className="w-4 h-4" /> Gửi lựa chọn</>
            )}
          </button>

        </div>
      </header>

      {/* GRID HIỂN THỊ ẢNH TRỰC TIẾP TỪ GOOGLE DRIVE */}
      <main className="max-w-7xl mx-auto p-6">
        {photos.length === 0 ? (
          <p className="text-center text-zinc-500 mt-20">Thư mục Drive hiện đang trống hoặc đang tải lên...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map((photo) => (
              <div 
                key={photo.id} onClick={() => { setViewPhoto(photo); setTempNote(photo.note || ""); }}
                className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                  photo.selected ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "border-white/5 hover:border-white/20"
                }`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-white/5 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.name} className={`w-full h-full object-cover transition-transform duration-500 ${photo.selected ? "scale-105" : "group-hover:scale-105"}`} />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <button onClick={(e) => toggleSelect(photo.id, e)} className={`absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center z-10 ${photo.selected ? "bg-indigo-500 text-white" : "bg-black/40 text-transparent border border-white/20"}`}>
                  <Check className="w-4 h-4" />
                </button>

                {photo.note && (
                  <div className="absolute top-3 right-3 w-7 h-7 bg-amber-500/90 rounded-full flex items-center justify-center text-white z-10">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* POPUP GHI CHÚ */}
      {viewPhoto && (
        <div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-black/95 backdrop-blur-md">
          <button onClick={() => setViewPhoto(null)} className="absolute top-6 right-6 z-50 text-white p-2 bg-white/10 rounded-full"><X className="w-5 h-5"/></button>
          
          <div className="flex-1 flex justify-center items-center p-8 h-[60vh] md:h-screen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewPhoto.url} alt="view" className="max-w-full max-h-full object-contain rounded-xl" />
          </div>

          <div className="w-full md:w-[400px] bg-[#0a0a0a] p-6 flex flex-col h-[40vh] md:h-screen border-l border-white/10">
            <h3 className="text-lg text-white mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-indigo-400"/> Ghi chú cho ảnh này</h3>
            <textarea 
              value={tempNote} onChange={(e) => setTempNote(e.target.value)}
              placeholder="VD: Xóa giúp mình rác ở góc trái..."
              className="flex-1 w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white resize-none outline-none focus:border-indigo-500 text-sm"
            ></textarea>
            
            <div className="mt-4 space-y-3">
               <button onClick={() => toggleSelect(viewPhoto.id)} className={`w-full py-3.5 rounded-xl text-sm font-medium border ${viewPhoto.selected ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-white/5 text-zinc-300 border-white/10"}`}>
                <CheckCircle2 className="w-4 h-4 inline mr-2" /> {viewPhoto.selected ? "Đã chọn ảnh này" : "Đánh dấu chọn ảnh"}
              </button>
              <button onClick={saveNoteAndClose} className="w-full py-3 bg-white text-black rounded-xl font-medium text-sm">Lưu & Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}