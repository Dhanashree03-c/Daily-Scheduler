import { useState } from "react";
import type { Task } from "../types";
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  SkipForward,
  Pencil,
  Trash2,
  Bell,
  RotateCcw,
  Flag,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "./ui/utils";
import { formatDateLabel, formatTimeRange } from "../utils/date";
import { reminderTimeLabel } from "../utils/notifications";

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  onUndoComplete?: (id: string) => void;
  onUndoSkip?: (id: string) => void;
  showDate?: boolean;
}

function statusPill(task: Task, isPast: boolean) {
  if (task.completed)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
        <CheckCircle2 className="size-3.5" aria-hidden /> Done
      </span>
    );
  if (task.skipped)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
        <SkipForward className="size-3.5" aria-hidden /> Skipped
      </span>
    );
  if (isPast)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
        <Clock className="size-3.5" aria-hidden /> Overdue
      </span>
    );
  if (task.type === "appointment")
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30">
        <CalendarIcon className="size-3.5" aria-hidden /> Appointment
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
      <Flag className="size-3.5" aria-hidden /> Task
    </span>
  );
}

const iconBtn =
  "min-w-11 min-h-11 flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function TaskCard({
  task,
  onComplete,
  onSkip,
  onDelete,
  onUndoComplete,
  onUndoSkip,
  showDate = false,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isCompleted = task.completed;
  const isSkipped = task.skipped;
  const isPast = new Date(`${task.date}T${task.endTime}`) < new Date();
  const needsExpansion = (task.description?.length ?? 0) > 120;

  return (
    <article
      className={cn(
        "p-4 rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md",
        "border-l-4",
        isCompleted && "border-l-emerald-500 opacity-80",
        !isCompleted && isSkipped && "border-l-orange-500 opacity-70",
        !isCompleted && !isSkipped && isPast && "border-l-rose-500",
        !isCompleted && !isSkipped && !isPast && task.type === "appointment" && "border-l-violet-500",
        !isCompleted && !isSkipped && !isPast && task.type !== "appointment" && "border-l-primary"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {statusPill(task, isPast)}
            <h3
              className={cn(
                "font-semibold text-base leading-snug break-words",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h3>
          </div>

          {task.description && (
            <div className="mb-2">
              <p
                className={cn(
                  "text-sm text-muted-foreground whitespace-pre-wrap break-words",
                  !expanded && "line-clamp-2"
                )}
              >
                {task.description}
              </p>
              {needsExpansion && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-xs font-semibold text-primary min-h-11 px-1 -ml-1"
                  aria-expanded={expanded}
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              {formatTimeRange(task.startTime, task.endTime)}
            </span>
            {showDate && (
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="size-4" aria-hidden />
                {formatDateLabel(task.date)}
              </span>
            )}
          </div>

          <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1.5">
            <Bell className="size-3.5" aria-hidden />
            {reminderTimeLabel(task) ?? "No reminder"}
            {task.alarmEnabled && task.reminderMinutes > 0 ? ` · ${task.reminderMinutes} min before` : ""}
          </p>
        </div>

        <div className="flex flex-col gap-0.5 shrink-0" aria-label={`Actions for ${task.title}`}>
          <Link
            to={`/edit/${task.id}`}
            className={cn(iconBtn, "text-muted-foreground hover:bg-accent hover:text-foreground")}
            aria-label={`Edit ${task.title}`}
          >
            <Pencil className="size-5" />
          </Link>
          {!isCompleted && !isSkipped && (
            <>
              <button
                type="button"
                onClick={() => onComplete(task.id)}
                className={cn(iconBtn, "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10")}
                aria-label={`Mark ${task.title} as done`}
              >
                <CheckCircle2 className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => onSkip(task.id)}
                className={cn(iconBtn, "text-orange-600 dark:text-orange-400 hover:bg-orange-500/10")}
                aria-label={`Skip ${task.title}`}
              >
                <SkipForward className="size-5" />
              </button>
            </>
          )}
          {isCompleted && onUndoComplete && (
            <button
              type="button"
              onClick={() => onUndoComplete(task.id)}
              className={cn(iconBtn, "text-muted-foreground hover:bg-accent")}
              aria-label={`Undo completion of ${task.title}`}
            >
              <RotateCcw className="size-5" />
            </button>
          )}
          {isSkipped && onUndoSkip && (
            <button
              type="button"
              onClick={() => onUndoSkip(task.id)}
              className={cn(iconBtn, "text-muted-foreground hover:bg-accent")}
              aria-label={`Undo skipping ${task.title}`}
            >
              <RotateCcw className="size-5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className={cn(iconBtn, "text-destructive hover:bg-destructive/10")}
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
