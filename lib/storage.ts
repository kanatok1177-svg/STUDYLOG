"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, DEFAULT_STATE } from "./types";
import { runDailySettlement } from "./bank";

export { uid, todayISO } from "./util";

const STORAGE_KEY = "nextk-study-hub-v1";

function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    // 既存データに新フィールドが無い場合の補完(将来のバージョンアップ対策)
    return {
      ...DEFAULT_STATE,
      ...parsed,
      streak: { ...DEFAULT_STATE.streak, ...(parsed.streak ?? {}) },
      notifications: { ...DEFAULT_STATE.notifications, ...(parsed.notifications ?? {}) },
      bank: {
        ...DEFAULT_STATE.bank,
        ...(parsed.bank ?? {}),
        flags: { ...DEFAULT_STATE.bank.flags, ...(parsed.bank?.flags ?? {}) },
      },
      exam: { ...DEFAULT_STATE.exam, ...(parsed.exam ?? {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    setState(runDailySettlement(loadState()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 保存失敗(容量超過など)は静かに無視
    }
  }, [state, hydrated]);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => updater(prev));
  }, []);

  return { state, update, hydrated };
}
