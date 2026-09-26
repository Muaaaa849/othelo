import { describe, expect, it } from "vitest";
import bank from "@/data/questions_ja.json";
import { ImportFormatError, exportText, parseImport } from "./importQuestions";
import { MODES } from "./orders";
import { seededRng } from "./rng";
import type { Question } from "./types";
import { questionsFromBank } from "./validateQuestions";

const BANK = bank.questions as Question[];

describe("parseImport", () => {
  it("正しい質問だけを取り込み、不正・重複を数える", () => {
    const text = `外部AIの出力です
\`\`\`json
{"questions":[
  {"category":"HOBBY","depth":1,"text":"新しい質問は?"},
  {"category":"HOBBY","depth":1,"text":"新しい質問は？"},
  {"category":"FOOD","depth":1,"text":"不正カテゴリは？"},
  {"category":"LOVE","depth":2,"text":"${"あ".repeat(41)}？"},
  {"category":"YOU","depth":3,"text":"${BANK[0].text}"}
]}
\`\`\``;
    const r = parseImport(text, BANK);
    expect(r.added).toEqual([{ category: "HOBBY", depth: 1, text: "新しい質問は？" }]);
    expect(r.invalid).toBe(2);
    expect(r.duplicate).toBe(2);
  });

  it("JSONでなければエラー", () => {
    expect(() => parseImport("こんにちは", [])).toThrow(ImportFormatError);
    expect(() => parseImport('{"items":[]}', [])).toThrow(ImportFormatError);
  });

  it("エクスポートした内容をそのままインポートできる", () => {
    const text = exportText(BANK);
    const r = parseImport(text, []);
    expect(r.added).toEqual(BANK);
    expect(r.invalid).toBe(0);
  });
});

describe("インポートした質問の優先", () => {
  it("インポートした質問が内蔵より先に使われ、不足分は内蔵で補う", () => {
    const imported: Question[] = Array.from({ length: 20 }, (_, i) => ({ category: "HOBBY", depth: 1, text: `取り込み${i}？` }));
    const qs = questionsFromBank("FIRST_MEET", [], BANK, seededRng(1), imported);
    expect(qs).toHaveLength(60);
    const hobby1 = qs.filter((q) => q.depth === 1 && q.category === "HOBBY");
    expect(hobby1).toHaveLength(MODES.FIRST_MEET.order[1].HOBBY);
    expect(hobby1.every((q) => q.text.startsWith("取り込み"))).toBe(true);
  });
});
