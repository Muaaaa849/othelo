import { questionsFromBank } from "@/engine/validateQuestions";
import type { Mode, Question } from "@/engine/types";
import { BANK } from "./questionBank";
import { loadImported } from "./storage";

/** インポートした質問を優先し、不足分は内蔵バンクから60問を作る */
export function localQuestions(mode: Mode, avoid: string[]): Question[] {
  return questionsFromBank(mode, avoid, BANK, Math.random, loadImported());
}
