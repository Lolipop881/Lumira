import type { Metadata } from "next";
import "./globals.css";
import "./lumira.css";
import Pwa from "./pwa";

export const metadata: Metadata = {
  title: "Lumira | เครื่องมือวิทยาศาสตร์",
  description: "นับโคโลนี คำนวณเตรียมสาร และบันทึกผลในพื้นที่ทำงานเดียว",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased"><Pwa/>{children}</body>
    </html>
  );
}
