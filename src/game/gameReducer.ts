import { applyMove, countDiscs, flipsFor, initialBoard, isBoardFull, legalMoves } from "@/engine/board";
import type {
  Category,
  CellQuestion,
  Disc,
  GameState as BaseGameState,
  Mode,
  Player,
  Pos,
  PrivilegeItem,
  PrivilegeState,
  Question,
  Seating,
} from "@/engine/types";
import { CATEGORIES, key, opponent } from "@/engine/types";

/** S9 で表示する質問（自由入力なら category は null） */
export type AskItem = { text: string; category: Category | null; depth: 1 | 2 | 3 | null };

export type GameState = BaseGameState & {
  /** 直前の回答結果（ANIMATING 中のアニメ切り替えに使う） */
  lastOutcome: "ANSWERED" | "FAILED" | null;
  /** 新しいゲームごとに増える（S3 の質問づくりのトリガー） */
  loadId: number;
  ask: AskItem | null;
  /** 全員の特権が終わった */
  askFinished: boolean;
};

export type Action =
  | { type: "NEW_GAME"; names: Record<Player, string>; mode: Mode; seating: Seating }
  | { type: "QUESTIONS_READY"; placed: Record<string, Question> }
  | { type: "CELL_TAP"; pos: Pos | null }
  | { type: "CONFIRM_PLACE" }
  | { type: "ANSWERED" }
  | { type: "COULD_NOT_ANSWER" }
  | { type: "ANIMATION_FINISHED" }
  | { type: "PASS_FINISHED" }
  | { type: "START_PRIVILEGE" }
  | { type: "PRIVILEGE_SELECT"; index: number }
  | { type: "PRIVILEGE_REROLLED"; questions: Question[] }
  | { type: "PRIVILEGE_ASK_SELECTED" }
  | { type: "PRIVILEGE_ASK_CUSTOM"; text: string }
  | { type: "ASK_DONE" }
  | { type: "REMATCH" };

export const emptyBoard = (): Disc[][] => Array.from({ length: 8 }, () => Array<Disc>(8).fill("EMPTY"));

export function createGame(names: Record<Player, string>, mode: Mode, seating: Seating, loadId = 0): GameState {
  return {
    screen: "LOADING",
    board: initialBoard(),
    questions: {},
    current: "BLACK",
    phase: "CHECK_MOVES",
    selected: null,
    pendingFlips: [],
    names,
    mode,
    seating,
    privilege: null,
    lastOutcome: null,
    loadId,
    ask: null,
    askFinished: false,
  };
}

/** CHECK_MOVES を即座に判定して次の状態へ */
function checkMoves(s: GameState): GameState {
  const base = { ...s, phase: "CHECK_MOVES" as const, selected: null, pendingFlips: [], lastOutcome: null };
  if (isBoardFull(s.board)) return { ...base, phase: "GAME_OVER", screen: "RESULT" };
  if (legalMoves(s.board, s.current).length > 0) return { ...base, phase: "AWAITING_MOVE" };
  if (legalMoves(s.board, opponent(s.current)).length > 0) return { ...base, phase: "PASS_NOTICE" };
  return { ...base, phase: "GAME_OVER", screen: "RESULT" };
}

/** 置いたマスから近い順に並べる（1枚ずつ返すアニメ用） */
function orderFlips(pos: Pos, flips: Pos[]): Pos[] {
  const d = (p: Pos) => Math.max(Math.abs(p.row - pos.row), Math.abs(p.col - pos.col));
  return [...flips].sort((a, b) => d(a) - d(b));
}

export function winnerOf(board: Disc[][]): Player | null {
  const { black, white } = countDiscs(board);
  if (black === white) return null;
  return black > white ? "BLACK" : "WHITE";
}

const STATUS_RANK = { REVEALED_UNANSWERED: 0, ANSWERED: 1, HIDDEN: 2 } as const;

/** 第6.8節: カテゴリ順 → 答えられなかった → 答えた → 深さの大きい順 */
export function revealedItems(questions: Record<string, CellQuestion>): PrivilegeItem[] {
  const items: PrivilegeItem[] = Object.values(questions)
    .filter((cq) => cq.status !== "HIDDEN")
    .map((cq) => ({
      question: cq.question,
      status: cq.status,
      by: cq.status === "ANSWERED" ? cq.answeredBy : null,
    }));
  return sortItems(items);
}

export function sortItems(items: PrivilegeItem[]): PrivilegeItem[] {
  return [...items].sort(
    (a, b) =>
      CATEGORIES.indexOf(a.question.category) - CATEGORIES.indexOf(b.question.category) ||
      (a.status ? STATUS_RANK[a.status] : 0) - (b.status ? STATUS_RANK[b.status] : 0) ||
      b.question.depth - a.question.depth,
  );
}

function privilegeFor(s: GameState, asker: Player, queue: Player[]): PrivilegeState {
  return { asker, queue, items: revealedItems(s.questions), rerollUsed: false, selectedIndex: null, customText: null };
}

