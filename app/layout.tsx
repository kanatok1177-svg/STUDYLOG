import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "勉強銀行 | NextK Lab",
  description: "集中ラボ・勉強銀行・受験スタディをひとつにまとめた、あなただけの勉強帳簿アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Kaisei+Tokumin:wght@400;500;700;800&family=Zen+Maru+Gothic:wght@300;400;500;700;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          // @ts-expect-error CSS変数の直接指定
          "--font-display": "'Kaisei Tokumin', serif",
          "--font-body": "'Zen Maru Gothic', sans-serif",
          "--font-mono": "'JetBrains Mono', monospace",
        }}
        className="font-body"
      >
        {children}
      </body>
    </html>
  );
}
