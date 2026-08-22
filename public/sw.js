// 通知表示専用の最小構成Service Worker。
// (Androidの一部ブラウザは new Notification() を直接使えず、
//  ServiceWorkerRegistration.showNotification() 経由でのみ通知を出せるため)

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      if (list.length > 0) {
        return list[0].focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    })
  );
});
