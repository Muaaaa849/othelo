"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CATEGORIES } from "@/engine/types";
import { CATEGORY_META } from "@/lib/categories";
import { Button } from "../Button";

const HINTS = ["盤の外側ほど、質問が深くなるよ", "角の質問は“とっておき”", "答えられないと、石は置けずに相手の番"];

export function FlippingDiscs({ size = 28 }: { size?: number }) {
  return (
    <div className="flex gap-2" style={{ perspective: 400 }}>
      {CATEGORIES.map((c, i) => (
        <motion.span
          key={c}
          className="block rounded-full"
          style={{ width: size, height: size, backgroundColor: CATEGORY_META[c].color }}
          animate={{ rotateY: [0, 180, 360] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, repeatDelay: 0.6, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function LoadingScreen({
  error,
  onRetry,
  onUseBank,
}: {
  error: boolean;
  onRetry: () => void;
  onUseBank: () => void;
}) {
  const [hint, setHint] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 3000);
    return () => clearInterval(t);
  }, []);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <p className="text-body font-bold">質問を作れませんでした</p>
        <div className="flex w-full flex-col gap-3">
          <Button onClick={onRetry}>もう一度</Button>
          <Button variant="secondary" onClick={onUseBank}>
            内蔵の質問で遊ぶ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4">
      <FlippingDiscs />
      <p className="text-body font-bold">ふたりのための質問を作っています…</p>
      <motion.p
        key={hint}
        className="absolute bottom-16 px-4 text-center text-note text-white/70"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {HINTS[hint]}
      </motion.p>
    </div>
  );
}
