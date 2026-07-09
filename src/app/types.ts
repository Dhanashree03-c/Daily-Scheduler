export type TaskType = "task" | "appointment";

export interface Task {
  id: string;
  title: string;
  description?: string;
  date: string;        // "YYYY-MM-DD"
  startTime: string;   // "HH:mm" (24h)
  endTime: string;     // "HH:mm"
  type: TaskType;
  completed: boolean;
  skipped: boolean;
  alarmEnabled: boolean;
  reminderMinutes: number; // minutes before start to remind, 0 = at start time
  color?: string;
}

export type NewTask = Omit<Task, "id" | "completed" | "skipped">;