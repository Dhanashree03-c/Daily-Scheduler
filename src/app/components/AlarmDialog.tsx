import type { Task } from "../types";
import type { Alarm, AlarmType } from "../hooks/useScheduler";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { BellRing, Clock, AlignLeft } from "lucide-react";
import { formatTimeRange } from "../utils/date";

export interface AlarmDialogProps {
  alarm: Alarm;
  task?: Task;
  onSnooze: (taskId: string, type: AlarmType, minutes?: number) => void;
  onDismiss: (taskId: string, type: AlarmType) => void;
  onComplete?: (taskId: string) => void;
  onSkip?: (taskId: string) => void;
  queueCount?: number;
}

const HEADINGS: Record<AlarmType, string> = {
  start: "▶️ Starting now",
  end: "⏰ Time's up",
  reminder: "🔔 Coming up",
};

export function AlarmDialog({ alarm, task, onSnooze, onDismiss, onComplete, onSkip, queueCount = 1 }: AlarmDialogProps) {
  if (!task) return null;

  const handleComplete = () => {
    onComplete?.(task.id);
    onDismiss(task.id, alarm.type);
  };
  const handleSkip = () => {
    onSkip?.(task.id);
    onDismiss(task.id, alarm.type);
  };

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onDismiss(task.id, alarm.type)}>
      <DialogContent aria-describedby="alarm-desc">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <BellRing className="size-5" aria-hidden />
            </span>
            <DialogTitle className="text-left">{HEADINGS[alarm.type]}</DialogTitle>
          </div>
          <DialogDescription id="alarm-desc" className="text-left">
            {queueCount > 1 && (
              <span className="block mb-2 text-xs font-semibold text-primary">
                {queueCount} reminders waiting — showing one at a time
              </span>
            )}
          </DialogDescription>
          <div className="text-left space-y-2 pt-1">
            <p className="font-semibold text-foreground text-lg">{task.title}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" aria-hidden />
              {formatTimeRange(task.startTime, task.endTime)}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                {task.type === "appointment" ? "Appointment" : "Task"}
              </span>
            </p>
            {task.description && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlignLeft className="size-4 mt-0.5 shrink-0" aria-hidden />
                <span className="whitespace-pre-wrap break-words">{task.description}</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {alarm.type === "start" && "Time to get started 🎉"}
              {alarm.type === "end" && "Move on to your next task when you're ready."}
              {alarm.type === "reminder" && `Starting soon — in ${task.reminderMinutes} min.`}
            </p>
          </div>
        </DialogHeader>
        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => onSnooze(task.id, alarm.type, 5)}
          >
            Snooze 5 min
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => onSnooze(task.id, alarm.type, 10)}
          >
            Snooze 10 min
          </Button>
          <Button
            variant="ghost"
            className="min-h-11"
            onClick={handleSkip}
          >
            Skip
          </Button>
          <Button className="min-h-11" onClick={handleComplete}>
            Mark done ✓
          </Button>
          <Button variant="ghost" className="min-h-11" onClick={() => onDismiss(task.id, alarm.type)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
