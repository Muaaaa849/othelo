import type { Metadata, Viewport } from "next";
import { APP_TITLE } from "@/constants";
import { GameProvider } from "@/game/GameContext";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: "答えなきゃ、ひっくり返せない。質問に答えて石を返す、2人で遊ぶ会話オセロ。",
  appleWebApp: { capable: true, title: APP_TITLE, statusBarStyle: "black" },
  // iOS 16.3 以前の「ホーム画面に追加」で全画面起動させるため
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#12151C",
};

// Material Symbols は使うアイコンだけに絞って読み込む（アルファベット順）
const ICONS = [
  "auto_awesome",
  "balance",
  "chat_bubble",
  "close",
  "favorite",
  "person_heart",
  "photo_album",
  "screen_rotation",
  "sports_esports",
].join(",");

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap"
        />
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,500,1,0&icon_names=${ICONS}&display=block`}
        />
      </head>
      <body className="font-sans">
        <GameProvider>
          <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col">{children}</div>
        </GameProvider>
        <div className="rotate-overlay fixed inset-0 z-[100] flex-col items-center justify-center gap-4 bg-bg text-center">
          <span className="material-symbols-rounded text-[48px]">screen_rotation</span>
          <p className="text-body font-bold">スマホを縦にしてね</p>
        </div>
      </body>
    </html>
  );
}
