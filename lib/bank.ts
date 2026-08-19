import { AppState, BankState, DebtLogEntry, ItemId, SavingsEntry } from "./types";
import { uid, todayISO, dateStrFromDate, addDaysStr } from "./util";
import { getItemDef } from "./items";

export function getSavingsBalance(bank: BankState): number {
  return bank.savingsEntries.reduce((sum, e) => sum + e.minutes, 0);
}

function getStudiedMinutesForDate(
  focusSessions: AppState["focusSessions"],
  dailyLogs: BankState["dailyLogs"],
  date: string
): number {
  const fromSessions = focusSessions
    .filter((s) => dateStrFromDate(new Date(s.completedAt)) === date)
    .reduce((sum, s) => sum + s.minutes, 0);
  const fromLogs = dailyLogs
    .filter((l) => l.date === date)
    .reduce((sum, l) => sum + l.minutes, 0);
  return fromSessions + fromLogs;
}

/** 1日分の精算(貯金/借金/利息/週間チャレンジ判定)を行う */
function settleOneDay(
  focusSessions: AppState["focusSessions"],
  bank: BankState,
  date: string
): BankState {
  const isRestDay = bank.flags.restDayDates.includes(date);
  const studied = getStudiedMinutesForDate(focusSessions, bank.dailyLogs, date);
  const goal = bank.dailyGoalMinutes;

  let savingsEntries = bank.savingsEntries;
  let debtAmount = bank.debtAmount;
  let debtLog = bank.debtLog;
  let flags = bank.flags;

  if (isRestDay) {
    // 休養券適用日: 貯金も借金も発生しない
  } else if (studied >= goal) {
    const surplus = studied - goal;
    if (surplus > 0) {
      savingsEntries = [
        ...savingsEntries,
        {
          id: uid(),
          minutes: surplus,
          memo: `${date} の貯金(目標達成)`,
          date,
          source: "settlement-deposit",
        },
      ];
    }
  } else {
    const deficit = goal - studied;
    debtAmount += deficit;
    debtLog = [...debtLog, { id: uid(), type: "borrow", minutes: deficit, date }];
  }

  // 利息(前日までの借金が残っている場合に発生)
  if (debtAmount > 0) {
    if (flags.interestSkipPending > 0) {
      flags = { ...flags, interestSkipPending: flags.interestSkipPending - 1 };
    } else {
      const interest = Math.round(debtAmount * 0.1);
      if (interest > 0) {
        debtAmount += interest;
        debtLog = [...debtLog, { id: uid(), type: "interest", minutes: interest, date }];
      }
    }
  }

  // 1週間チャレンジの日別判定
  let weeklyChallenge = bank.weeklyChallenge;
  if (weeklyChallenge && weeklyChallenge.active && !weeklyChallenge.pendingSetup) {
    const missUsed = flags.missTicketDates.includes(date);
    const achieved = missUsed || studied >= weeklyChallenge.targetDailyMinutes;
    if (achieved) {
      const dayResults = [...weeklyChallenge.dayResults, true];
      if (dayResults.length >= 7) {
        debtLog = [...debtLog, { id: uid(), type: "forgiven", minutes: debtAmount, date }];
        debtAmount = 0;
        weeklyChallenge = null;
      } else {
        weeklyChallenge = { ...weeklyChallenge, dayResults };
      }
    } else {
      weeklyChallenge = { ...weeklyChallenge, dayResults: [] };
    }
  }

  // 借金が目標×3日分を超えたら、強制的に1週間チャレンジを発動
  if (!weeklyChallenge && debtAmount >= goal * 3 && goal > 0) {
    weeklyChallenge = {
      active: true,
      pendingSetup: true,
      targetDailyMinutes: goal,
      dayResults: [],
    };
  }

  return { ...bank, savingsEntries, debtAmount, debtLog, flags, weeklyChallenge };
}

/** アプリを開くたびに呼び、未精算の日をまとめて精算する */
export function runDailySettlement(state: AppState): AppState {
  const today = todayISO();
  const bank = state.bank;

  if (!bank.lastSettledDate) {
    // 初回起動: 今日より前は精算対象がないので、基準日だけ設定する
    return { ...state, bank: { ...bank, lastSettledDate: addDaysStr(today, -1) } };
  }

  if (bank.lastSettledDate >= today) return state;

  let working = bank;
  let cursor = addDaysStr(bank.lastSettledDate, 1);
  while (cursor < today) {
    working = settleOneDay(state.focusSessions, working, cursor);
    cursor = addDaysStr(cursor, 1);
  }
  working = { ...working, lastSettledDate: addDaysStr(today, -1) };

  return { ...state, bank: working };
}

