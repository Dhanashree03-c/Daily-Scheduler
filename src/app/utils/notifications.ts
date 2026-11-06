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

export function alarmWhenLabel(task: Task): string {
  if (!task.alarmEnabled) return "No alarm set";
  if (task.reminderMinutes > 0) {
    const startMin = Number(task.startTime.split(":")[0]) * 60 + Number(task.startTime.split(":")[1] ?? 0);
    const at = startMin - task.reminderMinutes;
    const h = String(Math.floor(Math.max(0, at) / 60)).padStart(2, "0");
    const m = String(Math.max(0, at) % 60).padStart(2, "0");
    return `Reminds at ${formatTime(`${h}:${m}`)}`;
  }
  return `Alarm at start · ${formatTime(task.startTime)}`;
}

const FIRE_ICON = "/icons/scheduler-app.png";

export async function fireNotification(title: string, body: string, tag?: string, task?: Task) {
  // 1) In-app floating widget — always pops (visible every tab).
  if (task) {
    showNotificationWidget({ task, title, body, whenLabel: alarmWhenLabel(task), preview: false });
  }
  // Ring the picked in-app tone (OS notifications keep their system sound).
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

/** Immediately show a preview of this task's notification (used right after save). */
export async function previewTaskNotification(task: Task) {
  if (!task.alarmEnabled) return;
  const title = `🔔 ${task.title}`;
  const body = `Alarm set — ${alarmWhenLabel(task)}. We'll pop up here and notify you at that time.`;
  // In-app widget pops on every device, even without OS permission.
  showNotificationWidget({ task, title, body, whenLabel: alarmWhenLabel(task), preview: true });
  // OS popup too, when allowed — gives the "notification popped" confirmation.
  if ("Notification" in window && Notification.permission === "granted") {
    await fireNotification(title, body, `preview-${task.id}`, task);
  }
}
