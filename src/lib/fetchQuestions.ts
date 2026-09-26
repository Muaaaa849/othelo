import { questionsFromBank } from "@/engine/validateQuestions";
import type { Mode, Question } from "@/engine/types";
import { BANK } from "./questionBank";

export const BROWSER_TIMEOUT_MS = 30_000;

/** 自分のサーバーの /api/questions を呼ぶ。通信失敗・タイムアウトは例外。 */
export async function fetchQuestions(mode: Mode, avoid: string[], signal?: AbortSignal): Promise<Question[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BROWSER_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort);
  try {
    const res = await fetch("/api/questions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode, avoid }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = (await res.json()) as { questions?: Question[] };
    if (!Array.isArray(data.questions) || data.questions.length !== 60) throw new Error("invalid response");
    return data.questions;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/** 通信自体が失敗した時用: ブラウザ側で内蔵バンクから60問を作る */
export function localQuestions(mode: Mode, avoid: string[]): Question[] {
  return questionsFromBank(mode, avoid, BANK, Math.random);
}
