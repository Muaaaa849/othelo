"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { Question } from "@/engine/types";
import { CATEGORY_META } from "@/lib/categories";
import { Icon } from "./Icon";
import { Stars } from "./Stars";

export const CARD_LOCK_MS = 1500;

export function QuestionCard({
  question,
  askedName,
  failedName,
  rotated,
  origin,
  onAnswered,
  onCouldNotAnswer,
}: {
  question: Question;
  askedName: string;
  /** 以前このマスで答えられなかった人の名前 */
  failedName: string | null;
  rotated: boolean;
  /** マス中心の、画面中心からのずれ（px） */
  origin: { x: number; y: number };
  onAnswered: () => void;
  onCouldNotAnswer: () => void;
}) {
  const [locked, setLocked] = useState(true);
  const [done, setDone] = useState(false);
  const meta = CATEGORY_META[question.category];

  useEffect(() => {
    const t = setTimeout(() => setLocked(false), CARD_LOCK_MS);
    return () => clearTimeout(t);
  }, []);

  const press = (fn: () => void) => () => {
    if (locked || done) return;
    setDone(true);
    fn();
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[90%] max-w-[432px]" style={{ transform: rotated ? "rotate(180deg)" : undefined, perspective: 1000 }}>
        <motion.div
          className="overflow-hidden rounded-3xl bg-card shadow-2xl"
          initial={{ x: origin.x, y: origin.y, scale: 0.12, rotateY: 180 }}
          animate={{ x: 0, y: 0, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-center gap-2 px-4 py-3 text-white" style={{ backgroundColor: meta.color }}>
            <Icon name={meta.icon} size={22} />
            <span className="text-body font-bold">{meta.label}</span>
            <Stars depth={question.depth} className="ml-auto text-body" />
          </div>
          <div className="px-5 pb-5 pt-3">
            <p className="text-note text-white/70">{askedName}さんへの質問</p>
            <p className="my-5 line-clamp-3 text-center text-question">{question.text}</p>
            {failedName && (
              <p className="-mt-2 mb-4 text-center text-note text-white/70">前に{failedName}さんが答えられなかった質問</p>
            )}
            <div className="flex flex-col gap-3">
              <LockedButton locked={locked} filled color={meta.color} onClick={press(onAnswered)}>
                答えた！
              </LockedButton>
              <LockedButton locked={locked} onClick={press(onCouldNotAnswer)}>
                答えられなかった
              </LockedButton>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function LockedButton({
  locked,
  filled = false,
  color,
  onClick,
  children,
}: {
  locked: boolean;
  filled?: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={`relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl text-body font-bold text-white transition-colors ${
        filled ? "" : "border-2"
      }`}
      style={{
        backgroundColor: filled ? (locked ? "#4A5160" : color) : "transparent",
        borderColor: filled ? undefined : locked ? "#4A5160" : "#8B93A3",
        color: locked ? "#9AA1AE" : "#FFFFFF",
      }}
    >
      {locked && (
        <span
          className="absolute inset-y-0 left-0 w-full origin-left bg-white/15"
          style={{ animation: `fill-bar ${CARD_LOCK_MS}ms linear forwards` }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}
