import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stampsapp.vercel.app"),
  title: "Stamps. - スタンプラリー記録アプリ",
  description: "駅や観光地、限定イベントのスタンプを記録・共有・整理できるスタンプラリーアプリ。訪れた場所を地図とタイムラインで振り返ろう。",
  keywords: ["スタンプラリー", "記念スタンプ", "駅スタンプ", "観光", "御朱印", "スタンプ帳", "コレクション"],
  appleWebApp: {
    title: "Stamps.",
    statusBarStyle: "default",
  },
  icons: {
    apple: [
      { url: "/icon-512-v2.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Stamps. - スタンプラリー記録アプリ",
    description: "駅や観光地、限定イベントのスタンプを記録・共有・整理できるスタンプラリーアプリ。",
    url: "https://stampsapp.vercel.app",
    siteName: "Stamps.",
    images: ["/icon-512-v2.png"],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Stamps. - スタンプラリー記録アプリ",
    description: "駅や観光地、限定イベントのスタンプを記録・共有・整理できるスタンプラリーアプリ。",
    images: ["/icon-512-v2.png"],
  },
  robots: {
    index: true,
    follow: true,
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
      <body className="min-h-full flex flex-col">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HCEPBT9KVB"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-HCEPBT9KVB');`}
        </Script>
        {children}
      </body>
    </html>
  );
}
