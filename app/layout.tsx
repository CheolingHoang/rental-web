import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // File CSS chứa cấu hình Tailwind

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Velorah Rental System",
  description: "Hệ thống quản lý và cho thuê thiết bị",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}