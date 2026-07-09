import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, CheckCircle2, Circle, Flag, TrendingUp } from 'lucide-react';
import { cn } from '../components/ui/utils';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'work' | 'health' | 'learning' | 'other';
  completed: boolean;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
}

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>(() => {
    const saved = localStorage.getItem('goals');
    return saved ? JSON.parse(saved) : [];
  });

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'personal' as Goal['category'],
    deadline: '',
  });

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  const addGoal = () => {
    if (!newGoal.title.trim()) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      category: newGoal.category,
      completed: false,
      deadline: newGoal.deadline || undefined,
      createdAt: new Date().toISOString(),
    };

    setGoals([goal, ...goals]);
    setNewGoal({ title: '', description: '', category: 'personal', deadline: '' });
    setShowAddGoal(false);
  };

  const toggleGoalCompletion = (id: string) => {
    setGoals(goals.map(g =>
      g.id === id
        ? {
            ...g,
            completed: !g.completed,
            completedAt: !g.completed ? new Date().toISOString() : undefined,
          }
        : g
    ));
  };

  const deleteGoal = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const filteredGoals = goals.filter(g => {
    if (filter === 'active') return !g.completed;
    if (filter === 'completed') return g.completed;
    return true;
  });

  const stats = {
    total: goals.length,
    completed: goals.filter(g => g.completed).length,
    active: goals.filter(g => !g.completed).length,
    completionRate: goals.length > 0 ? Math.round((goals.filter(g => g.completed).length / goals.length) * 100) : 0,
  };

  const categoryColors = {
    personal: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
    work: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    health: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    learning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    other: 'bg-muted text-muted-foreground border-border',
  };

  const categoryIcons = {
    personal: '👤',
    work: '💼',
    health: '💪',
    learning: '📚',
    other: '🎯',
  };

  const inputClass =
    'w-full px-3 py-2.5 border border-border rounded-xl bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50';

  return (
    <div className="page-shell max-w-2xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-2">
          <Target className="size-7 text-primary" />
          <h1 className="page-title">Goals</h1>
        </div>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="bg-primary text-primary-foreground rounded-full p-3 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          aria-label="Add new goal"
        >
          <Plus className="size-6" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-4 text-primary-foreground bg-gradient-to-br from-primary to-primary/80 shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="size-5" />
            <p className="text-sm opacity-90">Completion Rate</p>
          </div>
          <p className="text-3xl font-bold">{stats.completionRate}%</p>
        </div>
        <div className="settings-card !py-4">
          <p className="text-sm text-muted-foreground mb-1">Goals</p>
          <p className="text-2xl font-bold">
            <span className="text-emerald-600 dark:text-emerald-400">{stats.completed}</span>
            <span className="text-muted-foreground text-lg font-normal"> / {stats.total}</span>
          </p>
        </div>
      </div>

      {showAddGoal && (
        <div className="settings-card">
          <h3 className="text-base font-semibold mb-4">New Goal</h3>
          <label htmlFor="goalTitle" className="sr-only">Goal Title</label>
          <input
            id="goalTitle"
            type="text"
            placeholder="Goal title"
            value={newGoal.title}
            onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            className={cn(inputClass, 'mb-3')}
          />
          <label htmlFor="goalDescription" className="sr-only">Goal Description</label>
          <textarea
            id="goalDescription"
            placeholder="Description (optional)"
            value={newGoal.description}
            onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            className={cn(inputClass, 'mb-3 h-20 resize-none')}
          />
          <div className="mb-3">
            <label htmlFor="category" className="text-sm text-muted-foreground mb-1 block">
              Category
            </label>
            <select
              id="category"
              value={newGoal.category}
              onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as Goal['category'] })}
              className={inputClass}
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="health">Health</option>
              <option value="learning">Learning</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="deadline" className="text-sm text-muted-foreground mb-1 block">
              Deadline (optional)
            </label>
            <input
              id="deadline"
              type="date"
              value={newGoal.deadline}
              onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addGoal}
              className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Add Goal
            </button>
            <button
              onClick={() => setShowAddGoal(false)}
              className="px-4 py-2.5 border border-border rounded-xl hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium transition-all',
              filter === f
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-foreground hover:bg-accent'
            )}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Completed'} (
            {f === 'all' ? stats.total : f === 'active' ? stats.active : stats.completed})
          </button>
        ))}
      </div>

      {filteredGoals.length === 0 ? (
        <div className="settings-card text-center py-12">
          <Flag className="size-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            {filter === 'all' ? 'No goals yet' : filter === 'active' ? 'No active goals' : 'No completed goals'}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowAddGoal(true)}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-colors"
            >
              Set Your First Goal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => (
            <div
              key={goal.id}
              className={cn('settings-card !py-3.5', goal.completed && 'opacity-60')}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleGoalCompletion(goal.id)}
                  className="mt-0.5 flex-shrink-0"
                  aria-label={goal.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                  {goal.completed ? (
                    <CheckCircle2 className="size-6 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="size-6 text-muted-foreground" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={cn('text-base font-semibold', goal.completed && 'line-through text-muted-foreground')}>
                      {goal.title}
                    </h3>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-destructive p-1 flex-shrink-0 hover:bg-destructive/10 rounded-lg transition-colors"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {goal.description && (
                    <p className="text-sm text-muted-foreground mb-2">{goal.description}</p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs px-2.5 py-1 rounded-full border', categoryColors[goal.category])}>
                      {categoryIcons[goal.category]} {goal.category}
                    </span>

                    {goal.deadline && (
                      <span className="text-xs text-muted-foreground">
                        📅 {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    )}

                    {goal.completedAt && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">
                        ✓ Completed {new Date(goal.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
