import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Lấy API Key từ file .env.local
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export default function AiOcrScanner() {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Xử lý khi người dùng chọn ảnh
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedData(null); // Reset data cũ
      setError(null);
    }
  };

  // Hàm gọi Gemini API
  const handleScan = async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Chuyển file ảnh sang Base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      // Prompt yêu cầu trả về JSON
      const prompt = `
        Phân tích hình ảnh thiết bị này và trả về kết quả dưới định dạng JSON nguyên bản (không kèm markdown \`\`\`json):
        {
          "loai_thiet_bi": "Máy ảnh / Ống kính / Bàn mixer...",
          "thuong_hieu": "Tên thương hiệu",
          "model": "Tên model chi tiết",
          "van_ban_nhan_dien_duoc": ["Chữ 1", "Chữ 2"]
        }
      `;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: imageFile.type } }
      ]);

      const responseText = result.response.text();
      
      // Parse JSON từ phản hồi của AI
      const cleanJson = responseText.replace(/```json|```/g, "").trim();
      setExtractedData(JSON.parse(cleanJson));

    } catch (err) {
      console.error("Lỗi quét ảnh:", err);
      setError("Không thể nhận diện hình ảnh lúc này. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-8 text-white p-6 bg-gray-900 min-h-screen">
      {/* Cột trái: Khung tải ảnh lên */}
      <div className="w-1/2 bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h2 className="text-xl font-bold mb-4">AI OCR Scanner</h2>
        
        <div className="mb-4">
          <input type="file" accept="image/*" onChange={handleImageChange} className="mb-4" />
          
          {previewUrl && (
            <div className="relative border-2 border-dashed border-blue-500 rounded-lg p-2 flex justify-center bg-gray-950">
              <img src={previewUrl} alt="Preview" className="max-h-64 object-contain" />
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="w-full h-1 bg-blue-500 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                </div>
              )}
            </div>
          )}
        </div>

        <button 
          onClick={handleScan} 
          disabled={!imageFile || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50"
        >
          {isLoading ? "AI ĐANG TRÍCH XUẤT DỮ LIỆU..." : "Bắt đầu quét"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-900 text-red-200 rounded-lg border border-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Cột phải: Khung hiển thị dữ liệu trích xuất */}
      <div className="w-1/2 bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span>[ ]</span> Dữ liệu trích xuất
        </h3>
        
        <div className="bg-gray-950 p-4 rounded-lg min-h-[300px] font-mono text-sm">
          {!extractedData && !isLoading && (
            <div className="text-gray-500 text-center mt-20">
              <p>Chưa có dữ liệu</p>
              <p className="text-xs mt-2">Tải ảnh lên và kích hoạt AI để trích xuất dữ liệu tự động vào hệ thống</p>
            </div>
          )}
          
          {isLoading && <p className="text-blue-400 animate-pulse">Đang phân tích dữ liệu...</p>}
          
          {extractedData && (
            <pre className="text-green-400 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(extractedData, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}