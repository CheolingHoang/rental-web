"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../../lib/firebase"; 
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ChevronLeft, Link as LinkIcon, Loader2, Folder, Copy, Check, DownloadCloud, Lock, Sparkles, Activity, MessageSquare, CheckCircle2, Image as ImageIcon, AlertCircle } from "lucide-react";

// COMPONENT XỬ LÝ ẢNH THÔNG MINH
const SmoothImage = ({ src, alt, className }: { src: string, alt: string, className?: string }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className={`relative w-full h-full bg-[#0a0a0a] flex items-center justify-center overflow-hidden ${className}`}>
      {status === 'loading' && <Loader2 className="w-5 h-5 text-indigo-500/50 animate-spin absolute" />}
      {status === 'error' ? (
        <div className="flex flex-col items-center justify-center text-zinc-600 absolute">
          <AlertCircle className="w-6 h-6 mb-2 opacity-50" />
          <span className="text-[10px] uppercase tracking-widest font-medium opacity-50">Lỗi tải ảnh</span>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img 
          src={src} 
          alt={alt} 
          loading="lazy"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          className={`w-full h-full object-cover transition-all duration-700 ${status === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
        />
      )}
    </div>
  );
};

export default function ProjectDetailsAndFeedbackPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  
  // States
  const [driveLink, setDriveLink] = useState("");
  const [allowDownload, setAllowDownload] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  
  // Trạng thái lưu ngầm (Auto-save status)
  const [isSavingLink, setIsSavingLink] = useState(false);
  const [isSavingToggle, setIsSavingToggle] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        const docSnap = await getDoc(doc(db, "projects", projectId as string));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject(data);
          setAllowDownload(data.allowDownload || false);
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

  // AUTO-SAVE: Khi gạt công tắc quyền tải
  const handleToggleDownload = async () => {
    const newValue = !allowDownload;
    setAllowDownload(newValue); 
    setIsSavingToggle(true);
    
    try {
      await updateDoc(doc(db, "projects", projectId as string), { 
        allowDownload: newValue 
      });
    } catch (error) {
      setAllowDownload(!newValue); 
      alert("Lỗi khi cập nhật quyền tải!");
    } finally {
      setIsSavingToggle(false);
    }
  };

  // AUTO-SAVE: Khi dán xong Link Drive và click ra ngoài (onBlur)
  const handleSaveDriveLink = async () => {
    const oldLink = project?.folders?.[0]?.driveLink || "";
    if (driveLink === oldLink) return;

    setIsSavingLink(true);
    try {
      await updateDoc(doc(db, "projects", projectId as string), { 
        folders: [{ id: "folder-1", name: "Thư mục ảnh Drive", driveLink: driveLink }]
      });
      setProject((prev: any) => ({
        ...prev, folders: [{ id: "folder-1", name: "Thư mục ảnh Drive", driveLink: driveLink }]
      }));
    } catch (error) {
      alert("Lỗi khi tự động lưu Link Drive!");
    } finally {
      setIsSavingLink(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/p/${projectId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
      <p className="text-sm font-medium text-zinc-500 uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );

  const feedbackPhotos = project?.photos?.filter((p: any) => p.selected || p.note) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      <button onClick={() => router.back()} className="group flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-all bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/10 px-4 py-2 rounded-xl w-fit">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
        Quay lại Danh sách Dự án
      </button>

      <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-6 backdrop-blur-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent truncate max-w-[400px]">
              {project?.name}
            </h1>
          </div>
          <p className="text-sm text-zinc-500 mt-2 flex items-center gap-2">
            Khách hàng: <span className="text-white font-medium bg-white/10 px-2 py-0.5 rounded-md">{project?.customerName}</span>
          </p>
        </div>

        <button 
          onClick={handleCopyLink}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-lg ${isCopied ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:scale-105 active:scale-95'}`}
        >
          {isCopied ? <><Check className="w-4 h-4" /> Đã Copy Link</> : <><Copy className="w-4 h-4" /> Copy Link Gửi Khách</>}
        </button>
      </div>

      {/* 1. KHU VỰC CẤU HÌNH (TỰ ĐỘNG LƯU) */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[24px] p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

        <h2 className="text-lg text-white font-bold flex items-center gap-3 tracking-tight mb-6 border-b border-white/5 pb-4">
          <Folder className="w-5 h-5 text-indigo-400" /> Tự động cấu hình dữ liệu
        </h2>
        
        <div className="space-y-6 relative z-10">
          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-widest">Đường dẫn Google Drive (Chứa ảnh)</label>
              {isSavingLink && <span className="text-[10px] text-indigo-400 flex items-center gap-1 animate-pulse"><Loader2 className="w-3 h-3 animate-spin"/> Đang lưu ngầm...</span>}
            </div>
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                value={driveLink} 
                onChange={(e) => setDriveLink(e.target.value)} 
                onBlur={handleSaveDriveLink} 
                placeholder="Dán link Drive vào đây... (Tự động lưu)" 
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white focus:border-indigo-500 outline-none text-sm transition-colors focus:bg-black/60" 
              />
            </div>
          </div>

          <div 
            className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${allowDownload ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`} 
            onClick={handleToggleDownload}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${allowDownload ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-zinc-400'}`}>
                {allowDownload ? <DownloadCloud className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${allowDownload ? 'text-emerald-400' : 'text-white'}`}>Chế độ: Bàn giao Ảnh cho Khách (Download Mode)</p>
                  {isSavingToggle && <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />}
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-lg">
                  {allowDownload 
                    ? 'BẬT: Giao diện Khách sẽ hiển thị nút Tải Xuống xanh lá trên mỗi ảnh. Tính năng tick chọn (Feedback) sẽ bị ẩn đi.' 
                    : 'TẮT (Mặc định): Khách chỉ được xem, tick chọn ảnh và nhập yêu cầu chỉnh sửa gửi về cho Media.'}
                </p>
              </div>
            </div>
            
            <div className={`w-10 h-6 rounded-full flex items-center transition-colors p-1 shrink-0 ${allowDownload ? 'bg-emerald-500' : 'bg-black/50 border border-white/10'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${allowDownload ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC XEM ẢNH KHÁCH YÊU CẦU */}
      <div className="pt-4">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-amber-500" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Phản hồi từ Khách hàng ({feedbackPhotos.length})
          </h2>
        </div>
        
        {feedbackPhotos.length === 0 ? (
          <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-[24px] p-16 text-center flex flex-col items-center justify-center">
            <ImageIcon className="w-12 h-12 text-zinc-700 mb-4" />
            <p className="text-zinc-400 font-medium text-lg">Chưa có phản hồi</p>
            <p className="text-zinc-600 text-sm mt-1 max-w-sm">Khách hàng chưa truy cập link hoặc chưa hoàn tất việc chọn lọc hình ảnh.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedbackPhotos.map((photo: any, index: number) => (
              <div key={index} className="group bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden flex flex-col hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
                
                <div className="aspect-[4/3] relative overflow-hidden bg-black">
                  <SmoothImage src={photo.url} alt={photo.name} className="group-hover:scale-105" />
                  
                  {photo.selected && (
                    <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg z-10">
                      <CheckCircle2 className="w-3.5 h-3.5"/> Khách Chốt
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-100 pointer-events-none" />
                  <p className="absolute bottom-3 left-4 right-4 text-xs text-zinc-300 font-mono truncate z-10">{photo.name}</p>
                </div>
                
                <div className="p-5 flex-1 bg-[#0a0a0a]">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3 text-amber-500" /> Ghi chú chỉnh sửa
                  </h4>
                  <div className="bg-black/40 p-3.5 rounded-xl border border-white/5 min-h-[60px]">
                    <p className="text-sm text-zinc-300 leading-relaxed">
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