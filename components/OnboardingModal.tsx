"use client";

import { useState } from "react";
import { AppState } from "@/lib/types";
import { completeOnboarding } from "@/lib/bank";
import {
  NotifyPermission,
  getNotificationPermission,
  requestNotificationPermission,
} from "@/lib/notify";
import { NumberInput } from "./NumberInput";

type Step = "notify" | "goal" | "confirm";

const PRESETS = [30, 60, 90, 120, 180];

export function OnboardingModal({
  update,
}: {
  update: (fn: (prev: AppState) => AppState) => void;
}) {
  const [step, setStep] = useState<Step>("notify");
  const [notifStatus, setNotifStatus] = useState<NotifyPermission>(() =>
    getNotificationPermission()
  );
  const [goal, setGoal] = useState(60);

  function askNotification() {
    requestNotificationPermission().then(setNotifStatus);
  }

  function finish() {
    update((prev) => completeOnboarding(prev, goal));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 px-4">
      <div className="w-full max-w-sm rounded-card bg-paper border border-line shadow-paper p-6 animate-fadeUp">
        {step === "notify" && (
          <>
            <h2 className="font-display text-lg font-bold mb-2">はじめに</h2>
            <p className="text-sm text-inkSoft leading-relaxed mb-5">
              勉強銀行へようこそ。集中タイマーの区切りなどを、ブラウザの通知でお知らせできます。通知を許可しますか?
            </p>

            {notifStatus === "unsupported" && (
              <p className="text-xs text-inkSoft mb-4">このブラウザは通知に対応していません。</p>
            )}
            {notifStatus === "granted" && (
              <p className="text-xs text-stamp mb-4">通知を許可済みです。</p>
            )}
            {notifStatus === "denied" && (
              <p className="text-xs text-inkSoft mb-4">
                通知はブロックされています。必要であればブラウザの設定から後で変更できます。
              </p>
            )}
            {notifStatus === "default" && (
              <div className="flex gap-3 mb-5">
                <button
                  onClick={askNotification}
                  className="px-4 py-2 rounded-full bg-ink text-paper text-sm font-bold hover:bg-ink/90 transition-colors"
                >
                  通知を許可する
                </button>
                <button
                  onClick={() => setStep("goal")}
                  className="px-4 py-2 rounded-full border border-line text-sm text-inkSoft hover:bg-white/40 transition-colors"
                >
                  あとで
                </button>
              </div>
            )}

            {notifStatus !== "default" && (
              <button
                onClick={() => setStep("goal")}
                className="px-5 py-2 rounded-full bg-ink text-paper text-sm font-bold hover:bg-ink/90 transition-colors"
              >
                次へ
              </button>
            )}
          </>
        )}

        {step === "goal" && (
          <>
            <h2 className="font-display text-lg font-bold mb-2">1日の目標時間</h2>
            <p className="text-sm text-inkSoft leading-relaxed mb-4">
              毎日の学習目標を分単位で決めてください。この目標をもとに、勉強銀行の貯金・借金が毎晩精算されます。
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setGoal(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors ${
                    goal === p
                      ? "bg-ink text-paper border-ink"
                      : "border-line text-inkSoft hover:bg-white/40"
                  }`}
                >
                  {p}分
                </button>
              ))}
            </div>
            <label className="block mb-5">
              <span className="block text-[11px] text-inkSoft mb-1">目標時間(分)</span>
              <NumberInput
                min={1}
                value={goal}
                onChange={setGoal}
                className="w-full rounded-lg border border-line bg-white/60 px-3 py-2 font-mono text-lg"
              />
            </label>
            <button
              onClick={() => setStep("confirm")}
              disabled={goal <= 0}
              className="px-5 py-2 rounded-full bg-ink text-paper text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-40"
            >
              決定
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <h2 className="font-display text-lg font-bold mb-2">確認</h2>
            <div className="font-mono text-2xl font-bold mb-3">{goal}分 / 日</div>
            <p className="text-sm text-inkSoft leading-relaxed mb-6">
              この目標は今後、「目標時間変更券」を使ったときだけ変更できますが、よろしいですか?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("goal")}
                className="px-4 py-2 rounded-full border border-line text-sm text-inkSoft hover:bg-white/40 transition-colors"
              >
                修正する
              </button>
              <button
                onClick={finish}
                className="px-5 py-2 rounded-full bg-stamp text-paper text-sm font-bold hover:bg-stamp/90 transition-colors"
              >
                はい、これにする
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
