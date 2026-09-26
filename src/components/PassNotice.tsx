"use client";

import { motion } from "framer-motion";

export function PassNotice({ name, onClose }: { name: string; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div className="mx-4 w-full max-w-[448px] rounded-2xl bg-card/95 px-5 py-4 text-center text-body font-bold shadow-2xl ring-1 ring-line">
        {name}さんは置ける場所がないのでパス
      </div>
    </motion.div>
  );
}
