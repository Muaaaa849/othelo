// サーバー専用。ブラウザから import しないこと（APIキーを扱う）
import { REGENERATE_THRESHOLD, fillFromBank, validateRaw } from "@/engine/validateQuestions";
import type { Mode, Question, Rng } from "@/engine/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { BANK } from "./questionBank";

/** AI呼び出しを隠す型。他社のLLMに差し替えられるようにする */
export type QuestionGenerator = (system: string, user: string, signal: AbortSignal) => Promise<string>;

export const MAX_ATTEMPTS = 3;
export const SERVER_TIMEOUT_MS = 25_000;
export const DEFAULT_MODEL = "claude-haiku-4-5";

export function anthropicGenerator(apiKey: string, model: string): QuestionGenerator {
  return async (system, user, signal) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        temperature: 1.0,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal,
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  };
}

/** 生成→検証→再生成（最大3回）→内蔵バンクで補充。必ず60問を返す。 */
export async function generateQuestions(
  mode: Mode,
  avoid: readonly string[],
  generator: QuestionGenerator | null,
  rng: Rng = Math.random,
  timeoutMs = SERVER_TIMEOUT_MS,
): Promise<{ questions: Question[]; source: "ai" | "bank" }> {
  let best: Question[] = [];
  if (generator) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const user = buildUserPrompt(mode, avoid);
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        let raw: string;
        try {
          raw = await generator(SYSTEM_PROMPT, user, controller.signal);
        } catch (e) {
          if (controller.signal.aborted) break;
          console.error("question generation failed", e);
          continue;
        }
        const result = validateRaw(raw, mode, avoid);
        if (result.questions.length > best.length) best = result.questions;
        if (result.shortage < REGENERATE_THRESHOLD) break;
      }
    } finally {
      clearTimeout(timer);
    }
  }
  return {
    questions: fillFromBank(best, mode, avoid, BANK, rng),
    source: best.length > 0 ? "ai" : "bank",
  };
}
