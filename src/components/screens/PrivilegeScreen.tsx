"use client";

import { useState } from "react";
import type { Category, PrivilegeItem } from "@/engine/types";
import { CATEGORIES, opponent } from "@/engine/types";
import type { GameViewModel } from "@/game/GameContext";
import type { GameState } from "@/game/gameReducer";
import { CATEGORY_META } from "@/lib/categories";
import { localQuestions } from "@/lib/localQuestions";
import { loadRecent } from "@/lib/storage";
import { Button } from "../Button";
import { CategoryChip } from "../CategoryChip";
import { Icon } from "../Icon";
import { Stars } from "../Stars";

export const CUSTOM_MAX = 60;

export function PrivilegeScreen({ vm, state }: { vm: GameViewModel; state: GameState }) {
  const p = state.privilege!;
  const { names } = state;
  const asker = p.asker;
  const target = opponent(asker);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  const reroll = () => {
    if (p.rerollUsed) return;
    if (!window.confirm("今の一覧は消えて、新しい質問が並びます。リロールは1回だけです。")) return;
    const current = Object.values(state.questions).map((cq) => cq.question.text);
    const avoid = [...loadRecent().filter((t) => !current.includes(t)), ...current];
    vm.rerolled(localQuestions(state.mode, avoid));
  };

  const groups = CATEGORIES.map((c) => ({
    category: c,
    items: p.items.map((item, index) => ({ item, index })).filter(({ item }) => item.question.category === c),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="flex items-start gap-3 px-4 pb-3 pt-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[22px] font-bold">{names[asker]}さんの特権</h1>
          <p className="text-note text-white/70">{names[target]}さんに、ひとつだけ何でも質問できます</p>
        </div>
        <button
          type="button"
          disabled={p.rerollUsed}
          onClick={reroll}
          className="h-12 shrink-0 rounded-2xl border-2 border-line px-3 text-note font-bold disabled:opacity-40"
        >
          {p.rerollUsed ? "リロール済み" : "リロール（1回）"}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <>
            {groups.length === 0 && (
              <p className="py-6 text-center text-note text-white/60">開示された質問はありません</p>
            )}
            {groups.map((g) => (
              <section key={g.category} className="mb-4">
                <div className="mb-2">
                  <CategoryChip category={g.category} count={g.items.length} />
                </div>
                <ul className="flex flex-col gap-2">
                  {g.items.map(({ item, index }) => (
                    <Row
                      key={index}
                      item={item}
                      names={names}
                      selected={p.selectedIndex === index}
                      onSelect={() => vm.selectPrivilege(index)}
                    />
                  ))}
                </ul>
              </section>
            ))}
            <button
              type="button"
              className="flex min-h-14 w-full items-center gap-2 rounded-2xl border-2 border-dashed border-line px-4 py-3 text-left text-body font-bold"
              onClick={() => setCustomOpen(true)}
            >
              <span className="text-gold">＋</span> 自分で質問を考える
            </button>
        </>
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2">
        <Button disabled={p.selectedIndex === null} onClick={vm.askSelected}>
          この質問にする
        </Button>
      </div>

      {customOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60" onClick={() => setCustomOpen(false)}>
          <div className="w-[90%] max-w-[432px] rounded-3xl bg-card p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center">
              <h2 className="flex-1 text-body font-bold">自分で質問を考える</h2>
              <button type="button" aria-label="閉じる" className="flex h-12 w-12 items-center justify-center" onClick={() => setCustomOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <textarea
              autoFocus
              maxLength={CUSTOM_MAX}
              rows={3}
              value={customText}
              onChange={(e) => setCustomText(e.target.value.slice(0, CUSTOM_MAX))}
              className="w-full resize-none rounded-xl bg-bg p-3 text-body outline-none ring-1 ring-line focus:ring-gold"
            />
            <p className="mb-3 text-right text-note text-white/60">
              {[...customText].length}/{CUSTOM_MAX}
            </p>
            <Button disabled={customText.trim().length === 0} onClick={() => vm.askCustom(customText)}>
              この質問にする
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  item,
  names,
  selected,
  onSelect,
}: {
  item: PrivilegeItem;
  names: GameState["names"];
  selected: boolean;
  onSelect: () => void;
}) {
  const color = CATEGORY_META[item.question.category as Category].color;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-h-14 w-full flex-col gap-1 rounded-2xl bg-board px-4 py-3 text-left"
        style={{ boxShadow: selected ? `inset 0 0 0 3px ${color}` : undefined }}
      >
        <span className="text-body font-bold">{item.question.text}</span>
        <span className="flex items-center gap-2 text-note text-white/70">
          <Stars depth={item.question.depth} className="text-[#FFE08C]" />
          {item.status === "ANSWERED" && item.by && (
            <span className="rounded-full bg-white/10 px-2 py-0.5">{names[item.by]}が答えた</span>
          )}
          {item.status === "REVEALED_UNANSWERED" && (
            <span className="rounded-full px-2 py-0.5 text-white" style={{ backgroundColor: color }}>
              答えられなかった
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
