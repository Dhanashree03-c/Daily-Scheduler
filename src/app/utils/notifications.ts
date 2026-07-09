export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export async function fireNotification(title: string, body: string, tag?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  // Prefer service worker notification (works while backgrounded on Android)
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg) {
      reg.showNotification(title, {
        body,
        tag,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,
      } as NotificationOptions);
      return;
    }
  }
  new Notification(title, { body, tag });
}