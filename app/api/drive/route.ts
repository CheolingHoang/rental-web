import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function POST(request: Request) {
  try {
    // Nhận thêm biến 'type' từ Frontend gửi lên
    const { folderLink, type } = await request.json();

    const match = folderLink.match(/[-\w]{25,}/);
    const folderId = match ? match[0] : null;

    if (!folderId) return NextResponse.json({ error: "Link Drive không hợp lệ" }, { status: 400 });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // LỌC THEO LOẠI FOLDER (ẢNH HOẶC VIDEO)
    let mimeFilter = "mimeType contains 'image/'";
    if (type === 'video') {
      mimeFilter = "mimeType contains 'video/'";
    }

    let allFiles: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const response: any = await drive.files.list({
        q: `'${folderId}' in parents and ${mimeFilter} and trashed = false`,
        fields: 'nextPageToken, files(id, name, thumbnailLink, webContentLink)', 
        pageSize: 1000, 
        pageToken: pageToken,
      });

      if (response.data.files && response.data.files.length > 0) {
        allFiles = allFiles.concat(response.data.files);
      }
      pageToken = response.data.nextPageToken; 
    } while (pageToken);

    const photos = allFiles.map((file) => ({
      id: file.id,
      name: file.name,
      // Video thường không có thumbnailLink nét, nên dùng luôn webContentLink
      url: type === 'video' ? file.webContentLink : (file.thumbnailLink?.replace('=s220', '=s800') || file.webContentLink), 
      note: "",
      selected: false
    }));

    return NextResponse.json({ photos });

  } catch (error: any) {
    console.error("Lỗi Google API:", error.message);
    return NextResponse.json({ error: "Lỗi kết nối tới Google Drive" }, { status: 500 });
  }
}