export function addManualStudyLog(state: AppState, minutes: number, memo: string): AppState {
  if (minutes <= 0) return state;
  return {
    ...state,
    bank: {
      ...state.bank,
      dailyLogs: [
        ...state.bank.dailyLogs,
        { id: uid(), minutes, date: todayISO(), memo: memo || undefined },
      ],
    },
  };
}

export function repayDebt(state: AppState, minutes: number): AppState {
  const bank = state.bank;
  const balance = getSavingsBalance(bank);
  const actual = Math.max(0, Math.min(minutes, balance, bank.debtAmount));
  if (actual <= 0) return state;

  const entry: SavingsEntry = {
    id: uid(),
    minutes: -actual,
    memo: "借金の返済",
    date: todayISO(),
    source: "repay",
  };
  const debtLogEntry: DebtLogEntry = {
    id: uid(),
    type: "repay",
    minutes: actual,
    date: todayISO(),
  };

  return {
    ...state,
    bank: {
      ...bank,
      savingsEntries: [...bank.savingsEntries, entry],
      debtAmount: bank.debtAmount - actual,
      debtLog: [...bank.debtLog, debtLogEntry],
    },
  };
}

export function updateDailyGoal(state: AppState, newGoal: number): AppState {
  if (!state.bank.flags.goalChangeUnlocked) return state;
  if (newGoal <= 0) return state;
  return {
    ...state,
    bank: {
      ...state.bank,
      dailyGoalMinutes: newGoal,
      flags: { ...state.bank.flags, goalChangeUnlocked: false },
    },
  };
}

export function setupWeeklyChallenge(state: AppState, targetDailyMinutes: number): AppState {
  if (!state.bank.weeklyChallenge?.pendingSetup) return state;
  if (targetDailyMinutes <= 0) return state;
  return {
    ...state,
    bank: {
      ...state.bank,
      weeklyChallenge: {
        active: true,
        pendingSetup: false,
        targetDailyMinutes,
        dayResults: [],
      },
    },
  };
}

export function purchaseItem(state: AppState, itemId: ItemId): AppState {
  const def = getItemDef(itemId);
  const bank = state.bank;
  const balance = getSavingsBalance(bank);
  if (balance < def.price) return state;

  const entry: SavingsEntry = {
    id: uid(),
    minutes: -def.price,
    memo: `出金: ${def.name}を購入`,
    date: todayISO(),
    source: "purchase",
  };

  return {
    ...state,
    bank: {
      ...bank,
      savingsEntries: [...bank.savingsEntries, entry],
      inventory: [
        ...bank.inventory,
        { id: uid(), itemId, acquiredAt: new Date().toISOString() },
      ],
    },
  };
}

export function useItem(state: AppState, inventoryId: string): AppState {
  const item = state.bank.inventory.find((i) => i.id === inventoryId);
  if (!item) return state;

  const def = getItemDef(item.itemId);
  const bank = state.bank;
  const today = todayISO();
  let nextState: AppState = {
    ...state,
    bank: {
      ...bank,
      inventory: bank.inventory.filter((i) => i.id !== inventoryId),
      savingsEntries: [
        ...bank.savingsEntries,
        { id: uid(), minutes: 0, memo: `使用: ${def.name}`, date: today, source: "item-use" },
      ],
      flags: { ...bank.flags },
    },
  };

  switch (item.itemId) {
    case "streak-revive":
      nextState = {
        ...nextState,
        streak: { ...nextState.streak, current: nextState.streak.best },
      };
      break;
    case "interest-skip":
      nextState.bank.flags.interestSkipPending += 1;
      break;
    case "miss-ticket":
      nextState.bank.flags.missTicketDates = [...nextState.bank.flags.missTicketDates, today];
      break;
    case "xp-boost":
      nextState.bank.flags.xpBoostPending = true;
      break;
    case "rest-day":
      nextState.bank.flags.restDayDates = [...nextState.bank.flags.restDayDates, today];
      break;
    case "away-reset": {
      const sessions = [...nextState.focusSessions];
      if (sessions.length > 0) {
        sessions[sessions.length - 1] = { ...sessions[sessions.length - 1], awayCount: 0 };
      }
      nextState = { ...nextState, focusSessions: sessions };
      break;
    }
    case "goal-change":
      nextState.bank.flags.goalChangeUnlocked = true;
      break;
  }

  return nextState;
}

export function getTodayStudiedMinutes(state: AppState): number {
  return getStudiedMinutesForDate(state.focusSessions, state.bank.dailyLogs, todayISO());
}
