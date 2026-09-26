import { MODES } from "./orders";
import { shuffle } from "./rng";
import type { Category, Depth, Mode, Question, Rng } from "./types";
import { CATEGORIES, DEPTHS } from "./types";

export const MAX_TEXT_LENGTH = 40;
/** 不足数の合計がこの値以上なら再生成 */
export const REGENERATE_THRESHOLD = 11;

const slot = (depth: Depth, category: Category) => `${depth}/${category}`;

/** 応答テキストから最初の { から最後の } までを取り出してパースする。失敗時は null。 */
export function extractJson(raw: unknown): unknown {
  if (typeof raw !== "string") return raw;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** 1要素を検証して正規化する。満たさなければ null。 */
export function normalizeQuestion(item: unknown): Question | null {
  if (!item || typeof item !== "object") return null;
  const { category, depth, text } = item as Record<string, unknown>;
  if (typeof category !== "string" || !CATEGORIES.includes(category as Category)) return null;
  if (typeof depth !== "number" || !Number.isInteger(depth) || depth < 1 || depth > 3) return null;
  if (typeof text !== "string") return null;
  let t = text.trim();
  if (t.length === 0) return null;
  if (t.endsWith("?")) t = t.slice(0, -1) + "？";
  if (!t.endsWith("？")) return null;
  if ([...t].length > MAX_TEXT_LENGTH) return null;
  return { category: category as Category, depth: depth as Depth, text: t };
}

/** 第8.4節 手順1〜4。注文表に収まる質問と不足数を返す。 */
export function validateRaw(
  raw: unknown,
  mode: Mode,
  avoid: readonly string[],
): { questions: Question[]; shortage: number; parsed: boolean } {
  const order = MODES[mode].order;
  const data = extractJson(raw);
  const items =
    data && typeof data === "object" && Array.isArray((data as { questions?: unknown }).questions)
      ? ((data as { questions: unknown[] }).questions)
      : null;

  const avoidSet = new Set(avoid);
  const seen = new Set<string>();
  const counts = new Map<string, number>();
  const kept: Question[] = [];
  for (const item of items ?? []) {
    const q = normalizeQuestion(item);
    if (!q) continue;
    if (seen.has(q.text) || avoidSet.has(q.text)) continue;
    seen.add(q.text);
    const s = slot(q.depth, q.category);
    const n = counts.get(s) ?? 0;
    if (n >= order[q.depth][q.category]) continue;
    counts.set(s, n + 1);
    kept.push(q);
  }
  return { questions: kept, shortage: 60 - kept.length, parsed: items !== null };
}

/**
 * 第8.4節 手順6。不足分を補充して必ず60問にする。
 * preferred（インポートした質問）を内蔵バンクより優先して使う。
 */
export function fillFromBank(
  kept: Question[],
  mode: Mode,
  avoid: readonly string[],
  bank: readonly Question[],
  rng: Rng,
  preferred: readonly Question[] = [],
): Question[] {
  const order = MODES[mode].order;
  const avoidSet = new Set(avoid);
  const used = new Set(kept.map((q) => q.text));
  const result = [...kept];
  for (const depth of DEPTHS) {
    for (const category of CATEGORIES) {
      let need = order[depth][category] - kept.filter((q) => q.depth === depth && q.category === category).length;
      if (need <= 0) continue;
      const inSlot = (pool: readonly Question[]) => pool.filter((q) => q.depth === depth && q.category === category);
      const fresh = (pool: readonly Question[]) => shuffle(inSlot(pool).filter((q) => !avoidSet.has(q.text)), rng);
      const stale = (pool: readonly Question[]) => shuffle(inSlot(pool).filter((q) => avoidSet.has(q.text)), rng);
      // 直近使用リストにないもの（インポート → 内蔵）を優先。足りなければ使用済みからも補う（必ず60問そろえるため）
      for (const q of [...fresh(preferred), ...fresh(bank), ...stale(preferred), ...stale(bank)]) {
        if (need === 0) break;
        if (used.has(q.text)) continue;
        used.add(q.text);
        result.push({ category: q.category, depth: q.depth, text: q.text });
        need--;
      }
      if (need > 0) throw new Error(`内蔵質問が不足しています: depth${depth}/${category}`);
    }
  }
  return result;
}

export function validateAndFill(
  raw: unknown,
  mode: Mode,
  avoid: readonly string[],
  bank: readonly Question[],
  rng: Rng,
): { questions: Question[]; shortage: number } {
  const { questions, shortage } = validateRaw(raw, mode, avoid);
  return { questions: fillFromBank(questions, mode, avoid, bank, rng), shortage };
}

/** 内蔵バンク（＋インポートした質問）だけで60問を作る */
export function questionsFromBank(
  mode: Mode,
  avoid: readonly string[],
  bank: readonly Question[],
  rng: Rng,
  preferred: readonly Question[] = [],
): Question[] {
  return fillFromBank([], mode, avoid, bank, rng, preferred);
}
