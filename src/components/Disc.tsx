"use client";

import { motion } from "framer-motion";
import type { Player } from "@/engine/types";

export const DISC_COLOR: Record<Player, string> = { BLACK: "#111111", WHITE: "#F5F5F5" };
const borderOf = (p: Player) => (p === "BLACK" ? "1px solid #555555" : "1px solid #F5F5F5");

const discBase = "absolute inset-[11%] rounded-full";

export function Disc({ player, opacity = 1 }: { player: Player; opacity?: number }) {
  return <div className={discBase} style={{ backgroundColor: DISC_COLOR[player], border: borderOf(player), opacity }} />;
}

/** 返る石: Y軸回転で裏返す（250ms） */
export function FlipDisc({ from, to, delayMs }: { from: Player; to: Player; delayMs: number }) {
  return (
    <motion.div
      className={discBase}
      initial={{ rotateY: 0, backgroundColor: DISC_COLOR[from], border: borderOf(from) }}
      animate={{
        rotateY: [0, 90, 0],
        backgroundColor: [DISC_COLOR[from], DISC_COLOR[from], DISC_COLOR[to], DISC_COLOR[to]],
        border: [borderOf(from), borderOf(from), borderOf(to), borderOf(to)],
      }}
      transition={{
        delay: delayMs / 1000,
        duration: 0.25,
        rotateY: { delay: delayMs / 1000, duration: 0.25, times: [0, 0.5, 1] },
        backgroundColor: { delay: delayMs / 1000, duration: 0.25, times: [0, 0.5, 0.51, 1] },
        border: { delay: delayMs / 1000, duration: 0.25, times: [0, 0.5, 0.51, 1] },
      }}
    />
  );
}

/** 答えられなかった時: 半透明の石が縮んで消える（300ms） */
export function ShrinkDisc({ player, delayMs }: { player: Player; delayMs: number }) {
  return (
    <motion.div
      className={discBase}
      style={{ backgroundColor: DISC_COLOR[player], border: borderOf(player) }}
      initial={{ scale: 1, opacity: 0.5 }}
      animate={{ scale: 0, opacity: 0 }}
      transition={{ delay: delayMs / 1000, duration: 0.3 }}
    />
  );
}

/** 画面表示用の小さい石アイコン */
export function DiscIcon({ player, size = 20 }: { player: Player; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{ width: size, height: size, backgroundColor: DISC_COLOR[player], border: borderOf(player) }}
    />
  );
}
