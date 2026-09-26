"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { APP_CATCH, APP_TITLE } from "@/constants";
import { CATEGORIES } from "@/engine/types";
import { CATEGORY_META } from "@/lib/categories";

const linkBtn = "flex h-14 w-full items-center justify-center rounded-2xl text-body font-bold";

export default function HomePage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden px-4">
      {/* 背景: 6色のカテゴリ石がゆっくり裏返る */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ perspective: 600 }}>
        {CATEGORIES.map((c, i) => (
          <motion.span
            key={c}
            className="absolute block rounded-full opacity-25"
            style={{
              width: 56,
              height: 56,
              backgroundColor: CATEGORY_META[c].color,
              left: `${[8, 72, 18, 80, 40, 60][i]}%`,
              top: `${[10, 16, 70, 64, 84, 6][i]}%`,
            }}
            animate={{ rotateY: [0, 180, 360] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, repeatDelay: 1.5, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-[44px] font-bold tracking-wide">{APP_TITLE}</h1>
        <p className="text-body text-white/80">{APP_CATCH}</p>
      </div>

      <nav className="relative flex flex-col gap-3 pb-10">
        <Link href="/setup" className={`${linkBtn} bg-gold text-white`}>
          あそぶ
        </Link>
        <Link href="/howto" className={`${linkBtn} bg-board`}>
          あそびかた
        </Link>
        <Link href="/settings" className={`${linkBtn} border-2 border-line`}>
          設定
        </Link>
      </nav>
    </main>
  );
}
