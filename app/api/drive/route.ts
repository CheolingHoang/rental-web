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
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 3. VÒNG LẶP VÉT SẠCH ẢNH (FIX LỖI THIẾU ẢNH)
    let allFiles: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const response: any = await drive.files.list({
        q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
        // Phải xin thêm nextPageToken để biết đường lật sang trang sau
        fields: 'nextPageToken, files(id, name, thumbnailLink, webContentLink)', 
        pageSize: 1000, // Kéo max ga 1000 ảnh mỗi lần gọi (Giới hạn cao nhất của Google)
        pageToken: pageToken,
      });

      if (response.data.files && response.data.files.length > 0) {
        allFiles = allFiles.concat(response.data.files);
      }
      
      // Lấy chìa khoá trang tiếp theo (Nếu hết ảnh, cái này sẽ là undefined -> vòng lặp dừng)
      pageToken = response.data.nextPageToken; 
    } while (pageToken);

    // 4. Biến đổi toàn bộ dữ liệu vừa gom được cho hợp với Giao diện web
    const photos = allFiles.map((file) => ({
      id: file.id,
      name: file.name,
      // Dùng thumbnailLink chỉnh kích thước s=800 (800px) cho ảnh nét căng mà load nhẹ
      url: file.thumbnailLink?.replace('=s220', '=s800') || file.webContentLink, 
      note: "",
      selected: false
    }));

    return NextResponse.json({ photos });

  } catch (error: any) {
    console.error("Lỗi Google API:", error.message);
    return NextResponse.json({ error: "Lỗi kết nối tới Google Drive" }, { status: 500 });
  }
}