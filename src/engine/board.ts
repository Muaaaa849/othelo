import type { Disc, Player, Pos } from "./types";

export const SIZE = 8;

const DIRS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

export function initialBoard(): Disc[][] {
  const b: Disc[][] = Array.from({ length: SIZE }, () => Array<Disc>(SIZE).fill("EMPTY"));
  b[3][3] = "WHITE";
  b[3][4] = "BLACK";
  b[4][3] = "BLACK";
  b[4][4] = "WHITE";
  return b;
}

export function isInitialCell(p: Pos): boolean {
  return (p.row === 3 || p.row === 4) && (p.col === 3 || p.col === 4);
}

const inBounds = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

/** 8方向を走査し、挟める石を返す。空配列なら非合法。 */
export function flipsFor(board: Disc[][], player: Player, pos: Pos): Pos[] {
  if (!inBounds(pos.row, pos.col) || board[pos.row][pos.col] !== "EMPTY") return [];
  const opp: Disc = player === "BLACK" ? "WHITE" : "BLACK";
  const result: Pos[] = [];
  for (const [dr, dc] of DIRS) {
    const line: Pos[] = [];
    let r = pos.row + dr;
    let c = pos.col + dc;
    while (inBounds(r, c) && board[r][c] === opp) {
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
    }
    if (line.length > 0 && inBounds(r, c) && board[r][c] === player) result.push(...line);
  }
  return result;
}

export function legalMoves(board: Disc[][], player: Player): Pos[] {
  const moves: Pos[] = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (flipsFor(board, player, { row, col }).length > 0) moves.push({ row, col });
    }
  }
  return moves;
}

/** 新しい盤を返す。元の盤は変更しない。 */
export function applyMove(board: Disc[][], player: Player, pos: Pos, flips: Pos[]): Disc[][] {
  const next = board.map((row) => [...row]);
  next[pos.row][pos.col] = player;
  for (const f of flips) next[f.row][f.col] = player;
  return next;
}

export function countDiscs(board: Disc[][]): { black: number; white: number } {
  let black = 0;
  let white = 0;
  for (const row of board) {
    for (const d of row) {
      if (d === "BLACK") black++;
      else if (d === "WHITE") white++;
    }
  }
  return { black, white };
}

export function isBoardFull(board: Disc[][]): boolean {
  return board.every((row) => row.every((d) => d !== "EMPTY"));
}

/** 両者とも合法手がない、または盤が埋まった */
export function isGameOver(board: Disc[][]): boolean {
  return (
    isBoardFull(board) ||
    (legalMoves(board, "BLACK").length === 0 && legalMoves(board, "WHITE").length === 0)
  );
}
