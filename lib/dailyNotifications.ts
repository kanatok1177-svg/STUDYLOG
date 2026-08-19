import { AppState } from "./types";
import { dateStrFromDate } from "./util";

// 「毎朝8時」「3日間未記録」の定型通知まわり。
// (このアプリはサーバーを持たないため、実際にはタブを開いている間の
//  定期チェックで代用している。詳しくは useDailyNotifications を参照)

const MORNING_TITLE = "📘 勉強銀行";
const INACTIVITY_TITLE = "📘 勉強銀行";

const MORNING_DEBT_MESSAGES = [
  "昨日は目標に届かず、少し借り入れが増えました。今日の学習でしっかり返済していきましょう。",
  "利息が積もる前に、今日は少し多めに記帳してみませんか?",
  "借入残高があります。今日の一歩が、そのまま返済になります。",
  "昨日の分は借金として記帳されています。今日、貯金に変えていきましょう。",
];

const MORNING_CLEAR_MESSAGES = [
  "今日も目標達成で、貯金を増やしていきましょう。",
  "絶好調です。今日も記帳を忘れずに。",
  "昨日は黒字達成でした。この調子で貯金を積み上げましょう。",
  "今日の学習が、そのまま貯金になります。窓口は開いています。",
];

const INACTIVITY_MESSAGE = "口座がしばらく動いていません。少しだけでも、また記帳してみませんか?";
const INACTIVITY_THRESHOLD_DAYS = 3;

export interface NotifContent {
  title: string;
  body: string;
}

function pickRandom(list: string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

/** 学習記録(集中セッション・手動記録)のうち、最後に何かが記帳された日 */
export function getLastActiveDate(state: AppState): string | null {
  const dates = [
    ...state.focusSessions.map((s) => dateStrFromDate(new Date(s.completedAt))),
    ...state.bank.dailyLogs.map((l) => l.date),
  ];
  if (dates.length === 0) return null;
  return dates.sort().at(-1) ?? null;
}

function daysBetween(fromISO: string, toISO: string): number {
  const from = new Date(`${fromISO}T00:00:00`);
  const to = new Date(`${toISO}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** 8時以降で、その日まだ朝の通知を送っていなければ内容を返す(送信自体はしない) */
export function pickMorningNotification(state: AppState, now: Date): NotifContent | null {
  if (now.getHours() < 8) return null;
  const today = dateStrFromDate(now);
  if (state.notifications.lastMorningNotifDate === today) return null;
  const hasDebt = state.bank.debtAmount > 0;
  const body = pickRandom(hasDebt ? MORNING_DEBT_MESSAGES : MORNING_CLEAR_MESSAGES);
  return { title: MORNING_TITLE, body };
}

export function markMorningNotified(state: AppState, now: Date): AppState {
  return {
    ...state,
    notifications: { ...state.notifications, lastMorningNotifDate: dateStrFromDate(now) },
  };
}

/** 3日以上未記録で、その未記録期間についてまだ通知していなければ内容を返す */
export function pickInactivityNotification(state: AppState, now: Date): NotifContent | null {
  const lastActive = getLastActiveDate(state);
  if (!lastActive) return null; // 一度も記帳していない場合は対象外
  if (state.notifications.lastInactivityNotifiedFor === lastActive) return null;
  const diff = daysBetween(lastActive, dateStrFromDate(now));
  if (diff < INACTIVITY_THRESHOLD_DAYS) return null;
  return { title: INACTIVITY_TITLE, body: INACTIVITY_MESSAGE };
}

export function markInactivityNotified(state: AppState, lastActiveDate: string): AppState {
  return {
    ...state,
    notifications: { ...state.notifications, lastInactivityNotifiedFor: lastActiveDate },
  };
}
