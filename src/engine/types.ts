export type Category = "HOBBY" | "MEMORY" | "IF" | "VALUES" | "LOVE" | "YOU";
export type Mode = "FIRST_MEET" | "FRIENDS" | "COUPLE";
export type Seating = "SIDE_BY_SIDE" | "FACING";
export type Player = "BLACK" | "WHITE"; // BLACK = 先手
export type Disc = "EMPTY" | "BLACK" | "WHITE";
export type Pos = { row: number; col: number }; // 0..7
export const key = (p: Pos) => `${p.row},${p.col}`; // Map のキーに使う
export const fromKey = (k: string): Pos => {
  const [row, col] = k.split(",").map(Number);
  return { row, col };
};

export type Depth = 1 | 2 | 3;
export type Question = { category: Category; depth: Depth; text: string };
export type QuestionStatus = "HIDDEN" | "REVEALED_UNANSWERED" | "ANSWERED";

export type CellQuestion = {
  question: Question;
  status: QuestionStatus;
  answeredBy: Player | null;
  failedBy: Player[];
};

export type TurnPhase =
  | "CHECK_MOVES"
  | "AWAITING_MOVE"
  | "CELL_SELECTED"
  | "QUESTION_SHOWN"
  | "ANIMATING"
  | "PASS_NOTICE"
  | "GAME_OVER";

export type Screen = "LOADING" | "PLAYING" | "RESULT" | "PRIVILEGE" | "ASK";

export type PrivilegeItem = {
  question: Question;
  status: QuestionStatus | null; // リロール後は null
  by: Player | null;
};

export type PrivilegeState = {
  asker: Player;
  queue: Player[]; // 引き分け時は ["BLACK","WHITE"]
  items: PrivilegeItem[];
  rerollUsed: boolean;
  selectedIndex: number | null;
  customText: string | null;
};

export const CATEGORIES: Category[] = ["HOBBY", "MEMORY", "IF", "VALUES", "LOVE", "YOU"];
export const DEPTHS: Depth[] = [1, 2, 3];
export const opponent = (p: Player): Player => (p === "BLACK" ? "WHITE" : "BLACK");
export type Rng = () => number;

export type GameState = {
  screen: Screen;
  board: Disc[][]; // 8x8
  questions: Record<string, CellQuestion>; // key(pos) → 60件
  current: Player;
  phase: TurnPhase;
  selected: Pos | null;
  pendingFlips: Pos[];
  names: Record<Player, string>;
  mode: Mode;
  seating: Seating;
  privilege: PrivilegeState | null;
};
