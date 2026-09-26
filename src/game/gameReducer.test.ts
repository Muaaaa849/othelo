import { describe, expect, it } from "vitest";
import bank from "@/data/questions_ja.json";
import { initialBoard, legalMoves } from "@/engine/board";
import { placeQuestions } from "@/engine/placeQuestions";
import { seededRng } from "@/engine/rng";
import type { Disc, Question } from "@/engine/types";
import { questionsFromBank } from "@/engine/validateQuestions";
import { type GameState, createGame, gameReducer, revealedItems } from "./gameReducer";

const BANK = bank.questions as Question[];

function ready(): GameState {
  const s = createGame({ BLACK: "くろ", WHITE: "しろ" }, "FRIENDS", "SIDE_BY_SIDE");
  const rng = seededRng(5);
  return gameReducer(s, { type: "QUESTIONS_READY", placed: placeQuestions(questionsFromBank("FRIENDS", [], BANK, rng), rng) });
}

describe("gameReducer", () => {
  it("開始時は黒の AWAITING_MOVE", () => {
    const s = ready();
    expect(s.screen).toBe("PLAYING");
    expect(s.phase).toBe("AWAITING_MOVE");
    expect(s.current).toBe("BLACK");
  });

  it("非合法マスのタップは何も起きない / 合法マスで選択 / 盤外で解除", () => {
    let s = ready();
    expect(gameReducer(s, { type: "CELL_TAP", pos: { row: 0, col: 0 } })).toBe(s);
    s = gameReducer(s, { type: "CELL_TAP", pos: { row: 2, col: 3 } });
    expect(s.phase).toBe("CELL_SELECTED");
    expect(s.pendingFlips).toEqual([{ row: 3, col: 3 }]);
    s = gameReducer(s, { type: "CELL_TAP", pos: { row: 3, col: 2 } });
    expect(s.selected).toEqual({ row: 3, col: 2 });
    s = gameReducer(s, { type: "CELL_TAP", pos: null });
    expect(s.phase).toBe("AWAITING_MOVE");
    expect(s.selected).toBeNull();
  });

  it("答えた: 石を確定して返し、ANSWERED になり手番交代", () => {
    let s = ready();
    s = gameReducer(s, { type: "CELL_TAP", pos: { row: 2, col: 3 } });
    s = gameReducer(s, { type: "CONFIRM_PLACE" });
    expect(s.phase).toBe("QUESTION_SHOWN");
    // カード表示中の盤タップは無視
    expect(gameReducer(s, { type: "CELL_TAP", pos: { row: 3, col: 2 } })).toBe(s);
    s = gameReducer(s, { type: "ANSWERED" });
    expect(s.phase).toBe("ANIMATING");
    expect(s.board[2][3]).toBe("BLACK");
    expect(s.board[3][3]).toBe("BLACK");
    expect(s.questions["2,3"]).toMatchObject({ status: "ANSWERED", answeredBy: "BLACK" });
    s = gameReducer(s, { type: "ANIMATION_FINISHED" });
    expect(s.current).toBe("WHITE");
    expect(s.phase).toBe("AWAITING_MOVE");
  });

  it("答えられなかった: 石を置かず REVEALED_UNANSWERED、failedBy に追記、手番交代", () => {
    let s = ready();
    s = gameReducer(s, { type: "CELL_TAP", pos: { row: 2, col: 3 } });
    s = gameReducer(s, { type: "CONFIRM_PLACE" });
    s = gameReducer(s, { type: "COULD_NOT_ANSWER" });
    expect(s.board).toEqual(initialBoard());
    expect(s.questions["2,3"]).toMatchObject({ status: "REVEALED_UNANSWERED", failedBy: ["BLACK"] });
    s = gameReducer(s, { type: "ANIMATION_FINISHED" });
    expect(s.current).toBe("WHITE");
    // 開示済みマスは以降も合法手なら置ける
    expect(legalMoves(s.board, "BLACK").some((p) => p.row === 2 && p.col === 3)).toBe(true);
  });

  it("合法手がなく相手にはある時はパス通知", () => {
    const s = ready();
    const b: Disc[][] = Array.from({ length: 8 }, () => Array<Disc>(8).fill("EMPTY"));
    // 白 (0,0)(0,1)、黒 (0,2) → 黒は置けない、白は (0,3) に置ける
    b[0][0] = "WHITE"; b[0][1] = "WHITE"; b[0][2] = "BLACK";
    const ended = gameReducer({ ...s, board: b, phase: "ANIMATING", current: "WHITE" }, { type: "ANIMATION_FINISHED" });
    expect(ended.current).toBe("BLACK");
    expect(ended.phase).toBe("PASS_NOTICE");
    const next = gameReducer(ended, { type: "PASS_FINISHED" });
    expect(next.current).toBe("WHITE");
    expect(next.phase).toBe("AWAITING_MOVE");
  });

  it("両者合法手なしで GAME_OVER → RESULT（パス通知は出さない）", () => {
    const s = ready();
    const b: Disc[][] = Array.from({ length: 8 }, () => Array<Disc>(8).fill("EMPTY"));
    b[0][0] = "BLACK"; b[7][7] = "WHITE";
    const ended = gameReducer({ ...s, board: b, phase: "ANIMATING" }, { type: "ANIMATION_FINISHED" });
    expect(ended.phase).toBe("GAME_OVER");
    expect(ended.screen).toBe("RESULT");
  });

  it("引き分けは先手→後手の順に2回特権", () => {
    let s = ready();
    s = { ...s, screen: "RESULT", phase: "GAME_OVER" };
    s = gameReducer(s, { type: "START_PRIVILEGE" });
    expect(s.privilege).toMatchObject({ asker: "BLACK", queue: ["BLACK", "WHITE"] });
    s = gameReducer(s, { type: "PRIVILEGE_ASK_CUSTOM", text: "好きな言葉は？" });
    expect(s.screen).toBe("ASK");
    s = gameReducer(s, { type: "ASK_DONE" });
    expect(s.screen).toBe("PRIVILEGE");
    expect(s.privilege).toMatchObject({ asker: "WHITE", rerollUsed: false });
    s = gameReducer(s, { type: "PRIVILEGE_ASK_CUSTOM", text: "次の質問は？" });
    s = gameReducer(s, { type: "ASK_DONE" });
    expect(s.askFinished).toBe(true);
  });

  it("リロールは1回だけ", () => {
    let s = ready();
    s = gameReducer({ ...s, screen: "RESULT" }, { type: "START_PRIVILEGE" });
    const qs = questionsFromBank("FRIENDS", [], BANK, seededRng(9));
    s = gameReducer(s, { type: "PRIVILEGE_REROLLED", questions: qs });
    expect(s.privilege?.rerollUsed).toBe(true);
    expect(s.privilege?.items).toHaveLength(60);
    expect(s.privilege?.items.every((i) => i.status === null)).toBe(true);
    const again = gameReducer(s, { type: "PRIVILEGE_REROLLED", questions: qs.slice(0, 1) });
    expect(again).toBe(s);
  });
});

describe("revealedItems", () => {
  it("カテゴリ順 → 答えられなかった → 答えた → 深さの大きい順", () => {
    const q = (category: Question["category"], depth: 1 | 2 | 3, text: string): Question => ({ category, depth, text });
    const items = revealedItems({
      a: { question: q("MEMORY", 1, "m1"), status: "ANSWERED", answeredBy: "BLACK", failedBy: [] },
      b: { question: q("HOBBY", 1, "h1"), status: "ANSWERED", answeredBy: "WHITE", failedBy: [] },
      c: { question: q("HOBBY", 2, "h2"), status: "ANSWERED", answeredBy: "BLACK", failedBy: [] },
      d: { question: q("HOBBY", 1, "h1f"), status: "REVEALED_UNANSWERED", answeredBy: null, failedBy: ["BLACK"] },
      e: { question: q("HOBBY", 3, "hidden"), status: "HIDDEN", answeredBy: null, failedBy: [] },
    });
    expect(items.map((i) => i.question.text)).toEqual(["h1f", "h2", "h1", "m1"]);
  });
});
