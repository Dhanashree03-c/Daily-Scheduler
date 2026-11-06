import { useEffect, useRef, useState, useCallback } from "react";
import type { Task } from "../types";
import { getItemsForDate, getAllItems, TASKS_CHANGED_EVENT } from "../utils/storage";
import { fireNotification } from "../utils/notifications";
import { syncAlarmsToServiceWorker, requestWakeLock, releaseWakeLock } from "../utils/alarmScheduler";
import { getLocalDateStr, toMinutes } from "../utils/date";

export type AlarmType = "start" | "end" | "reminder";

export interface Alarm {
  taskId: string;
  type: AlarmType;
  snoozedUntil?: number; // epoch ms
  missed?: boolean;
}

/** End alarms only fire shortly after a task ends (avoids spamming on open). */
const END_WINDOW_MINUTES = 15;

/**
 * Single scheduler instance (mounted once in SchedulerProvider).
 *
 * How alarms ring when the app is closed:
 *  1. Page poll (15s) — fires while the tab is open.
 *  2. Service Worker schedule (utils/alarmScheduler + src/sw.ts) — the worker
 *     keeps timers after tab close/minimise and calls showNotification itself.
 *  3. Missed-alarm catch-up — on open/focus, anything whose time passed while
 *     the app was closed fires immediately as "Missed" (see tryFire below).
 *
 * Honest limit: without a server doing Web Push, NO local-only web page can
 * wake the OS after the browser process itself is fully killed. The worker
 * covers tab-closed/browser-open + sleep; catch-up covers the rest.
 */
