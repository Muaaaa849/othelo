import { CATEGORIES } from "@/engine/types";
import { CategoryChip } from "./CategoryChip";

export function CategoryLegend() {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 py-1.5">
      {CATEGORIES.map((c) => (
        <CategoryChip key={c} category={c} />
      ))}
    </div>
  );
}
