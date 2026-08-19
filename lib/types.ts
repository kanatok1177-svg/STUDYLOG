export type TimerMode = "pomodoro" | "stack" | "interval";

export interface FocusSession {
  id: string;
  mode: TimerMode;
  minutes: number;
  xpBonusMinutes?: number; // XPブースト適用分(レベル計算にのみ加算、学習実績には含めない)
  completedAt: string; // ISO date
  awayCount: number;
}

export type LedgerSource =
  | "focus" // 集中ラボからの実績記録(参考表示用)
  | "manual" // 手動での学習記録
  | "settlement-deposit" // 日次精算による貯金
  | "repay" // 借金への返済(出金)
  | "purchase" // アイテム購入(出金)
  | "item-use"; // アイテム使用ログ(金額を伴わない場合はminutes=0)

export interface SavingsEntry {
  id: string;
  minutes: number; // 正=入金 / 負=出金
  memo: string;
  date: string; // ISO date
  source: LedgerSource;
}

export interface DailyStudyLog {
  id: string;
  minutes: number;
  date: string; // YYYY-MM-DD
  memo?: string;
}

export type DebtLogType = "borrow" | "interest" | "repay" | "forgiven";

export interface DebtLogEntry {
  id: string;
  type: DebtLogType;
  minutes: number;
  date: string; // YYYY-MM-DD
}

export interface WeeklyChallengeState {
  active: boolean;
  pendingSetup: boolean; // 強制発動直後、目標時間の入力待ち
  targetDailyMinutes: number;
  dayResults: boolean[]; // 今の挑戦での日別結果(達成=true)
}

export type ItemId =
  | "streak-revive"
  | "interest-skip"
  | "miss-ticket"
  | "xp-boost"
  | "rest-day"
  | "away-reset"
  | "goal-change";

export interface InventoryItem {
  id: string;
  itemId: ItemId;
  acquiredAt: string; // ISO date
}

export interface BankFlags {
  xpBoostPending: boolean;
  interestSkipPending: number;
  restDayDates: string[]; // 休養券を使った日(YYYY-MM-DD)
  missTicketDates: string[]; // 見逃しチケットを使った日(YYYY-MM-DD)
  goalChangeUnlocked: boolean;
}

export interface BankState {
  dailyGoalMinutes: number;
  lastSettledDate: string | null; // 最後に精算済みの日(YYYY-MM-DD)
  dailyLogs: DailyStudyLog[]; // 手動での「今日の学習」記録
  savingsEntries: SavingsEntry[]; // 通帳明細(貯金の増減)
  debtAmount: number;
  debtLog: DebtLogEntry[];
  weeklyChallenge: WeeklyChallengeState | null;
  inventory: InventoryItem[];
  flags: BankFlags;
}

export interface MockExamResult {
  id: string;
  name: string;
  date: string; // ISO date
  hensachi: number;
  subject?: string;
}

export interface SubjectLog {
  id: string;
  subject: string;
  minutes: number;
  date: string; // ISO date
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface StreakState {
  current: number;
  best: number;
  lastDate: string | null; // YYYY-MM-DD
}

export interface NotificationState {
  lastMorningNotifDate: string | null; // 朝の定期通知を最後に送った日(YYYY-MM-DD)
  lastInactivityNotifiedFor: string | null; // 未記録通知の対象とした「最終学習日」(重複送信防止)
}

export interface AppState {
  onboarded: boolean; // 初回の目標時間設定(オンボーディング)が完了したか
  focusSessions: FocusSession[];
  streak: StreakState;
  bank: BankState;
  notifications: NotificationState;
  exam: {
    mockResults: MockExamResult[];
    subjectLogs: SubjectLog[];
    todos: TodoItem[];
  };
}

export const DEFAULT_STATE: AppState = {
  onboarded: false,
  focusSessions: [],
  streak: { current: 0, best: 0, lastDate: null },
  notifications: { lastMorningNotifDate: null, lastInactivityNotifiedFor: null },
  bank: {
    dailyGoalMinutes: 60,
    lastSettledDate: null,
    dailyLogs: [],
    savingsEntries: [],
    debtAmount: 0,
    debtLog: [],
    weeklyChallenge: null,
    inventory: [],
    flags: {
      xpBoostPending: false,
      interestSkipPending: 0,
      restDayDates: [],
      missTicketDates: [],
      goalChangeUnlocked: false,
    },
  },
  exam: { mockResults: [], subjectLogs: [], todos: [] },
};
