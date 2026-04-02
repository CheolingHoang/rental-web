import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Cấu hình Font chữ Inter (hiện đại, sạch sẽ)
const inter = Inter({ subsets: ["latin"] });

// Thông tin Metadata hiện trên tab trình duyệt và Google
export const metadata: Metadata = {
  title: "Space Vietnam | Management System",
  description: "Hệ thống quản lý thiết bị và khách hàng tối ưu cho sự kiện.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body
        className={`${inter.className} bg-[#050505] text-zinc-300 antialiased selection:bg-indigo-500/30`}
      >
        {/* Nếu Tín có AuthProvider để quản lý Firebase, 
          hãy bọc {children} bên trong nó ở đây.
        */}
        <div className="min-h-screen relative overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
