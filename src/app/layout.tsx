"use client"; // ✅ クライアントコンポーネント

import { Geist, Geist_Mono } from "next/font/google";
import { UserProvider } from "../lib/UserContext"; // UserProvider をインポート
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <UserProvider> {/* ✅ UserProvider を追加 */}

          {children}
        
        </UserProvider> {/* ✅ UserProvider を追加 */}
      </body>
    </html>
  );
}
