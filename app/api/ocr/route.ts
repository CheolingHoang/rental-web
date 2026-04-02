import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Sử dụng API Key đã cài trên Vercel
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();
    
    // Sử dụng model mới nhất (như Tín đã fix lỗi 404 trước đó)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Trích xuất thông tin từ ảnh này (thiết bị hoặc CCCD) và trả về định dạng JSON nguyên bản, không kèm giải thích hay markdown.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.split(',')[1], // Lấy phần base64 sạch
          mimeType: "image/jpeg"
        }
      }
    ]);

    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json|```/g, "").trim();

    return NextResponse.json(JSON.parse(cleanJson));

  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "Lỗi xử lý AI: " + error.message }, { status: 500 });
  }
}