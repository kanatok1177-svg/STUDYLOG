"use client";

import { useEffect, useRef } from "react";
import { AppState } from "./types";
import {
  getLastActiveDate,
  markInactivityNotified,
  markMorningNotified,
  pickInactivityNotification,
  pickMorningNotification,
} from "./dailyNotifications";
import { sendNotification } from "./notify";

const CHECK_INTERVAL_MS = 60_000;

/**
 * 「毎朝8時」「3日間未記録」の通知チェックを行うフック。
 * サーバー/Service Workerを持たないため、タブを開いている間だけ
 * 1分おきに条件を確認する簡易実装(タブを閉じている間は送れない)。
 */
export function useDailyNotifications(
  state: AppState,
  update: (fn: (prev: AppState) => AppState) => void,
  enabled: boolean
) {
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!enabled) return;

    function check() {
      const now = new Date();
      const current = stateRef.current;

      const morning = pickMorningNotification(current, now);
      if (morning) {
        sendNotification(morning.title, morning.body);
        update((prev) => markMorningNotified(prev, now));
      }

      const inactivity = pickInactivityNotification(current, now);
      if (inactivity) {
        sendNotification(inactivity.title, inactivity.body);
        const lastActive = getLastActiveDate(current);
        if (lastActive) {
          update((prev) => markInactivityNotified(prev, lastActive));
        }
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [enabled, update]);
}
