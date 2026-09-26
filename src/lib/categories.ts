import type { Category } from "@/engine/types";

export type CategoryMeta = { label: string; color: string; icon: string };

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  HOBBY: { label: "趣味・好き", color: "#2FA85A", icon: "sports_esports" },
  MEMORY: { label: "思い出", color: "#F08C1A", icon: "photo_album" },
  IF: { label: "もしも", color: "#8A5CF0", icon: "auto_awesome" },
  VALUES: { label: "価値観", color: "#2F72E0", icon: "balance" },
  LOVE: { label: "恋愛", color: "#E5484D", icon: "favorite" },
  YOU: { label: "あなたのこと", color: "#C99A1C", icon: "person_heart" },
};

export const DEPTH_LABEL: Record<1 | 2 | 3, string> = { 1: "かるめ", 2: "ふかめ", 3: "とっておき" };

export const GOLD = "#C99A1C";

/** HEX に不透明度を付ける（#RRGGBB → rgba） */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}
