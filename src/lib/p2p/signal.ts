/**
 * WebRTC の接続情報（SDP）を QR コード / テキストで受け渡すための圧縮エンコード。
 * 形式: "TS1." + base64url(deflate-raw(JSON {t, s}))
 */

const PREFIX = "TS1.";

export type Signal = { type: "offer" | "answer"; sdp: string };

/** データチャネルだけの接続に不要な行を落として短くする */
export function slimSdp(sdp: string): string {
  const drop = [/^a=extmap-allow-mixed/, /^a=msid-semantic/, /^a=max-message-size/];
  return sdp
    .split(/\r?\n/)
    .filter((l) => l && !drop.some((re) => re.test(l)))
    .join("\r\n")
    .concat("\r\n");
}

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([data as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function encodeSignal(sig: Signal): Promise<string> {
  const json = JSON.stringify({ t: sig.type === "offer" ? "o" : "a", s: slimSdp(sig.sdp) });
  const packed = await pipe(new TextEncoder().encode(json), new CompressionStream("deflate-raw"));
  return PREFIX + toBase64Url(packed);
}

export class SignalFormatError extends Error {}

export async function decodeSignal(code: string): Promise<Signal> {
  const s = code.trim();
  if (!s.startsWith(PREFIX)) throw new SignalFormatError("接続コードの形式が違います");
  try {
    const bytes = await pipe(fromBase64Url(s.slice(PREFIX.length)), new DecompressionStream("deflate-raw"));
    const { t, s: sdp } = JSON.parse(new TextDecoder().decode(bytes)) as { t: string; s: string };
    if ((t !== "o" && t !== "a") || typeof sdp !== "string" || !sdp.startsWith("v=0")) throw new Error();
    return { type: t === "o" ? "offer" : "answer", sdp };
  } catch {
    throw new SignalFormatError("接続コードを読み取れませんでした");
  }
}
