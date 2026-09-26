import { loadSettings } from "./storage";

let ctx: AudioContext | null = null;

/** 短い効果音（サウンド設定がオンの時のみ） */
export function playSound(kind: "place" | "flip" | "fail" = "place") {
  if (!loadSettings().sound) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const freq = { place: 520, flip: 780, fail: 220 }[kind];
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    // 音が出せなくても遊べる
  }
}

export const canVibrate = () => typeof navigator !== "undefined" && typeof navigator.vibrate === "function";

/** 軽い振動（振動設定がオン・対応ブラウザのみ） */
export function vibrate(ms = 30) {
  if (!canVibrate() || !loadSettings().vibration) return;
  try {
    navigator.vibrate(ms);
  } catch {
    // 無視
  }
}
