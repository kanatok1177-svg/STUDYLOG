"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppState, FocusSession, TimerMode } from "@/lib/types";
import { uid } from "@/lib/storage";
import { bumpStreak, getLevelInfo, getTotalXPMinutes } from "@/lib/xp";
import { HankoStamp } from "./HankoStamp";

type Phase = { type: "work" | "break"; seconds: number };

function buildPhases(
  mode: TimerMode,
  settings: { work: number; rest: number; cycles: number }
): Phase[] {
  const phases: Phase[] = [];
  if (mode === "pomodoro") {
    for (let i = 0; i < settings.cycles; i++) {
      phases.push({ type: "work", seconds: settings.work * 60 });
      if (i < settings.cycles - 1) {
        phases.push({ type: "break", seconds: settings.rest * 60 });
      }
    }
  } else if (mode === "stack") {
    // 積み上げ式: 短い休憩を挟みつつ同じ長さのブロックを積む
    for (let i = 0; i < settings.cycles; i++) {
      phases.push({ type: "work", seconds: settings.work * 60 });
      phases.push({ type: "break", seconds: Math.max(1, settings.rest) * 60 });
    }
  } else {
    // interval: 短いwork/restを繰り返す(HIIT的)
    for (let i = 0; i < settings.cycles; i++) {
      phases.push({ type: "work", seconds: settings.work * 60 });
      phases.push({ type: "break", seconds: settings.rest * 60 });
    }
  }
  return phases;
}

const MODE_LABEL: Record<TimerMode, { title: string; desc: string }> = {
  pomodoro: { title: "ポモドーロ", desc: "王道の作業/休憩サイクル" },
  stack: { title: "積み上げ", desc: "同じ長さのブロックをコツコツ積む" },
  interval: { title: "インターバル", desc: "短いサイクルで集中力を切り替える" },
};

