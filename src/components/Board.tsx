"use client";

import { useMemo, useRef, useState } from "react";
import { legalMoves } from "@/engine/board";
import type { Pos } from "@/engine/types";
import { key } from "@/engine/types";
import type { GameState } from "@/game/gameReducer";
import { CATEGORY_META, DEPTH_LABEL } from "@/lib/categories";
import { Cell, type CellView } from "./Cell";

/** 返る石の1枚目までの待ち（カードが消える200ms）と間隔 */
export const FLIP_START_MS = 200;
export const FLIP_INTERVAL_MS = 80;
export const FLIP_DURATION_MS = 250;

export function Board({ state, onCellTap }: { state: GameState; onCellTap: (pos: Pos | null) => void }) {
  const [peek, setPeek] = useState<string | null>(null);
  const peekArmed = useRef(false);
  const { board, questions, current, phase, selected, pendingFlips, lastOutcome } = state;

  const legal = useMemo(() => {
    if (phase !== "AWAITING_MOVE" && phase !== "CELL_SELECTED") return new Set<string>();
    return new Set(legalMoves(board, current).map(key));
  }, [board, current, phase]);

  const selectedKey = selected ? key(selected) : null;
  const flipIndex = new Map(pendingFlips.map((p, i) => [key(p), i]));
  const showPreview = phase === "CELL_SELECTED" || phase === "QUESTION_SHOWN";
  const animAnswered = phase === "ANIMATING" && lastOutcome === "ANSWERED";
  const animFailed = phase === "ANIMATING" && lastOutcome === "FAILED";

  const peekText = (() => {
    if (!peek) return null;
    const cq = questions[peek];
    if (!cq) return null;
    const m = CATEGORY_META[cq.question.category];
    if (cq.status === "HIDDEN") {
      return `${m.label}・${DEPTH_LABEL[cq.question.depth]}${cq.question.depth > 1 ? " " + "★".repeat(cq.question.depth - 1) : ""}`;
    }
    return cq.question.text;
  })();

  const onLongPress = (k: string) => {
    if (phase === "QUESTION_SHOWN" || phase === "ANIMATING") return;
    if (!questions[k]) return;
    peekArmed.current = false;
    setPeek(k);
  };

  return (
    <div className="relative mx-auto" style={{ width: "calc(min(100vw, 480px) - 32px)" }}>
      <div className="grid aspect-square w-full grid-cols-8 gap-px bg-line p-px" style={{ touchAction: "manipulation" }}>
        {board.map((row, r) =>
          row.map((disc, c) => {
            const k = `${r},${c}`;
            const fi = flipIndex.get(k);
            const view: CellView = {
              disc,
              cq: questions[k],
              legal: legal.has(k),
              selected: showPreview && selectedKey === k,
              willFlip: showPreview && fi !== undefined,
              flipDelay: animAnswered && fi !== undefined ? FLIP_START_MS + fi * FLIP_INTERVAL_MS : null,
              shrinking: animFailed && selectedKey === k,
              ghost: showPreview && selectedKey === k,
              current,
            };
            return (
              <Cell
                key={k}
                id={k}
                view={view}
                onTap={() => onCellTap({ row: r, col: c })}
                onLongPress={() => onLongPress(k)}
              />
            );
          }),
        )}
      </div>
      {peekText && (
        <div
          className="fixed inset-0 z-30"
          // 長押しを離した時の click で閉じないよう、新しくタッチされてから閉じる
          onPointerDown={() => (peekArmed.current = true)}
          onClick={(e) => {
            e.stopPropagation();
            if (peekArmed.current) setPeek(null);
          }}
        >
          <div className="absolute left-1/2 top-1/3 w-[80%] max-w-[400px] -translate-x-1/2 rounded-2xl border border-line bg-card px-4 py-3 text-center text-body font-bold shadow-2xl">
            {peekText}
          </div>
        </div>
      )}
    </div>
  );
}
