"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { QrCode } from "@/components/QrCode";
import { QrScanner } from "@/components/QrScanner";
import { vibrate } from "@/lib/feedback";
import { Peer, type RouteKind } from "@/lib/p2p/peer";

type Step =
  | { kind: "ROLE" }
  | { kind: "WORKING"; label: string }
  | { kind: "SHOW"; code: string; next: "SCAN_ANSWER" | "WAIT" }
  | { kind: "SCAN"; purpose: "OFFER" | "ANSWER" }
  | { kind: "CONNECTED" }
  | { kind: "ERROR"; message: string };

type Msg = { t: "ping"; at: number } | { t: "pong"; at: number } | { t: "poke"; n: number };

const ROUTE_LABEL: Record<RouteKind, string> = {
  LAN: "同じネットワーク内で直接",
  INTERNET: "インターネット経由で直接",
  RELAY: "中継サーバー経由",
  UNKNOWN: "不明",
};

/** 2台のスマホを直接つなぐ実験ページ（サーバー不要・QRで接続情報を交換） */
export default function LinkPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "ROLE" });
  const [role, setRole] = useState<"HOST" | "GUEST" | null>(null);
  const [route, setRoute] = useState<RouteKind | null>(null);
  const [rtt, setRtt] = useState<number | null>(null);
  const [sent, setSent] = useState(0);
  const [received, setReceived] = useState(0);
  const [flash, setFlash] = useState(false);
  const [lost, setLost] = useState(false);
  const peer = useRef<Peer | null>(null);

  const reset = useCallback(() => {
    peer.current?.close();
    peer.current = null;
    setRole(null);
    setRoute(null);
    setRtt(null);
    setSent(0);
    setReceived(0);
    setLost(false);
    setStep({ kind: "ROLE" });
  }, []);

  useEffect(() => () => peer.current?.close(), []);

  const newPeer = () => {
    peer.current?.close();
    const p = new Peer({
      onOpen: () => {
        setStep({ kind: "CONNECTED" });
        setTimeout(() => p.route().then(setRoute), 300);
      },
      onClose: () => setLost(true),
      onMessage: (m) => {
        const msg = m as Msg;
        if (msg.t === "ping") p.send({ t: "pong", at: msg.at });
        else if (msg.t === "pong") setRtt(Math.round(performance.now() - msg.at));
        else if (msg.t === "poke") {
          setReceived((n) => n + 1);
          setFlash(true);
          vibrate(60);
          setTimeout(() => setFlash(false), 300);
        }
      },
    });
    peer.current = p;
    return p;
  };

  // 接続中は2秒ごとに往復時間を測る
  useEffect(() => {
    if (step.kind !== "CONNECTED") return;
    const t = setInterval(() => peer.current?.send({ t: "ping", at: performance.now() }), 2000);
    peer.current?.send({ t: "ping", at: performance.now() });
    return () => clearInterval(t);
  }, [step.kind]);

  const fail = (e: unknown) => setStep({ kind: "ERROR", message: e instanceof Error ? e.message : "うまくいきませんでした" });

  const startHost = async () => {
    setRole("HOST");
    setStep({ kind: "WORKING", label: "接続コードを作っています…" });
    try {
      const code = await newPeer().createOffer();
      setStep({ kind: "SHOW", code, next: "SCAN_ANSWER" });
    } catch (e) {
      fail(e);
    }
  };

  const startGuest = () => {
    setRole("GUEST");
    setStep({ kind: "SCAN", purpose: "OFFER" });
  };

  const onCode = async (code: string) => {
    if (step.kind !== "SCAN") return;
    try {
      if (step.purpose === "OFFER") {
        setStep({ kind: "WORKING", label: "返事のコードを作っています…" });
        const answer = await newPeer().answerOffer(code);
        setStep({ kind: "SHOW", code: answer, next: "WAIT" });
      } else {
        setStep({ kind: "WORKING", label: "つないでいます…" });
        await peer.current!.acceptAnswer(code);
      }
    } catch (e) {
      fail(e);
    }
  };

  const poke = () => {
    if (peer.current?.send({ t: "poke", n: sent + 1 })) setSent((n) => n + 1);
  };

  return (
    <main className="flex min-h-[100dvh] flex-col pb-8" style={{ backgroundColor: flash ? "#3a2f10" : undefined, transition: "background-color 150ms" }}>
      <header className="flex h-14 items-center px-2">
        <button type="button" aria-label="閉じる" className="flex h-12 w-12 items-center justify-center" onClick={() => router.push("/settings")}>
          <Icon name="close" />
        </button>
        <h1 className="flex-1 pr-12 text-center text-body font-bold">2台接続テスト</h1>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4" data-step={step.kind} data-role={role ?? ""}>
        {step.kind === "ROLE" && (
          <>
            <p className="text-note text-white/70">
              近くの人のスマホと、サーバーを使わずに直接つながるかを試します。2台でこのページを開いて、片方が「ホスト」、もう片方が「ゲスト」を選んでね。同じWi‑Fi（またはどちらかのテザリング）につなぐと確実です。
            </p>
            <Button onClick={startHost}>ホストになる（QRを見せる）</Button>
            <Button variant="secondary" className="ring-1 ring-line" onClick={startGuest}>
              ゲストになる（QRを読む）
            </Button>
          </>
        )}

        {step.kind === "WORKING" && <p className="py-10 text-center text-body">{step.label}</p>}

        {step.kind === "SHOW" && (
          <>
            <p className="text-center text-body font-bold">
              {step.next === "SCAN_ANSWER" ? "① ゲストにこのQRを読み取ってもらってね" : "② ホストにこのQRを読み取ってもらってね"}
            </p>
            <QrCode text={step.code} />
            <CodeText code={step.code} />
            {step.next === "SCAN_ANSWER" ? (
              <Button onClick={() => setStep({ kind: "SCAN", purpose: "ANSWER" })}>ゲストのQRを読み取る</Button>
            ) : (
              <p className="text-center text-note text-white/60">読み取ってもらうと自動でつながります…</p>
            )}
          </>
        )}

        {step.kind === "SCAN" && (
          <>
            <p className="text-center text-body font-bold">
              {step.purpose === "OFFER" ? "① ホストのQRを読み取ってね" : "② ゲストのQRを読み取ってね"}
            </p>
            <QrScanner onResult={onCode} />
            <PasteCode onSubmit={onCode} />
          </>
        )}

        {step.kind === "CONNECTED" && (
          <>
            <div className="rounded-2xl bg-board p-4 text-center">
              <p className="text-[22px] font-bold text-[#6FD08F]" data-testid="connected">
                {lost ? "切断されました" : "つながりました！"}
              </p>
              <p className="mt-1 text-note text-white/70">
                あなたは{role === "HOST" ? "ホスト" : "ゲスト"}・経路: <span data-testid="route">{route ? ROUTE_LABEL[route] : "確認中…"}</span>
              </p>
              <p className="text-note text-white/70">
                往復時間: <span data-testid="rtt">{rtt === null ? "計測中…" : `${rtt} ms`}</span>
              </p>
            </div>
            <Button onClick={poke} disabled={lost}>
              相手の画面を光らせる
            </Button>
            <p className="text-center text-note text-white/70">
              送った <span data-testid="sent">{sent}</span> 回・届いた <span data-testid="received">{received}</span> 回
            </p>
          </>
        )}

        {step.kind === "ERROR" && <p className="rounded-xl bg-bg p-4 text-note text-[#FF8A8D]">{step.message}</p>}

        {step.kind !== "ROLE" && (
          <Button variant="outline" className="mt-auto" onClick={reset}>
            最初からやり直す
          </Button>
        )}
      </div>
    </main>
  );
}

function CodeText({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <details className="text-note text-white/70">
      <summary className="cursor-pointer py-2">QRが読めない時はコードで送る（{code.length}文字）</summary>
      <textarea readOnly value={code} rows={4} data-testid="code" className="w-full rounded-xl bg-bg p-2 font-mono text-[11px] ring-1 ring-line" />
      <button
        type="button"
        className="mt-2 h-12 w-full rounded-2xl border-2 border-line font-bold"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
          } catch {
            // 手動でコピーしてもらう
          }
        }}
      >
        {copied ? "コピーしました" : "コードをコピー"}
      </button>
    </details>
  );
}

function PasteCode({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [text, setText] = useState("");
  return (
    <details className="text-note text-white/70">
      <summary className="cursor-pointer py-2">コードを貼り付けてつなぐ</summary>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        data-testid="paste"
        placeholder="TS1.…"
        className="w-full rounded-xl bg-bg p-2 font-mono text-[11px] outline-none ring-1 ring-line focus:ring-gold"
      />
      <Button className="mt-2" disabled={!text.trim()} onClick={() => onSubmit(text)}>
        読み込む
      </Button>
    </details>
  );
}
