import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getAllItems, completeItem, skipItem, deleteItem, restoreItem, uncompleteItem, unskipItem, TASKS_CHANGED_EVENT } from "../utils/storage";
import { TaskCard } from "../components/TaskCard";
import { EmptyState } from "../components/EmptyState";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "../components/ui/utils";
import { getLocalDateStr, formatDateLong } from "../utils/date";
import type { Task } from "../types";

const WEEKDAYS = [
  { short: "Sun", full: "Sunday" },
  { short: "Mon", full: "Monday" },
  { short: "Tue", full: "Tuesday" },
  { short: "Wed", full: "Wednesday" },
  { short: "Thu", full: "Thursday" },
  { short: "Fri", full: "Friday" },
  { short: "Sat", full: "Saturday" },
];

export function Calendar() {
  const [monthDate, setMonthDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(getLocalDateStr());
  const [items, setItems] = useState<Task[]>([]);

  const reload = () => setItems(getAllItems());
  useEffect(() => {
    reload();
    window.addEventListener(TASKS_CHANGED_EVENT, reload);
    window.addEventListener("focus", reload);
    return () => {
      window.removeEventListener(TASKS_CHANGED_EVENT, reload);
      window.removeEventListener("focus", reload);
    };
  }, []);

  const days = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const arr: Date[] = [];
    for (let d = 1; d <= last.getDate(); d++) arr.push(new Date(year, month, d));
    return { arr, leadingBlanks: first.getDay() };
  }, [monthDate]);

  const itemsForSelected = items
    .filter((i) => i.date === selected)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const today = getLocalDateStr();

  const goToday = () => {
    const now = new Date();
    setMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelected(getLocalDateStr());
  };

  return (
    <main className="page-shell" aria-label="Calendar">
      <div className="page-head">
        <div>
          <p className="page-subtitle mb-0.5">Plan every day 📅</p>
          <h1 className="page-title">Calendar</h1>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="min-h-11 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-primary/10 transition-colors"
        >
          Today
        </button>
      </div>

      <div className="settings-card">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="font-bold text-base" aria-live="polite">
            {monthDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          <button
            type="button"
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1" role="row">
          {WEEKDAYS.map((d) => (
            <div key={d.full} className="text-muted-foreground font-semibold py-1" aria-label={d.full}>
              <span aria-hidden>{d.short}</span>
              <span className="sr-only">{d.full}</span>
            </div>
          ))}
          {Array.from({ length: days.leadingBlanks }).map((_, i) => (
            <div key={"b" + i} aria-hidden />
          ))}
          {days.arr.map((d) => {
            const key = getLocalDateStr(d);
            const count = items.filter((i) => i.date === key && !i.completed && !i.skipped).length;
            const isSelected = key === selected;
            const isToday = key === today;
            const fullLabel = formatDateLong(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                aria-label={`${fullLabel}${count ? `, ${count} task${count === 1 ? "" : "s"}` : ", no tasks"}${isToday ? ", today" : ""}`}
                className={cn(
                  "rounded-full h-11 w-11 mx-auto flex items-center justify-center relative text-sm transition-all min-h-11",
                  isSelected && "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30 scale-105",
                  !isSelected && isToday && "ring-2 ring-primary/50 font-bold text-primary",
                  !isSelected && !isToday && "hover:bg-accent",
                  !isSelected && isToday && "hover:bg-accent"
                )}
              >
                {d.getDate()}
                {count > 0 && (
                  <>
                    <span
                      aria-hidden
                      className={cn(
                        "absolute bottom-1 min-w-4 h-4 px-0.5 rounded-full text-[10px] font-bold flex items-center justify-center",
                        isSelected ? "bg-white text-primary" : "bg-gradient-to-tr from-violet-500 to-fuchsia-500 text-white"
                      )}
                    >
                      {count}
                    </span>
                    <span className="sr-only">{count} tasks</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
            {formatDateLong(selected)}
          </h2>
          <a
            href={`/add?date=${selected}`}
            className="min-h-11 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            aria-label={`Add task on ${formatDateLong(selected)}`}
          >
            <Plus className="size-4" aria-hidden /> Add here
          </a>
        </div>
        {itemsForSelected.length === 0 && (
          <EmptyState
            emoji="🌤️"
            title="Nothing on this day"
            message="A blank day is full of promise — add something fun."
            ctaLabel="Add a task"
            ctaTo={`/add?date=${selected}`}
          />
        )}
        {itemsForSelected.map((item) => (
          <TaskCard
            key={item.id}
            task={item}
            showDate
            onComplete={(id) => {
              completeItem(id);
              reload();
              toast.success("Done! 🎉", { description: `"${item.title}" completed.`, action: { label: "Undo", onClick: () => { uncompleteItem(id); reload(); } } });
            }}
            onSkip={(id) => {
              skipItem(id);
              reload();
              toast("Skipped", { action: { label: "Undo", onClick: () => { unskipItem(id); reload(); } } });
            }}
            onDelete={(id) => {
              deleteItem(id);
              reload();
              toast.error("Deleted", { description: `"${item.title}" removed.`, action: { label: "Undo", onClick: () => { restoreItem(item); reload(); } } });
            }}
            onUndoComplete={(id) => { uncompleteItem(id); reload(); }}
            onUndoSkip={(id) => { unskipItem(id); reload(); }}
          />
        ))}
      </div>
    </main>
  );
}
