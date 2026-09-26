import { describe, expect, it } from "vitest";
import { AVOID_LIMIT, buildExternalPrompt, orderLines } from "./prompt";

describe("外部AI用プロンプト", () => {
  it("注文表の行は0件を除く", () => {
    const lines = orderLines("FIRST_MEET").split("\n");
    expect(lines[0]).toBe("depth1 / HOBBY: 14問");
    expect(lines.some((l) => l.startsWith("depth1 / LOVE"))).toBe(false);
    expect(lines).toHaveLength(14);
  });

  it("役割・関係・出力形式を含み、避ける質問は最大120件", () => {
    const avoid = Array.from({ length: 150 }, (_, i) => `質問${i}？`);
    const p = buildExternalPrompt("COUPLE", avoid);
    expect(p).toContain("会話ゲーム用の質問を作る専門家");
    expect(p).toContain("恋人・夫婦");
    expect(p).toContain('{"questions":[');
    expect(p).not.toContain("- 質問29？");
    expect(p).toContain("- 質問30？");
    expect(p.match(/^- 質問\d+？$/gm)).toHaveLength(AVOID_LIMIT);
  });

  it("避ける質問がなければ（なし）", () => {
    expect(buildExternalPrompt("FRIENDS", [])).toContain("（なし）");
  });
});
