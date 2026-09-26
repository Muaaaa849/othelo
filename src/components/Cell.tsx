"use client";

import { useRef } from "react";
import type { CellQuestion, Disc as DiscT, Player } from "@/engine/types";
import { CATEGORY_META, GOLD, withAlpha } from "@/lib/categories";
import { DISC_COLOR, Disc, FlipDisc, ShrinkDisc } from "./Disc";
import { Icon } from "./Icon";
import { Stars } from "./Stars";

export type CellView = {
  disc: DiscT;
  cq: CellQuestion | undefined;
  legal: boolean;
  selected: boolean;
  willFlip: boolean;
  /** 返るアニメの遅延（ms）。null なら返らない */
  flipDelay: number | null;
  /** 答えられなかった石の縮むアニメ */
  shrinking: boolean;
  /** 仮置き（半透明）の石 */
  ghost: boolean;
  current: Player;
};

const LONG_PRESS_MS = 500;

export function Cell({
  id,
  view,
  onTap,
  onLongPress,
}: {
  id: string;
  view: CellView;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const { disc, cq, legal, selected, willFlip, flipDelay, shrinking, ghost, current } = view;
  const q = cq?.question;
  const meta = q ? CATEGORY_META[q.category] : null;
  const revealed = cq?.status === "REVEALED_UNANSWERED";
  const empty = disc === "EMPTY";
  const fillAlpha = revealed && empty ? 0.6 : 0.35;

  return (
    <div
      data-cell={id}
      className={`relative select-none ${q?.depth === 3 && empty ? "deep-glow" : ""}`}
      style={{
        backgroundColor: meta ? withAlpha(meta.color, fillAlpha) : "#1E2430",
        boxShadow: selected ? `inset 0 0 0 3px ${GOLD}` : undefined,
        WebkitTouchCallout: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={() => {
        longPressed.current = false;
        clear();
        timer.current = setTimeout(() => {
          longPressed.current = true;
          onLongPress();
        }, LONG_PRESS_MS);
      }}
      onPointerUp={clear}
      onPointerLeave={clear}
      onPointerCancel={clear}
      onClick={(e) => {
        e.stopPropagation();
        if (longPressed.current) return;
        onTap();
      }}
    >
      {meta && empty && !ghost && !shrinking && (
        <>
          {legal ? (
            <Icon name={revealed ? "chat_bubble" : meta.icon} size={12} className="absolute left-0.5 top-0.5 text-white/50" />
          ) : (
            <Icon
              name={revealed ? "chat_bubble" : meta.icon}
              size={16}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/50"
            />
          )}
          {q && <Stars depth={q.depth} className="absolute right-0.5 top-0 text-[9px] leading-[12px] text-[#FFE08C]" />}
        </>
      )}

      {legal && empty && !selected && (
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 12, height: 12, backgroundColor: DISC_COLOR[current], opacity: 0.7, border: current === "BLACK" ? "1px solid #555" : undefined }}
        />
      )}

      {!empty && flipDelay === null && <Disc player={disc as Player} />}
      {!empty && flipDelay !== null && (
        <FlipDisc from={disc === "BLACK" ? "WHITE" : "BLACK"} to={disc as Player} delayMs={flipDelay} />
      )}
      {ghost && <Disc player={current} opacity={0.5} />}
      {shrinking && <ShrinkDisc player={current} delayMs={200} />}

      {willFlip && (
        <span className="pointer-events-none absolute inset-[6%] rounded-full" style={{ border: `2px solid ${GOLD}` }} />
      )}
    </div>
  );
}
