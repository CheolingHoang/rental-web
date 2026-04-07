"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore"; 
import { CheckCircle, MessageSquare, Send, X, Check, Loader2, Sparkles, AlertCircle, Download, CloudDownload, Lock, AlertTriangle } from "lucide-react";

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
  const [inAppBrowser, setInAppBrowser] = useState(false); 
  
  const [viewPhotoId, setViewPhotoId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");

  const [toast, setToast] = useState<{show: boolean, message: string}>({show: false, message: ""});
  
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      const ua = navigator.userAgent || navigator.vendor;
      if (ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1 || ua.indexOf("Messenger") > -1 || ua.indexOf("Zalo") > -1 || ua.indexOf("Instagram") > -1) {
        setInAppBrowser(true);
      }
    }

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

  const downloadImageAsBlob = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("CORS error");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'download.jpg';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSingleDownload = (photo: Photo, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (project?.allowDownload !== true) {
      showToast("Tính năng tải gốc đang khóa. Vui lòng liên hệ Admin Space Vietnam.");
      return;
    }
    if (inAppBrowser) {
      showToast("⚠️ Hãy mở bằng Safari/Chrome để tải ảnh.");
      return;
    }
    showToast(`Đang tải xuống: ${photo.name || "Hình ảnh"}`);
    downloadImageAsBlob(photo.url, photo.name || "image.jpg");
  };

  const handleDownloadAll = () => {
    if (project?.allowDownload !== true) {
      showToast("Tính năng tải gốc đang khóa. Vui lòng liên hệ Admin.");
      return;
    }
    const driveLink = project?.folders?.[0]?.driveLink;
    if (driveLink) window.open(driveLink, '_blank');
  };

  const handleSubmit = async () => {
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
      showToast(`Tuyệt vời! Đã chốt ${selectedPhotos.length} ảnh cho Space Vietnam.`);
    } catch (error) {
      showToast("Lỗi đường truyền. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" /><p className="text-zinc-500 text-sm animate-pulse tracking-widest uppercase font-medium">Đang đồng bộ dữ liệu...</p></div>;
  if (errorMsg) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-red-400 gap-4"><AlertCircle className="w-10 h-10 opacity-50"/> <p>{errorMsg}</p></div>;

  const selectedCount = photos.filter(p => p.selected).length;
  const activePhoto = photos.find(p => p.id === viewPhotoId);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 pb-32 selection:bg-indigo-500/30 font-sans relative">
      
      {inAppBrowser && (
        <div className="sticky top-0 z-[100] w-full bg-rose-600/90 backdrop-blur-md text-white text-xs sm:text-sm py-3 px-4 font-medium flex items-start gap-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="leading-tight">
            Cảnh báo: Ứng dụng này <b>chặn tải file</b>. Vui lòng bấm vào <b>dấu 3 chấm ở góc phải màn hình</b> và chọn <b>Mở bằng trình duyệt (Safari/Chrome)</b> để tải ảnh.
          </p>
        </div>
      )}

      <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[90] transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-black/90 border border-white/10 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 text-sm font-medium whitespace-nowrap">
          <Sparkles className="w-4 h-4 text-indigo-400" /> {toast.message}
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-2xl border-b border-white/5 px-4 md:px-8 py-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400"/> {project?.name}</h1>
          <p className="text-xs text-zinc-400 mt-1 font-medium tracking-wide">KHÁCH HÀNG: {project?.customerName}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleDownloadAll}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border transition-colors ${project?.allowDownload ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-red-500/5 border-red-500/10 text-red-400/50 cursor-not-allowed'}`}
          >
            {project?.allowDownload ? <CloudDownload className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span className="hidden sm:inline">Link Folder Gốc</span>
          </button>

          <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>

          <p className="text-sm font-medium text-zinc-400 hidden sm:block">Đã chọn: <span className="text-white bg-indigo-500/20 px-2 py-0.5 rounded-md">{selectedCount}</span> / {photos.length}</p>
          
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all"
          >
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Xử lý...</> : <><Send className="w-4 h-4" /> Gửi lựa chọn</>}
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {photos.map((photo) => (
            <div 
              key={photo.id} 
              onClick={() => { setViewPhotoId(photo.id); setTempNote(photo.note || ""); }}
              className={`relative group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                photo.selected ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "border-white/5 hover:border-white/20"
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
                  className={`w-full h-full object-cover transition-transform duration-700 ${photo.selected ? "scale-105" : "group-hover:scale-105"}`} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <button 
                onClick={(e) => toggleSelect(photo.id, e)} 
                className={`absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${photo.selected ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40" : "bg-black/40 text-transparent border border-white/30 backdrop-blur-md group-hover:border-white/80 group-hover:bg-black/60"}`}
              >
                <Check className="w-4 h-4" />
              </button>

              <button 
                onClick={(e) => handleSingleDownload(photo, e)} 
                className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all backdrop-blur-md opacity-0 group-hover:opacity-100 ${project?.allowDownload ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}
                title="Tải ảnh này"
              >
                {project?.allowDownload ? <Download className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
              </button>

              {photo.note && (
                <div className="absolute bottom-3 left-3 right-3 bg-amber-500/90 backdrop-blur-md rounded-lg p-2 flex items-start gap-2 text-white shadow-lg">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium truncate">{photo.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* FLOATING BUTTON GỌI POPUP TRUNG TÂM TẢI XUỐNG */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            onClick={() => {
              if (inAppBrowser) {
                showToast("⚠️ Vui lòng mở bằng Safari/Chrome để tải ảnh.");
                return;
              }
              setShowDownloadModal(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 md:px-8 py-3.5 md:py-4 rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.4)] flex items-center gap-3 font-bold text-sm transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <CloudDownload className="w-5 h-5 shrink-0" /> Tải xuống {selectedCount} ảnh đã chọn
          </button>
        </div>
      )}

      {/* POPUP: TRUNG TÂM TẢI XUỐNG AN TOÀN */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CloudDownload className="w-5 h-5 text-emerald-400"/> Tải ảnh đã chọn
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Hệ thống yêu cầu tải từng file để bảo mật.</p>
              </div>
              <button onClick={() => setShowDownloadModal(false)} className="text-zinc-500 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              {photos.filter(p => p.selected).map((photo, index) => (
                <div key={photo.id} className="flex items-center gap-4 p-3 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="w-12 h-12 rounded-xl object-cover border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{photo.name || `Hình ảnh ${index + 1}`}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Đã sẵn sàng tải</p>
                  </div>
                  <button
                    onClick={(e) => handleSingleDownload(photo, e)}
                    className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.02]">
               <button onClick={() => setShowDownloadModal(false)} className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors text-sm">
                 Hoàn tất tải & Đóng cửa sổ
               </button>
            </div>

          </div>
        </div>
      )}

      {/* POPUP XEM ẢNH CHI TIẾT */}
      {viewPhotoId && activePhoto && (
        <div className="fixed inset-0 z-[100] flex flex-col md:flex-row bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
          <button onClick={() => setViewPhotoId(null)} className="absolute top-6 right-6 z-[60] text-zinc-400 hover:text-white p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5"/></button>
          
          <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 h-[60vh] md:h-screen relative">
            <div className="absolute top-6 left-6 z-50">
              <button 
                onClick={(e) => handleSingleDownload(activePhoto, e)}
                className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 border transition-colors ${project?.allowDownload ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
              >
                {project?.allowDownload ? <><Download className="w-4 h-4"/> Tải file ảnh này</> : <><Lock className="w-4 h-4"/> Khóa tải</>}
              </button>
            </div>
            
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activePhoto.url} alt="view" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]" />
            <p className="text-zinc-500 font-mono text-xs mt-4 opacity-50">{activePhoto.name}</p>
          </div>

          <div className="w-full md:w-[420px] bg-[#080808] p-6 md:p-8 flex flex-col h-[40vh] md:h-screen border-t md:border-t-0 md:border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
            <h3 className="text-lg text-white mb-6 flex items-center gap-2 font-semibold tracking-tight"><MessageSquare className="w-5 h-5 text-indigo-400"/> Ghi chú & Yêu cầu</h3>
            <textarea 
              value={tempNote} onChange={(e) => setTempNote(e.target.value)}
              placeholder="Ghi chú yêu cầu chỉnh sửa cho kỹ thuật viên tại đây..."
              className="flex-1 w-full bg-white/[0.03] border border-white/10 rounded-xl p-5 text-white resize-none outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all text-sm leading-relaxed"
            ></textarea>
            
            <div className="mt-6 space-y-3">
               <button onClick={() => toggleSelect(activePhoto.id)} className={`w-full py-4 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${activePhoto.selected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10"}`}>
                <CheckCircle className={`w-5 h-5 ${activePhoto.selected ? 'fill-emerald-500/20' : ''}`} /> {activePhoto.selected ? "Đã Chọn Hình Này" : "Đánh Dấu Chọn"}
              </button>
              <button onClick={saveNoteAndClose} className="w-full py-4 bg-white hover:bg-zinc-200 text-black rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-white/10">Lưu Ghi Chú & Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}