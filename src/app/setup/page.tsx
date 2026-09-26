"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { DiscIcon } from "@/components/Disc";
import { Icon } from "@/components/Icon";
import { SeatingToggle } from "@/components/SeatingToggle";
import { MODE_IDS, MODES } from "@/engine/orders";
import type { Mode, Seating } from "@/engine/types";
import { useGame } from "@/game/GameContext";
import { loadSettings } from "@/lib/storage";

const NAME_MAX = 8;

export default function SetupPage() {
  const router = useRouter();
  const vm = useGame();
  const [names, setNames] = useState<[string, string]>(["プレイヤー1", "プレイヤー2"]);
  const [mode, setMode] = useState<Mode>("FRIENDS");
  const [seating, setSeating] = useState<Seating>("SIDE_BY_SIDE");

  useEffect(() => {
    setSeating(loadSettings().seating);
  }, []);

  const setName = (i: 0 | 1, v: string) => {
    const next: [string, string] = [...names];
    next[i] = [...v].slice(0, NAME_MAX).join("");
    setNames(next);
  };

  const start = () => {
    const black = names[0].trim() || "プレイヤー1";
    const white = names[1].trim() || "プレイヤー2";
    vm.newGame({ BLACK: black, WHITE: white }, mode, seating);
    router.push("/play");
  };

  return (
    <main className="flex min-h-[100dvh] flex-col gap-6 px-4 pb-4">
      <header className="-mx-2 flex h-14 items-center">
        <button type="button" aria-label="閉じる" className="flex h-12 w-12 items-center justify-center" onClick={() => router.push("/")}>
          <Icon name="close" />
        </button>
        <h1 className="flex-1 pr-12 text-center text-body font-bold">ゲーム準備</h1>
      </header>

      <section>
        <h2 className="mb-2 text-body font-bold">プレイヤー名</h2>
        <div className="flex flex-col gap-1">
          <NameInput player="BLACK" value={names[0]} onChange={(v) => setName(0, v)} />
          <div className="flex justify-center">
            <button
              type="button"
              aria-label="先手後手を入れ替える"
              className="flex h-12 w-12 items-center justify-center rounded-full text-[22px]"
              onClick={() => setNames([names[1], names[0]])}
            >
              ⇄
            </button>
          </div>
          <NameInput player="WHITE" value={names[1]} onChange={(v) => setName(1, v)} />
        </div>
        <p className="mt-2 text-note text-white/60">先手（黒）はじゃんけんで決めてね</p>
      </section>

      <section>
        <h2 className="mb-2 text-body font-bold">ふたりの関係</h2>
        <div className="flex flex-col gap-2">
          {MODE_IDS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-2xl bg-board px-4 py-3 text-left ring-2 ${mode === m ? "ring-gold" : "ring-transparent"}`}
            >
              <p className="text-body font-bold">{MODES[m].label}</p>
              <p className="truncate text-note text-white/60">{MODES[m].description}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-body font-bold">座り方</h2>
        <SeatingToggle value={seating} onChange={setSeating} />
      </section>

      <div className="mt-auto">
        <Button onClick={start}>はじめる</Button>
      </div>
    </main>
  );
}

function NameInput({ player, value, onChange }: { player: "BLACK" | "WHITE"; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex h-14 items-center gap-3 rounded-2xl bg-board px-4">
      <DiscIcon player={player} size={24} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={NAME_MAX}
        aria-label={player === "BLACK" ? "先手の名前" : "後手の名前"}
        className="min-w-0 flex-1 bg-transparent text-body outline-none"
      />
    </label>
  );
}
