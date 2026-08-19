"use client";

import { useState } from "react";
import { AppState, ItemId } from "@/lib/types";
import {
  addManualStudyLog,
  getSavingsBalance,
  getTodayStudiedMinutes,
  purchaseItem,
  repayDebt,
  setupWeeklyChallenge,
  updateDailyGoal,
  useItem,
} from "@/lib/bank";
import { ITEMS, getItemDef } from "@/lib/items";
import { HankoStamp } from "./HankoStamp";
import { NumberInput } from "./NumberInput";

function formatMinutes(total: number) {
  const sign = total < 0 ? "-" : "";
  const abs = Math.abs(total);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}分`;
  return `${sign}${h}時間${m > 0 ? `${m}分` : ""}`;
}

export function BankVault({
  state,
  update,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}) {
  const bank = state.bank;
  const balance = getSavingsBalance(bank);
  const todayStudied = getTodayStudiedMinutes(state);
  const goalProgress = Math.min(1, bank.dailyGoalMinutes > 0 ? todayStudied / bank.dailyGoalMinutes : 0);

  const [stampFlash, setStampFlash] = useState<string | null>(null);

  function flash(label: string) {
    setStampFlash(label);
    setTimeout(() => setStampFlash(null), 1800);
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* 残高カード */}
      <div className="rounded-card border border-line bg-white/50 p-6 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[11px] font-mono tracking-widest text-inkSoft uppercase">
              勉強銀行 残高
            </span>
            <div className="mt-1 font-display text-4xl font-extrabold tabular-nums">
              {formatMinutes(balance)}
            </div>
          </div>
          {stampFlash && <HankoStamp char={stampFlash} size={60} animate />}
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-[11px] text-inkSoft mb-1.5">
            <span>今日の学習: {formatMinutes(todayStudied)}</span>
            <span>目標: {formatMinutes(bank.dailyGoalMinutes)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-paperDeep overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-500"
              style={{ width: `${goalProgress * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-inkSoft mt-1.5">
            毎晩、目標を超えた分は貯金に、届かなかった分は借金になります。
          </p>
        </div>
      </div>

      {bank.weeklyChallenge?.pendingSetup && (
        <WeeklyChallengeSetup state={state} update={update} />
      )}
      {bank.weeklyChallenge && !bank.weeklyChallenge.pendingSetup && (
        <WeeklyChallengeStatus state={state} />
      )}

      {bank.debtAmount > 0 && (
        <DebtPanel state={state} update={update} balance={balance} onRepay={() => flash("済")} />
      )}

      <GoalPanel state={state} update={update} />

      <ManualLogPanel state={state} update={update} onLog={() => flash("記")} />

      <ItemShop state={state} update={update} balance={balance} onBuy={() => flash("購")} />

      <Inventory state={state} update={update} onUse={(label) => flash(label)} />

      <Ledger state={state} />
    </div>
  );
}

function WeeklyChallengeSetup({
  state,
  update,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}) {
  const suggested = state.bank.dailyGoalMinutes;
  const [target, setTarget] = useState(suggested);

  return (
    <div className="rounded-card border-2 border-stamp bg-stamp/5 p-5">
      <h3 className="font-display font-bold text-sm mb-2 text-stamp">
        借金が膨らみました。1週間チャレンジが発動します
      </h3>
      <p className="text-xs text-inkSoft mb-4">
        7日間連続で1日の目標を達成できれば、借金は全額帳消しになります。
        1日でも未達成があれば、また1日目からやり直しです。挑戦する1日あたりの目標時間を決めてください。
      </p>
      <div className="flex gap-3 items-end">
        <label className="flex-1">
          <span className="block text-[11px] text-inkSoft mb-1">1日の目標(分)</span>
          <NumberInput
            min={1}
            value={target}
            onChange={setTarget}
            className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-sm"
          />
        </label>
        <button
          onClick={() => update((prev) => setupWeeklyChallenge(prev, target))}
          className="px-5 py-2 rounded-full bg-stamp text-paper text-sm font-bold hover:bg-stamp/90 transition-colors"
        >
          挑戦を始める
        </button>
      </div>
    </div>
  );
}

