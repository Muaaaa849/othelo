import type { Seating } from "@/engine/types";

export type Settings = { sound: boolean; vibration: boolean; seating: Seating };

const SETTINGS_KEY = "talkthello.settings";
const RECENT_KEY = "talkthello.recent";
export const RECENT_LIMIT = 120;

export const DEFAULT_SETTINGS: Settings = { sound: true, vibration: true, seating: "SIDE_BY_SIDE" };

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 保存できなくても遊べる
  }
}

export function loadSettings(): Settings {
  const s = read<Partial<Settings>>(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
}

export function saveSettings(s: Settings) {
  write(SETTINGS_KEY, s);
}

/** 直近に使った質問文（古い順） */
export function loadRecent(): string[] {
  const r = read<unknown>(RECENT_KEY);
  return Array.isArray(r) ? r.filter((x): x is string => typeof x === "string").slice(-RECENT_LIMIT) : [];
}

export function addRecent(texts: string[]) {
  const set = new Set(texts);
  const merged = [...loadRecent().filter((t) => !set.has(t)), ...texts];
  write(RECENT_KEY, merged.slice(-RECENT_LIMIT));
}
