import type { Task } from "../types";
import { showNotificationWidget } from "./notifyWidget";
import { playAlarmTone } from "./alarmTones";
import { formatTime } from "./date";

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Single source of truth for "when does this alarm ring?" — used by the
 * form, task cards, Today, toasts, widget and service worker so every
 * message says the same thing. Returns null when no alarm is set.
 * (Validation ensures reminderMinutes <= start minutes, so `at` >= 0.)
 */
export function reminderTimeLabel(task: Task): string | null {
  if (!task.alarmEnabled) return null;
  if (task.reminderMinutes > 0) {
    const startMin = Number(task.startTime.split(":")[0]) * 60 + Number(task.startTime.split(":")[1] ?? 0);
    const at = startMin - task.reminderMinutes;
    const h = String(Math.floor(at / 60)).padStart(2, "0");
    const m = String(at % 60).padStart(2, "0");
    return `Reminds at ${formatTime(`${h}:${m}`)}`;
  }
  return `Alarm at start · ${formatTime(task.startTime)}`;
}

export function alarmWhenLabel(task: Task): string {
  return reminderTimeLabel(task) ?? "No alarm";
}

const FIRE_ICON = "/icons/scheduler-app.png";

/**
 * Real alarm fire (page path). One consistent behaviour:
 *  - a one-shot in-app chime (the AlarmDialog itself rings in a loop),
 *  - an OS notification (vibrates, banner when backgrounded).
 * No floating widget here — the dialog is the in-app surface when the app
 * is visible, so a widget would just duplicate it.
 */
export async function fireNotification(title: string, body: string, tag?: string, _task?: Task) {
  // One-shot chime alert (the visible dialog will keep ringing in a loop).
  playAlarmTone();

  // 2) OS notification (if permitted).
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  // Prefer service worker notification (works while backgrounded on Android)
  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg) {
      await reg.showNotification(title, {
        body,
        tag,
        icon: FIRE_ICON,
        badge: FIRE_ICON,
        vibrate: [200, 100, 200],
        requireInteraction: true,
      } as NotificationOptions);
      return;
    }
  }
  new Notification(title, { body, tag, icon: FIRE_ICON });
}

/**
 * User-initiated TEST notification only (Settings → Test). Shows once:
 * floating widget + chime + OS notification, all labelled as a test
 * so it never reads like a real alarm. Never called on save.
 */
export async function sendTestNotification(task: Task) {
  if (!task.alarmEnabled) return;
  const when = alarmWhenLabel(task);
  const title = `🧪 Test notification`;
  const body = `This is what you'll see for "${task.title}" — ${when}.`;
  // In-app widget (works even without OS permission).
  showNotificationWidget({ task, title, body, whenLabel: when, preview: true });
  // Chime + OS notification.
  playAlarmTone();
  if ("Notification" in window && Notification.permission === "granted") {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    if (reg) {
      await reg.showNotification(title, {
        body,
        tag: `test-${task.id}`,
        icon: FIRE_ICON,
        badge: FIRE_ICON,
        vibrate: [200, 100, 200],
        requireInteraction: true,
      } as NotificationOptions).catch(() => undefined);
    } else {
      new Notification(title, { body, tag: `test-${task.id}`, icon: FIRE_ICON });
    }
  }
}

/** @deprecated Use sendTestNotification — kept as an alias for older imports. */
export const previewTaskNotification = sendTestNotification;
