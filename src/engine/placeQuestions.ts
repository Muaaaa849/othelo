import { SIZE, isInitialCell } from "./board";
import { shuffle } from "./rng";
import type { Depth, Pos, Question, Rng } from "./types";
import { key } from "./types";

export type Zone = "CORNER" | "EDGE" | "INNER";

export function zoneOf(p: Pos): Zone | null {
  if (isInitialCell(p)) return null;
  const rEdge = p.row === 0 || p.row === SIZE - 1;
  const cEdge = p.col === 0 || p.col === SIZE - 1;
  if (rEdge && cEdge) return "CORNER";
  if (rEdge || cEdge) return "EDGE";
  return "INNER";
}

export const ZONE_DEPTH: Record<Zone, Depth> = { CORNER: 3, EDGE: 2, INNER: 1 };

export function zoneCells(zone: Zone): Pos[] {
  const cells: Pos[] = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (zoneOf({ row, col }) === zone) cells.push({ row, col });
    }
  }
  return cells;
}

const MAX_TRIES = 20;

function innerAdjacency(assign: Record<string, Question>): number {
  let n = 0;
  for (const [k, q] of Object.entries(assign)) {
    const [row, col] = k.split(",").map(Number);
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const other = assign[key({ row: row + dr, col: col + dc })];
      if (other && other.category === q.category) n++;
    }
  }
  return n;
}

/** 第4.3節の配置。depth ごとに質問とマスをシャッフルしてペアにする。 */
export function placeQuestions(questions: Question[], rng: Rng): Record<string, Question> {
  const result: Record<string, Question> = {};
  for (const zone of ["CORNER", "EDGE", "INNER"] as Zone[]) {
    const depth = ZONE_DEPTH[zone];
    const qs = questions.filter((q) => q.depth === depth);
    const cells = zoneCells(zone);
    if (qs.length !== cells.length) {
      throw new Error(`depth${depth} の質問数 ${qs.length} がマス数 ${cells.length} と一致しません`);
    }
    const tries = zone === "INNER" ? MAX_TRIES : 1;
    let best: Record<string, Question> | null = null;
    let bestScore = Infinity;
    for (let t = 0; t < tries; t++) {
      const sq = shuffle(qs, rng);
      const sc = shuffle(cells, rng);
      const assign: Record<string, Question> = {};
      sc.forEach((c, i) => (assign[key(c)] = sq[i]));
      const score = zone === "INNER" ? innerAdjacency(assign) : 0;
      if (score < bestScore) {
        best = assign;
        bestScore = score;
      }
      if (bestScore === 0) break;
    }
    Object.assign(result, best);
  }
  return result;
}
