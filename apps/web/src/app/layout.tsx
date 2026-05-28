import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Lieng — Game bài Việt Nam",
  description: "Chơi Lieng trực tuyến với bạn bè — không cần tải, không cần đăng ký",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster position="top-center" toastOptions={{
          style: { background: "#21262d", color: "#f0f6fc", border: "1px solid #2d333b", fontSize: "13px" },
        }} />
      </body>
    </html>
  );
}
