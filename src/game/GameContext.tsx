"use client";

import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import type { Mode, Player, Pos, Question, Seating } from "@/engine/types";
import type { Action, GameState } from "./gameReducer";
import { createGame, gameReducer } from "./gameReducer";

type Store = GameState | null;

function reducer(s: Store, a: Action | { type: "RESET" }): Store {
  if (a.type === "RESET") return null;
  if (a.type === "NEW_GAME") return createGame(a.names, a.mode, a.seating, (s?.loadId ?? 0) + 1);
  return s ? gameReducer(s, a) : s;
}

/** 第7章の ViewModel 関数。これ以外で状態を変えない */
export type GameViewModel = {
  state: Store;
  newGame: (names: Record<Player, string>, mode: Mode, seating: Seating) => void;
  reset: () => void;
  retryLoading: () => void;
  questionsReady: (placed: Record<string, Question>) => void;
  onCellTap: (pos: Pos | null) => void;
  onConfirmPlace: () => void;
  onAnswered: () => void;
  onCouldNotAnswer: () => void;
  onAnimationFinished: () => void;
  onPassFinished: () => void;
  startPrivilege: () => void;
  selectPrivilege: (index: number) => void;
  rerolled: (questions: Question[]) => void;
  askSelected: () => void;
  askCustom: (text: string) => void;
  askDone: () => void;
  rematch: () => void;
};

const Ctx = createContext<GameViewModel | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null);
  const d = useCallback((a: Action | { type: "RESET" }) => dispatch(a), []);
  const vm = useMemo<GameViewModel>(
    () => ({
      state,
      newGame: (names, mode, seating) => d({ type: "NEW_GAME", names, mode, seating }),
      reset: () => d({ type: "RESET" }),
      retryLoading: () => d({ type: "RETRY_LOADING" }),
      questionsReady: (placed) => d({ type: "QUESTIONS_READY", placed }),
      onCellTap: (pos) => d({ type: "CELL_TAP", pos }),
      onConfirmPlace: () => d({ type: "CONFIRM_PLACE" }),
      onAnswered: () => d({ type: "ANSWERED" }),
      onCouldNotAnswer: () => d({ type: "COULD_NOT_ANSWER" }),
      onAnimationFinished: () => d({ type: "ANIMATION_FINISHED" }),
      onPassFinished: () => d({ type: "PASS_FINISHED" }),
      startPrivilege: () => d({ type: "START_PRIVILEGE" }),
      selectPrivilege: (index) => d({ type: "PRIVILEGE_SELECT", index }),
      rerolled: (questions) => d({ type: "PRIVILEGE_REROLLED", questions }),
      askSelected: () => d({ type: "PRIVILEGE_ASK_SELECTED" }),
      askCustom: (text) => d({ type: "PRIVILEGE_ASK_CUSTOM", text }),
      askDone: () => d({ type: "ASK_DONE" }),
      rematch: () => d({ type: "REMATCH" }),
    }),
    [state, d],
  );
  return <Ctx.Provider value={vm}>{children}</Ctx.Provider>;
}

export function useGame(): GameViewModel {
  const vm = useContext(Ctx);
  if (!vm) throw new Error("useGame must be used within GameProvider");
  return vm;
}
