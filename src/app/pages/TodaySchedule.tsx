import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useSchedulerContext } from "../components/SchedulerContext";
import { TaskCard } from "../components/TaskCard";
import { EmptyState } from "../components/EmptyState";
import {
  completeItem,
  skipItem,
  deleteItem,
  uncompleteItem,
  unskipItem,
  restoreItem,
} from "../utils/storage";
import { Clock, Sparkles, ChevronRight, PartyPopper, Coffee } from "lucide-react";
import { formatTimeRange, toMinutes } from "../utils/date";
import { cn } from "../components/ui/utils";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 18) return { text: "Good afternoon", emoji: "🌈" };
  return { text: "Good evening", emoji: "🌙" };
}

type Filter = "all" | "upcoming" | "done";

export function TodaySchedule() {
  const { tasks, currentTask, nextTask, minutesLeft, refresh } = useSchedulerContext();
  const [filter, setFilter] = useState<Filter>("all");

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const doneCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const g = greeting();

  const filtered =
    filter === "all"
      ? tasks
      : filter === "done"
        ? tasks.filter((t) => t.completed)
        : tasks.filter((t) => !t.completed);

  const handleComplete = (id: string) => {
    completeItem(id);
    refresh();
    const t = tasks.find((x) => x.id === id);
    toast.success("Done! 🎉", {
      description: t ? `"${t.title}" — nice work.` : undefined,
      action: { label: "Undo", onClick: () => { uncompleteItem(id); refresh(); } },
    });
  };
  const handleSkip = (id: string) => {
    skipItem(id);
    refresh();
    const t = tasks.find((x) => x.id === id);
    toast("Skipped", {
      description: t ? `"${t.title}" — no worries.` : undefined,
      action: { label: "Undo", onClick: () => { unskipItem(id); refresh(); } },
    });
  };
  const handleDelete = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    deleteItem(id);
    refresh();
    toast.error("Deleted", {
      description: t ? `"${t.title}" was removed.` : undefined,
      action: {
        label: "Undo",
        onClick: () => {
          if (t) {
            restoreItem(t);
            refresh();
          }
        },
      },
    });
  };

  const handleUndoComplete = (id: string) => {
    uncompleteItem(id);
    refresh();
    toast("Marked as not done", { description: "You can do this — one step at a time." });
  };
  const handleUndoSkip = (id: string) => {
    unskipItem(id);
    refresh();
    toast("Back on your list", { description: "Skipped task restored." });
  };

  const currentProgress = currentTask && minutesLeft !== null
    ? 100 - Math.round((minutesLeft / Math.max(1, toMinutes(currentTask.endTime) - toMinutes(currentTask.startTime))) * 100)
    : 0;

  return (
    <main className="page-shell" aria-label="Today">
      <div className="page-head">
        <div>
          <p className="page-subtitle mb-0.5">
            {g.emoji} {g.text} · {todayLabel}
          </p>
          <h1 className="page-title">Today</h1>
        </div>
      </div>

      {tasks.length > 0 && (
        <section className="hero-card p-4" aria-label="Today's progress">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <PartyPopper className="size-4 text-primary" aria-hidden />
              {doneCount} of {tasks.length} done
            </p>
            <p className="text-sm font-bold text-primary">{progress}%</p>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Daily progress">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </section>
      )}

      <section className="bg-card border border-border rounded-2xl p-4 shadow-sm" aria-label="Right now">
        <h2 className="flex items-center gap-2 text-base font-bold mb-2">
          <Sparkles className="size-4 text-primary" aria-hidden />
          Right now
        </h2>
        {currentTask ? (
          <div>
            <p className="font-semibold text-lg">{currentTask.title}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Clock className="size-4" aria-hidden />
              {formatTimeRange(currentTask.startTime, currentTask.endTime)}
              {minutesLeft !== null && ` · ${minutesLeft} min left`}
            </p>
            <div className="progress-track mt-3" role="progressbar" aria-valuenow={currentProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Task time elapsed">
              <div className="progress-fill" style={{ width: `${Math.max(4, Math.min(100, currentProgress))}%` }} />
            </div>
            <Link to={`/edit/${currentTask.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary min-h-11">
              View details <ChevronRight className="size-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Coffee className="size-4" aria-hidden />
            Nothing scheduled right now — enjoy the free time! ✨
          </p>
        )}
      </section>

      {nextTask && (
        <Link
          to={`/edit/${nextTask.id}`}
          className="block bg-card border border-border rounded-2xl p-4 shadow-sm hover:border-primary/40 transition-colors"
          aria-label={`Up next: ${nextTask.title} at ${nextTask.startTime}`}
        >
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Up next →</h2>
          <p className="font-semibold">{nextTask.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">Starts at {nextTask.startTime} · tap for details</p>
        </Link>
      )}

      {tasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              All tasks ({tasks.length})
            </h2>
            <div className="flex gap-1.5" role="group" aria-label="Filter tasks">
              {(["all", "upcoming", "done"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={cn(
                    "min-h-11 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors capitalize",
                    filter === f
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-accent text-accent-foreground hover:bg-primary/10"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          {filtered.length === 0 ? (
            <EmptyState
              emoji={filter === "done" ? "⭐" : "🎈"}
              title={filter === "done" ? "Nothing done yet" : "All clear!"}
              message={filter === "done" ? "Finish something and it'll shine here." : "Everything's checked off. Nice!"}
            />
          ) : (
            <div className="space-y-2.5">
              {filtered.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onSkip={handleSkip}
                  onDelete={handleDelete}
                  onUndoComplete={handleUndoComplete}
                  onUndoSkip={handleUndoSkip}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tasks.length === 0 && (
        <EmptyState
          emoji="🗓️"
          title="Your day is wide open"
          message="Plan something fun! Tap + to add your first task — a 10-minute win counts."
          ctaLabel="＋ Add your first task"
          ctaTo="/add"
        />
      )}
    </main>
  );
}

