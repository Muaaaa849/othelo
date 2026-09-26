"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { countDiscs } from "@/engine/board";
import { key } from "@/engine/types";
import type { GameViewModel } from "@/game/GameContext";
import type { GameState } from "@/game/gameReducer";
import { playSound, vibrate } from "@/lib/feedback";
import { Board, FLIP_DURATION_MS, FLIP_INTERVAL_MS, FLIP_START_MS } from "../Board";
import { Button } from "../Button";
import { CategoryLegend } from "../CategoryLegend";
import { HowToPlay } from "../HowToPlay";
import { PassNotice } from "../PassNotice";
import { PlayerPanel } from "../PlayerPanel";
import { QuestionCard } from "../QuestionCard";

export const PASS_NOTICE_MS = 2000;
const FAIL_ANIM_MS = 200 + 300;

export function GameScreen({ vm, state, onQuit }: { vm: GameViewModel; state: GameState; onQuit: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [howto, setHowto] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const { phase, current, names, seating, selected, pendingFlips, lastOutcome } = state;
  const facing = seating === "FACING";
  const counts = countDiscs(state.board);

  // アニメ完了 → 手番交代
  useEffect(() => {
    if (phase !== "ANIMATING") return;
    if (lastOutcome === "ANSWERED") {
      const n = pendingFlips.length;
      const total = FLIP_START_MS + Math.max(0, n - 1) * FLIP_INTERVAL_MS + FLIP_DURATION_MS;
      const s = setTimeout(() => playSound("place"), FLIP_START_MS);
      const t = setTimeout(() => {
        vibrate(30);
        vm.onAnimationFinished();
      }, total);
      return () => {
        clearTimeout(s);
        clearTimeout(t);
      };
    }
    const s = setTimeout(() => playSound("fail"), 200);
    const t = setTimeout(vm.onAnimationFinished, FAIL_ANIM_MS);
    return () => {
      clearTimeout(s);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lastOutcome]);

  // パス通知は2秒で自動的に閉じる
  useEffect(() => {
    if (phase !== "PASS_NOTICE") return;
    const t = setTimeout(vm.onPassFinished, PASS_NOTICE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current]);

  const confirmPlace = () => {
    if (selected) {
      const el = document.querySelector(`[data-cell="${key(selected)}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        const x = r.left + r.width / 2 - window.innerWidth / 2;
        const y = r.top + r.height / 2 - window.innerHeight / 2;
        const rot = facing && current === "WHITE";
        setOrigin(rot ? { x: -x, y: -y } : { x, y });
      }
    }
    vm.onConfirmPlace();
  };

  const cq = selected ? state.questions[key(selected)] : undefined;
  const lastFailer = cq && cq.failedBy.length > 0 ? cq.failedBy[cq.failedBy.length - 1] : null;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden" onClick={() => vm.onCellTap(null)}>
      {/* 最上部メニュー（回転しない） */}
      <div className="relative flex h-10 shrink-0 items-center justify-end px-2">
        <button
          type="button"
          aria-label="メニュー"
          className="flex h-12 w-12 items-center justify-center text-[24px] font-bold"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
        >
          ⋮
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
            <div className="absolute right-3 top-11 z-30 w-44 overflow-hidden rounded-2xl bg-card shadow-2xl ring-1 ring-line">
              <button
                type="button"
                className="block h-12 w-full px-4 text-left text-body"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setHowto(true);
                }}
              >
                あそびかた
              </button>
              <button
                type="button"
                className="block h-12 w-full border-t border-line px-4 text-left text-body"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onQuit();
                }}
              >
                ゲームをやめる
              </button>
            </div>
          </>
        )}
      </div>

      <PlayerPanel player="WHITE" name={names.WHITE} count={counts.white} active={current === "WHITE"} rotated={facing} />

      <div className="flex flex-1 flex-col justify-center py-1">
        <Board state={state} onCellTap={vm.onCellTap} />
        <CategoryLegend />
      </div>

      <PlayerPanel player="BLACK" name={names.BLACK} count={counts.black} active={current === "BLACK"} rotated={false} />

      {/* 最下部の操作バー */}
      <div className="shrink-0 px-4 pb-3 pt-1.5" onClick={(e) => e.stopPropagation()}>
        {phase === "CELL_SELECTED" || phase === "QUESTION_SHOWN" ? (
          <Button onClick={confirmPlace} disabled={phase !== "CELL_SELECTED"}>
            ここに置く
          </Button>
        ) : (
          <div className="flex h-14 items-center justify-center text-body text-white/70">
            {phase === "AWAITING_MOVE" ? "置く場所をタップしてね" : ""}
          </div>
        )}
      </div>

      <AnimatePresence>
        {phase === "QUESTION_SHOWN" && cq && (
          <QuestionCard
            key={`card-${key(selected!)}`}
            question={cq.question}
            askedName={names[current]}
            failedName={lastFailer ? names[lastFailer] : null}
            rotated={facing && current === "WHITE"}
            origin={origin}
            onAnswered={vm.onAnswered}
            onCouldNotAnswer={vm.onCouldNotAnswer}
          />
        )}
        {phase === "PASS_NOTICE" && <PassNotice key="pass" name={names[current]} onClose={vm.onPassFinished} />}
      </AnimatePresence>

      {howto && (
        <div className="fixed inset-0 z-50 mx-auto flex max-w-[480px] flex-col bg-bg" onClick={(e) => e.stopPropagation()}>
          <HowToPlay onClose={() => setHowto(false)} />
        </div>
      )}
    </div>
  );
}
