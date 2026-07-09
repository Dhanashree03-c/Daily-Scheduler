import { useScheduler } from "../hooks/useScheduler";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { TaskCard } from "../components/TaskCard";
import { AlarmDialog } from "../components/AlarmDialog";
import { completeItem, skipItem, deleteItem } from "../utils/storage";
import { Clock, Sparkles } from "lucide-react";

export function TodaySchedule() {
  const { tasks, currentTask, nextTask, minutesLeft, getActiveAlarms, dismissAlarm, snoozeAlarm, refresh } =
    useScheduler();

  const activeAlarms = getActiveAlarms();
  const currentAlarm = activeAlarms[0];
  const alarmTask = currentAlarm ? tasks.find((t) => t.id === currentAlarm.taskId) : undefined;

  const handleComplete = (id: string) => {
    completeItem(id);
    refresh();
  };
  const handleSkip = (id: string) => {
    skipItem(id);
    refresh();
  };
  const handleDelete = (id: string) => {
    deleteItem(id);
    refresh();
  };

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="page-shell">
      <div>
        <p className="text-sm text-muted-foreground mb-0.5">{todayLabel}</p>
        <h1 className="page-title">Today</h1>
      </div>

      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4 text-primary" />
            Right now
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentTask ? (
            <>
              <p className="font-semibold text-lg">{currentTask.title}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Clock className="size-3.5" />
                {currentTask.startTime} – {currentTask.endTime} · {minutesLeft} min left
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing scheduled right now — enjoy the free time!</p>
          )}
        </CardContent>
      </Card>

      {nextTask && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-muted-foreground">Up next</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{nextTask.title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">starts at {nextTask.startTime}</p>
          </CardContent>
        </Card>
      )}

      {tasks.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            All tasks ({tasks.length})
          </h2>
          <div className="space-y-2.5">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onSkip={handleSkip}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="settings-card text-center py-10">
          <p className="text-muted-foreground">No tasks for today yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Tap the + button to add your first task.</p>
        </div>
      )}

      {currentAlarm && (
        <AlarmDialog alarm={currentAlarm} task={alarmTask} onSnooze={snoozeAlarm} onDismiss={dismissAlarm} />
      )}
    </div>
  );
}
