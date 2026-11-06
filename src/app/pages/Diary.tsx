import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BookOpen, ChevronLeft, ChevronRight, Save, Smile, Meh, Frown, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "../components/ui/utils";

interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  mood?: "happy" | "neutral" | "sad";
  createdAt: string;
  updatedAt: string;
}

type Mood = "happy" | "neutral" | "sad";

function loadEntries(): DiaryEntry[] {
  try {
    const saved = localStorage.getItem("diaryEntries");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Diary stores dates as yyyy-MM-dd; parse with date-fns to avoid UTC shift. */
function entryDate(e: DiaryEntry): Date {
  const d = new Date(`${e.date}T12:00:00`);
  return Number.isNaN(d.getTime()) ? new Date(e.createdAt) : d;
}

const MOODS: { value: Mood; label: string; icon: typeof Smile; activeClass: string }[] = [
  { value: "happy", label: "Happy", icon: Smile, activeClass: "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30" },
  { value: "neutral", label: "Okay", icon: Meh, activeClass: "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30" },
  { value: "sad", label: "Sad", icon: Frown, activeClass: "bg-sky-500/20 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/30" },
];

export function Diary() {
  const [entries, setEntries] = useState<DiaryEntry[]>(loadEntries);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [editingContent, setEditingContent] = useState("");
  const [editingMood, setEditingMood] = useState<Mood>("neutral");

  useEffect(() => {
    try {
      localStorage.setItem("diaryEntries", JSON.stringify(entries));
    } catch {
      toast.error("Couldn't save diary", { description: "Storage is full or unavailable." });
    }
  }, [entries]);

  const currentEntry = entries.find((e) => isSameDay(entryDate(e), selectedDate));

  // Load the selected day's saved content (only overwrites after explicit date pick,
  // and warns if there are unsaved edits).
  useEffect(() => {
    setEditingContent(currentEntry?.content ?? "");
    setEditingMood(currentEntry?.mood ?? "neutral");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const isDirty = currentEntry
    ? currentEntry.content !== editingContent || (currentEntry.mood ?? "neutral") !== editingMood
    : editingContent.trim() !== "" || editingMood !== "neutral";

  const saveEntry = () => {
    if (!editingContent.trim()) {
      toast.error("Write a little something first ✍️", { description: "Even one sentence counts." });
      return;
    }
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    if (currentEntry) {
      setEntries(entries.map((e) => (e.id === currentEntry.id ? { ...e, content: editingContent, mood: editingMood, updatedAt: new Date().toISOString() } : e)));
      toast.success("Entry updated ✓");
    } else {
      const newEntry: DiaryEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date: dateStr,
        content: editingContent,
        mood: editingMood,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEntries([...entries, newEntry]);
      toast.success("Saved to your diary 📔");
    }
  };

  const deleteEntry = () => {
    if (!currentEntry) return;
    if (!window.confirm("Delete this day's diary entry?")) return;
    const removed = currentEntry;
    setEntries(entries.filter((e) => e.id !== currentEntry.id));
    setEditingContent("");
    setEditingMood("neutral");
    toast.error("Entry deleted", {
      action: { label: "Undo", onClick: () => setEntries((prev) => [...prev, removed]) },
    });
  };

  const pickDate = (d: Date) => {
    if (isSameDay(d, selectedDate)) return;
    if (isDirty && !window.confirm("You have unsaved changes. Switch days and lose them?")) return;
    setSelectedDate(d);
  };

  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const hasEntry = (date: Date) => entries.some((e) => isSameDay(entryDate(e), date));
  const getEntryMood = (date: Date) => entries.find((e) => isSameDay(entryDate(e), date))?.mood;

  const MoodIcon = ({ mood, className = "size-6" }: { mood?: Mood; className?: string }) => {
    if (mood === "happy") return <Smile className={className} aria-hidden />;
    if (mood === "sad") return <Frown className={className} aria-hidden />;
    return <Meh className={className} aria-hidden />;
  };

  const stats = [
    { mood: "happy" as Mood, label: "Happy days", count: entries.filter((e) => e.mood === "happy").length },
    { mood: "neutral" as Mood, label: "Okay days", count: entries.filter((e) => e.mood === "neutral").length },
    { mood: "sad" as Mood, label: "Sad days", count: entries.filter((e) => e.mood === "sad").length },
  ];

  return (
    <main className="page-shell max-w-2xl mx-auto" aria-label="Diary">
      <div className="page-head">
        <div className="flex items-center gap-2">
          <BookOpen className="size-8 text-primary" aria-hidden />
          <div>
            <p className="page-subtitle mb-0.5">A cozy spot for your thoughts 💛</p>
            <h1 className="page-title">My diary</h1>
          </div>
        </div>
      </div>

      <section className="settings-card" aria-label="Calendar">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-5" />
          </button>
          <h2 className="text-base font-bold">{format(currentMonth, "MMMM yyyy")}</h2>
          <button
            type="button"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="min-w-11 min-h-11 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1" aria-label={day}>
              <span aria-hidden>{day}</span>
            </div>
          ))}
          {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
            <div key={`empty-${i}`} aria-hidden />
          ))}
          {monthDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const mood = getEntryMood(day);
            const label = format(day, "EEEE, MMMM d, yyyy");
            return (
              <button
                key={format(day, "yyyy-MM-dd")}
                type="button"
                onClick={() => pickDate(day)}
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                aria-label={`${label}${hasEntry(day) ? `, has entry${mood ? `, ${mood}` : ""}` : ", no entry"}${isToday ? ", today" : ""}`}
                className={cn(
                  "aspect-square min-h-11 rounded-xl p-1 text-sm relative flex flex-col items-center justify-center transition-all",
                  isSelected ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30" : "hover:bg-accent",
                  isToday && !isSelected ? "ring-2 ring-primary/50 font-bold text-primary" : ""
                )}
              >
                <span aria-hidden>{format(day, "d")}</span>
                {hasEntry(day) && <MoodIcon mood={mood} className={cn("size-3.5 mt-0.5", isSelected ? "text-white" : "text-muted-foreground")} />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-card" aria-label="Diary entry">
        <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
          <h2 className="text-base font-bold">{format(selectedDate, "EEEE, MMMM d")}</h2>
          {currentEntry && (
            <span className="text-xs text-muted-foreground">
              Last edited {format(new Date(currentEntry.updatedAt), "PPp")}
            </span>
          )}
        </div>

        <div className="mb-4">
          <p id="mood-label" className="text-sm font-semibold mb-2">How are you feeling today?</p>
          <div className="flex gap-2 flex-wrap" role="radiogroup" aria-labelledby="mood-label">
            {MOODS.map((m) => {
              const Icon = m.icon;
              const selected = editingMood === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setEditingMood(m.value)}
                  className={cn(
                    "min-h-11 flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-semibold transition-all",
                    selected ? m.activeClass : "border-border hover:bg-accent"
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {m.label}
                  {selected && <span aria-hidden>·</span>}
                </button>
              );
            })}
          </div>
        </div>

        <label htmlFor="diary-content" className="text-sm font-semibold block mb-1">Your entry</label>
        <textarea
          id="diary-content"
          value={editingContent}
          onChange={(e) => setEditingContent(e.target.value)}
          placeholder="Dear diary… ✨"
          className="w-full min-h-56 px-3 py-2 border border-border rounded-xl resize-y focus:outline-none focus:ring-2 focus:ring-ring/50 bg-input-background text-foreground placeholder:text-muted-foreground"
        />

        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={saveEntry}
            className="flex-1 min-h-11 bg-primary text-primary-foreground py-3 rounded-xl flex items-center justify-center gap-2 font-semibold hover:bg-primary/90 transition-colors"
          >
            <Save className="size-5" aria-hidden />
            {currentEntry ? "Update entry" : "Save entry"}
          </button>
          {currentEntry && (
            <button
              type="button"
              onClick={deleteEntry}
              className="min-h-11 px-4 py-3 border border-destructive/40 text-destructive rounded-xl flex items-center gap-2 font-semibold hover:bg-destructive/10 transition-colors"
              aria-label="Delete this entry"
            >
              <Trash2 className="size-4" aria-hidden /> Delete
            </button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm text-muted-foreground mb-2">Total entries: <strong className="text-foreground">{entries.length}</strong></h3>
          <ul className="flex gap-4 text-xs flex-wrap">
            {stats.map((s) => (
              <li key={s.mood} className="flex items-center gap-1.5">
                <span aria-hidden className={s.mood === "happy" ? "text-emerald-600" : s.mood === "neutral" ? "text-amber-600" : "text-sky-600"}>
                  {s.mood === "happy" ? <Smile className="size-4" /> : s.mood === "neutral" ? <Meh className="size-4" /> : <Frown className="size-4" />}
                </span>
                <span>{s.label}: <strong>{s.count}</strong></span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
