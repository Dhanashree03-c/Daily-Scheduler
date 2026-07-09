import type { Task, NewTask } from "../types";

const KEY = "tasks_v1";

export function getAllItems(): Task[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

export function saveAllItems(tasks: Task[]) {
  localStorage.setItem(KEY, JSON.stringify(tasks));
}

export function addItem(task: NewTask): Task {
  const full: Task = { ...task, id: crypto.randomUUID(), completed: false, skipped: false };
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

export function completeItem(id: string) {
  return updateItem(id, { completed: true, skipped: false });
}

export function skipItem(id: string) {
  return updateItem(id, { skipped: true });
}

export function getItemsForDate(date: string): Task[] {
  return getAllItems()
    .filter((t) => t.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}