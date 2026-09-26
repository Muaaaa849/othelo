import type { Category } from "@/engine/types";
import { CATEGORY_META } from "@/lib/categories";
import { Icon } from "./Icon";

export function CategoryChip({ category, count }: { category: Category; count?: number }) {
  const m = CATEGORY_META[category];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-note font-bold text-white"
      style={{ backgroundColor: m.color }}
    >
      <Icon name={m.icon} size={16} />
      {m.label}
      {count !== undefined && <span className="ml-0.5 opacity-90">{count}</span>}
    </span>
  );
}
