import { extractJson, normalizeQuestion } from "./validateQuestions";
import type { Question } from "./types";

export type ImportResult = {
  /** 新しく取り込める質問 */
  added: Question[];
  /** 形式に合わず捨てた件数 */
  invalid: number;
  /** 既存の質問やファイル内で重複して捨てた件数 */
  duplicate: number;
};

export class ImportFormatError extends Error {}

/**
 * インポート用テキスト（.txt の中身）を読む。
 * 形式は {"questions":[{"category","depth","text"}]}。前後の文章やコードブロック記号があってもよい。
 * 各要素は第8.4節と同じ基準で検証する（カテゴリ・深さ・40文字以内・末尾「？」）。
 */
export function parseImport(text: string, existing: readonly Question[]): ImportResult {
  const data = extractJson(text);
  const items =
    data && typeof data === "object" && Array.isArray((data as { questions?: unknown }).questions)
      ? (data as { questions: unknown[] }).questions
      : null;
  if (!items) throw new ImportFormatError('{"questions":[...]} の形式のJSONが見つかりません');

  const seen = new Set(existing.map((q) => q.text));
  const added: Question[] = [];
  let invalid = 0;
  let duplicate = 0;
  for (const item of items) {
    const q = normalizeQuestion(item);
    if (!q) {
      invalid++;
    } else if (seen.has(q.text)) {
      duplicate++;
    } else {
      seen.add(q.text);
      added.push(q);
    }
  }
  return { added, invalid, duplicate };
}

/** エクスポート用テキスト（インポートと同じ形式） */
export function exportText(questions: readonly Question[]): string {
  const lines = questions.map((q) => "  " + JSON.stringify({ category: q.category, depth: q.depth, text: q.text }));
  return `{"questions":[\n${lines.join(",\n")}\n]}\n`;
}
