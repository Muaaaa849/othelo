/** 深さの星（depth1 は星なし、depth2 は★1つ、depth3 は★2つ） */
export function Stars({ depth, className = "" }: { depth: 1 | 2 | 3; className?: string }) {
  if (depth === 1) return null;
  return <span className={className}>{"★".repeat(depth - 1)}</span>;
}
