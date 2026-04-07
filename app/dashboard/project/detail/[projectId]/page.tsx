"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, Loader2, Folder, Copy, Check, DownloadCloud, Lock, Sparkles, Image as ImageIcon, Film, Plus, Trash2, X, Link as LinkIcon, RefreshCw, MessageSquare, AlertCircle, CheckCircle, ClipboardList, Filter } from "lucide-react";

interface ProjectFolder {
  id: string;
  name: string;
  type: 'image' | 'video';
  driveLink: string;
}

export default function ProjectDetailsAndFeedbackPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<ProjectFolder | null>(null);

  const [previewItems, setPreviewItems] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const [isAddingFolder, setIsAddingFolder] = useState<'image' | 'video' | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const [allowDownload, setAllowDownload] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopiedLink, setIsCopiedLink] = useState(false);

  // States cho khu vực VIP Feedback
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'image' | 'raw' | 'video'>('all');
  const [isCopiedFiles, setIsCopiedFiles] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        const docSnap = await getDoc(doc(db, "projects", projectId as string));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject(data);
          setAllowDownload(data.allowDownload || false);
          if (data.folders) setFolders(data.folders);
        }
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };
    fetchProject();
  }, [projectId]);

  // LOGIC NHẬN DIỆN FILE (JPG, RAW, VIDEO)
  const getFileType = (filename: string) => {
    const ext = filename?.toLowerCase().split('.').pop() || '';
    if (['mp4', 'mov', 'avi', 'wmv', 'mkv'].includes(ext)) return 'video';
    if (['arw', 'cr2', 'cr3', 'nef', 'dng', 'raw'].includes(ext)) return 'raw';
    return 'image';
  };

  const feedbackPhotos = project?.photos?.filter((p: any) => p.selected || p.note) || [];
  
  // Lọc Feedback theo Tab
  const filteredFeedback = feedbackPhotos.filter((item: any) => {
    if (feedbackFilter === 'all') return true;
    return getFileType(item.name) === feedbackFilter;
  });

  // HÀM COPY TÊN FILE CHO EDITOR
  const handleCopyFileNames = () => {
    const namesList = filteredFeedback.map((item: any) => item.name).join(', ');
    navigator.clipboard.writeText(namesList);
    setIsCopiedFiles(true);
    setTimeout(() => setIsCopiedFiles(false), 2000);
  };

  const handleToggleDownload = async () => {
    const newValue = !allowDownload;
    setAllowDownload(newValue); 
    try { await updateDoc(doc(db, "projects", projectId as string), { allowDownload: newValue }); } 
    catch (error) { setAllowDownload(!newValue); alert("Lỗi cập nhật!"); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${projectId}`);
    setIsCopiedLink(true); setTimeout(() => setIsCopiedLink(false), 2000);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return alert("Vui lòng nhập tên thư mục!");
    const newFolder: ProjectFolder = { id: Date.now().toString(), name: newFolderName, type: isAddingFolder as 'image' | 'video', driveLink: "" };
    const updatedFolders = [...folders, newFolder];
    try {
      await updateDoc(doc(db, "projects", projectId as string), { folders: updatedFolders });
      setFolders(updatedFolders); setIsAddingFolder(null); setNewFolderName("");
    } catch (error) { alert("Lỗi khi tạo thư mục!"); }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa thư mục này?")) return;
    const updatedFolders = folders.filter(f => f.id !== folderId);
    try {
      await updateDoc(doc(db, "projects", projectId as string), { folders: updatedFolders });
      setFolders(updatedFolders);
    } catch (error) { alert("Lỗi khi xóa thư mục!"); }
  };

  const handleUpdateFolderLink = async (newLink: string) => {
    if (!activeFolder) return;
    const updatedFolder = { ...activeFolder, driveLink: newLink };
    setActiveFolder(updatedFolder); 
    const updatedFolders = folders.map(f => f.id === activeFolder.id ? updatedFolder : f);
    try {
      await updateDoc(doc(db, "projects", projectId as string), { folders: updatedFolders });
      setFolders(updatedFolders);
    } catch (error) { alert("Lỗi lưu link Drive!"); }
  };

  const fetchDrivePreview = async () => {
    if (!activeFolder || !activeFolder.driveLink) return alert("Vui lòng dán link Drive trước!");
    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderLink: activeFolder.driveLink, type: activeFolder.type })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      const savedItems = project?.photos || [];
      const mergedItems = result.photos.map((driveItem: any) => {
        const saved = savedItems.find((p: any) => p.id === driveItem.id);
        return { ...driveItem, selected: saved ? saved.selected : false, note: saved ? saved.note : "" };
      });
      setPreviewItems(mergedItems);
    } catch (error) { alert("Lỗi tải Drive!"); } finally { setIsLoadingPreview(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 p-4 font-sans relative">
      
      <button onClick={() => router.back()} className="group flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white px-4 py-2 bg-white/5 rounded-xl w-fit transition-colors border border-white/10">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
      </button>

      {/* HEADER DỰ ÁN */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3"><Sparkles className="text-indigo-400"/> {project?.name}</h1>
          <p className="text-sm text-zinc-500 mt-2">Khách hàng: <span className="text-white bg-white/10 px-2 py-0.5 rounded-md">{project?.customerName}</span></p>
        </div>
        <button onClick={handleCopyLink} className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-colors">
          {isCopiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} Copy Link Gửi Khách
        </button>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-[24px] p-6 shadow-xl">
         <div className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${allowDownload ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`} onClick={handleToggleDownload}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${allowDownload ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-zinc-400'}`}>
                {allowDownload ? <DownloadCloud className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <p className={`text-sm font-bold ${allowDownload ? 'text-emerald-400' : 'text-white'}`}>Chế độ Bàn giao File (Download Mode)</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-lg">Bật để Khách được tải File ở TẤT CẢ thư mục. Tắt để Khách chỉ Feedback.</p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${allowDownload ? 'bg-emerald-500' : 'bg-black/50 border border-white/10'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${allowDownload ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
      </div>

      <div className="pt-4">
        
        {!activeFolder ? (
          <>
            {/* KHU VỰC THƯ MỤC */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-white/10 pb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2"><Folder className="text-indigo-400"/> Quản lý Thư mục</h2>
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => setIsAddingFolder('image')} className="px-4 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                  <ImageIcon className="w-4 h-4"/> + Tạo Thư mục Ảnh
                </button>
                <button onClick={() => setIsAddingFolder('video')} className="px-4 py-2.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                  <Film className="w-4 h-4"/> + Tạo Thư mục Video
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map((folder) => (
                <div key={folder.id} onClick={() => { setActiveFolder(folder); setPreviewItems([]); }} className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-pointer hover:bg-white/10 transition-colors group relative flex items-start gap-4">
                   <div className="p-3 bg-black/50 border border-white/10 rounded-xl shrink-0">
                     {folder.type === 'video' ? <Film className="w-6 h-6 text-indigo-400"/> : <ImageIcon className="w-6 h-6 text-emerald-400"/>}
                   </div>
                   <div className="flex-1 min-w-0 pr-8">
                     <h3 className="text-white font-bold truncate text-lg">{folder.name}</h3>
                     <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 mb-2">{folder.type === 'video' ? 'Phân loại: Video' : 'Phân loại: Hình ảnh'}</p>
                     {folder.driveLink ? (
                       <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-xs font-medium"><Check className="w-3 h-3"/> Đã chèn Link</span>
                     ) : (
                       <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-400 rounded-md text-xs font-medium"><AlertCircle className="w-3 h-3"/> Chưa có Link</span>
                     )}
                   </div>
                   <button onClick={(e) => handleDeleteFolder(folder.id, e)} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Xóa thư mục">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
              {folders.length === 0 && <p className="text-zinc-500 p-10 border border-dashed border-white/10 rounded-2xl w-full col-span-full text-center">Chưa có thư mục nào. Hãy tạo thư mục bên trên.</p>}
            </div>

            {/* KHU VỰC VIP: DANH SÁCH FILE KHÁCH ĐÃ CHỌN TRONG TOÀN BỘ DỰ ÁN */}
            {feedbackPhotos.length > 0 && (
              <div className="mt-16 pt-10 border-t border-white/10 animate-in fade-in slide-in-from-bottom-8">
                
                {/* Header VIP */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white tracking-tight">Khách Hàng Đã Chốt <span className="text-emerald-400">({feedbackPhotos.length})</span></h2>
                      <p className="text-sm text-zinc-400 mt-1">Tổng hợp toàn bộ file từ tất cả thư mục.</p>
                    </div>
                  </div>

                  {/* Nút Copy Tên File Cho Editor */}
                  <button 
                    onClick={handleCopyFileNames}
                    className={`px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg ${isCopiedFiles ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 'bg-white hover:bg-zinc-200 text-black shadow-white/10 active:scale-95'}`}
                  >
                    {isCopiedFiles ? <Check className="w-5 h-5"/> : <ClipboardList className="w-5 h-5"/>} 
                    {isCopiedFiles ? 'Đã Copy Tên File' : 'Copy Tên File'}
                  </button>
                </div>

                {/* Tabs Bộ Lọc (All, Image, Raw, Video) */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-xl border border-white/10">
                    <Filter className="w-4 h-4 text-zinc-500 ml-2 mr-1" />
                    <button onClick={() => setFeedbackFilter('all')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${feedbackFilter === 'all' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>Tất cả ({feedbackPhotos.length})</button>
                    <button onClick={() => setFeedbackFilter('image')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${feedbackFilter === 'image' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-500 hover:text-white'}`}>Ảnh JPG/PNG</button>
                    <button onClick={() => setFeedbackFilter('raw')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${feedbackFilter === 'raw' ? 'bg-amber-500/20 text-amber-400' : 'text-zinc-500 hover:text-white'}`}>File RAW</button>
                    <button onClick={() => setFeedbackFilter('video')} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${feedbackFilter === 'video' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-500 hover:text-white'}`}>Video</button>
                  </div>
                </div>

                {/* Grid Ảnh/Video */}
                {filteredFeedback.length === 0 ? (
                  <div className="p-10 border border-dashed border-white/10 rounded-2xl text-center text-zinc-500">Không có file nào thuộc phân loại này.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredFeedback.map((item: any, index: number) => {
                      const fileType = getFileType(item.name);
                      
                      return (
                        <div key={index} className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden p-3 group hover:border-white/20 transition-all hover:-translate-y-1 hover:shadow-2xl relative">
                          
                          {/* Label hiển thị loại File (Góc trái trên) */}
                          <div className="absolute top-5 left-5 z-20">
                            {fileType === 'raw' && <span className="px-2 py-0.5 bg-amber-500/90 backdrop-blur-sm text-black text-[10px] font-bold rounded-md shadow-lg">RAW</span>}
                            {fileType === 'video' && <span className="px-2 py-0.5 bg-indigo-500/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-md shadow-lg">VIDEO</span>}
                            {fileType === 'image' && <span className="px-2 py-0.5 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-md shadow-lg">JPG</span>}
                          </div>

                          <div className="aspect-[4/5] overflow-hidden rounded-lg mb-3 bg-black/80 relative flex items-center justify-center">
                            {fileType === 'video' ? (
                              <>
                                <Film className="w-10 h-10 text-white/30 absolute z-10" />
                                <video src={item.url} className="w-full h-full object-cover opacity-50" />
                              </>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={item.url} className="w-full h-full object-cover" alt={item.name} loading="lazy" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-transparent pointer-events-none" />
                            <p className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-zinc-300 truncate z-20 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm" title={item.name}>{item.name}</p>
                          </div>
                          
                          {item.note ? (
                            <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0"/>
                              <p className="text-xs text-amber-200/90 font-medium italic leading-relaxed break-words">{item.note}</p>
                            </div>
                          ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-lg flex items-center justify-center gap-2">
                              <Check className="w-4 h-4 text-emerald-500"/>
                              <p className="text-xs text-emerald-400 font-bold tracking-wide">ĐÃ CHỌN</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          
          /* BÊN TRONG 1 THƯ MỤC (CẤU HÌNH LINK) */
          <div className="animate-in fade-in slide-in-from-right-8 bg-[#080808] border border-white/5 p-6 rounded-[24px]">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
               <div className="flex items-center gap-4">
                 <button onClick={() => setActiveFolder(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"><ChevronLeft/></button>
                 <div>
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     {activeFolder.type === 'video' ? <Film className="w-5 h-5 text-indigo-400"/> : <ImageIcon className="w-5 h-5 text-emerald-400"/>} 
                     {activeFolder.name}
                   </h2>
                   <p className="text-sm text-zinc-500 mt-1">Cấu hình dữ liệu cho thư mục này</p>
                 </div>
               </div>
            </div>
            
            <div className="mb-8">
              <label className="block text-xs text-zinc-400 uppercase tracking-widest mb-3 font-bold">Link Thư mục Google Drive</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" value={activeFolder.driveLink || ""} onChange={(e) => handleUpdateFolderLink(e.target.value)}
                    placeholder="Dán link Drive vào đây..." className="w-full bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:border-indigo-500 outline-none text-sm"
                  />
                </div>
                <button onClick={fetchDrivePreview} disabled={isLoadingPreview || !activeFolder.driveLink} className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-zinc-500 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-lg">
                  {isLoadingPreview ? <Loader2 className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4"/>} Đồng bộ & Xem trước
                </button>
              </div>
            </div>

            {previewItems.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">Dữ liệu hiển thị cho khách ({previewItems.length} files)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                   {previewItems.map((item: any, index: number) => (
                     <div key={index} className={`bg-white/5 border ${item.selected || item.note ? 'border-amber-500/50' : 'border-white/10'} rounded-xl overflow-hidden p-3 relative`}>
                       {(item.selected || item.note) && <div className="absolute top-4 right-4 z-10 w-6 h-6 bg-amber-500 text-black rounded-full flex items-center justify-center"><Check className="w-3 h-3 font-bold"/></div>}
                       <div className={`w-full ${activeFolder.type === 'video' ? 'aspect-video' : 'aspect-[4/5]'} overflow-hidden rounded-lg mb-3 relative bg-black/50`}>
                         {activeFolder.type === 'video' ? (
                           <><video src={item.url} className="w-full h-full object-cover opacity-70" preload="metadata" /><div className="absolute inset-0 flex items-center justify-center"><Film className="w-6 h-6 text-white/50"/></div></>
                         ) : (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img src={item.url} className="w-full h-full object-cover" alt="" loading="lazy" />
                         )}
                       </div>
                       {item.note ? (
                         <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg flex gap-2"><MessageSquare className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0"/><p className="text-xs text-amber-200/80 italic">{item.note}</p></div>
                       ) : ( <p className="text-[10px] font-mono text-zinc-500 truncate">{item.name}</p> )}
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL TẠO THƯ MỤC */}
      {isAddingFolder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {isAddingFolder === 'image' ? <ImageIcon className="text-emerald-400 w-5 h-5"/> : <Film className="text-indigo-400 w-5 h-5"/>} Thư mục {isAddingFolder === 'image' ? 'Ảnh' : 'Video'}
              </h3>
              <button onClick={() => setIsAddingFolder(null)} className="text-zinc-500 hover:text-white p-1"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <label className="block text-xs text-zinc-400 uppercase tracking-widest mb-2 font-bold">Tên hiển thị cho khách</label>
              <input value={newFolderName} onChange={e => setNewFolderName(e.target.value)} placeholder="VD: Highlight Cưới..." autoFocus className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:border-indigo-500 outline-none text-sm"/>
            </div>
            <div className="p-4 border-t border-white/5 bg-white/[0.02] flex gap-3">
              <button onClick={() => setIsAddingFolder(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm">Hủy</button>
              <button onClick={handleCreateFolder} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm flex justify-center items-center gap-2 shadow-lg"><Plus className="w-4 h-4"/> Lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}