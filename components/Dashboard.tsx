"use client";

import { AppState } from "@/lib/types";
import { BADGES, getLevelInfo, getTotalXPMinutes } from "@/lib/xp";
import { getSavingsBalance } from "@/lib/bank";
import { HankoStamp } from "./HankoStamp";
import { TabKey } from "./TabNav";

function formatMinutes(total: number) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}分`;
  return `${h}時間${m > 0 ? `${m}分` : ""}`;
}

// 借金は「○時間○分」に加えて、合計の分数も併記する
function formatMinutesWithTotal(total: number) {
  const h = Math.floor(total / 60);
  if (h === 0) return formatMinutes(total);
  return `${formatMinutes(total)}(${total}分)`;
}

export function Dashboard({
  state,
  onNavigate,
}: {
  state: AppState;
  onNavigate: (tab: TabKey) => void;
}) {
  const xpMinutes = getTotalXPMinutes(state);
  const { current, next, progress } = getLevelInfo(xpMinutes);
  const balance = getSavingsBalance(state.bank);
  const debt = state.bank.debtAmount;
  const todos = state.exam.todos;
  const doneCount = todos.filter((t) => t.done).length;
  const results = [...state.exam.mockResults].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const latestResult = results[results.length - 1];
  const earnedBadges = BADGES.filter((b) => b.check(state, xpMinutes));

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* 表紙ヘッダー */}
      <div className="rounded-card border border-line bg-white/50 p-6 flex items-center gap-5">
        <HankoStamp char={current.stamp} size={68} tone="ink" />
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-mono tracking-widest text-inkSoft uppercase">
            Lv.{current.level}
          </span>
          <h2 className="font-display text-xl font-extrabold truncate">{current.name}</h2>
          {next && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-paperDeep overflow-hidden">
                <div
                  className="h-full bg-ink rounded-full transition-all duration-500"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="text-[11px] text-inkSoft mt-1 block">
                次の位「{next.name}」まで {formatMinutes(next.minMinutes - xpMinutes)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 概要カード群 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate("focus")}
          className="text-left rounded-card border border-line bg-white/40 p-4 hover:border-ink/30 transition-colors"
        >
          <span className="text-[11px] text-inkSoft">連続記録</span>
          <div className="font-display text-2xl font-extrabold mt-1">
            {state.streak.current}
            <span className="text-sm font-body font-normal ml-1">日</span>
          </div>
          <span className="text-[11px] text-inkSoft">最長 {state.streak.best}日</span>
        </button>

        <button
          onClick={() => onNavigate("savings")}
          className={`text-left rounded-card border p-4 transition-colors ${
            debt > 0
              ? "border-stamp/60 bg-stamp/5 hover:border-stamp"
              : "border-line bg-white/40 hover:border-ink/30"
          }`}
        >
          <span className="text-[11px] text-inkSoft">勉強銀行</span>
          <div className="font-display text-2xl font-extrabold mt-1 truncate">
            {formatMinutes(balance)}
          </div>
          <span className={`text-[11px] ${debt > 0 ? "text-stamp font-bold" : "text-inkSoft"}`}>
            {debt > 0 ? `借金 ${formatMinutesWithTotal(debt)}` : "借金なし"}
          </span>
        </button>

        <button
          onClick={() => onNavigate("exam")}
          className="text-left rounded-card border border-line bg-white/40 p-4 hover:border-ink/30 transition-colors"
        >
          <span className="text-[11px] text-inkSoft">最新の模試</span>
          <div className="font-display text-2xl font-extrabold mt-1">
            {latestResult ? latestResult.hensachi : "--"}
          </div>
          <span className="text-[11px] text-inkSoft truncate block">
            {latestResult ? latestResult.name : "未記録"}
          </span>
        </button>

        <button
          onClick={() => onNavigate("exam")}
          className="text-left rounded-card border border-line bg-white/40 p-4 hover:border-ink/30 transition-colors"
        >
          <span className="text-[11px] text-inkSoft">ToDo進捗</span>
          <div className="font-display text-2xl font-extrabold mt-1">
            {todos.length > 0 ? `${doneCount}/${todos.length}` : "--"}
          </div>
          <span className="text-[11px] text-inkSoft">受験準備リスト</span>
        </button>
      </div>

      {/* バッジ */}
      <div className="rounded-card border border-line bg-white/40 p-5">
        <h3 className="font-display font-bold text-sm mb-3">
          獲得した印 ({earnedBadges.length}/{BADGES.length})
        </h3>
        {earnedBadges.length === 0 ? (
          <p className="text-sm text-inkSoft">
            集中ラボでセッションを完了すると、最初の印が押されます。
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {earnedBadges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2.5 rounded-lg border border-line/70 bg-paper/60 px-2.5 py-2"
              >
                <HankoStamp char="印" size={30} tone="gold" />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{b.label}</div>
                  <div className="text-[10px] text-inkSoft truncate">{b.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
