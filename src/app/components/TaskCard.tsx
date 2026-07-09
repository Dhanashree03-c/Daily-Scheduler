import type { Task } from "../types";
import { Clock, Calendar, CheckCircle2, SkipForward, Edit, Trash2, MapPin, Bell } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from './ui/utils';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
  showDate?: boolean;
}

const statusStyles = {
  completed: 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/15',
  skipped: 'bg-muted/60 border-border',
  appointment: 'bg-violet-500/10 border-violet-500/30 dark:bg-violet-500/15',
  task: 'bg-primary/8 border-primary/25 dark:bg-primary/12',
};

export function TaskCard({ task, onComplete, onSkip, onDelete, showDate = false }: TaskCardProps) {
  const isCompleted = task.completed;
  const isSkipped = task.skipped;
  const isPast = new Date(`${task.date}T${task.endTime}`) < new Date();

  const styleKey = isCompleted
    ? 'completed'
    : isSkipped
    ? 'skipped'
    : task.type === 'appointment'
    ? 'appointment'
    : 'task';

  return (
    <div
      className={cn(
        'p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 hover:shadow-md',
        statusStyles[styleKey],
        isPast && !isCompleted && !isSkipped && 'opacity-70'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {task.type === 'appointment' ? (
              <MapPin className="size-4 text-violet-600 dark:text-violet-400 shrink-0" />
            ) : (
              <CheckCircle2
                className={cn(
                  'size-4 shrink-0',
                  isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
                )}
              />
            )}
            <h3
              className={cn(
                'font-semibold truncate',
                isCompleted && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </h3>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="size-3.5" />
              <span>{task.startTime} – {task.endTime}</span>
            </div>
            {showDate && (
              <div className="flex items-center gap-1">
                <Calendar className="size-3.5" />
                <span>{new Date(task.date).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {task.alarmEnabled && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              <Bell className="size-3" />
              Reminder: {task.reminderMinutes} min before
            </div>
          )}
        </div>

        <div className="flex flex-col gap-0.5 shrink-0">
          <Link
            to={`/edit-task/${task.id}`}
            className="p-1.5 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <Edit className="size-4" />
          </Link>
          {!isCompleted && !isSkipped && (
            <>
              <button
                onClick={() => onComplete(task.id)}
                className="p-1.5 hover:bg-emerald-500/10 rounded-lg transition-colors"
                title="Complete"
              >
                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              </button>
              <button
                onClick={() => onSkip(task.id)}
                className="p-1.5 hover:bg-orange-500/10 rounded-lg transition-colors"
                title="Skip"
              >
                <SkipForward className="size-4 text-orange-500" />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 hover:bg-destructive/10 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="size-4 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}
