import { type Signal, decodeSignal, encodeSignal } from "./signal";

/**
 * スマホ2台を WebRTC DataChannel で直接つなぐ。
 * シグナリングサーバーは使わず、接続コード（QR）を2回やりとりする:
 *   ホスト: createOffer → 相手に見せる → 相手の答えを acceptAnswer
 *   ゲスト: 相手のコードで answerOffer → 自分の答えを相手に見せる
 * STUN はインターネット経由（別々の回線）でもつながるようにするため。同じWi‑Fiなら不要。
 */
export const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
const GATHER_TIMEOUT_MS = 4000;

export type RouteKind = "LAN" | "INTERNET" | "RELAY" | "UNKNOWN";

export type PeerEvents = {
  onOpen: () => void;
  onMessage: (data: unknown) => void;
  onClose: () => void;
};

/** 候補を集め終わるまで待つ（コードを1回で渡すため、trickle しない） */
function waitGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      pc.removeEventListener("icegatheringstatechange", check);
      resolve();
    };
    const check = () => pc.iceGatheringState === "complete" && done();
    const timer = setTimeout(done, GATHER_TIMEOUT_MS);
    pc.addEventListener("icegatheringstatechange", check);
  });
}

export class Peer {
  readonly pc: RTCPeerConnection;
  private channel: RTCDataChannel | null = null;

  constructor(private events: PeerEvents, iceServers: RTCIceServer[] = ICE_SERVERS) {
    this.pc = new RTCPeerConnection({ iceServers });
    this.pc.addEventListener("datachannel", (e) => this.bind(e.channel));
    this.pc.addEventListener("connectionstatechange", () => {
      if (this.pc.connectionState === "failed" || this.pc.connectionState === "closed") this.events.onClose();
    });
  }

  private bind(ch: RTCDataChannel) {
    this.channel = ch;
    ch.addEventListener("open", () => this.events.onOpen());
    ch.addEventListener("close", () => this.events.onClose());
    ch.addEventListener("message", (e) => {
      try {
        this.events.onMessage(JSON.parse(e.data as string));
      } catch {
        // 壊れたメッセージは無視
      }
    });
  }

  private async localCode(): Promise<string> {
    await waitGathering(this.pc);
    const d = this.pc.localDescription!;
    return encodeSignal({ type: d.type as Signal["type"], sdp: d.sdp });
  }

  /** ホスト: 最初の接続コードを作る */
  async createOffer(): Promise<string> {
    this.bind(this.pc.createDataChannel("game", { ordered: true }));
    await this.pc.setLocalDescription(await this.pc.createOffer());
    return this.localCode();
  }

  /** ゲスト: ホストのコードから返事のコードを作る */
  async answerOffer(code: string): Promise<string> {
    const sig = await decodeSignal(code);
    if (sig.type !== "offer") throw new Error("ホストの接続コードを読み取ってね");
    await this.pc.setRemoteDescription(sig);
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    return this.localCode();
  }

  /** ホスト: ゲストの返事を受け取ってつなぐ */
  async acceptAnswer(code: string): Promise<void> {
    const sig = await decodeSignal(code);
    if (sig.type !== "answer") throw new Error("ゲストの返事のコードを読み取ってね");
    await this.pc.setRemoteDescription(sig);
  }

  send(data: unknown): boolean {
    if (this.channel?.readyState !== "open") return false;
    this.channel.send(JSON.stringify(data));
    return true;
  }

  /** 実際に使われている経路（同じネットワーク内 / インターネット経由 / 中継） */
  async route(): Promise<RouteKind> {
    const stats = await this.pc.getStats();
    let pairId: string | undefined;
    stats.forEach((s) => {
      if (s.type === "transport" && s.selectedCandidatePairId) pairId = s.selectedCandidatePairId;
    });
    let pair: RTCIceCandidatePairStats | undefined;
    stats.forEach((s) => {
      if (s.type === "candidate-pair" && (s.id === pairId || (!pairId && s.nominated && s.state === "succeeded"))) pair = s;
    });
    if (!pair) return "UNKNOWN";
    const local = stats.get(pair.localCandidateId) as { candidateType?: string } | undefined;
    const remote = stats.get(pair.remoteCandidateId) as { candidateType?: string } | undefined;
    const types = [local?.candidateType, remote?.candidateType];
    if (types.includes("relay")) return "RELAY";
    // 両端がローカルのアドレスなら同じネットワーク内、どちらかがルーター越し（srflx）ならインターネット経由
    return types.every((t) => t === "host" || t === "prflx") ? "LAN" : "INTERNET";
  }

  close() {
    this.channel?.close();
    this.pc.close();
  }
}
