"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore"; 
import { CheckCircle, MessageSquare, Send, X, Check, Loader2, Sparkles, AlertCircle, DownloadCloud, Lock, Download, Camera } from "lucide-react";

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

  // LOGIC TẢI ẢNH: ÉP BẰNG BLOB HOẶC WINDOW.OPEN THEO CHUẨN IOS
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
      // Fallback cho Safari iOS
      const link = document.createElement('a');
      link.href = photo.url;
      link.download = photo.name || 'download.jpg';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAllFolder = () => {
    const driveLink = project?.folders?.[0]?.driveLink;
    if (driveLink) window.open(driveLink, '_blank');
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
    <div className="min-h-screen bg-[#050505] text-zinc-300 pb-32 selection:bg-indigo-500/30 font-sans relative">
      
      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className={`backdrop-blur-md text-white px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 text-sm font-bold whitespace-nowrap ${isDownloadMode ? 'bg-emerald-600/90 border border-emerald-500/50' : 'bg-indigo-600/90 border border-indigo-500/50'}`}>
          <Sparkles className="w-4 h-4" /> {toast.message}
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-2xl border-b border-white/5 px-4 md:px-8 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Camera className={`w-5 h-5 ${isDownloadMode ? 'text-emerald-400' : 'text-indigo-400'}`}/> {project?.name}</h1>
          <p className="text-xs text-zinc-400 mt-1 font-medium tracking-wide">KHÁCH HÀNG: {project?.customerName}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          
          {isDownloadMode ? (
            // TRẠNG THÁI 2: CHẾ ĐỘ BÀN GIAO (DOWNLOAD MODE)
            <>
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-emerald-400 text-sm font-bold flex items-center gap-2">
                <DownloadCloud className="w-4 h-4"/> Chế độ Bàn Giao
              </div>
              <button onClick={handleDownloadAllFolder} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium border border-white/10 transition-colors">
                Mở Thư Mục Gốc
              </button>
            </>
          ) : (
            // TRẠNG THÁI 1: CHẾ ĐỘ PHẢN HỒI (FEEDBACK MODE)
            <>
              <p className="text-sm font-medium text-zinc-400 hidden sm:block">Đã chọn: <span className="text-white bg-indigo-500/20 px-2 py-0.5 rounded-md">{selectedCount}</span> / {photos.length}</p>
              <button 
                onClick={handleSubmitFeedback} 
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
              >
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</> : <><Send className="w-4 h-4" /> Gửi Yêu Cầu Chỉnh Sửa</>}
              </button>
            </>
          )}

        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              onClick={() => { setViewPhotoId(photo.id); setTempNote(photo.note || ""); }}
              className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                !isDownloadMode && photo.selected ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]" : "border-white/5 hover:border-white/20"
              }`}
            >
              <div className="aspect-[4/5] overflow-hidden bg-white/5 relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center -z-10">
                  <Loader2 className="w-6 h-6 text-zinc-700 animate-spin" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={photo.url} 
                  alt={photo.name} 
                  loading="lazy"
                  className={`w-full h-full object-cover transition-transform duration-700 ${!isDownloadMode && photo.selected ? "scale-105" : "group-hover:scale-105"}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* RENDER NÚT DỰA VÀO CHẾ ĐỘ */}
              {isDownloadMode ? (
                // NÚT TẢI XUỐNG XANH LÁ (BÀN GIAO)
                <button 
                  onClick={(e) => handleSingleDownload(photo, e)} 
                  className="absolute bottom-3 right-3 bg-emerald-500 hover:bg-emerald-400 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(16,185,129,0.5)] transition-all transform hover:scale-110 active:scale-95"
                >
                  <Download className="w-5 h-5" />
                </button>
              ) : (
                // NÚT CHỌN TICK TRÒN (FEEDBACK)
                <button 
                  onClick={(e) => toggleSelect(photo.id, e)} 
                  className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${photo.selected ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40" : "bg-black/40 text-transparent border border-white/30 backdrop-blur-md group-hover:border-white/80 group-hover:bg-black/60"}`}
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {/* CHỈ HIỂN THỊ GHI CHÚ NẾU ĐANG LÀ CHẾ ĐỘ FEEDBACK VÀ CÓ GHI CHÚ */}
              {!isDownloadMode && photo.note && (
                <div className="absolute bottom-3 left-3 right-3 bg-amber-500/90 backdrop-blur-md rounded-lg p-2 flex items-start gap-2 text-white shadow-lg">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium truncate">{photo.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* POPUP CHI TIẾT */}
      {viewPhotoId && activePhoto && (
        <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-black/95 backdrop-blur-2xl animate-in fade-in duration-200">
          
          {/* NÚT ĐÓNG KHỔNG LỒ MÀU ĐỎ NỔI BẬT */}
          <button 
            onClick={() => setViewPhotoId(null)} 
            className="absolute top-4 right-4 md:top-8 md:right-8 z-[110] bg-rose-600 hover:bg-rose-500 text-white p-3 rounded-full shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all flex items-center gap-2 pr-4 border border-rose-400/50 hover:scale-105 active:scale-95 group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300"/> 
            <span className="font-bold tracking-widest text-sm hidden sm:block uppercase">Đóng</span>
          </button>
          
          <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 h-[60vh] md:h-screen relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activePhoto.url} alt="view" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]" />
            <p className="text-zinc-500 font-mono text-xs mt-4 opacity-50">{activePhoto.name}</p>
          </div>

          <div className="w-full md:w-[420px] bg-[#0a0a0a] p-6 md:p-8 flex flex-col h-[40vh] md:h-screen border-t md:border-t-0 md:border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] overflow-y-auto">
            
            {isDownloadMode ? (
              // BẢNG BÊN PHẢI (CHẾ ĐỘ TẢI XUỐNG)
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                  <DownloadCloud className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Lưu Hình Ảnh</h3>
                  <p className="text-sm text-zinc-400">Hình ảnh đã xử lý hoàn tất. Nhấn nút bên dưới để tải file gốc chất lượng cao về thiết bị.</p>
                </div>
                <button 
                  onClick={(e) => handleSingleDownload(activePhoto, e)}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-lg transition-colors shadow-[0_10px_30px_rgba(16,185,129,0.3)] flex justify-center items-center gap-2 hover:scale-[1.02] active:scale-95"
                >
                  <Download className="w-6 h-6"/> TẢI VỀ MÁY
                </button>
              </div>
            ) : (
              // BẢNG BÊN PHẢI (CHẾ ĐỘ FEEDBACK GHI CHÚ)
              <>
                <h3 className="text-lg text-white mb-6 flex items-center gap-2 font-bold tracking-tight">
                  <MessageSquare className="w-5 h-5 text-indigo-400"/> Ghi chú Yêu cầu (Nếu có)
                </h3>
                <textarea 
                  value={tempNote} onChange={(e) => setTempNote(e.target.value)}
                  placeholder="Ghi chú yêu cầu chỉnh sửa cho kỹ thuật viên tại đây..."
                  className="flex-1 w-full bg-white/[0.03] border border-white/10 rounded-xl p-5 text-white resize-none outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all text-sm leading-relaxed"
                ></textarea>
                
                <div className="mt-6 space-y-3">
                   <button onClick={() => toggleSelect(activePhoto.id)} className={`w-full py-4 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${activePhoto.selected ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10"}`}>
                    <CheckCircle className={`w-5 h-5 ${activePhoto.selected ? 'fill-indigo-500/20' : ''}`} /> {activePhoto.selected ? "Đã Chọn Hình Này" : "Đánh Dấu Chọn"}
                  </button>
                  <button onClick={saveNoteAndClose} className="w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-xl font-bold text-sm transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2">
                    Lưu Ghi Chú & Đóng Màn Hình
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}