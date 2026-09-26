import type { Category, Depth, Mode } from "./types";

export type Order = Record<Depth, Record<Category, number>>;
export type ModeDef = { label: string; description: string; order: Order };

// 第4.2節の注文表（定数）
export const MODES: Record<Mode, ModeDef> = {
  FIRST_MEET: {
    label: "はじめまして",
    description: "今日初めて会った、またはまだほとんど話したことがない2人",
    order: {
      1: { HOBBY: 14, IF: 8, MEMORY: 7, VALUES: 2, LOVE: 0, YOU: 1 },
      2: { HOBBY: 4, IF: 4, MEMORY: 5, VALUES: 5, LOVE: 3, YOU: 3 },
      3: { HOBBY: 0, IF: 0, MEMORY: 0, VALUES: 1, LOVE: 1, YOU: 2 },
    },
  },
  FRIENDS: {
    label: "ともだち",
    description: "友達・同僚・クラスメイトなど、普通に話せるがもっと仲良くなりたい2人",
    order: {
      1: { HOBBY: 12, IF: 7, MEMORY: 7, VALUES: 3, LOVE: 1, YOU: 2 },
      2: { HOBBY: 2, IF: 3, MEMORY: 5, VALUES: 6, LOVE: 5, YOU: 3 },
      3: { HOBBY: 0, IF: 0, MEMORY: 0, VALUES: 1, LOVE: 2, YOU: 1 },
    },
  },
  COUPLE: {
    label: "恋人・夫婦",
    description: "付き合っている、または結婚している2人。お互いをもっと深く知りたい",
    order: {
      1: { HOBBY: 7, IF: 6, MEMORY: 6, VALUES: 5, LOVE: 5, YOU: 3 },
      2: { HOBBY: 1, IF: 2, MEMORY: 4, VALUES: 6, LOVE: 7, YOU: 4 },
      3: { HOBBY: 0, IF: 0, MEMORY: 0, VALUES: 1, LOVE: 2, YOU: 1 },
    },
  },
};

export const MODE_IDS: Mode[] = ["FIRST_MEET", "FRIENDS", "COUPLE"];

export const MODE_NOTES: Record<Mode, string> = {
  FIRST_MEET:
    "初対面なので、LOVEは過去の恋愛の詳細ではなく「好きなタイプ」「理想」など一般的な内容にする。YOUは第一印象など、今日の印象で答えられる内容にする。",
  FRIENDS:
    "友達同士なので、少しいじり合えるくらいの軽さはOK。LOVEは恋愛観や経験を聞いてよいが、相手への告白を迫る質問は作らない。",
  COUPLE:
    "恋人・夫婦なので、2人の関係や思い出、将来についての質問もOK。YOUは「相手の好きなところ」など、2人の関係を深める内容にする。",
};
