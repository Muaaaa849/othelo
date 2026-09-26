"use client";

import { useRouter } from "next/navigation";
import { HowToPlay } from "@/components/HowToPlay";

export default function HowToPage() {
  const router = useRouter();
  return <HowToPlay onClose={() => router.push("/")} />;
}
