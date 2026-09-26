"use client";

import { countDiscs } from "@/engine/board";
import type { Player } from "@/engine/types";
import type { GameViewModel } from "@/game/GameContext";
import type { GameState } from "@/game/gameReducer";
import { gameStats, winnerOf } from "@/game/gameReducer";
import { Button } from "../Button";
import { CategoryChip } from "../CategoryChip";
import { DISC_COLOR, DiscIcon } from "../Disc";

export function ResultScreen({ vm, state, onHome }: { vm: GameViewModel; state: GameState; onHome: () => void }) {
  const { black, white } = countDiscs(state.board);
  const winner = winnerOf(state.board);
  const { names } = state;
  const stats = gameStats(state.questions);
  const total = black + white || 1;

  return (
    <div className="flex min-h-[100dvh] flex-col gap-6 px-4 py-8">
      <h1 className="text-center text-[28px] font-bold leading-snug">
        {winner ? `${names[winner]}さんの勝ち！` : "引き分け！ふたりとも質問できます"}
      </h1>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-body font-bold">
          <span className="flex items-center gap-2">
            <DiscIcon player="BLACK" /> {names.BLACK}
          </span>
          <span className="flex items-center gap-2">
            {names.WHITE} <DiscIcon player="WHITE" />
          </span>
        </div>
        <div className="flex h-10 overflow-hidden rounded-xl ring-1 ring-line">
          <div
            className="flex items-center pl-3 text-[20px] font-bold text-white"
            style={{ width: `${(black / total) * 100}%`, backgroundColor: DISC_COLOR.BLACK, minWidth: 40 }}
          >
            {black}
          </div>
          <div
            className="flex flex-1 items-center justify-end pr-3 text-[20px] font-bold text-[#111]"
            style={{ backgroundColor: DISC_COLOR.WHITE, minWidth: 40 }}
          >
            {white}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-board p-4">
        <h2 className="mb-3 text-body font-bold">ふりかえり</h2>
        <table className="w-full text-body">
          <thead>
            <tr className="text-note text-white/70">
              <th className="text-left font-normal" />
              <th className="font-normal">答えた数</th>
              <th className="font-normal">答えられなかった数</th>
            </tr>
          </thead>
          <tbody>
            {(["BLACK", "WHITE"] as Player[]).map((p) => (
              <tr key={p}>
                <td className="py-1">
                  <span className="flex items-center gap-2 font-bold">
                    <DiscIcon player={p} size={16} />
                    <span className="max-w-[7em] truncate">{names[p]}</span>
                  </span>
                </td>
                <td className="text-center tabular-nums">{stats.answered[p]}</td>
                <td className="text-center tabular-nums">{stats.failed[p]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {stats.topCategory && (
          <div className="mt-3 flex items-center gap-2 text-note text-white/70">
            最も多く出たカテゴリ
            <CategoryChip category={stats.topCategory} />
          </div>
        )}
        {!stats.topCategory && <p className="mt-3 text-note text-white/50">開示された質問はありませんでした</p>}
      </section>

      <div className="mt-auto flex flex-col gap-3">
        <Button onClick={vm.startPrivilege}>
          {winner ? "質問する権利を使う" : `${names.BLACK}さん（先手）から質問する`}
        </Button>
        <Button variant="secondary" onClick={vm.rematch}>
          もう一回
        </Button>
        <Button variant="outline" onClick={onHome}>
          ホームへ
        </Button>
      </div>
    </div>
  );
}

