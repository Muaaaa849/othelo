export function Icon({ name, size = 24, className = "", style }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`material-symbols-rounded ${className}`}
      style={{ fontSize: size, width: size, height: size, overflow: "hidden", ...style }}
    >
      {name}
    </span>
  );
}