export function FocusLab({
  state,
  update,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}) {
  const [mode, setMode] = useState<TimerMode>("pomodoro");
  const [work, setWork] = useState(25);
  const [rest, setRest] = useState(5);
  const [cycles, setCycles] = useState(4);

  const [running, setRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(work * 60);
  const [awayCount, setAwayCount] = useState(0);
  const [justCompleted, setJustCompleted] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );

  const workedSecondsRef = useRef(0);
  const wasHiddenRef = useRef(false);

  const phases = useMemo(
    () => buildPhases(mode, { work, rest, cycles }),
    [mode, work, rest, cycles]
  );

  useEffect(() => {
    if (!running) {
      setSecondsLeft(phases[0]?.seconds ?? work * 60);
      setPhaseIndex(0);
      workedSecondsRef.current = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, work, rest, cycles]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotifPermission("unsupported");
      return;
    }
    setNotifPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          if (phases[phaseIndex]?.type === "work") {
            workedSecondsRef.current += 1;
          }
          return prev - 1;
        }
        // このフェーズ終了
        const isLastPhase = phaseIndex >= phases.length - 1;
        if (phases[phaseIndex]?.type === "work") {
          workedSecondsRef.current += 1;
        }
        if (isLastPhase) {
          setRunning(false);
          completeSession();
          return 0;
        }
        const nextIndex = phaseIndex + 1;
        setPhaseIndex(nextIndex);
        notify(
          phases[nextIndex].type === "break" ? "小休止です" : "再開しましょう",
          phases[nextIndex].type === "break" ? "少し肩の力を抜いて" : "集中モードに戻ります"
        );
        return phases[nextIndex].seconds;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phaseIndex, phases]);

  useEffect(() => {
    function handleVisibility() {
      if (!running) return;
      if (document.hidden) {
        wasHiddenRef.current = true;
      } else if (wasHiddenRef.current) {
        wasHiddenRef.current = false;
        setAwayCount((c) => c + 1);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [running]);

  function notify(title: string, body: string) {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, tag: "nextk-study-hub" });
    }
  }

  function requestNotifPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    Notification.requestPermission().then(setNotifPermission);
  }

  function completeSession() {
    const minutes = Math.round(workedSecondsRef.current / 60);
    if (minutes <= 0) return;
    update((prev) => {
      const boosted = prev.bank.flags.xpBoostPending;
      const session: FocusSession = {
        id: uid(),
        mode,
        minutes,
        xpBonusMinutes: boosted ? minutes : 0,
        completedAt: new Date().toISOString(),
        awayCount,
      };
      return {
        ...prev,
        focusSessions: [...prev.focusSessions, session],
        streak: bumpStreak(prev.streak),
        bank: {
          ...prev.bank,
          flags: { ...prev.bank.flags, xpBoostPending: false },
        },
      };
    });
    setJustCompleted(true);
    setAwayCount(0);
    notify("記帳完了", `${minutes}分の集中を記録しました`);
    setTimeout(() => setJustCompleted(false), 2200);
  }

  function start() {
    setRunning(true);
  }
  function pause() {
    setRunning(false);
  }
  function reset() {
    setRunning(false);
    setPhaseIndex(0);
    setSecondsLeft(phases[0]?.seconds ?? work * 60);
    workedSecondsRef.current = 0;
    setAwayCount(0);
  }

  const xpMinutes = getTotalXPMinutes(state);
  const { current } = getLevelInfo(xpMinutes);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");
  const currentPhase = phases[phaseIndex]?.type ?? "work";
  const totalPhaseSeconds = phases[phaseIndex]?.seconds || 1;
  const phaseProgress = 1 - secondsLeft / totalPhaseSeconds;

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* モード選択 */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(MODE_LABEL) as TimerMode[]).map((m) => (
          <button
            key={m}
            disabled={running}
            onClick={() => setMode(m)}
            className={`rounded-card border px-3 py-3 text-left transition-colors disabled:opacity-40 ${
              mode === m
                ? "border-stamp bg-stamp/5"
                : "border-line bg-white/40 hover:border-ink/30"
            }`}
          >
            <div className="font-display font-bold text-sm">{MODE_LABEL[m].title}</div>
            <div className="text-[11px] text-inkSoft mt-0.5 leading-snug">
              {MODE_LABEL[m].desc}
            </div>
          </button>
        ))}
      </div>

      {/* タイマー本体 */}
      <div className="rounded-card border border-line bg-white/50 p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono tracking-widest text-inkSoft uppercase">
            {currentPhase === "work" ? "集中中" : "休憩中"} ・ フェーズ {phaseIndex + 1}/
            {phases.length}
          </span>
          <span className="text-xs font-mono text-inkSoft">
            離席 {awayCount} 回
          </span>
        </div>

        {state.bank.flags.xpBoostPending && (
          <div className="mb-3 text-center text-xs font-bold text-gold">
            ✦ XPブースト適用中(次のセッションのXPが2倍になります)
          </div>
        )}

        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <svg width="220" height="220" viewBox="0 0 220 220">
              <circle
                cx="110"
                cy="110"
                r="98"
                fill="none"
                stroke="#D2CDBB"
                strokeWidth="8"
              />
              <circle
                cx="110"
                cy="110"
                r="98"
                fill="none"
                stroke={currentPhase === "work" ? "#A63D33" : "#B98F2C"}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 98}
                strokeDashoffset={2 * Math.PI * 98 * (1 - phaseProgress)}
                transform="rotate(-90 110 110)"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-5xl font-bold tabular-nums">
                {mm}:{ss}
              </span>
              <span className="text-[11px] text-inkSoft mt-1">
                Lv.{current.level} {current.name}
              </span>
            </div>
          </div>

          {justCompleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-paper/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <HankoStamp char="済" animate size={80} />
                <span className="font-display font-bold text-ink">記帳しました</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-3 mt-2">
          {!running ? (
            <button
              onClick={start}
              className="px-6 py-2.5 rounded-full bg-ink text-paper font-bold text-sm hover:bg-ink/90 transition-colors"
            >
              はじめる
            </button>
          ) : (
            <button
              onClick={pause}
              className="px-6 py-2.5 rounded-full bg-stamp text-paper font-bold text-sm hover:bg-stamp/90 transition-colors"
            >
              一時停止
            </button>
          )}
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-full border border-line text-ink font-bold text-sm hover:border-ink/40 transition-colors"
          >
            リセット
          </button>
        </div>
      </div>

      {/* 設定 */}
      <div className="rounded-card border border-line bg-white/40 p-5">
        <h3 className="font-display font-bold text-sm mb-3">タイマー設定</h3>
        <div className="grid grid-cols-3 gap-4">
          <NumberField
            label={mode === "pomodoro" ? "作業(分)" : "ブロック(分)"}
            value={work}
            min={1}
            max={90}
            onChange={setWork}
            disabled={running}
          />
          <NumberField
            label="休憩(分)"
            value={rest}
            min={0}
            max={30}
            onChange={setRest}
            disabled={running}
          />
          <NumberField
            label={mode === "pomodoro" ? "サイクル数" : "回数"}
            value={cycles}
            min={1}
            max={12}
            onChange={setCycles}
            disabled={running}
          />
        </div>

        {notifPermission === "default" && (
          <button
            onClick={requestNotifPermission}
            className="mt-4 text-xs text-stamp underline underline-offset-2"
          >
            通知を許可してフェーズ切り替えをお知らせする
          </button>
        )}
      </div>

      {/* 最近のセッション */}
      <div className="rounded-card border border-line bg-white/40 p-5">
        <h3 className="font-display font-bold text-sm mb-3">最近の記帳</h3>
        {state.focusSessions.length === 0 ? (
          <p className="text-sm text-inkSoft">
            まだ記録がありません。タイマーを完了すると、ここに刻まれていきます。
          </p>
        ) : (
          <ul className="divide-y divide-line/70">
            {[...state.focusSessions]
              .slice(-6)
              .reverse()
              .map((s) => (
                <li key={s.id} className="py-2.5 flex items-center justify-between text-sm">
                  <span className="text-inkSoft">
                    {new Date(s.completedAt).toLocaleString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    <span className="ml-2 text-xs">({MODE_LABEL[s.mode].title})</span>
                  </span>
                  <span className="font-mono font-bold">{s.minutes}分</span>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-[11px] text-inkSoft mb-1">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
        }}
        className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-sm disabled:opacity-50"
      />
    </label>
  );
}
