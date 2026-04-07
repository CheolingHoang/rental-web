"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore"; 
import { CheckCircle, MessageSquare, Send, X, Check, Loader2, Sparkles, AlertCircle, DownloadCloud, Download, Camera, Folder, ChevronLeft, Film, Image as ImageIcon } from "lucide-react";

interface MediaItem {
  id: string;
  url: string; 
  name: string;
  note: string;
  selected?: boolean;
}

interface ProjectFolder {
  id: string;
  name: string;
  type: 'image' | 'video';
  driveLink: string;
}

export default function ClientProofingPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<ProjectFolder | null>(null);
  
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewItemId, setViewItemId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");
  const [toast, setToast] = useState<{show: boolean, message: string}>({show: false, message: ""});

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, "projects", id as string));
        if (!docSnap.exists()) {
          setErrorMsg("Dự án không tồn tại.");
          return;
        }
        const data = docSnap.data();
        setProject(data);
        if (data.folders) setFolders(data.folders);
      } catch (error: any) { setErrorMsg("Lỗi tải thông tin."); } finally { setIsLoading(false); }
    };
    fetchProject();
  }, [id]);

  useEffect(() => {
    if (viewItemId) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [viewItemId]);

  const handleOpenFolder = async (folder: ProjectFolder) => {
    setActiveFolder(folder);
    setIsLoadingFolder(true);
    setErrorMsg("");

    try {
      const response = await fetch('/api/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Quan trọng: Truyền type lên API để API biết mà lọc mp4 hay jpg
        body: JSON.stringify({ folderLink: folder.driveLink, type: folder.type })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      const savedItems = project?.photos || [];
      const mergedItems = result.photos.map((driveItem: any) => {
        const saved = savedItems.find((p: any) => p.id === driveItem.id);
        return { ...driveItem, selected: saved ? saved.selected : false, note: saved ? saved.note : "" };
      });
      setMediaItems(mergedItems);
    } catch (error: any) { setErrorMsg("Lỗi tải dữ liệu. Folder có thể chưa public!"); } finally { setIsLoadingFolder(false); }
  };

  const closeFolder = () => { setActiveFolder(null); setMediaItems([]); setErrorMsg(""); };

  const showToast = (msg: string) => { setToast({ show: true, message: msg }); setTimeout(() => setToast({ show: false, message: "" }), 3000); };
  
  const toggleSelect = (itemId: string, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setMediaItems(prev => prev.map(p => p.id === itemId ? { ...p, selected: !p.selected } : p));
  };

  const saveNoteAndClose = () => {
    if (!viewItemId) return;
    setMediaItems(prev => prev.map(p => {
      if (p.id === viewItemId) return { ...p, note: tempNote, selected: true };
      return p;
    }));
    setViewItemId(null);
  };

  const handleSingleDownload = async (item: MediaItem, e?: React.MouseEvent) => {
    if (e && e.stopPropagation) e.stopPropagation();
    showToast(`Đang tải: ${item.name}`);
    window.open(item.url, '_blank');
  };

  const handleSubmitFeedback = async () => {
    const selectedItems = mediaItems.filter(p => p.selected || p.note);
    if (selectedItems.length === 0) { showToast("Vui lòng chọn ít nhất 1 file!"); return; }
    setIsSubmitting(true);
    try {
      // Vì firebase lưu chung mảng photos, mình merge ảnh cũ và mới để ko bị đè
      const oldPhotos = project?.photos || [];
      const notInCurrentFolder = oldPhotos.filter((old: any) => !mediaItems.some((m) => m.id === old.id));
      const finalPhotos = [...notInCurrentFolder, ...selectedItems.map(p => ({ id: p.id, url: p.url, name: p.name, note: p.note || "", selected: p.selected || false }))];
      
      await updateDoc(doc(db, "projects", id as string), { photos: finalPhotos });
      // Cập nhật lại state ảo để khách bấm qua lại thư mục khác ko bị lỗi
      setProject((prev:any) => ({...prev, photos: finalPhotos}));
      showToast(`Đã chốt ${selectedItems.length} lựa chọn trong thư mục này.`);
    } catch (error) { showToast("Lỗi đường truyền!"); } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" /><p className="text-zinc-500 text-sm animate-pulse tracking-widest uppercase font-medium">Đang chuẩn bị dữ liệu...</p></div>;

  const isDownloadMode = project?.allowDownload === true;
  const activeItem = mediaItems.find(p => p.id === viewItemId);
  const selectedCount = mediaItems.filter(p => p.selected).length;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 pb-24 sm:pb-32 selection:bg-indigo-500/30 font-sans relative">
      
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className={`backdrop-blur-xl text-white px-5 py-3 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-2 text-sm font-bold whitespace-nowrap ${isDownloadMode ? 'bg-emerald-600/95 border border-emerald-500/50' : 'bg-indigo-600/95 border border-indigo-500/50'}`}>
          <Sparkles className="w-4 h-4" /> {toast.message}
        </div>
      </div>

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
        
        {activeFolder && (
          <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto animate-in fade-in slide-in-from-right-4">
            {isDownloadMode ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-emerald-400 text-sm font-bold flex items-center justify-center gap-2 w-full sm:w-auto">
                <DownloadCloud className="w-4 h-4"/> Chế độ Bàn Giao
              </div>
            ) : (
              <>
                <p className="text-xs sm:text-sm font-medium text-zinc-400 whitespace-nowrap">Đã chọn: <span className="text-white bg-indigo-500/20 px-2 py-0.5 rounded-md mx-1">{selectedCount}</span></p>
                <button onClick={handleSubmitFeedback} disabled={isSubmitting} className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all active:scale-95">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</> : <><Send className="w-4 h-4" /> Gửi Phản Hồi Thư Mục</>}
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-8">
        
        {/* VIEW 1: LƯỚI THƯ MỤC */}
        {!activeFolder && (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2"><Folder className="w-5 h-5 text-indigo-400"/> Vui lòng chọn Thư mục</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {folders.map((folder, idx) => (
                <div key={idx} onClick={() => handleOpenFolder(folder)} className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/20 rounded-2xl p-6 cursor-pointer transition-all duration-300 group hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-black/50 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shrink-0">
                    {folder.type === 'video' ? <Film className="w-8 h-8 text-indigo-400" /> : <ImageIcon className="w-8 h-8 text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-lg truncate">{folder.name}</h3>
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">{folder.type === 'video' ? 'Xem Video' : 'Xem Hình ảnh'}</p>
                  </div>
                </div>
              ))}
              {folders.length === 0 && <p className="text-zinc-500 col-span-full border border-dashed border-white/10 p-10 text-center rounded-2xl">Space Vietnam đang cập nhật dữ liệu. Vui lòng quay lại sau!</p>}
            </div>
          </div>
        )}

        {/* VIEW 2: TRONG THƯ MỤC */}
        {activeFolder && (
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-500">
            
            <div className="flex items-center gap-4 mb-6">
              <button onClick={closeFolder} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white"><ChevronLeft className="w-6 h-6"/></button>
              <div>
                <h2 className="text-white font-bold text-xl">{activeFolder.name}</h2>
                <p className="text-sm text-zinc-500">{activeFolder.type === 'video' ? 'Danh sách Video' : 'Danh sách Hình ảnh'}</p>
              </div>
            </div>

            {errorMsg ? (
               <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-6 rounded-2xl flex items-center gap-3"><AlertCircle className="w-6 h-6"/> {errorMsg}</div>
            ) : isLoadingFolder ? (
               <div className="h-[40vh] flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" /><p className="text-zinc-500 font-medium">Đang tải dữ liệu, vui lòng đợi...</p></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 md:gap-6">
                {mediaItems.map((item) => (
                  <div key={item.id} onClick={() => { setViewItemId(item.id); setTempNote(item.note || ""); }} className={`relative group cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden transform-gpu border-2 transition-all duration-300 ${!isDownloadMode && item.selected ? "border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]" : "border-white/5 hover:border-white/20"}`}>
                    
                    <div className={`${activeFolder.type === 'video' ? 'aspect-video' : 'aspect-[4/5]'} overflow-hidden bg-white/5 relative flex items-center justify-center`}>
                      <div className="absolute inset-0 flex items-center justify-center -z-10"><Loader2 className="w-5 h-5 text-zinc-700 animate-spin" /></div>
                      
                      {activeFolder.type === 'video' ? (
                        <video src={item.url} className={`w-full h-full object-cover transition-transform duration-700 ${!isDownloadMode && item.selected ? "scale-105" : "group-hover:scale-105"}`} preload="metadata" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt={item.name} loading="lazy" className={`w-full h-full object-cover transition-transform duration-700 ${!isDownloadMode && item.selected ? "scale-105" : "group-hover:scale-105"}`} />
                      )}

                      {activeFolder.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors z-0">
                           <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 pl-1"><Film className="w-5 h-5 text-white"/></div>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-black/40 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>

                    {isDownloadMode ? (
                      <button onClick={(e) => handleSingleDownload(item, e)} className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-emerald-500 hover:bg-emerald-400 text-white w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 z-20">
                        <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    ) : (
                      <button onClick={(e) => toggleSelect(item.id, e)} className={`absolute top-2 left-2 sm:top-3 sm:left-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center z-20 transition-all ${item.selected ? "bg-indigo-500 text-white" : "bg-black/50 text-white/50 border border-white/20 backdrop-blur-md"}`}>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}

                    {!isDownloadMode && item.note && (
                      <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 bg-amber-500/95 backdrop-blur-md rounded-lg p-2 flex items-start gap-1.5 text-white shadow-lg pointer-events-none">
                        <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 mt-0.5" />
                        <p className="text-[10px] sm:text-[11px] font-medium truncate">{item.note}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* POPUP XEM CHI TIẾT */}
      {viewItemId && activeItem && (
         <div className="fixed inset-0 z-[150] flex flex-col sm:flex-row bg-black/95 backdrop-blur-3xl animate-in fade-in duration-200 overflow-hidden">
          <button onClick={() => setViewItemId(null)} className="absolute top-4 right-4 z-[200] bg-rose-600 hover:bg-rose-500 text-white w-10 h-10 sm:w-auto sm:px-4 sm:py-3 rounded-full flex items-center justify-center gap-2 border border-rose-400/30 active:scale-90">
            <X className="w-5 h-5 sm:w-6 h-6"/> <span className="font-bold tracking-widest text-sm hidden sm:block uppercase">Đóng</span>
          </button>
          
          <div className="flex-1 min-h-0 w-full flex items-center justify-center p-4 pt-16 sm:p-8 relative z-10">
            {activeFolder?.type === 'video' ? (
              <video src={activeItem.url} controls autoPlay className="max-w-full max-h-[85%] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] border border-white/10 outline-none" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={activeItem.url} alt="view" className="max-w-full max-h-full object-contain rounded-xl drop-shadow-[0_0_20px_rgba(255,255,255,0.05)] pointer-events-auto" />
            )}
          </div>

          <div className="shrink-0 w-full sm:w-[420px] max-h-[60vh] sm:max-h-none sm:h-screen bg-[#0f0f0f] rounded-t-[32px] sm:rounded-none p-6 sm:p-8 flex flex-col shadow-2xl overflow-y-auto relative z-[120]">
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 sm:hidden shrink-0"></div>
            
            {isDownloadMode ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5">
                <button onClick={(e) => handleSingleDownload(activeItem, e)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-base sm:text-lg transition-colors flex justify-center items-center gap-2 active:scale-95">
                  <Download className="w-5 h-5"/> TẢI VỀ MÁY
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <h3 className="text-base sm:text-lg text-white mb-4 flex items-center gap-2 font-bold"><MessageSquare className="w-4 h-4 text-indigo-400"/> Ghi chú Yêu cầu</h3>
                <textarea value={tempNote} onChange={(e) => setTempNote(e.target.value)} placeholder="Nhập yêu cầu..." className="flex-1 min-h-[120px] w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white resize-none outline-none focus:border-indigo-500/50 text-base sm:text-sm"></textarea>
                <div className="mt-4 sm:mt-6 space-y-3 pb-4">
                   <button onClick={() => toggleSelect(activeItem.id)} className={`w-full py-3.5 sm:py-4 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 active:scale-95 ${activeItem.selected ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30" : "bg-white/5 text-zinc-300 border-white/10"}`}><CheckCircle className="w-5 h-5" /> Chốt File Này</button>
                  <button onClick={saveNoteAndClose} className="w-full py-3.5 sm:py-4 bg-white text-black rounded-xl font-bold text-sm active:scale-95">Lưu Lại & Đóng</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}