export function useScheduler() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [now, setNow] = useState(new Date());
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const firedRef = useRef<Set<string>>(new Set()); // dedupe key: `${taskId}-${type}-${date}`
  const prevFingerprints = useRef<Map<string, string>>(new Map());

  const fingerprint = useCallback((t: Task) =>
    `${t.title}|${t.date}|${t.startTime}|${t.endTime}|${t.alarmEnabled}|${t.reminderMinutes}|${t.completed}|${t.skipped}`,
  []);

  const refresh = useCallback(() => {
    const next = getItemsForDate(getLocalDateStr());
    // Integrity: if a task was edited/deleted/completed, clear its stale
    // fired-keys + pending dialogs so the new schedule actually re-arms.
    const prevFp = prevFingerprints.current;
    const nextFp = new Map(next.map((t) => [t.id, fingerprint(t)]));
    for (const t of next) {
      const was = prevFp.get(t.id);
      const is = nextFp.get(t.id);
      if (was !== undefined && was !== is) {
        for (const key of [...firedRef.current]) {
          if (key.startsWith(`${t.id}-`)) firedRef.current.delete(key);
        }
        setAlarms((prev) => prev.filter((a) => a.taskId !== t.id));
      }
    }
    for (const id of [...prevFp.keys()]) {
      if (!nextFp.has(id)) {
        for (const key of [...firedRef.current]) {
          if (key.startsWith(`${id}-`)) firedRef.current.delete(key);
        }
        setAlarms((prev) => prev.filter((a) => a.taskId !== id));
      }
    }
    prevFingerprints.current = nextFp;
    setTasks(next);
  }, [fingerprint]);

  useEffect(() => {
    refresh();
    const poll = setInterval(() => {
      setNow(new Date());
      refresh();
    }, 15_000);
    const onChange = () => {
      refresh();
      void syncAlarmsToServiceWorker(getAllItems());
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setNow(new Date());
        refresh();
        void syncAlarmsToServiceWorker(getAllItems());
        // Re-acquire the wake lock that the OS auto-releases on hide.
        void requestWakeLock();
      } else {
        void releaseWakeLock();
      }
    };
    window.addEventListener(TASKS_CHANGED_EVENT, onChange);
    window.addEventListener("focus", onChange);
    document.addEventListener("visibilitychange", onVisible);
    // Initial sync so the worker starts ringing even if this tab closes.
    void syncAlarmsToServiceWorker(getAllItems());
    // Keep the device awake while the app is open so alarms fire on time
    // even with the screen off. Best-effort; released automatically on hide.
    void requestWakeLock();
    return () => {
      clearInterval(poll);
      window.removeEventListener(TASKS_CHANGED_EVENT, onChange);
      window.removeEventListener("focus", onChange);
      document.removeEventListener("visibilitychange", onVisible);
      void releaseWakeLock();
    };
  }, [refresh]);

  // Service-worker-fired alarms: show the in-app dialog/widget (the worker
  // already showed the OS notification, so don't re-notify here).
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const msg = event.data as
        | { type?: string; alarm?: { id: string; taskId: string; type: string } }
        | undefined;
      if (!msg || msg.type !== "ALARM_FIRED" || !msg.alarm) return;
      const { taskId, type } = msg.alarm;
      const key = msg.alarm.id;
      if (firedRef.current.has(key)) return; // page poll already fired it
      firedRef.current.add(key);
      const task = getAllItems().find((t) => t.id === taskId);
      if (!task || task.completed || task.skipped) return;
      setAlarms((prev) => {
        if (prev.some((a) => a.taskId === taskId && a.type === type)) return prev;
        return [...prev, { taskId, type: type as AlarmType }];
      });
      // No extra tone here — the AlarmDialog rings in a loop (single source).
      // Also refresh so the task list is current.
      refresh();
    };
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onMessage as EventListener);
      return () => navigator.serviceWorker.removeEventListener("message", onMessage as EventListener);
    }
  }, [refresh]);

  useEffect(() => {
    const nowMs = now.getTime();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    tasks.forEach((task) => {
      // Reminders are opt-in.
      if (!task.alarmEnabled) return;
      if (task.completed || task.skipped) return;
      const start = toMinutes(task.startTime);
      const end = toMinutes(task.endTime);
      if (Number.isNaN(start) || Number.isNaN(end)) return;
      const reminderAt = start - task.reminderMinutes;

      const tryFire = (
        type: AlarmType,
        condition: boolean,
        title: string,
        body: string,
        missed = false
      ) => {
        const key = `${task.id}-${type}-${task.date}`;
        if (!condition || firedRef.current.has(key)) return;
        firedRef.current.add(key);
        void fireNotification(title, body, key, task);
        setAlarms((prev) => [...prev, { taskId: task.id, type, missed }]);
      };

      // Reminder: fires in-window, or as a "missed" catch-up if the app was
      // closed when the remind time passed but it's still today.
      // If the start alarm is ALSO missed in this same tick, only the start
      // fires — two popups at once is never helpful.
      const startWillFire =
        nowMin >= start && nowMin < end && !firedRef.current.has(`${task.id}-start-${task.date}`);
      if (task.reminderMinutes > 0) {
        const inWindow = nowMin >= reminderAt && nowMin < start;
        const missed =
          nowMin >= reminderAt && nowMin >= start && nowMin <= end && !startWillFire;
        tryFire(
          "reminder",
          inWindow || missed,
          inWindow ? `Coming up: ${task.title}` : `Missed reminder: ${task.title}`,
          inWindow ? `Starts in ${task.reminderMinutes} min` : "The app was closed — catching you up now.",
          missed && !inWindow
        );
      }
      // Start: fires in-task — including as missed catch-up when we reopen
      // the app while the task is already running (idle the first minute
      // counts as "on time" for labelling).
      tryFire(
        "start",
        nowMin >= start && nowMin < end,
        `Now: ${task.title}`,
        "Time to start this.",
        nowMin > start
      );
      // Only fire "end" if the task ended recently (not hours ago).
      tryFire(
        "end",
        nowMin >= end && nowMin < end + END_WINDOW_MINUTES && !task.completed,
        `Time's up: ${task.title}`,
        "Move on to your next task."
      );
    });

    // clear expired snoozes so they show again
    setAlarms((prev) =>
      prev.map((a) => (a.snoozedUntil && a.snoozedUntil <= nowMs ? { ...a, snoozedUntil: undefined } : a))
    );
  }, [now, tasks]);

  const getActiveAlarms = useCallback(() => {
    const nowMs = Date.now();
    return alarms.filter((a) => !a.snoozedUntil || a.snoozedUntil <= nowMs);
  }, [alarms]);

  const dismissAlarm = useCallback((taskId: string, type: AlarmType) => {
    setAlarms((prev) => prev.filter((a) => !(a.taskId === taskId && a.type === type)));
  }, []);

  const snoozeAlarm = useCallback((taskId: string, type: AlarmType, minutes = 5) => {
    setAlarms((prev) =>
      prev.map((a) =>
        a.taskId === taskId && a.type === type
          ? { ...a, snoozedUntil: Date.now() + minutes * 60_000 }
          : a
      )
    );
    // Re-sync so the snoozed time is what the worker fires next.
    void syncAlarmsToServiceWorker(getAllItems());
  }, []);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const upcoming = tasks.filter((t) => !t.completed && !t.skipped);
  const currentTask = upcoming.find((t) => {
    const s = toMinutes(t.startTime);
    const e = toMinutes(t.endTime);
    return !Number.isNaN(s) && !Number.isNaN(e) && s <= nowMin && nowMin < e;
  });
  const nextTask = upcoming
    .filter((t) => {
      const s = toMinutes(t.startTime);
      return !Number.isNaN(s) && s > nowMin;
    })
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))[0];
  const minutesLeft = currentTask ? Math.max(0, toMinutes(currentTask.endTime) - nowMin) : null;

  return {
    tasks,
    now,
    currentTask,
    nextTask,
    minutesLeft,
    getActiveAlarms,
    snoozeAlarm,
    dismissAlarm,
    refresh,
  };
}

export type Scheduler = ReturnType<typeof useScheduler>;
