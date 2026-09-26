import { describe, expect, it } from "vitest";
import { applyMove, countDiscs, flipsFor, initialBoard, isGameOver, legalMoves } from "./board";
import type { Disc, Pos } from "./types";
import { key } from "./types";

const empty = (): Disc[][] => Array.from({ length: 8 }, () => Array<Disc>(8).fill("EMPTY"));
const keys = (ps: Pos[]) => ps.map(key).sort();

describe("legalMoves", () => {
  it("初期配置で黒の合法手は (2,3)(3,2)(4,5)(5,4) の4つ", () => {
    expect(keys(legalMoves(initialBoard(), "BLACK"))).toEqual(
      keys([{ row: 2, col: 3 }, { row: 3, col: 2 }, { row: 4, col: 5 }, { row: 5, col: 4 }]),
    );
  });
});

describe("flipsFor", () => {
  // 中央 (4,4) に黒を置き、各方向に 白→黒 を並べて1枚ずつ返ることを確認
  const dirs: [string, number, number][] = [
    ["上", -1, 0], ["下", 1, 0], ["左", 0, -1], ["右", 0, 1],
    ["左上", -1, -1], ["右上", -1, 1], ["左下", 1, -1], ["右下", 1, 1],
  ];
  for (const [name, dr, dc] of dirs) {
    it(`${name}方向に挟める`, () => {
      const b = empty();
      b[4 + dr][4 + dc] = "WHITE";
      b[4 + 2 * dr][4 + 2 * dc] = "WHITE";
      b[4 + 3 * dr][4 + 3 * dc] = "BLACK";
      expect(keys(flipsFor(b, "BLACK", { row: 4, col: 4 }))).toEqual(
        keys([{ row: 4 + dr, col: 4 + dc }, { row: 4 + 2 * dr, col: 4 + 2 * dc }]),
      );
    });
  }

  it("端まで相手の石で自分の石がなければ返らない", () => {
    const b = empty();
    b[0][1] = "WHITE";
    expect(flipsFor(b, "BLACK", { row: 0, col: 0 })).toEqual([]);
  });

  it("複数方向を同時に返す", () => {
    const b = empty();
    b[2][3] = "WHITE"; b[1][3] = "BLACK";
    b[3][4] = "WHITE"; b[3][5] = "BLACK";
    expect(keys(flipsFor(b, "BLACK", { row: 3, col: 3 }))).toEqual(keys([{ row: 2, col: 3 }, { row: 3, col: 4 }]));
  });

  it("石があるマスは非合法", () => {
    expect(flipsFor(initialBoard(), "BLACK", { row: 3, col: 3 })).toEqual([]);
  });
});

describe("applyMove / countDiscs", () => {
  it("新しい盤を返し元の盤を変えない", () => {
    const b = initialBoard();
    const pos = { row: 2, col: 3 };
    const next = applyMove(b, "BLACK", pos, flipsFor(b, "BLACK", pos));
    expect(countDiscs(next)).toEqual({ black: 4, white: 1 });
    expect(countDiscs(b)).toEqual({ black: 2, white: 2 });
  });
});

describe("isGameOver", () => {
  it("初期配置では終局しない", () => {
    expect(isGameOver(initialBoard())).toBe(false);
  });
  it("両者合法手なしで終局", () => {
    const b = empty();
    b[0][0] = "BLACK";
    b[7][7] = "WHITE";
    expect(legalMoves(b, "BLACK")).toEqual([]);
    expect(legalMoves(b, "WHITE")).toEqual([]);
    expect(isGameOver(b)).toBe(true);
  });
  it("盤が満杯で終局", () => {
    const b = empty().map((r) => r.map(() => "BLACK" as Disc));
    expect(isGameOver(b)).toBe(true);
  });
});
