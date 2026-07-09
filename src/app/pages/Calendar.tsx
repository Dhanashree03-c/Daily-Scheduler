import { useMemo, useState } from "react";
import { getAllItems } from "../utils/storage";
import { Badge } from "../components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../components/ui/utils";

function fmt(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function Calendar() {
  const [monthDate, setMonthDate] = useState(new Date());
  const [selected, setSelected] = useState(fmt(new Date()));
  const items = getAllItems();

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

  const today = fmt(new Date());

  return (
    <div className="page-shell">
      <h1 className="page-title">Calendar</h1>

      <div className="settings-card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="font-semibold">
            {monthDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          <button
            onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-muted-foreground font-medium py-1">
              {d}
            </div>
          ))}
          {Array.from({ length: days.leadingBlanks }).map((_, i) => (
            <div key={"b" + i} />
          ))}
          {days.arr.map((d) => {
            const key = fmt(d);
            const hasItems = items.some((i) => i.date === key);
            const isSelected = key === selected;
            const isToday = key === today;
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  "rounded-full h-9 w-9 flex items-center justify-center relative text-sm transition-all",
                  isSelected && "bg-primary text-primary-foreground font-semibold shadow-sm",
                  !isSelected && isToday && "ring-2 ring-primary/40 font-semibold",
                  !isSelected && !isToday && "hover:bg-accent"
                )}
              >
                {d.getDate()}
                {hasItems && (
                  <span
                    className={cn(
                      "absolute bottom-0.5 h-1.5 w-1.5 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-primary"
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {new Date(selected + "T12:00:00").toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        {itemsForSelected.length === 0 && (
          <div className="settings-card text-center py-8">
            <p className="text-sm text-muted-foreground">Nothing on this day.</p>
          </div>
        )}
        {itemsForSelected.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between border border-border rounded-xl p-3.5 bg-card shadow-sm"
          >
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.startTime} – {item.endTime}
              </p>
            </div>
            <Badge variant={item.type === "appointment" ? "default" : "secondary"}>{item.type}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
