import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stamps.",
  description: "駅や記念スタンプを共有、記録、整理できるWebアプリ",
  appleWebApp: {
    title: "Stamps.",
    statusBarStyle: "default",
  },
  icons: {
    apple: [
      { url: "/icon-512-v2.png", sizes: "512x512", type: "image/png" },
    ],
  },
  other: {
    google: "notranslate",
  },
};

export const viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased notranslate`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
