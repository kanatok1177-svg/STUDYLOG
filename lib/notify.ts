"use client";

// ブラウザのNotification APIまわりの薄いラッパー。
// 「送信できる状態か」を毎回確認してから実際の送信を行う。
//
// 注意: Android版Chromeなど一部の環境では new Notification() を直接呼ぶと
// 「Illegal constructor」で例外を投げる(Service Worker経由でしか通知を
// 出せない制限があるため)。ここで例外を握りつぶさずに投げてしまうと、
// 呼び出し元(タイマーのインターバル処理など)がそのまま落ちて
// アプリ全体がクラッシュしてしまうので、必ずtry/catchで受け止め、
// 可能であればService Worker経由にフォールバックする。

export type NotifyPermission = NotificationPermission | "unsupported";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotifyPermission {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export function requestNotificationPermission(): Promise<NotifyPermission> {
  if (!isNotificationSupported()) return Promise.resolve("unsupported");
  return Notification.requestPermission();
}

/** 通知表示用のService Workerを登録しておく(失敗しても無視する) */
export function registerNotificationServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // 登録に失敗しても、その場合は単に通知が出せないだけでアプリは継続する
  });
}

/**
 * 許可されているかを確認してから送信する。未許可/未対応なら何もしない。
 * new Notification() が使えない環境ではService Worker経由にフォールバックし、
 * どちらも失敗した場合は静かに諦める(例外を外に投げない)。
 */
export async function sendNotification(title: string, body: string): Promise<void> {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, { body, tag: "study-bank" });
    return;
  } catch {
    // Illegal constructor等。Service Workerでのフォールバックを試みる。
  }

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.showNotification(title, { body, tag: "study-bank" });
    }
  } catch {
    // これも失敗した場合は通知を諦める(アプリの動作は継続させる)
  }
}
