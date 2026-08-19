import { AppState, StreakState } from "./types";

export interface LevelDef {
  level: number;
  name: string;
  minMinutes: number;
  stamp: string; // 印影に刻む一文字〜二文字
}

export const LEVELS: LevelDef[] = [
  { level: 1, name: "帳簿見習い", minMinutes: 0, stamp: "初" },
  { level: 2, name: "記帳係", minMinutes: 60, stamp: "記" },
  { level: 3, name: "出納係", minMinutes: 180, stamp: "出" },
  { level: 4, name: "帳簿番人", minMinutes: 360, stamp: "番" },
  { level: 5, name: "台帳の匠", minMinutes: 720, stamp: "匠" },
  { level: 6, name: "記録の賢者", minMinutes: 1440, stamp: "賢" },
  { level: 7, name: "伝説の帳簿係", minMinutes: 2880, stamp: "伝" },
  { level: 8, name: "殿堂入り記帳士", minMinutes: 5760, stamp: "殿" },
];

/** 実際に集中した時間の合計(学習実績・貯金精算の基準) */
export function getTotalFocusMinutes(state: AppState): number {
  return state.focusSessions.reduce((sum, s) => sum + s.minutes, 0);
}

/** レベル判定に使うXP合計(XPブースト分を加算) */
export function getTotalXPMinutes(state: AppState): number {
  return state.focusSessions.reduce(
    (sum, s) => sum + s.minutes + (s.xpBonusMinutes ?? 0),
    0
  );
}

export function getLevelInfo(totalMinutes: number) {
  let current = LEVELS[0];
  let next: LevelDef | null = null;
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalMinutes >= LEVELS[i].minMinutes) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
    }
  }
  const progress = next
    ? (totalMinutes - current.minMinutes) / (next.minMinutes - current.minMinutes)
    : 1;
  return { current, next, progress: Math.min(1, Math.max(0, progress)) };
}

export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  check: (state: AppState, totalMinutes: number) => boolean;
}

export const BADGES: BadgeDef[] = [
  {
    id: "first-session",
    label: "はじめの一歩",
    description: "はじめて集中セッションを完了した",
    check: (s) => s.focusSessions.length >= 1,
  },
  {
    id: "streak-3",
    label: "三日坊主克服",
    description: "3日連続で学習を記録した",
    check: (s) => s.streak.best >= 3,
  },
  {
    id: "streak-7",
    label: "一週間皆勤",
    description: "7日連続で学習を記録した",
    check: (s) => s.streak.best >= 7,
  },
  {
    id: "streak-30",
    label: "継続は力なり",
    description: "30日連続で学習を記録した",
    check: (s) => s.streak.best >= 30,
  },
  {
    id: "minutes-600",
    label: "10時間の貯蓄",
    description: "累計10時間の集中を貯めた",
    check: (_s, total) => total >= 600,
  },
  {
    id: "minutes-3000",
    label: "50時間の貯蓄",
    description: "累計50時間の集中を貯めた",
    check: (_s, total) => total >= 3000,
  },
  {
    id: "sessions-20",
    label: "帳簿の常連",
    description: "20回のセッションを記録した",
    check: (s) => s.focusSessions.length >= 20,
  },
  {
    id: "exam-3",
    label: "模試の記録係",
    description: "模試結果を3回記録した",
    check: (s) => s.exam.mockResults.length >= 3,
  },
];

/** 今日の学習をストリークに反映する(1日1回だけ加算) */
export function bumpStreak(streak: StreakState): StreakState {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(today.getDate()).padStart(2, "0")}`;

  if (streak.lastDate === todayStr) return streak; // 本日はすでに記録済み

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(
    yesterday.getMonth() + 1
  ).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

  const nextCurrent = streak.lastDate === yesterdayStr ? streak.current + 1 : 1;
  return {
    current: nextCurrent,
    best: Math.max(streak.best, nextCurrent),
    lastDate: todayStr,
  };
}
