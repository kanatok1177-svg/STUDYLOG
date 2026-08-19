"use client";

// ブラウザのNotification APIまわりの薄いラッパー。
// 「送信できる状態か」を毎回確認してから実際の送信を行う。

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

/** 許可されているかを確認してから送信する。未許可/未対応なら何もしない。 */
export function sendNotification(title: string, body: string): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, { body, tag: "study-bank" });
}
