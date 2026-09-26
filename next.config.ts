import type { NextConfig } from "next";

// GitHub Pages などのサブパス配信用（例: /othelo）。ルート配信なら空
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // サーバー処理がないので静的サイトとして書き出す（out/）
  output: "export",
  basePath,
  // /setup → /setup/index.html として出力（静的ホスティングで確実に開けるように）
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
