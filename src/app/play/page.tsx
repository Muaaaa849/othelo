"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AskScreen } from "@/components/screens/AskScreen";
import { GameScreen } from "@/components/screens/GameScreen";
import { LoadingScreen } from "@/components/screens/LoadingScreen";
import { PrivilegeScreen } from "@/components/screens/PrivilegeScreen";
import { ResultScreen } from "@/components/screens/ResultScreen";
import { placeQuestions } from "@/engine/placeQuestions";
import type { Question } from "@/engine/types";
import { useGame } from "@/game/GameContext";
import { fetchQuestions, localQuestions } from "@/lib/fetchQuestions";
import { addRecent, loadRecent } from "@/lib/storage";

const QUIT_MESSAGE = "ゲームを終了しますか？（進行は保存されません）";

/** S3〜S9 を1ページ内で段階表示する（ページ遷移しない） */
export default function PlayPage() {
  const router = useRouter();
  const vm = useGame();
  const { state } = vm;
  const [loadError, setLoadError] = useState(false);
  const screen = state?.screen;

  const goHome = useCallback(() => {
    vm.reset();
    router.push("/");
  }, [vm, router]);

  // 準備なしで開かれたらホームへ
  useEffect(() => {
    if (!state) router.replace("/");
  }, [state, router]);

  const start = useCallback(
    (questions: Question[]) => {
      if (!state) return;
      addRecent(questions.map((q) => q.text));
      vm.questionsReady(placeQuestions(questions, Math.random));
    },
    [state, vm],
  );

  // S3: 質問づくり
  useEffect(() => {
    if (!state || state.screen !== "LOADING") return;
    const controller = new AbortController();
    let cancelled = false;
    setLoadError(false);
    fetchQuestions(state.mode, loadRecent(), controller.signal)
      .then((qs) => {
        if (!cancelled) start(qs);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, state?.loadId]);

  // 対局中の戻る操作・再読み込みの確認
  const playing = screen === "PLAYING";
  useEffect(() => {
    if (!playing) return;
    window.history.pushState(window.history.state, "", window.location.href);
    const onPop = () => {
      if (window.confirm(QUIT_MESSAGE)) {
        goHome();
      } else {
        window.history.pushState(window.history.state, "", window.location.href);
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [playing, goHome]);

  if (!state) return null;

  switch (state.screen) {
    case "LOADING":
      return (
        <LoadingScreen
          error={loadError}
          onRetry={vm.retryLoading}
          onUseBank={() => start(localQuestions(state.mode, loadRecent()))}
        />
      );
    case "PLAYING":
      return (
        <GameScreen
          vm={vm}
          state={state}
          onQuit={() => {
            if (window.confirm(QUIT_MESSAGE)) goHome();
          }}
        />
      );
    case "RESULT":
      return <ResultScreen vm={vm} state={state} onHome={goHome} />;
    case "PRIVILEGE":
      return <PrivilegeScreen vm={vm} state={state} />;
    case "ASK":
      return <AskScreen vm={vm} state={state} onHome={goHome} />;
  }
}
