import { describe, expect, it } from "vitest";
import { SignalFormatError, decodeSignal, encodeSignal, slimSdp } from "./signal";

const SDP = [
  "v=0",
  "o=- 4611731400430051336 2 IN IP4 127.0.0.1",
  "s=-",
  "t=0 0",
  "a=group:BUNDLE 0",
  "a=extmap-allow-mixed",
  "a=msid-semantic: WMS",
  "m=application 9 UDP/DTLS/SCTP webrtc-datachannel",
  "c=IN IP4 0.0.0.0",
  "a=candidate:1 1 udp 2113937151 3f1c2a4e-1111-4b2b-9c1d-0123456789ab.local 54321 typ host generation 0",
  "a=ice-ufrag:abcd",
  "a=ice-pwd:0123456789abcdefghijklmn",
  "a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99",
  "a=setup:actpass",
  "a=mid:0",
  "a=sctp-port:5000",
  "a=max-message-size:262144",
  "",
].join("\r\n");

describe("接続コード", () => {
  it("エンコード → デコードで元に戻る（不要行は除く）", async () => {
    const code = await encodeSignal({ type: "offer", sdp: SDP });
    expect(code.startsWith("TS1.")).toBe(true);
    expect(code).toMatch(/^TS1\.[A-Za-z0-9_-]+$/);
    const back = await decodeSignal(code);
    expect(back.type).toBe("offer");
    expect(back.sdp).toBe(slimSdp(SDP));
    expect(back.sdp).toContain("a=candidate:");
    expect(back.sdp).not.toContain("extmap-allow-mixed");
    expect(code.length).toBeLessThan(SDP.length);
  });

  it("answer も区別できる", async () => {
    const back = await decodeSignal(await encodeSignal({ type: "answer", sdp: SDP }));
    expect(back.type).toBe("answer");
  });

  it("壊れたコードはエラー", async () => {
    await expect(decodeSignal("hello")).rejects.toBeInstanceOf(SignalFormatError);
    await expect(decodeSignal("TS1.!!!!")).rejects.toBeInstanceOf(SignalFormatError);
    const code = await encodeSignal({ type: "offer", sdp: SDP });
    await expect(decodeSignal(code.slice(0, -10))).rejects.toBeInstanceOf(SignalFormatError);
  });
});
