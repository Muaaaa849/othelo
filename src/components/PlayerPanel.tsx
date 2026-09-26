import type { Player } from "@/engine/types";
import { DISC_COLOR, DiscIcon } from "./Disc";

export function PlayerPanel({
  player,
  name,
  count,
  active,
  rotated,
}: {
  player: Player;
  name: string;
  count: number;
  active: boolean;
  rotated: boolean;
}) {
  return (
    <div className="px-4 py-1.5" style={{ transform: rotated ? "rotate(180deg)" : undefined }}>
      <div
        className="flex h-12 items-center gap-3 rounded-2xl bg-board px-3 transition-opacity"
        style={{
          border: `3px solid ${active ? DISC_COLOR[player] : "transparent"}`,
          boxShadow: active && player === "BLACK" ? "0 0 0 1px #555555" : undefined,
          opacity: active ? 1 : 0.5,
        }}
      >
        <DiscIcon player={player} size={24} />
        <span className="min-w-0 flex-1 truncate text-body font-bold">{name}</span>
        {active && (
          <span className="shrink-0 rounded-full bg-gold px-2 py-0.5 text-note font-bold text-white">あなたの番</span>
        )}
        <span className="w-8 shrink-0 text-right text-[20px] font-bold tabular-nums">{count}</span>
      </div>
    </div>
  );
}
