import type { Task } from "../types";
import { toMinutes } from "./date";
import { getAllItems } from "./storage";

export type AlarmKind = "reminder" | "start" | "end";

export interface ScheduledAlarm {
  id: string;
  fireAt: number;
  title: string;
  body: string;
  tag: string;
  taskId: string;
  type: AlarmKind;
}

function fireAtFor(task: Task, type: AlarmKind): number | null {
  const start = toMinutes(task.startTime);
  const end = toMinutes(task.endTime);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  const [y, mo, d] = task.date.split("-").map(Number);
  if (!y || !mo || !d) return null;
  const base = new Date(y, mo - 1, d, 0, 0, 0, 0).getTime();
  const minutes = type === "reminder" ? start - task.reminderMinutes : type === "start" ? start : end;
  if (Number.isNaN(minutes) || minutes < 0 || minutes >= 1440) return null;
  return base + minutes * 60_000;
}

const TITLES: Record<AlarmKind, (t: Task) => string> = {
  reminder: (t) => `Coming up: ${t.title}`,
  start: (t) => `Now: ${t.title}`,
  end: (t) => `Time's up: ${t.title}`,
};
const BODIES: Record<AlarmKind, (t: Task) => string> = {
  reminder: (t) => `Starts in ${t.reminderMinutes} min`,
  start: () => "Time to start this.",
  end: () => "Move on to your next task.",
};

/**
 * Build the future-only alarm schedule (today + tomorrow) for the worker.
 * Past alarms are handled by the catch-up path in useScheduler, not here.
 */
export function buildAlarmSchedule(tasks: Task[] = getAllItems(), nowMs: number = Date.now()): ScheduledAlarm[] {
  const out: ScheduledAlarm[] = [];
  const todayStr = (() => {
    const d = new Date(nowMs);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  for (const task of tasks) {
    if (!task.alarmEnabled || task.completed || task.skipped) continue;
    const types: AlarmKind[] = task.reminderMinutes > 0 ? ["reminder", "start", "end"] : ["start", "end"];
    for (const type of types) {
      const fireAt = fireAtFor(task, type);
      if (fireAt === null || fireAt <= nowMs) continue;
      // Only schedule a 2-day horizon — the page re-syncs on every change.
      if (fireAt - nowMs > 2 * 24 * 60 * 60_000) continue;
      void todayStr;
      out.push({
        id: `${task.id}-${type}-${task.date}`,
        fireAt,
        title: TITLES[type](task),
        body: BODIES[type](task),
        tag: `${task.id}-${type}-${task.date}`,
        taskId: task.id,
        type,
      });
    }
  }
  return out.sort((a, b) => a.fireAt - b.fireAt);
}

export async function syncAlarmsToServiceWorker(tasks?: Task[]): Promise<number> {
  const alarms = buildAlarmSchedule(tasks);
  try {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    const worker = reg?.active ?? (await navigator.serviceWorker.getRegistration())?.active;
    if (!worker) return alarms.length; // worker not ready yet; page timers still cover us.
    worker.postMessage({ type: "SCHEDULE_ALARMS", alarms });
  } catch {
    /* SW unavailable — page poll is the fallback */
  }
  return alarms.length;
}

export async function clearServiceWorkerAlarms() {
  try {
    const reg = await navigator.serviceWorker.ready.catch(() => null);
    reg?.active?.postMessage({ type: "CLEAR_ALARMS" });
  } catch {
    /* ignore */
  }
}

/* ---------------- Wake Lock ---------------- */

let wakeLock: any = null;

export async function requestWakeLock(): Promise<boolean> {
  if (!("wakeLock" in navigator)) return false;
  try {
    wakeLock = await (navigator as any).wakeLock.request("screen");
    wakeLock.addEventListener?.("release", () => {
      wakeLock = null;
    });
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock() {
  try {
    await wakeLock?.release?.();
  } catch {
    /* ignore */
  }
  wakeLock = null;
}
