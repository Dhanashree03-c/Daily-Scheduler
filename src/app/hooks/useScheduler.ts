import { useEffect, useRef, useState, useCallback } from "react";
import type { Task } from "../types";
import { getItemsForDate, TASKS_CHANGED_EVENT } from "../utils/storage";
import { fireNotification } from "../utils/notifications";
import { getLocalDateStr, toMinutes } from "../utils/date";

export type AlarmType = "start" | "end" | "reminder";

export interface Alarm {
  taskId: string;
  type: AlarmType;
  snoozedUntil?: number; // epoch ms
}

/** End alarms only fire shortly after a task ends (avoids spamming on open). */
const END_WINDOW_MINUTES = 15;

export function useScheduler() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [now, setNow] = useState(new Date());
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const firedRef = useRef<Set<string>>(new Set()); // dedupe key: `${taskId}-${type}-${date}`

  const refresh = useCallback(() => {
    setTasks(getItemsForDate(getLocalDateStr()));
  }, []);

  useEffect(() => {
    refresh();
    const poll = setInterval(() => {
      setNow(new Date());
      refresh();
    }, 15_000);
    const onChange = () => refresh();
    window.addEventListener(TASKS_CHANGED_EVENT, onChange);
    window.addEventListener("focus", onChange);
    return () => {
      clearInterval(poll);
      window.removeEventListener(TASKS_CHANGED_EVENT, onChange);
      window.removeEventListener("focus", onChange);
    };
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

      const tryFire = (type: AlarmType, condition: boolean, title: string, body: string) => {
        const key = `${task.id}-${type}-${task.date}`;
        if (!condition || firedRef.current.has(key)) return;
        firedRef.current.add(key);
        void fireNotification(title, body, key, task);
        setAlarms((prev) => [...prev, { taskId: task.id, type }]);
      };

      if (task.reminderMinutes > 0) {
        tryFire(
          "reminder",
          nowMin >= reminderAt && nowMin < start,
          `Coming up: ${task.title}`,
          `Starts in ${task.reminderMinutes} min`
        );
      }
      tryFire("start", nowMin >= start && nowMin < end, `Now: ${task.title}`, "Time to start this.");
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