export function gameReducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "NEW_GAME":
      return createGame(a.names, a.mode, a.seating, s.loadId + 1);
    case "REMATCH":
      return createGame(s.names, s.mode, s.seating, s.loadId + 1);

    case "QUESTIONS_READY": {
      if (s.screen !== "LOADING") return s;
      const questions: Record<string, CellQuestion> = {};
      for (const [k, q] of Object.entries(a.placed)) {
        questions[k] = { question: q, status: "HIDDEN", answeredBy: null, failedBy: [] };
      }
      return checkMoves({ ...s, screen: "PLAYING", board: initialBoard(), questions, current: "BLACK" });
    }

    case "CELL_TAP": {
      if (s.phase !== "AWAITING_MOVE" && s.phase !== "CELL_SELECTED") return s;
      const flips = a.pos ? flipsFor(s.board, s.current, a.pos) : [];
      if (!a.pos || flips.length === 0) {
        // 盤の外や非合法マス: 選択解除（未選択なら何も起きない）
        return s.phase === "CELL_SELECTED" ? { ...s, phase: "AWAITING_MOVE", selected: null, pendingFlips: [] } : s;
      }
      return { ...s, phase: "CELL_SELECTED", selected: a.pos, pendingFlips: orderFlips(a.pos, flips) };
    }

    case "CONFIRM_PLACE":
      if (s.phase !== "CELL_SELECTED" || !s.selected) return s;
      return { ...s, phase: "QUESTION_SHOWN" };

    case "ANSWERED": {
      if (s.phase !== "QUESTION_SHOWN" || !s.selected) return s;
      const k = key(s.selected);
      const cq = s.questions[k];
      return {
        ...s,
        phase: "ANIMATING",
        lastOutcome: "ANSWERED",
        board: applyMove(s.board, s.current, s.selected, s.pendingFlips),
        questions: cq ? { ...s.questions, [k]: { ...cq, status: "ANSWERED", answeredBy: s.current } } : s.questions,
      };
    }

    case "COULD_NOT_ANSWER": {
      if (s.phase !== "QUESTION_SHOWN" || !s.selected) return s;
      const k = key(s.selected);
      const cq = s.questions[k];
      return {
        ...s,
        phase: "ANIMATING",
        lastOutcome: "FAILED",
        questions: cq
          ? {
              ...s.questions,
              [k]: {
                ...cq,
                status: cq.status === "ANSWERED" ? "ANSWERED" : "REVEALED_UNANSWERED",
                failedBy: [...cq.failedBy, s.current],
              },
            }
          : s.questions,
      };
    }

    case "ANIMATION_FINISHED":
      if (s.phase !== "ANIMATING") return s;
      return checkMoves({ ...s, current: opponent(s.current) });

    case "PASS_FINISHED":
      if (s.phase !== "PASS_NOTICE") return s;
      return checkMoves({ ...s, current: opponent(s.current) });

    case "START_PRIVILEGE": {
      if (s.screen !== "RESULT") return s;
      const w = winnerOf(s.board);
      const queue: Player[] = w ? [w] : ["BLACK", "WHITE"];
      return { ...s, screen: "PRIVILEGE", privilege: privilegeFor(s, queue[0], queue), ask: null, askFinished: false };
    }

    case "PRIVILEGE_SELECT":
      if (!s.privilege) return s;
      return { ...s, privilege: { ...s.privilege, selectedIndex: a.index } };

    case "PRIVILEGE_REROLLED":
      if (!s.privilege || s.privilege.rerollUsed) return s;
      return {
        ...s,
        privilege: {
          ...s.privilege,
          rerollUsed: true,
          selectedIndex: null,
          items: sortItems(a.questions.map((q) => ({ question: q, status: null, by: null }))),
        },
      };

    case "PRIVILEGE_ASK_SELECTED": {
      const p = s.privilege;
      const item = p && p.selectedIndex !== null ? p.items[p.selectedIndex] : null;
      if (!item) return s;
      return {
        ...s,
        screen: "ASK",
        ask: { text: item.question.text, category: item.question.category, depth: item.question.depth },
      };
    }

    case "PRIVILEGE_ASK_CUSTOM": {
      const text = a.text.trim();
      if (!s.privilege || !text) return s;
      return {
        ...s,
        screen: "ASK",
        privilege: { ...s.privilege, customText: text },
        ask: { text, category: null, depth: null },
      };
    }

    case "ASK_DONE": {
      const p = s.privilege;
      if (s.screen !== "ASK" || !p) return s;
      const next = p.queue[p.queue.indexOf(p.asker) + 1];
      if (next) return { ...s, screen: "PRIVILEGE", privilege: privilegeFor(s, next, p.queue), ask: null };
      return { ...s, askFinished: true };
    }
  }
}

/** ふりかえり用の集計 */
export function gameStats(questions: Record<string, CellQuestion>) {
  const answered: Record<Player, number> = { BLACK: 0, WHITE: 0 };
  const failed: Record<Player, number> = { BLACK: 0, WHITE: 0 };
  const byCategory = new Map<Category, number>();
  for (const cq of Object.values(questions)) {
    if (cq.answeredBy) answered[cq.answeredBy]++;
    for (const p of cq.failedBy) failed[p]++;
    if (cq.status !== "HIDDEN") byCategory.set(cq.question.category, (byCategory.get(cq.question.category) ?? 0) + 1);
  }
  let topCategory: Category | null = null;
  for (const c of CATEGORIES) {
    if ((byCategory.get(c) ?? 0) > (topCategory ? byCategory.get(topCategory) ?? 0 : 0)) topCategory = c;
  }
  return { answered, failed, topCategory };
}
