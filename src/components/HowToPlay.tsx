"use client";

import { useRef, useState } from "react";
import { CATEGORY_META, withAlpha } from "@/lib/categories";
import { DiscIcon } from "./Disc";
import { Icon } from "./Icon";

const PAGES = [
  {
    title: "置く → 質問が開く",
    lines: ["オセロと同じように、置ける場所に石を置こう。", "置いたマスの質問カードが開くよ。"],
    figure: <FigurePlace />,
  },
  {
    title: "答えたら返せる",
    lines: ["質問に答えられたら、相手の石をひっくり返せる。", "答えられないと石は置けずに、相手の番になるよ。"],
    figure: <FigureAnswer />,
  },
  {
    title: "外側ほど深い質問",
    lines: ["盤の外側ほど質問が深くなる。角は“とっておき”。", "勝った人は、相手にひとつだけ何でも質問できるよ。"],
    figure: <FigureDepth />,
  },
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  const goTo = (i: number) => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col">
      <header className="flex h-14 items-center px-2">
        <button type="button" aria-label="閉じる" className="flex h-12 w-12 items-center justify-center" onClick={onClose}>
          <Icon name="close" />
        </button>
        <h1 className="flex-1 pr-12 text-center text-body font-bold">あそびかた</h1>
      </header>
      <div
        ref={scroller}
        className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          setPage(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {PAGES.map((p, i) => (
          <section key={i} className="flex w-full shrink-0 snap-center flex-col items-center justify-center gap-8 px-6">
            <div className="flex h-56 items-center justify-center">{p.figure}</div>
            <h2 className="text-[22px] font-bold">
              {i + 1}. {p.title}
            </h2>
            <div className="text-center text-body text-white/85">
              {p.lines.map((l) => (
                <p key={l}>{l}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="flex justify-center gap-2 pb-8 pt-4">
        {PAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}ページ目`}
            className="flex h-12 w-12 items-center justify-center"
            onClick={() => goTo(i)}
          >
            <span className={`block h-2.5 w-2.5 rounded-full ${page === i ? "bg-gold" : "bg-line"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

const cell = "relative flex h-12 w-12 items-center justify-center";

function FigurePlace() {
  const c = CATEGORY_META.HOBBY;
  return (
    <div className="flex items-center gap-4">
      <div className="grid grid-cols-3 gap-px bg-line p-px">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className={cell} style={{ backgroundColor: i === 5 ? withAlpha(c.color, 0.35) : "#1E2430", boxShadow: i === 5 ? "inset 0 0 0 3px #C99A1C" : undefined }}>
            {i === 3 && <DiscIcon player="BLACK" size={36} />}
            {i === 4 && <DiscIcon player="WHITE" size={36} />}
            {i === 5 && <span className="block h-9 w-9 rounded-full bg-[#111] opacity-50" />}
          </div>
        ))}
      </div>
      <span className="text-[28px]">→</span>
      <div className="w-28 overflow-hidden rounded-xl bg-card shadow-xl">
        <div className="flex items-center gap-1 px-2 py-1 text-note font-bold" style={{ backgroundColor: c.color }}>
          <Icon name={c.icon} size={14} /> {c.label}
        </div>
        <p className="p-2 text-center text-note font-bold">最近ハマっているものは？</p>
      </div>
    </div>
  );
}

function FigureAnswer() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="w-28 rounded-xl bg-gold py-2 text-center text-note font-bold">答えた！</span>
        <span>→</span>
        <DiscIcon player="BLACK" size={28} />
        <DiscIcon player="BLACK" size={28} />
        <DiscIcon player="BLACK" size={28} />
      </div>
      <div className="flex items-center gap-3">
        <span className="w-28 rounded-xl border-2 border-line py-1.5 text-center text-note font-bold">答えられなかった</span>
        <span>→</span>
        <DiscIcon player="BLACK" size={28} />
        <span className="flex h-7 w-7 items-center justify-center rounded" style={{ backgroundColor: withAlpha(CATEGORY_META.IF.color, 0.6) }}>
          <Icon name="chat_bubble" size={16} className="text-white/60" />
        </span>
        <DiscIcon player="WHITE" size={28} />
      </div>
    </div>
  );
}

function FigureDepth() {
  const color = (r: number, c: number) => {
    const edgeR = r === 0 || r === 4;
    const edgeC = c === 0 || c === 4;
    if (edgeR && edgeC) return withAlpha(CATEGORY_META.YOU.color, 0.8);
    if (edgeR || edgeC) return withAlpha(CATEGORY_META.VALUES.color, 0.55);
    return withAlpha(CATEGORY_META.HOBBY.color, 0.35);
  };
  const label = (r: number, c: number) => {
    const edgeR = r === 0 || r === 4;
    const edgeC = c === 0 || c === 4;
    if (edgeR && edgeC) return "★★";
    if (edgeR || edgeC) return "★";
    return "";
  };
  return (
    <div className="grid grid-cols-5 gap-px bg-line p-px">
      {Array.from({ length: 25 }, (_, i) => {
        const r = Math.floor(i / 5);
        const c = i % 5;
        return (
          <div key={i} className="flex h-10 w-10 items-center justify-center text-[10px] text-[#FFE08C]" style={{ backgroundColor: color(r, c) }}>
            {label(r, c)}
          </div>
        );
      })}
    </div>
  );
}
