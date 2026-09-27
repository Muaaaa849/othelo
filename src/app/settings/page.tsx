"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";
import { SeatingToggle } from "@/components/SeatingToggle";
import { canVibrate } from "@/lib/feedback";
import { DEFAULT_SETTINGS, type Settings, loadSettings, saveSettings } from "@/lib/storage";

export default function SettingsPage() {
  const router = useRouter();
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [vibrationSupported, setVibrationSupported] = useState(false);

  useEffect(() => {
    setS(loadSettings());
    setVibrationSupported(canVibrate());
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...s, ...patch };
    setS(next);
    saveSettings(next);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col">
      <header className="flex h-14 items-center px-2">
        <button type="button" aria-label="閉じる" className="flex h-12 w-12 items-center justify-center" onClick={() => router.push("/")}>
          <Icon name="close" />
        </button>
        <h1 className="flex-1 pr-12 text-center text-body font-bold">設定</h1>
      </header>
      <div className="flex flex-col gap-3 px-4">
        <ToggleRow label="サウンド" value={s.sound} onChange={(v) => update({ sound: v })} />
        {vibrationSupported && <ToggleRow label="振動" value={s.vibration} onChange={(v) => update({ vibration: v })} />}
        <div className="rounded-2xl bg-board p-4">
          <p className="mb-3 text-body font-bold">座り方の初期値</p>
          <SeatingToggle value={s.seating} onChange={(v) => update({ seating: v })} />
        </div>
        <Link href="/questions" className="flex h-16 items-center justify-between rounded-2xl bg-board px-4 text-body font-bold">
          <span>
            質問データ
            <span className="block text-note font-normal text-white/60">インポート・エクスポート・外部AI用プロンプト</span>
          </span>
          <span className="text-white/60">›</span>
        </Link>
        <Link href="/link" className="flex h-16 items-center justify-between rounded-2xl bg-board px-4 text-body font-bold">
          <span>
            2台接続テスト（実験）
            <span className="block text-note font-normal text-white/60">近くの人のスマホと直接つながるか試す</span>
          </span>
          <span className="text-white/60">›</span>
        </Link>
      </div>
    </main>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex h-16 items-center justify-between rounded-2xl bg-board px-4 text-body font-bold"
    >
      {label}
      <span className={`relative h-8 w-14 rounded-full transition-colors ${value ? "bg-gold" : "bg-line"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${value ? "left-7" : "left-1"}`} />
      </span>
    </button>
  );
}
