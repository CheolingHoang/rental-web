"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore"; 
import { CheckCircle, MessageSquare, Send, X, Check, Loader2, Sparkles, AlertCircle, DownloadCloud, Download, Camera } from "lucide-react";

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
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [viewPhotoId, setViewPhotoId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  const [toast, setToast] = useState<{show: boolean, message: string}>({show: false, message: ""});

  useEffect(() => {
    const fetchProjectAndImages = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, "projects", id as string));
        if (!docSnap.exists()) {
          setErrorMsg("Dự án không tồn tại.");
          setIsLoading(false);
          return;
        }
        
        const data = docSnap.data();
        setProject(data);

        const driveLink = data.folders?.[0]?.driveLink;
        if (!driveLink) {
          setErrorMsg("Space Vietnam chưa cập nhật dữ liệu hình ảnh cho dự án này.");
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ folderLink: driveLink })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        
        const savedPhotos = data.photos || [];
        const mergedPhotos = result.photos.map((drivePhoto: any) => {
          const saved = savedPhotos.find((p: any) => p.id === drivePhoto.id);
          return { ...drivePhoto, selected: saved ? saved.selected : false, note: saved ? saved.note : "" };
        });

        setPhotos(mergedPhotos);
      } catch (error: any) {
        console.error("Lỗi:", error);
        setErrorMsg(error.message || "Không thể tải ảnh từ hệ thống lưu trữ.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectAndImages();
  }, [id]);

  const showToast = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const toggleSelect = (photoId: string, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, selected: !p.selected } : p));
  };

  const saveNoteAndClose = () => {
    if (!viewPhotoId) return;
    setPhotos(prev => prev.map(p => {
      if (p.id === viewPhotoId) {
        const shouldSelect = tempNote.trim() !== "" ? true : p.selected;
        return { ...p, note: tempNote, selected: shouldSelect };
      }
      return p;
    }));
    setViewPhotoId(null);
  };

  const handleSingleDownload = async (photo: Photo, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    showToast(`Đang tải ảnh: ${photo.name || "Hình ảnh"}`);
    try {
      const response = await fetch(photo.url);
      if (!response.ok) throw new Error("CORS error");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = photo.name || 'download.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = photo.url;
      link.download = photo.name || 'download.jpg';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmitFeedback = async () => {
    const selectedPhotos = photos.filter(p => p.selected || p.note);
    if (selectedPhotos.length === 0) {
      showToast("Vui lòng tick chọn ít nhất 1 ảnh trước khi gửi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const projectRef = doc(db, "projects", id as string);
      await updateDoc(projectRef, {
        photos: selectedPhotos.map(p => ({
           id: p.id, url: p.url, name: p.name, note: p.note || "", selected: p.selected || false
        }))
      });
      showToast(`Tuyệt vời! Đã gửi ${selectedPhotos.length} ảnh cho Space Vietnam.`);
    } catch (error) {
      showToast("Lỗi đường truyền. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" /><p className="text-zinc-500 text-sm animate-pulse tracking-widest uppercase font-medium">Đang chuẩn bị dữ liệu...</p></div>;
  if (errorMsg) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-red-400 gap-4"><AlertCircle className="w-10 h-10 opacity-50"/> <p>{errorMsg}</p></div>;

  const selectedCount = photos.filter(p => p.selected).length;
  const activePhoto = photos.find(p => p.id === viewPhotoId);
  const isDownloadMode = project?.allowDownload === true;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 pb-24 sm:pb-32 selection:bg-indigo-500/30 font-sans relative">
      
      {/* TOAST NOTIFICATION - Chuyển xuống góc trên, bo viên siêu gọn */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className={`backdrop-blur-xl text-white px-5 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-2 text-sm font-bold whitespace-nowrap ${isDownloadMode ? 'bg-emerald-600/95 border border-emerald-500/50' : 'bg-indigo-600/95 border border-indigo-500/50'}`}>
          <Sparkles className="w-4 h-4" /> {toast.message}
        </div>
      </div>

      {/* HEADER TỐI ƯU MOBILE */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-2xl border-b border-white/10 px-4 py-3 sm:px-8 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 shadow-lg">
        <div className="flex justify-between items-start sm:items-center w-full sm:w-auto">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Camera className={`w-5 h-5 ${isDownloadMode ? 'text-emerald-400' : 'text-indigo-400'}`}/> 
              <span className="truncate max-w-[200px] sm:max-w-[400px]">{project?.name}</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 font-medium tracking-wide">KHÁCH HÀNG: <span className="text-zinc-300">{project?.customerName}</span></p>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {isDownloadMode ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-emerald-400 text-sm font-bold flex items-center justify-center gap-2 w-full sm:w-auto">
              <DownloadCloud className="w-4 h-4"/> Chế độ Bàn Giao
            </div>
          ) : (
            <>
              <p className="text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">
                Đã chọn: <span className="text-white bg-indigo-500/20 px-2 py-0.5 rounded-md mx-1">{selectedCount}</span> <span className="hidden sm:inline">/ {photos.length}</span>
              </p>
              <button 
                onClick={handleSubmitFeedback} 
                disabled={isSubmitting}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all active:scale-95"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</> : <><Send className="w-4 h-4" /> Gửi Yêu Cầu</>}
              </button>
            </>
          )}
        </div>
      </header>

      {/* GRID ẢNH TỐI ƯU MOBILE (Khoảng cách hẹp hơn, nút to hơn) */}
      <main className="max-w-[1600px] mx-auto p-2 sm:p-4 md:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              onClick={() => { setViewPhotoId(photo.id); setTempNote(photo.note || ""); }}
              className={`relative group cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                !isDownloadMode && photo.selected ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "border-white/5 hover:border-white/20"
              }`}
            >
              <div className="aspect-[4/5] overflow-hidden bg-white/5 relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center -z-10">
                  <Loader2 className="w-5 h-5 text-zinc-700 animate-spin" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={photo.url} 
                  alt={photo.name} 
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-700 ${!isDownloadMode && photo.selected ? "scale-105" : "group-hover:scale-105"}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-black/40 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {isDownloadMode ? (
                // NÚT TẢI XUỐNG DÀNH CHO TOUCH ĐIỆN THOẠI (To hơn, nằm ở góc phải dưới)
                <button 
                  onClick={(e) => handleSingleDownload(photo, e)} 
                  className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-emerald-500 hover:bg-emerald-400 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(16,185,129,0.5)] transition-all transform active:scale-90"
                >
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              ) : (
                // NÚT CHỌN (Góc trái trên)
                <button 
                  onClick={(e) => toggleSelect(photo.id, e)} 
                  className={`absolute top-2 left-2 sm:top-3 sm:left-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center z-10 transition-all ${photo.selected ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/50" : "bg-black/50 text-white/50 border border-white/20 backdrop-blur-md"}`}
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* HIỂN THỊ GHI CHÚ */}
              {!isDownloadMode && photo.note && (
                <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 bg-amber-500/95 backdrop-blur-md rounded-lg p-2 flex items-start gap-1.5 text-white shadow-lg">
                  <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 mt-0.5" />
                  <p className="text-[10px] sm:text-[11px] font-medium truncate">{photo.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* POPUP CHI TIẾT UX MOBILE (BOTTOM SHEET LÀM CHUẨN) */}
      {viewPhotoId && activePhoto && (
        <div className="fixed inset-0 z-[100] flex flex-col sm:flex-row bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
          
          {/* NÚT ĐÓNG CỰC KỲ NỔI BẬT (Góc trên phải, Fixed để lúc nào cũng thấy) */}
          <button 
            onClick={() => setViewPhotoId(null)} 
            className="fixed top-4 right-4 z-[120] bg-rose-600 hover:bg-rose-500 text-white w-11 h-11 sm:w-auto sm:px-4 sm:py-3 rounded-full shadow-[0_4px_20px_rgba(225,29,72,0.6)] transition-all flex items-center justify-center gap-2 border border-rose-400/30 active:scale-90"
          >
            <X className="w-6 h-6"/> 
            <span className="font-bold tracking-widest text-sm hidden sm:block uppercase">Đóng</span>
          </button>
          
          {/* VÙNG XEM ẢNH TRÊN ĐIỆN THOẠI (Chiếm 60% màn hình trên) */}
          <div className="flex-1 w-full h-[55vh] sm:h-screen flex items-center justify-center p-2 pt-16 sm:p-8 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activePhoto.url} alt="view" className="max-w-full max-h-full object-contain rounded-xl drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]" />
          </div>

          {/* VÙNG THAO TÁC - THIẾT KẾ DẠNG BOTTOM SHEET CHO MOBILE */}
          <div className="w-full sm:w-[420px] h-[45vh] sm:h-screen bg-[#0f0f0f] rounded-t-[32px] sm:rounded-none border-t sm:border-t-0 sm:border-l border-white/10 p-5 sm:p-8 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-y-auto relative z-[110]">
            
            {/* Vạch ngang vuốt kiểu iOS (Chỉ hiện trên mobile) */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden"></div>
            
            {isDownloadMode ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <DownloadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Tải Hình Ảnh</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 px-4">Nhấn nút bên dưới để lưu file gốc độ phân giải cao vào điện thoại của bạn.</p>
                </div>
                <button 
                  onClick={(e) => handleSingleDownload(activePhoto, e)}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-base sm:text-lg transition-colors shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex justify-center items-center gap-2 active:scale-95"
                >
                  <Download className="w-5 h-5 sm:w-6 sm:h-6"/> TẢI VỀ MÁY
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <h3 className="text-base sm:text-lg text-white mb-4 flex items-center gap-2 font-bold tracking-tight">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400"/> Ghi chú Yêu cầu
                </h3>
                
                {/* Textarea text-base để iPhone không bị zoom tự động */}
                <textarea 
                  value={tempNote} onChange={(e) => setTempNote(e.target.value)}
                  placeholder="Nhập yêu cầu chỉnh sửa (Nếu có)..."
                  className="flex-1 w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white resize-none outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all text-base sm:text-sm leading-relaxed"
                ></textarea>
                
                <div className="mt-4 sm:mt-6 space-y-3 pb-4">
                   <button onClick={() => toggleSelect(activePhoto.id)} className={`w-full py-3.5 sm:py-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 active:scale-95 ${activePhoto.selected ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10"}`}>
                    <CheckCircle className={`w-5 h-5 ${activePhoto.selected ? 'fill-indigo-500/20' : ''}`} /> {activePhoto.selected ? "Đã Chọn Ảnh Này" : "Đánh Dấu Chọn"}
                  </button>
                  <button onClick={saveNoteAndClose} className="w-full py-3.5 sm:py-4 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold text-sm transition-colors shadow-[0_10px_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 active:scale-95">
                    Lưu Lại & Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}