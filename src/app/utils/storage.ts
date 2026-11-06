import type { Task, NewTask } from "../types";

const KEY = "tasks_v1";

export const TASKS_CHANGED_EVENT = "tasks-changed";

function notifyTasksChanged() {
  window.dispatchEvent(new Event(TASKS_CHANGED_EVENT));
}

export function getAllItems(): Task[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Task[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAllItems(tasks: Task[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tasks));
  } catch {
    // Quota errors are surfaced by callers via toasts where possible.
  }
  notifyTasksChanged();
}

export function addItem(task: NewTask): Task {
  const full: Task = {
    ...task,
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    completed: false,
    skipped: false,
  };
  const tasks = getAllItems();
  tasks.push(full);
  saveAllItems(tasks);
  return full;
}

export function updateItem(id: string, patch: Partial<Task>) {
  const tasks = getAllItems().map((t) => (t.id === id ? { ...t, ...patch } : t));
  saveAllItems(tasks);
  return tasks;
}

export function deleteItem(id: string) {
  const tasks = getAllItems().filter((t) => t.id !== id);
  saveAllItems(tasks);
  return tasks;
}

export function restoreItem(task: Task) {
  const tasks = getAllItems();
  if (!tasks.some((t) => t.id === task.id)) {
    tasks.push(task);
    saveAllItems(tasks);
  }
  return getAllItems();
}

export function completeItem(id: string) {
  return updateItem(id, { completed: true, skipped: false });
}

export function uncompleteItem(id: string) {
  return updateItem(id, { completed: false, skipped: false });
}

export function skipItem(id: string) {
  return updateItem(id, { skipped: true });
}

export function unskipItem(id: string) {
  return updateItem(id, { skipped: false });
}

export function getTaskById(id: string): Task | undefined {
  return getAllItems().find((t) => t.id === id);
}

export function getItemsForDate(date: string): Task[] {
  return getAllItems()
    .filter((t) => t.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}
