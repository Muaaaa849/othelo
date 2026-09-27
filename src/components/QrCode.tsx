"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

/** 接続コードを QR で表示する（白地・余白付きで読み取りやすく） */
export function QrCode({ text }: { text: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  // 細かいQRなので、カメラで読みやすいよう画面幅いっぱいまで大きくする
  const [size, setSize] = useState(280);
  useEffect(() => setSize(Math.min(window.innerWidth, 480) - 32), []);
  useEffect(() => {
    if (!canvas.current) return;
    QRCode.toCanvas(canvas.current, text, { errorCorrectionLevel: "L", margin: 2, width: size }).catch(() => {});
  }, [text, size]);
  return <canvas ref={canvas} data-qr className="mx-auto rounded-xl bg-white" style={{ width: size, height: size }} />;
}
