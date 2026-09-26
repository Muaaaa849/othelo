import { describe, expect, it } from "vitest";
import bank from "@/data/questions_ja.json";
import { MODE_IDS, MODES } from "./orders";
import { placeQuestions } from "./placeQuestions";
import { seededRng } from "./rng";
import { questionsFromBank } from "./validateQuestions";
import type { Question } from "./types";
import { CATEGORIES, DEPTHS } from "./types";

const BANK = bank.questions as Question[];

describe("orders", () => {
  it.each(MODE_IDS)("%s の注文表は合計60（depth1=32, depth2=24, depth3=4）", (mode) => {
    const o = MODES[mode].order;
    const sum = (d: 1 | 2 | 3) => CATEGORIES.reduce((a, c) => a + o[d][c], 0);
    expect(sum(1)).toBe(32);
    expect(sum(2)).toBe(24);
    expect(sum(3)).toBe(4);
    expect(sum(1) + sum(2) + sum(3)).toBe(60);
  });
});

describe("placeQuestions", () => {
  it.each(MODE_IDS)("%s: 60問を正しいゾーンに配置する", (mode) => {
    const rng = seededRng(42);
    const qs = questionsFromBank(mode, [], BANK, rng);
    const placed = placeQuestions(qs, rng);
    expect(Object.keys(placed)).toHaveLength(60);
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const q = placed[`${row},${col}`];
        const initial = (row === 3 || row === 4) && (col === 3 || col === 4);
        const rEdge = row === 0 || row === 7;
        const cEdge = col === 0 || col === 7;
        if (initial) expect(q).toBeUndefined();
        else if (rEdge && cEdge) expect(q.depth).toBe(3);
        else if (rEdge || cEdge) expect(q.depth).toBe(2);
        else expect(q.depth).toBe(1);
      }
    }
    // 全問が使われている
    expect(new Set(Object.values(placed).map((q) => q.text)).size).toBe(60);
  });

  it("同じシードなら同じ配置になる", () => {
    const qs = questionsFromBank("FRIENDS", [], BANK, seededRng(1));
    expect(placeQuestions(qs, seededRng(7))).toEqual(placeQuestions(qs, seededRng(7)));
  });
});

describe("内蔵質問バンク", () => {
  it("各 (depth, category) に3モードの注文数の最大値の2倍以上ある", () => {
    for (const d of DEPTHS) {
      for (const c of CATEGORIES) {
        const max = Math.max(...MODE_IDS.map((m) => MODES[m].order[d][c]));
        const n = BANK.filter((q) => q.depth === d && q.category === c).length;
        expect(n, `${d}/${c}`).toBeGreaterThanOrEqual(max * 2);
      }
    }
  });
  it("全問が40文字以内で「？」で終わり、重複しない", () => {
    for (const q of BANK) {
      expect([...q.text].length).toBeLessThanOrEqual(40);
      expect(q.text.endsWith("？")).toBe(true);
    }
    expect(new Set(BANK.map((q) => q.text)).size).toBe(BANK.length);
  });
});
