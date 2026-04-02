import { NextResponse } from 'next/server';
// Yêu cầu cài đặt: npm install @google-cloud/vision
import vision from '@google-cloud/vision'; 

const client = new vision.ImageAnnotatorClient();

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();
    
    // Gọi Google Vision API để trích xuất văn bản từ ảnh thiết bị/biên lai
    const [result] = await client.textDetection(imageUrl);
    const detections = result.textAnnotations;
    const extractedText = detections?.[0]?.description || "";

    return NextResponse.json({ success: true, text: extractedText });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi nhận diện OCR" }, { status: 500 });
  }
}