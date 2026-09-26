"use client";

import { opponent } from "@/engine/types";
import type { GameViewModel } from "@/game/GameContext";
import type { GameState } from "@/game/gameReducer";
import { CATEGORY_META, GOLD } from "@/lib/categories";
import { Button } from "../Button";
import { Icon } from "../Icon";

export function AskScreen({ vm, state, onHome }: { vm: GameViewModel; state: GameState; onHome: () => void }) {
  const p = state.privilege!;
  const ask = state.ask!;
  const { names } = state;
  const asker = p.asker;
  const answerer = opponent(asker);
  const meta = ask.category ? CATEGORY_META[ask.category] : null;
  const bg = meta ? meta.color : GOLD;
  // 向かい合わせでは、答える側（敗者）に文字が正しく見える向きにする（白は上側に座る）
  const rotated = state.seating === "FACING" && answerer === "WHITE";
  const next = p.queue[p.queue.indexOf(asker) + 1];

  return (
    <div className="fixed inset-0 z-10 flex flex-col text-white" style={{ backgroundColor: bg }}>
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 py-8">
        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center" style={{ transform: rotated ? "rotate(180deg)" : undefined }}>
          <p className="text-body font-bold opacity-90">
            {names[asker]}さん → {names[answerer]}さん
          </p>
          {meta && <Icon name={meta.icon} size={40} className="opacity-80" />}
          <p className="text-[28px] font-bold leading-snug" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.25)" }}>
            {ask.text}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {!state.askFinished ? (
            <Button onClick={vm.askDone} style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
              {next ? `次は${names[next]}さんの番` : "おわり"}
            </Button>
          ) : (
            <>
              <Button onClick={vm.rematch} style={{ backgroundColor: "rgba(0,0,0,0.35)" }}>
                もう一回
              </Button>
              <Button variant="outline" onClick={onHome} style={{ borderColor: "rgba(255,255,255,0.6)" }}>
                ホームへ
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
