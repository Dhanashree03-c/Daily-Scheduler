import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Target, Plus, Trash2, CheckCircle2, Circle, TrendingUp, CalendarDays } from "lucide-react";
import { cn } from "../components/ui/utils";
import { parseLocalDate } from "../utils/date";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: "personal" | "work" | "health" | "learning" | "other";
  completed: boolean;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
}

function loadGoals(): Goal[] {
  try {
    const saved = localStorage.getItem("goals");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>(loadGoals);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "personal" as Goal["category"],
    deadline: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("goals", JSON.stringify(goals));
    } catch {
      toast.error("Couldn't save goals", { description: "Storage is full or unavailable." });
    }
  }, [goals]);

  const addGoal = () => {
    if (!newGoal.title.trim()) {
      setFormError("Give your goal a title.");
      toast.error("Title needed", { description: "What are you aiming for?" });
      return;
    }
    setFormError("");
    const goal: Goal = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
      category: newGoal.category,
      completed: false,
      deadline: newGoal.deadline || undefined,
      createdAt: new Date().toISOString(),
    };
    setGoals([goal, ...goals]);
    setNewGoal({ title: "", description: "", category: "personal", deadline: "" });
    setShowAddGoal(false);
    toast.success("Goal added 🎯", { description: `"${goal.title}" — let's go!` });
  };

  const toggleGoalCompletion = (id: string) => {
    const g = goals.find((x) => x.id === id);
    setGoals(
      goals.map((x) =>
        x.id === id
          ? { ...x, completed: !x.completed, completedAt: !x.completed ? new Date().toISOString() : undefined }
          : x
      )
    );
    if (g && !g.completed) toast.success("Goal crushed! 🏆", { description: `"${g.title}" completed.` });
  };

  const deleteGoal = (id: string) => {
    const g = goals.find((x) => x.id === id);
    setGoals(goals.filter((x) => x.id !== id));
    toast.error("Goal deleted", {
      description: g ? `"${g.title}" removed.` : undefined,
      action: { label: "Undo", onClick: () => g && setGoals((prev) => [g, ...prev]) },
    });
  };

  const filteredGoals = goals.filter((g) => {
    if (filter === "active") return !g.completed;
    if (filter === "completed") return g.completed;
    return true;
  });

  const stats = {
    total: goals.length,
    completed: goals.filter((g) => g.completed).length,
    active: goals.filter((g) => !g.completed).length,
    completionRate: goals.length > 0 ? Math.round((goals.filter((g) => g.completed).length / goals.length) * 100) : 0,
  };

  const categoryColors = {
    personal: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    work: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    health: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    learning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    other: "bg-muted text-muted-foreground border-border",
  };

  const categoryIcons = { personal: "👤", work: "💼", health: "💪", learning: "📚", other: "🎯" };

  const inputClass =
    "w-full min-h-11 px-3 py-2.5 border border-border rounded-xl bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50";

  const isOverdue = (g: Goal) => {
    if (g.completed || !g.deadline) return false;
    const d = parseLocalDate(g.deadline);
    return !!d && d < new Date(new Date().setHours(0, 0, 0, 0));
  };

  return (
    <main className="page-shell max-w-2xl mx-auto" aria-label="Goals">
      <div className="page-head">
        <div className="flex items-center gap-2">
          <Target className="size-7 text-primary" aria-hidden />
          <div>
            <p className="page-subtitle mb-0.5">Dream big, step small 🚀</p>
            <h1 className="page-title">Goals</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddGoal(!showAddGoal)}
          aria-expanded={showAddGoal}
          className="min-h-11 min-w-11 bg-primary text-primary-foreground rounded-full p-3 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
          aria-label={showAddGoal ? "Close new goal form" : "Add new goal"}
        >
          <Plus className="size-6" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-primary-foreground bg-gradient-to-br from-primary to-fuchsia-500/80 shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="size-5" aria-hidden />
            <p className="text-sm opacity-90">Completion rate</p>
          </div>
          <p className="text-3xl font-extrabold">{stats.completionRate}%</p>
          <div className="progress-track mt-2 bg-white/25" role="progressbar" aria-valuenow={stats.completionRate} aria-valuemin={0} aria-valuemax={100} aria-label="Completion rate">
            <div className="progress-fill !bg-white" style={{ width: `${stats.completionRate}%` }} />
          </div>
        </div>
        <div className="settings-card !py-4">
          <p className="text-sm text-muted-foreground mb-1">Goals</p>
          <p className="text-2xl font-extrabold">
            <span className="text-emerald-600 dark:text-emerald-400">{stats.completed}</span>
            <span className="text-muted-foreground text-lg font-normal"> / {stats.total}</span>
          </p>
          <p className="text-xs text-muted-foreground">{stats.active} active — keep going!</p>
        </div>
      </div>

      {showAddGoal && (
        <form
          className="settings-card"
          onSubmit={(e) => {
            e.preventDefault();
            addGoal();
          }}
        >
          <h2 className="text-base font-bold mb-4">🎯 New goal</h2>
          <label htmlFor="goalTitle" className="text-sm font-semibold block mb-1">What do you want to achieve? *</label>
          <input
            id="goalTitle"
            type="text"
            placeholder="e.g. Run 5k, Finish book, Save $100"
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            className={cn(inputClass, "mb-3")}
            aria-invalid={!!formError}
            aria-describedby={formError ? "goal-title-error" : undefined}
            autoFocus
          />
          {formError && (
            <p id="goal-title-error" role="alert" className="text-sm text-destructive -mt-2 mb-3">{formError}</p>
          )}
          <label htmlFor="goalDescription" className="text-sm font-semibold block mb-1">Why it matters (optional)</label>
          <textarea
            id="goalDescription"
            placeholder="A sentence to future-you 💛"
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            className={cn(inputClass, "mb-3 min-h-20 resize-none")}
          />
          <div className="mb-3">
            <label htmlFor="category" className="text-sm font-semibold mb-1 block">Category</label>
            <select
              id="category"
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as Goal["category"] })}
              className={inputClass}
            >
              <option value="personal">👤 Personal</option>
              <option value="work">💼 Work</option>
              <option value="health">💪 Health</option>
              <option value="learning">📚 Learning</option>
              <option value="other">🎯 Other</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="deadline" className="text-sm font-semibold mb-1 block">Deadline (optional)</label>
            <input
              id="deadline"
              type="date"
              value={newGoal.deadline}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 min-h-11 bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Add goal 🚀
            </button>
            <button
              type="button"
              onClick={() => setShowAddGoal(false)}
              className="min-h-11 px-4 py-2.5 border border-border rounded-xl hover:bg-accent transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter goals">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "min-h-11 px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize",
              filter === f ? "bg-primary text-primary-foreground shadow-sm" : "bg-card border border-border text-foreground hover:bg-accent"
            )}
          >
            {f} ({f === "all" ? stats.total : f === "active" ? stats.active : stats.completed})
          </button>
        ))}
      </div>

      {filteredGoals.length === 0 ? (
        <div className="empty-state" role="status">
          <span className="empty-emoji" aria-hidden>🚩</span>
          <h2 className="text-base font-semibold">
            {filter === "all" ? "No goals yet" : filter === "active" ? "No active goals" : "No completed goals"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "Small goals make big changes. Start with one!" : filter === "active" ? "All done — celebrate! 🎉" : "Complete a goal and watch it shine here."}
          </p>
          {filter === "all" && (
            <button type="button" onClick={() => setShowAddGoal(true)} className="mt-2 min-h-11 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
              Set your first goal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => {
            const overdue = isOverdue(goal);
            const deadlineDate = goal.deadline ? parseLocalDate(goal.deadline) : null;
            return (
              <article key={goal.id} className={cn("settings-card", goal.completed && "opacity-70")}>
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleGoalCompletion(goal.id)}
                    className="mt-0.5 shrink-0 min-w-11 min-h-11 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"
                    aria-label={goal.completed ? `Mark "${goal.title}" as not complete` : `Mark "${goal.title}" as complete`}
                    aria-pressed={goal.completed}
                  >
                    {goal.completed ? (
                      <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    ) : (
                      <Circle className="size-6 text-muted-foreground" aria-hidden />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={cn("text-base font-semibold break-words", goal.completed && "line-through text-muted-foreground")}>
                        {goal.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => deleteGoal(goal.id)}
                        className="text-destructive min-w-11 min-h-11 flex items-center justify-center shrink-0 hover:bg-destructive/10 rounded-xl transition-colors"
                        aria-label={`Delete goal: ${goal.title}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {goal.description && <p className="text-sm text-muted-foreground mb-2 break-words">{goal.description}</p>}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", categoryColors[goal.category])}>
                        <span aria-hidden>{categoryIcons[goal.category]} </span>{goal.category}
                      </span>
                      {deadlineDate && (
                        <span className={cn("text-xs flex items-center gap-1", overdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-muted-foreground")}>
                          <CalendarDays className="size-3.5" aria-hidden />
                          {overdue ? "Overdue — " : ""}{deadlineDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      )}
                      {goal.completedAt && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          ✓ Completed {new Date(goal.completedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
