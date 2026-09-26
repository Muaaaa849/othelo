import { describe, expect, it, vi } from "vitest";
import { seededRng } from "@/engine/rng";
import { generateQuestions } from "./generateQuestions";
import { BANK } from "./questionBank";
import { orderLines } from "./prompt";

describe("generateQuestions", () => {
  it("生成器なし（APIキー未設定）でも内蔵バンクで60問", async () => {
    const r = await generateQuestions("FIRST_MEET", [], null, seededRng(1));
    expect(r.source).toBe("bank");
    expect(r.questions).toHaveLength(60);
  });

  it("不足が11以上なら再生成し、最大3回で打ち切って補充する", async () => {
    const gen = vi.fn().mockResolvedValue('{"questions":[]}');
    const r = await generateQuestions("FRIENDS", [], gen, seededRng(2));
    expect(gen).toHaveBeenCalledTimes(3);
    expect(r.questions).toHaveLength(60);
  });

  it("十分な応答なら1回で終わる", async () => {
    // 内蔵バンクから FRIENDS の注文どおりの60問を AI の応答として返す
    const { questionsFromBank } = await import("@/engine/validateQuestions");
    const qs = questionsFromBank("FRIENDS", [], BANK, seededRng(3));
    const gen = vi.fn().mockResolvedValue("```json\n" + JSON.stringify({ questions: qs }) + "\n```");
    const r = await generateQuestions("FRIENDS", [], gen, seededRng(4));
    expect(gen).toHaveBeenCalledTimes(1);
    expect(r.source).toBe("ai");
    expect(r.questions.map((q) => q.text).sort()).toEqual(qs.map((q) => q.text).sort());
  });

  it("例外が出ても60問を返す", async () => {
    const gen = vi.fn().mockRejectedValue(new Error("boom"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await generateQuestions("COUPLE", [], gen, seededRng(5));
    spy.mockRestore();
    expect(r.questions).toHaveLength(60);
  });
});

describe("prompt", () => {
  it("注文表の行は0件を除く", () => {
    const lines = orderLines("FIRST_MEET").split("\n");
    expect(lines[0]).toBe("depth1 / HOBBY: 14問");
    expect(lines.some((l) => l.includes("LOVE") && l.startsWith("depth1"))).toBe(false);
    expect(lines).toHaveLength(6 + 6 + 3 - 1);
  });
});
