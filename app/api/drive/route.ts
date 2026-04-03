import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    const { folderLink } = await request.json();

    // 1. Tự động bóc tách Folder ID từ cái Link Drive dài loằng ngoằng
    const match = folderLink.match(/[-\w]{25,}/);
    const folderId = match ? match[0] : null;

    if (!folderId) {
      return NextResponse.json({ error: "Link Drive không hợp lệ" }, { status: 400 });
    }

    // 2. Đánh thức con Bot bằng Key bí mật
    // Lưu ý: Replace('\\n') cực kỳ quan trọng vì khi lưu vào .env nó hay bị lỗi định dạng xuống dòng
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 3. Xin Google danh sách ảnh trong Folder đó
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: 'files(id, name, thumbnailLink, webContentLink)', // Xin Google trả về link ảnh
      pageSize: 100, // Lấy tối đa 100 ảnh mỗi lần
    });

    // 4. Biến đổi dữ liệu cho hợp với Giao diện web của Tín
    const photos = response.data.files?.map((file) => ({
      id: file.id,
      name: file.name,
      // Dùng thumbnailLink chỉnh kích thước s=800 (800px) cho ảnh nét căng mà load nhẹ
      url: file.thumbnailLink?.replace('=s220', '=s800') || file.webContentLink, 
      note: "",
      selected: false
    })) || [];

    return NextResponse.json({ photos });

  } catch (error: any) {
    console.error("Lỗi Google API:", error.message);
    return NextResponse.json({ error: "Lỗi kết nối tới Google Drive" }, { status: 500 });
  }
}