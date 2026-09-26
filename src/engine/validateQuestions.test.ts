import { describe, expect, it } from "vitest";
import bank from "@/data/questions_ja.json";
import { MODES } from "./orders";
import { seededRng } from "./rng";
import { extractJson, validateAndFill, validateRaw } from "./validateQuestions";
import type { Question } from "./types";
import { CATEGORIES, DEPTHS } from "./types";

const BANK = bank.questions as Question[];

function countBySlot(qs: Question[]) {
  const m = new Map<string, number>();
  for (const q of qs) m.set(`${q.depth}/${q.category}`, (m.get(`${q.depth}/${q.category}`) ?? 0) + 1);
  return m;
}

describe("extractJson", () => {
  it("コードブロック記号や前後の文章があってもパースできる", () => {
    const raw = 'はい、どうぞ。\n```json\n{"questions":[{"category":"HOBBY","depth":1,"text":"好きな色は？"}]}\n```';
    expect(extractJson(raw)).toEqual({ questions: [{ category: "HOBBY", depth: 1, text: "好きな色は？" }] });
  });
  it("パース失敗は null", () => {
    expect(extractJson("{ broken")).toBeNull();
    expect(extractJson("no json")).toBeNull();
  });
});

describe("validateRaw", () => {
  it("41文字の質問・不正カテゴリ・重複・超過分がすべて捨てられる", () => {
    const q40 = "あ".repeat(39) + "？";
    const q41 = "い".repeat(40) + "？";
    const raw = {
      questions: [
        { category: "HOBBY", depth: 1, text: q40 }, // OK（40文字）
        { category: "HOBBY", depth: 1, text: q41 }, // 41文字 → 捨てる
        { category: "FOOD", depth: 1, text: "好きな料理は？" }, // 不正カテゴリ
        { category: "HOBBY", depth: 4, text: "深すぎる質問は？" }, // 不正 depth
        { category: "HOBBY", depth: 1.5, text: "小数の質問は？" }, // 非整数
        { category: "HOBBY", depth: 1, text: q40 }, // 重複
        { category: "HOBBY", depth: 1, text: "" }, // 空
        { category: "HOBBY", depth: 1, text: "句点で終わる。" }, // ？で終わらない
        { category: "HOBBY", depth: 1, text: "半角で終わる?" }, // ？に置き換えて OK
        { category: "HOBBY", depth: 1, text: "避けるべき質問？" }, // avoid と一致
        // FIRST_MEET の depth3/HOBBY は0件 → 超過
        { category: "HOBBY", depth: 3, text: "とっておきの趣味は？" },
        // FIRST_MEET の depth3/VALUES は1件 → 2件目は超過
        { category: "VALUES", depth: 3, text: "価値観その1は？" },
        { category: "VALUES", depth: 3, text: "価値観その2は？" },
      ],
    };
    const { questions, shortage } = validateRaw(raw, "FIRST_MEET", ["避けるべき質問？"]);
    expect(questions.map((q) => q.text)).toEqual([q40, "半角で終わる？", "価値観その1は？"]);
    expect(shortage).toBe(57);
  });

  it("文字列の応答も扱える", () => {
    const { questions } = validateRaw('{"questions":[{"category":"YOU","depth":1,"text":"相手の第一印象は？"}]}', "FRIENDS", []);
    expect(questions).toHaveLength(1);
  });

  it("パース失敗は不足60", () => {
    expect(validateRaw("oops", "FRIENDS", []).shortage).toBe(60);
  });
});

describe("validateAndFill", () => {
  it("不足分を内蔵バンクで補って注文表どおり60問にする", () => {
    const raw = { questions: [{ category: "HOBBY", depth: 1, text: "オリジナルの質問は？" }] };
    const { questions, shortage } = validateAndFill(raw, "COUPLE", [], BANK, seededRng(3));
    expect(shortage).toBe(59);
    expect(questions).toHaveLength(60);
    expect(questions.some((q) => q.text === "オリジナルの質問は？")).toBe(true);
    const counts = countBySlot(questions);
    for (const d of DEPTHS) for (const c of CATEGORIES) {
      expect(counts.get(`${d}/${c}`) ?? 0).toBe(MODES.COUPLE.order[d][c]);
    }
    expect(new Set(questions.map((q) => q.text)).size).toBe(60);
  });

  it("直近使用リストにある質問は補充に使わない", () => {
    const first = validateAndFill(null, "FRIENDS", [], BANK, seededRng(10)).questions;
    const avoid = first.map((q) => q.text);
    const second = validateAndFill(null, "FRIENDS", avoid, BANK, seededRng(11)).questions;
    expect(second.filter((q) => avoid.includes(q.text))).toEqual([]);
  });

  it("3回連続でも同じ質問が出ない（直近120件を避ける）", () => {
    for (const mode of ["FIRST_MEET", "FRIENDS", "COUPLE"] as const) {
      const recent: string[] = [];
      for (let i = 0; i < 3; i++) {
        const qs = validateAndFill(null, mode, recent.slice(-120), BANK, seededRng(i)).questions;
        expect(qs.filter((q) => recent.includes(q.text))).toEqual([]);
        recent.push(...qs.map((q) => q.text));
      }
    }
  });
});