function WeeklyChallengeStatus({ state }: { state: AppState }) {
  const wc = state.bank.weeklyChallenge!;
  return (
    <div className="rounded-card border border-gold bg-gold/10 p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-bold text-sm">挑戦中: 1週間チャレンジ</h3>
        <span className="text-xs font-mono font-bold">{wc.dayResults.length}/7日</span>
      </div>
      <p className="text-xs text-inkSoft mb-3">
        1日{formatMinutes(wc.targetDailyMinutes)}の目標を7日連続で達成すると、借金が帳消しになります。
      </p>
      <div className="flex gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full ${
              i < wc.dayResults.length ? "bg-gold" : "bg-paperDeep"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function DebtPanel({
  state,
  update,
  balance,
  onRepay,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
  balance: number;
  onRepay: () => void;
}) {
  const [amount, setAmount] = useState(Math.min(state.bank.debtAmount, balance) || 10);

  return (
    <div className="rounded-card border border-stamp/60 bg-white/40 p-5">
      <h3 className="font-display font-bold text-sm mb-1 text-stamp">借金</h3>
      <div className="font-mono text-2xl font-extrabold text-stamp mb-1">
        {formatMinutes(state.bank.debtAmount)}
      </div>
      <p className="text-[11px] text-inkSoft mb-4">
        返済せずに日をまたぐと、残高に約10%の利息がつきます。
      </p>
      <div className="flex gap-3 items-end">
        <label className="flex-1">
          <span className="block text-[11px] text-inkSoft mb-1">返済する分数(貯金から)</span>
          <NumberInput
            min={1}
            value={amount}
            onChange={setAmount}
            className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-sm"
          />
        </label>
        <button
          onClick={() => {
            update((prev) => repayDebt(prev, amount));
            onRepay();
          }}
          disabled={balance <= 0}
          className="px-5 py-2 rounded-full bg-ink text-paper text-sm font-bold hover:bg-ink/90 transition-colors disabled:opacity-40"
        >
          返済する
        </button>
      </div>
      {balance <= 0 && (
        <p className="text-[11px] text-inkSoft mt-2">貯金がありません。学習して貯金を増やしましょう。</p>
      )}
    </div>
  );
}

function GoalPanel({
  state,
  update,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
}) {
  const unlocked = state.bank.flags.goalChangeUnlocked;
  const [value, setValue] = useState(state.bank.dailyGoalMinutes);

  return (
    <div className="rounded-card border border-line bg-white/40 p-5">
      <h3 className="font-display font-bold text-sm mb-1">1日の目標</h3>
      <div className="font-mono text-xl font-bold mb-2">
        {formatMinutes(state.bank.dailyGoalMinutes)}
      </div>
      {unlocked ? (
        <div className="flex gap-3 items-end">
          <label className="flex-1">
            <span className="block text-[11px] text-inkSoft mb-1">新しい目標(分)</span>
            <NumberInput
              min={1}
              value={value}
              onChange={setValue}
              className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-sm"
            />
          </label>
          <button
            onClick={() => update((prev) => updateDailyGoal(prev, value))}
            className="px-5 py-2 rounded-full bg-ink text-paper text-sm font-bold hover:bg-ink/90 transition-colors"
          >
            更新する
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-inkSoft">
          通常は変更できません。「目標時間変更券」を使うと、一度だけ変更できます。
        </p>
      )}
    </div>
  );
}

function ManualLogPanel({
  state,
  update,
  onLog,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
  onLog: () => void;
}) {
  const [minutes, setMinutes] = useState(30);
  const [memo, setMemo] = useState("");

  return (
    <div className="rounded-card border border-line bg-white/40 p-5">
      <h3 className="font-display font-bold text-sm mb-3">今日の学習を記録する</h3>
      <p className="text-[11px] text-inkSoft mb-3">
        タイマー以外で勉強した分を追加できます。今日の実績にそのまま反映されます。
      </p>
      <div className="flex gap-3 mb-3">
        <label className="w-28">
          <span className="block text-[11px] text-inkSoft mb-1">分数</span>
          <NumberInput
            min={1}
            value={minutes}
            onChange={setMinutes}
            className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-sm"
          />
        </label>
        <label className="flex-1">
          <span className="block text-[11px] text-inkSoft mb-1">メモ(任意)</span>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="例: 参考書を読んだ"
            className="w-full rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm"
          />
        </label>
      </div>
      <button
        onClick={() => {
          update((prev) => addManualStudyLog(prev, minutes, memo));
          setMemo("");
          onLog();
        }}
        className="px-5 py-2 rounded-full border border-line text-sm font-bold hover:border-ink/40 transition-colors"
      >
        記録する
      </button>
    </div>
  );
}

function ItemShop({
  state,
  update,
  balance,
  onBuy,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
  balance: number;
  onBuy: () => void;
}) {
  return (
    <div className="rounded-card border border-line bg-white/40 p-5">
      <h3 className="font-display font-bold text-sm mb-3">アイテムショップ</h3>
      <div className="space-y-2.5">
        {ITEMS.map((item) => {
          const affordable = balance >= item.price;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-line/70 bg-paper/60 px-3 py-2.5"
            >
              <HankoStamp char={item.icon} size={34} tone="gold" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">{item.name}</div>
                <div className="text-[11px] text-inkSoft leading-snug">{item.description}</div>
              </div>
              <button
                onClick={() => {
                  update((prev) => purchaseItem(prev, item.id as ItemId));
                  onBuy();
                }}
                disabled={!affordable}
                className="flex-shrink-0 px-3 py-1.5 rounded-full bg-ink text-paper text-xs font-bold hover:bg-ink/90 transition-colors disabled:opacity-30 disabled:hover:bg-ink"
              >
                {item.price}分
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Inventory({
  state,
  update,
  onUse,
}: {
  state: AppState;
  update: (fn: (prev: AppState) => AppState) => void;
  onUse: (label: string) => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const inventory = state.bank.inventory;

  if (inventory.length === 0) return null;

  return (
    <div className="rounded-card border border-line bg-white/40 p-5">
      <h3 className="font-display font-bold text-sm mb-3">持ち物</h3>
      <div className="space-y-2">
        {inventory.map((inv) => {
          const def = getItemDef(inv.itemId);
          const confirming = confirmId === inv.id;
          return (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-lg border border-line/70 bg-paper/60 px-3 py-2.5"
            >
              <HankoStamp char={def.icon} size={30} tone="stamp" />
              <span className="flex-1 text-sm font-bold min-w-0 truncate">{def.name}</span>
              {confirming ? (
                <div className="flex gap-1.5 flex-shrink-0">
                  <span className="text-[11px] text-inkSoft self-center mr-1">使用しますか?</span>
                  <button
                    onClick={() => {
                      update((prev) => useItem(prev, inv.id));
                      onUse(def.icon);
                      setConfirmId(null);
                    }}
                    className="px-2.5 py-1 rounded-full bg-stamp text-paper text-xs font-bold"
                  >
                    はい
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="px-2.5 py-1 rounded-full border border-line text-xs font-bold"
                  >
                    いいえ
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(inv.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full border border-line text-xs font-bold hover:border-ink/40 transition-colors"
                >
                  使う
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Ledger({ state }: { state: AppState }) {
  const entries = state.bank.savingsEntries;
  let running = 0;

  return (
    <div className="rounded-card border border-line bg-white/40 overflow-hidden">
      <h3 className="font-display font-bold text-sm px-5 pt-5">通帳明細</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-inkSoft px-5 pb-5 pt-2">
          毎晩の精算や記帳が行われると、ここに明細が並びます。
        </p>
      ) : (
        <div className="mt-3 punch-holes overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-inkSoft border-t border-line/70">
                <th className="text-left font-normal px-5 py-2">日付</th>
                <th className="text-left font-normal px-2 py-2">内容</th>
                <th className="text-right font-normal px-2 py-2">増減</th>
                <th className="text-right font-normal px-5 py-2">残高</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                running += e.minutes;
                return (
                  <tr key={e.id} className="ledger-line">
                    <td className="px-5 py-2 text-inkSoft whitespace-nowrap">
                      {new Date(e.date).toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-2 py-2 truncate max-w-[160px]">{e.memo}</td>
                    <td
                      className={`px-2 py-2 text-right font-mono ${
                        e.minutes > 0 ? "text-gold" : e.minutes < 0 ? "text-stamp" : "text-inkSoft"
                      }`}
                    >
                      {e.minutes > 0 ? `+${e.minutes}` : e.minutes}
                    </td>
                    <td className="px-5 py-2 text-right font-mono font-bold">{running}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
