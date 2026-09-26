"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline";

export function Button({
  variant = "primary",
  className = "",
  color,
  style,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; color?: string }) {
  const base =
    "relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl px-4 text-body font-bold transition-opacity select-none disabled:cursor-not-allowed";
  const variants: Record<Variant, string> = {
    primary: "text-white disabled:opacity-40",
    secondary: "bg-board text-white disabled:opacity-40",
    outline: "border-2 border-line bg-transparent text-white disabled:opacity-40",
  };
  const bg = variant === "primary" ? { backgroundColor: color ?? "#C99A1C" } : {};
  return <button type="button" className={`${base} ${variants[variant]} ${className}`} style={{ ...bg, ...style }} {...rest} />;
}
