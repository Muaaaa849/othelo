"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { ImportFormatError, exportText, parseImport } from "@/engine/importQuestions";
import { MODE_IDS, MODES } from "@/engine/orders";
import type { Mode, Question } from "@/engine/types";
import { CATEGORIES } from "@/engine/types";
import { CATEGORY_META } from "@/lib/categories";
import { dateStamp, downloadText } from "@/lib/download";
import { AVOID_LIMIT, buildExternalPrompt } from "@/lib/prompt";
import { BANK } from "@/lib/questionBank";
import { loadImported, loadRecent, saveImported } from "@/lib/storage";

const FORMAT_EXAMPLE = `{"questions":[
  {"category":"HOBBY","depth":1,"text":"休みの日の朝、最初にしたいことは？"},
  {"category":"YOU","depth":3,"text":"相手に今日一番伝えたいことは？"}
]}`;

type Message = { kind: "ok" | "error"; text: string } | null;

export default function QuestionsPage() {
  const router = useRouter();
  const [imported, setImported] = useState<Question[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>("FRIENDS");
  const [copied, setCopied] = useState(false);
  const [paste, setPaste] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImported(loadImported());
    setRecent(loadRecent());
  }, []);

  // すでに持っている質問（インポート済み＋直近使用）を避けてもらう
  const prompt = useMemo(() => {
    const texts = [...new Set([...recent, ...imported.map((q) => q.text)])];
    return buildExternalPrompt(mode, texts.slice(-AVOID_LIMIT));
  }, [mode, imported, recent]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const importText = (text: string) => {
    try {
      const r = parseImport(text, [...BANK, ...imported]);
      const skipped = [r.invalid > 0 && `形式エラー ${r.invalid}`, r.duplicate > 0 && `重複 ${r.duplicate}`]
        .filter(Boolean)
        .join("・");
      if (r.added.length === 0) {
        setMessage({ kind: "error", text: `取り込める質問がありませんでした${skipped ? `（${skipped}）` : ""}` });
        return;
      }
      const next = [...imported, ...r.added];
      if (!saveImported(next)) {
        setMessage({ kind: "error", text: "保存できませんでした（ブラウザの保存領域を確認してね）" });
        return;
      }
      setImported(next);
      setPaste("");
      setMessage({ kind: "ok", text: `${r.added.length}問を取り込みました${skipped ? `（${skipped}は除外）` : ""}` });
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof ImportFormatError ? e.message : "読み込めませんでした" });
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    importText(await file.text());
    if (fileInput.current) fileInput.current.value = "";
  };

  const clearImported = () => {
    if (!window.confirm(`インポートした${imported.length}問をすべて削除します。よろしいですか？`)) return;
    saveImported([]);
    setImported([]);
    setMessage({ kind: "ok", text: "インポートした質問を削除しました" });
  };

  return (
    <main className="flex min-h-[100dvh] flex-col pb-8">
      <header className="flex h-14 items-center px-2">
        <button type="button" aria-label="閉じる" className="flex h-12 w-12 items-center justify-center" onClick={() => router.push("/settings")}>
          <Icon name="close" />
        </button>
        <h1 className="flex-1 pr-12 text-center text-body font-bold">質問データ</h1>
      </header>

      <div className="flex flex-col gap-4 px-4">
        {/* いまの質問 */}
        <section className="rounded-2xl bg-board p-4">
          <h2 className="mb-2 text-body font-bold">いまの質問</h2>
          <div className="flex gap-6 text-body">
            <p>
              内蔵 <span className="font-bold tabular-nums">{BANK.length}</span>問
            </p>
            <p>
              インポート <span className="font-bold tabular-nums">{imported.length}</span>問
            </p>
          </div>
          {imported.length > 0 && <CategoryCounts questions={imported} />}
          <p className="mt-2 text-note text-white/60">
            ゲームではインポートした質問を優先して使い、足りない分は内蔵の質問で補います。
          </p>
        </section>

        {/* 外部AI用プロンプト */}
        <section className="rounded-2xl bg-board p-4">
          <h2 className="mb-1 text-body font-bold">外部AIで質問を作る</h2>
          <ol className="mb-3 list-decimal pl-5 text-note text-white/70">
            <li>ふたりの関係を選んで、プロンプトをコピー</li>
            <li>ChatGPT・Claude・Gemini などに貼り付けて送信</li>
            <li>出てきたJSONを下の「インポート」で取り込む</li>
          </ol>
          <div className="mb-3 grid grid-cols-3 gap-1 rounded-2xl bg-bg p-1">
            {MODE_IDS.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={`h-12 rounded-xl text-note font-bold ${mode === m ? "bg-gold text-white" : "text-white/70"}`}
              >
                {MODES[m].label}
              </button>
            ))}
          </div>
          <pre className="mb-3 max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-bg p-3 text-[12px] leading-relaxed text-white/85 ring-1 ring-line">
            {prompt}
          </pre>
          <Button onClick={copyPrompt}>{copied ? "コピーしました" : "プロンプトをコピー"}</Button>
        </section>

        {/* インポート */}
        <section className="rounded-2xl bg-board p-4">
          <h2 className="mb-1 text-body font-bold">インポート</h2>
          <p className="mb-3 text-note text-white/70">
            JSON形式の .txt ファイルを選ぶか、AIの出力をそのまま貼り付けてね。
          </p>
          <input
            ref={fileInput}
            type="file"
            accept=".txt,.json,text/plain,application/json"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button variant="secondary" className="mb-3 ring-1 ring-line" onClick={() => fileInput.current?.click()}>
            .txt ファイルを選ぶ
          </Button>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={5}
            placeholder={FORMAT_EXAMPLE}
            className="mb-3 w-full resize-y rounded-xl bg-bg p-3 font-mono text-[12px] outline-none ring-1 ring-line placeholder:text-white/30 focus:ring-gold"
          />
          <Button disabled={paste.trim().length === 0} onClick={() => importText(paste)}>
            貼り付けた内容を取り込む
          </Button>
          {message && (
            <p role="status" className={`mt-3 text-note font-bold ${message.kind === "ok" ? "text-[#6FD08F]" : "text-[#FF8A8D]"}`}>
              {message.text}
            </p>
          )}
          <details className="mt-3 text-note text-white/70">
            <summary className="cursor-pointer py-2">形式について</summary>
            <pre className="mb-2 whitespace-pre-wrap break-words rounded-xl bg-bg p-3 text-[12px]">{FORMAT_EXAMPLE}</pre>
            <ul className="list-disc pl-5">
              <li>category: HOBBY / MEMORY / IF / VALUES / LOVE / YOU</li>
              <li>depth: 1（かるめ）/ 2（ふかめ）/ 3（とっておき）</li>
              <li>text: 40文字以内で、末尾は「？」</li>
              <li>形式に合わないもの・すでにある質問は取り込みません</li>
            </ul>
          </details>
        </section>

        {/* エクスポート */}
        <section className="rounded-2xl bg-board p-4">
          <h2 className="mb-1 text-body font-bold">エクスポート</h2>
          <p className="mb-3 text-note text-white/70">インポートと同じ形式の .txt ファイルで保存します。</p>
          <div className="flex flex-col gap-3">
            <Button
              variant="secondary"
              className="ring-1 ring-line"
              disabled={imported.length === 0}
              onClick={() => downloadText(`talkthello_imported_${dateStamp()}.txt`, exportText(imported))}
            >
              インポートした質問を保存（{imported.length}問）
            </Button>
            <Button
              variant="secondary"
              className="ring-1 ring-line"
              onClick={() => downloadText(`talkthello_all_${dateStamp()}.txt`, exportText([...BANK, ...imported]))}
            >
              すべての質問を保存（{BANK.length + imported.length}問）
            </Button>
          </div>
        </section>

        {imported.length > 0 && (
          <Button variant="outline" style={{ borderColor: "#E5484D", color: "#FF8A8D" }} onClick={clearImported}>
            インポートした質問をすべて削除
          </Button>
        )}
      </div>
    </main>
  );
}

function CategoryCounts({ questions }: { questions: Question[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-note text-white/70">
      {CATEGORIES.map((c) => {
        const n = questions.filter((q) => q.category === c).length;
        return n > 0 ? (
          <span key={c} className="flex items-center gap-1">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_META[c].color }} />
            {CATEGORY_META[c].label} {n}
          </span>
        ) : null;
      })}
    </div>
  );
}
