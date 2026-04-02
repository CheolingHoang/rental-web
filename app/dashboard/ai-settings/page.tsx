"use client";

import { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase"; // Đảm bảo đường dẫn này đúng với project của bạn
import { Sparkles, UploadCloud, ScanLine, Cpu, CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Khởi tạo Gemini API
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export default function AISettingsPage() {
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý khi người dùng chọn ảnh
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setScanResult(null); 
        setSaveSuccess(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Tích hợp AI thật (Gemini 1.5 Flash)
  const processAI = async () => {
    if (!imagePreview) return;
    
    setIsScanning(true);
    setSaveSuccess(false);
    
    try {
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        throw new Error("Chưa cấu hình NEXT_PUBLIC_GEMINI_API_KEY");
      }

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Tách chuỗi base64 và mimeType từ DataURL (imagePreview)
      const mimeType = imagePreview.split(';')[0].split(':')[1];
      const base64Data = imagePreview.split(',')[1];

      // Viết Prompt ép AI trả về chuẩn JSON cho thiết bị sự kiện
      const prompt = `
        Bạn là một kỹ sư quản lý thiết bị sự kiện chuyên nghiệp.
        Phân tích hình ảnh thiết bị này và trả về KẾT QUẢ DUY NHẤT LÀ ĐỊNH DẠNG JSON NGUYÊN BẢN (không giải thích, không dùng markdown \`\`\`json).
        
        Cấu trúc JSON bắt buộc:
        {
          "name": "Tên chi tiết của thiết bị (VD: Sony Alpha a7R II, Cáp SDI, Bàn mixer...)",
          "category": "Phân loại (Máy ảnh, Ống kính, Bàn điều khiển, Âm thanh, Ánh sáng, Phụ kiện...)",
          "serialNumber": "Đọc các dãy số trên thiết bị. Nếu không thấy, hãy tạo mã ngẫu nhiên dạng SP-VN-XXXX",
          "status": "Dự đoán tình trạng (Mới, Khá, Cũ, Hỏng...)",
          "pricePerDay": Giá thuê 1 ngày dự kiến tính bằng số nguyên VNĐ (VD: 500000),
          "confidence": "Tỷ lệ phần trăm tự tin (VD: 98%)"
        }
      `;

      // Gửi ảnh và prompt cho AI
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType } }
      ]);

      const responseText = result.response.text();
      
      // Xóa các ký tự markdown thừa nếu AI vẫn cố tình trả về
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      const aiData = JSON.parse(cleanJson);
      
      // Cập nhật State để hiển thị lên UI
      setScanResult({
        name: aiData.name,
        category: aiData.category,
        serialNumber: aiData.serialNumber,
        status: aiData.status,
        pricePerDay: aiData.pricePerDay,
        confidence: aiData.confidence
      });

    } catch (error) {
      console.error("Lỗi quét AI:", error);
      alert("Lỗi trích xuất AI. Hãy kiểm tra lại API Key hoặc Console log!");
    } finally {
      setIsScanning(false);
    }
  };

  // Lưu thẳng kết quả AI vào Database (Giữ nguyên logic cũ của bạn)
  const handleSaveToInventory = async () => {
    if (!scanResult) return;
    setIsSaving(true);
    
    try {
      await addDoc(collection(db, "equipments"), {
        name: scanResult.name,
        category: scanResult.category,
        serialNumber: scanResult.serialNumber,
        pricePerDay: scanResult.pricePerDay,
        status: scanResult.status,
        createdAt: serverTimestamp()
      });
      
      setSaveSuccess(true);
      // Reset lại sau 2 giây
      setTimeout(() => {
        setImagePreview(null);
        setScanResult(null);
        setSaveSuccess(false);
      }, 2000);

    } catch (error) {
      console.error("Lỗi khi lưu từ AI:", error);
      alert("Không thể lưu vào cơ sở dữ liệu Firebase!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium tracking-widest text-indigo-400 uppercase">Computer Vision Engine</span>
          </div>
          <h2 className="text-3xl font-normal text-white tracking-tight">AI OCR Scanner</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Khu vực Upload & Quét */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden shadow-xl">
          <div 
            onClick={() => !isScanning && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl h-80 flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden ${
              imagePreview ? "border-indigo-500/30" : "border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.02]"
            }`}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain p-2 opacity-60" />
                
                {isScanning && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_2s_ease-in-out_infinite]" />
                )}
                
                {isScanning && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-[2px]">
                    <ScanLine className="w-12 h-12 text-indigo-400 animate-pulse mb-3" />
                    <p className="text-indigo-300 text-sm font-medium tracking-widest animate-pulse">AI ĐANG TRÍCH XUẤT DỮ LIỆU...</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="p-4 bg-indigo-500/10 rounded-full mb-4">
                  <UploadCloud className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-white font-medium">Tải ảnh thiết bị hoặc biên lai lên</p>
                <p className="text-zinc-500 text-sm mt-1">Hỗ trợ JPG, PNG (Max 5MB)</p>
              </>
            )}
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          </div>

          <div className="mt-6 flex gap-4">
            <button 
              onClick={() => { setImagePreview(null); setScanResult(null); }}
              disabled={isScanning || !imagePreview || isSaving}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-all disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button 
              onClick={processAI}
              disabled={isScanning || !imagePreview || isSaving}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isScanning ? (
                <Cpu className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
              )}
              {isScanning ? "Đang xử lý..." : "Kích hoạt AI OCR"}
            </button>
          </div>
        </div>

        {/* Khu vực Hiển thị Kết quả */}
        <div className="flex flex-col space-y-6">
          <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-md flex-1 shadow-xl">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-indigo-400" /> Dữ liệu trích xuất
            </h3>

            {scanResult ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm font-medium">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Trích xuất thành công</span>
                  <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded">Độ chính xác: {scanResult.confidence}</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-medium">Tên thiết bị nhận diện</p>
                    <p className="text-lg font-medium text-white bg-black/40 px-4 py-2.5 rounded-xl border border-white/10">{scanResult.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-medium">Số Serial / Mã vạch</p>
                    <p className="text-lg font-mono text-indigo-400 bg-black/40 px-4 py-2.5 rounded-xl border border-indigo-500/20">{scanResult.serialNumber}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-medium">Phân loại</p>
                      <p className="text-sm text-zinc-300 bg-black/40 px-4 py-2.5 rounded-xl border border-white/10">{scanResult.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-medium">Giá thuê (Đề xuất)</p>
                      <p className="text-sm text-emerald-400 font-medium bg-black/40 px-4 py-2.5 rounded-xl border border-white/10">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(scanResult.pricePerDay)}
                      </p>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveToInventory}
                  disabled={isSaving || saveSuccess}
                  className={`w-full mt-8 px-6 py-3.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    saveSuccess 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-white/10 hover:bg-white/20 border border-white/10 text-white"
                  }`}
                >
                  {isSaving ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Đang đồng bộ...</>
                  ) : saveSuccess ? (
                    <><CheckCircle2 className="w-5 h-5" /> Đã thêm vào Kho</>
                  ) : (
                    <><ArrowRight className="w-5 h-5" /> Xác nhận & Thêm vào kho</>
                  )}
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 opacity-50 pb-10">
                <AlertCircle className="w-12 h-12 mb-2" />
                <p>Chưa có dữ liệu.</p>
                <p className="text-sm text-center max-w-xs">Tải ảnh lên và kích hoạt AI để trích xuất dữ liệu tự động vào hệ thống.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}