import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { Task, TaskType } from "../types";
import { addItem, getTaskById, updateItem } from "../utils/storage";
import { getLocalDateStr, isValidTimeRange } from "../utils/date";
import { alarmWhenLabel, previewTaskNotification, requestNotificationPermission } from "../utils/notifications";

interface TaskFormProps {
  mode: "add" | "edit";
  initial?: Task;
  initialDate?: string;
}

const QUICK_TIMES = [
  { label: "30 min", start: "09:00", end: "09:30" },
  { label: "1 hour", start: "09:00", end: "10:00" },
  { label: "Morning", start: "09:00", end: "12:00" },
  { label: "Afternoon", start: "13:00", end: "17:00" },
];

export function TaskForm({ mode, initial, initialDate }: TaskFormProps) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [type, setType] = useState<TaskType>(initial?.type ?? "task");
  const [date, setDate] = useState(initial?.date ?? initialDate ?? getLocalDateStr());
  const [startTime, setStartTime] = useState(initial?.startTime ?? "09:00");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "10:00");
  const [alarmEnabled, setAlarmEnabled] = useState(initial?.alarmEnabled ?? true);
  const [reminderMinutes, setReminderMinutes] = useState(String(initial?.reminderMinutes ?? 10));
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Give your task a title.";
    if (!date) e.date = "Pick a date so this shows up in your schedule.";
    if (!startTime || !endTime) {
      e.time = "Set both a start and end time.";
    } else if (!isValidTimeRange(startTime, endTime)) {
      e.time = "End time must be after start time.";
    }
    const mins = Number(reminderMinutes);
    if (alarmEnabled && (reminderMinutes === "" || Number.isNaN(mins) || mins < 0 || mins > 1440)) {
      e.reminder = "Enter 0 to 1440 minutes (24 hours).";
    }
    return e;
  }, [title, date, startTime, endTime, reminderMinutes, alarmEnabled]);

  const hasErrors = Object.keys(errors).length > 0;
  const showError = (key: string) => touched && errors[key];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) {
      toast.error("Almost there — fix the highlighted fields.");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        date,
        startTime,
        endTime,
        alarmEnabled,
        reminderMinutes: alarmEnabled ? Number(reminderMinutes) : 0,
      };
      let saved: Task | undefined;
      if (mode === "edit" && initial) {
        updateItem(initial.id, payload);
        saved = getTaskById(initial.id) ?? { ...initial, ...payload };
        toast.success("Saved ✓", {
          description: alarmEnabled
            ? `"${payload.title}" was updated. ${alarmWhenLabel(saved)}.`
            : `"${payload.title}" was updated.`,
        });
      } else {
        saved = addItem(payload);
        toast.success("Added 🎉", {
          description: alarmEnabled
            ? `"${payload.title}" is scheduled. ${alarmWhenLabel(saved)}.`
            : `"${payload.title}" is on your schedule.`,
        });
      }
      if (alarmEnabled && Notification.permission === "default") {
        const granted = await requestNotificationPermission();
        if (!granted) {
          toast.info("Reminders need permission", {
            description: "Turn on notifications in your browser settings to get reminders.",
          });
        }
      }
      // Land on the day the task belongs to so users see what they created.
      navigate(date === getLocalDateStr() ? "/today" : "/calendar");
      // Pop the notification widget + OS notification immediately as a preview.
      if (alarmEnabled && saved) {
        window.setTimeout(() => {
          void previewTaskNotification(saved);
        }, 450);
      }
    } finally {
      setSaving(false);
    }
  }

  const fieldError = (id: string, msg?: string) => (
    <p id={`${id}-error`} role="alert" className="text-sm text-destructive mt-1">
      {msg}
    </p>
  );

  return (
    <form onSubmit={handleSubmit} className="page-shell" noValidate>
      <div className="page-head">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <p className="page-subtitle mb-0.5">{mode === "edit" ? "Make it perfect ✏️" : "Plan something fun ✨"}</p>
            <h1 className="page-title">{mode === "edit" ? "Edit task" : "Add task"}</h1>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="task-title">Title *</Label>
          <Input
            id="task-title"
            placeholder="e.g. Team standup, Gym, Read 20 pages"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!showError("title")}
            aria-describedby={showError("title") ? "task-title-error" : undefined}
            autoFocus={mode === "add"}
          />
          {showError("title") && fieldError("task-title", errors.title)}
        </div>

        <div>
          <Label htmlFor="task-description">Description (optional)</Label>
          <textarea
            id="task-description"
            placeholder="Details, links, or anything to remember…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <p className="text-xs text-muted-foreground mt-1">A little context makes future-you happy.</p>
        </div>

        <div>
          <Label htmlFor="task-type">Type</Label>
          <Select value={type} onValueChange={(v: string) => setType(v as TaskType)}>
            <SelectTrigger id="task-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="task">✅ Task</SelectItem>
              <SelectItem value="appointment">📅 Appointment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="task-date">Date *</Label>
          <Input
            id="task-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={!!showError("date")}
            aria-describedby={showError("date") ? "task-date-error" : undefined}
          />
          {showError("date") && fieldError("task-date", errors.date)}
        </div>

        <div className="flex gap-2 flex-wrap" aria-label="Quick durations">
          {QUICK_TIMES.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => {
                setStartTime(q.start);
                setEndTime(q.end);
              }}
              className="min-h-11 px-3 py-1.5 text-xs font-semibold rounded-full bg-accent text-accent-foreground hover:bg-primary/10 transition-colors"
            >
              {q.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <Label htmlFor="task-start">Start *</Label>
            <Input
              id="task-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              aria-invalid={!!showError("time")}
              aria-describedby={showError("time") ? "task-start-error" : undefined}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="task-end">End *</Label>
            <Input
              id="task-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              aria-invalid={!!showError("time")}
              aria-describedby={showError("time") ? "task-end-error" : undefined}
            />
          </div>
        </div>
        {showError("time") && fieldError("task-start", errors.time)}

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <Label htmlFor="task-alarm">🔔 Remind me</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Get a reminder before this starts.</p>
          </div>
          <Switch
            id="task-alarm"
            checked={alarmEnabled}
            onCheckedChange={setAlarmEnabled}
            aria-label="Enable reminder"
          />
        </div>

        {alarmEnabled && (
          <div>
            <Label htmlFor="task-reminder">Remind me before (minutes)</Label>
            <Input
              id="task-reminder"
              type="number"
              min={0}
              max={1440}
              inputMode="numeric"
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(e.target.value)}
              aria-invalid={!!showError("reminder")}
              aria-describedby={showError("reminder") ? "task-reminder-error" : "task-reminder-help"}
              placeholder="10"
            />
            <p id="task-reminder-help" className="text-xs text-muted-foreground mt-1">
              0 means right at the start time. Max 1440 (24 hours).
            </p>
            {showError("reminder") && fieldError("task-reminder", errors.reminder)}
          </div>
        )}

        <div className="flex gap-2 pt-1 sticky bottom-0 bg-background/90 backdrop-blur py-2 -mx-1 px-1">
          <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" className="min-h-11 flex-[2] font-semibold" disabled={saving}>
            <Sparkles className="size-4" aria-hidden />
            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Save task"}
          </Button>
        </div>
      </div>
    </form>
  );
}
