import { useEffect, useRef, useState, useCallback } from "react";
import type { Task } from "../types";
import { getItemsForDate } from "../utils/storage";
import { fireNotification } from "../utils/notifications";

export type AlarmType = "start" | "end" | "reminder";

export interface Alarm {
  taskId: string;
  type: AlarmType;
  snoozedUntil?: number; // epoch ms
}

// ✅ fixed
function todayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function useScheduler() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [now, setNow] = useState(new Date());
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const firedRef = useRef<Set<string>>(new Set()); // dedupe key: `${taskId}-${type}`

  const refresh = useCallback(() => {
    setTasks(getItemsForDate(todayStr()));
  }, []);

  useEffect(() => {
    refresh();
    const poll = setInterval(() => {
      setNow(new Date());
      refresh();
    }, 15_000);
    return () => clearInterval(poll);
  }, [refresh]);

  useEffect(() => {
    const nowMs = now.getTime();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    tasks.forEach((task) => {
      const start = toMinutes(task.startTime);
      const end = toMinutes(task.endTime);
      const reminderAt = start - task.reminderMinutes;

      const tryFire = (type: AlarmType, condition: boolean, title: string, body: string) => {
        const key = `${task.id}-${type}`;
        if (!condition || firedRef.current.has(key)) return;
        firedRef.current.add(key);
        fireNotification(title, body, key);
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
      tryFire("end", nowMin >= end && !task.completed, `Time's up: ${task.title}`, "Move on to your next task.");
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
  const currentTask = tasks.find((t) => toMinutes(t.startTime) <= nowMin && nowMin < toMinutes(t.endTime));
  const nextTask = tasks
    .filter((t) => toMinutes(t.startTime) > nowMin)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime))[0];
  const minutesLeft = currentTask ? toMinutes(currentTask.endTime) - nowMin : null;

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