"use client";

import type { Seating } from "@/engine/types";

export function SeatingToggle({ value, onChange }: { value: Seating; onChange: (v: Seating) => void }) {
  const opts: [Seating, string][] = [
    ["SIDE_BY_SIDE", "となり同士"],
    ["FACING", "向かい合わせ"],
  ];
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl bg-bg p-1">
      {opts.map(([v, label]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`h-12 rounded-xl text-body font-bold ${value === v ? "bg-gold text-white" : "text-white/70"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
