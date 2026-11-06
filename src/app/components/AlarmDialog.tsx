import { useEffect, useRef } from "react";
import type { Task } from "../types";
import type { Alarm, AlarmType } from "../hooks/useScheduler";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { BellRing, Clock, AlignLeft, Volume2 } from "lucide-react";
import { formatTimeRange } from "../utils/date";
import { startAlarmRing } from "../utils/alarmTones";

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
  const stopRef = useRef<(() => void) | null>(null);

  // Ring loudly in a loop while this dialog is open. Stops on any action.
  useEffect(() => {
    if (!task) return;
    const stop = startAlarmRing();
    stopRef.current = stop;
    return () => {
      stop();
      stopRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?.id, alarm.type]);

  if (!task) return null;

  const silenceAnd = (fn: () => void) => () => {
    stopRef.current?.();
    fn();
  };

  const heading = alarm.missed ? `⏰ Missed — ${HEADINGS[alarm.type].replace(/^(▶️|⏰|🔔)\s*/, "")}` : HEADINGS[alarm.type];
  const handleComplete = silenceAnd(() => {
    onComplete?.(task.id);
    onDismiss(task.id, alarm.type);
  });
  const handleSkip = silenceAnd(() => {
    onSkip?.(task.id);
    onDismiss(task.id, alarm.type);
  });

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && silenceAnd(() => onDismiss(task.id, alarm.type))()}>
      <DialogContent aria-describedby="alarm-desc">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white animate-pulse">
              <BellRing className="size-5" aria-hidden />
            </span>
            <DialogTitle className="text-left">{heading}</DialogTitle>
            <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
              <Volume2 className="size-4" aria-hidden />
              Ringing…
            </span>
          </div>
          <DialogDescription id="alarm-desc" className="text-left">
            {queueCount > 1 && (
              <span className="block mb-2 text-xs font-semibold text-primary">
                {queueCount} reminders waiting — showing one at a time
              </span>
            )}
            <span className="block text-xs font-semibold text-rose-600 dark:text-rose-400">
              🔔 Ringing — tap Snooze / Done / Skip to stop.
            </span>
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
            onClick={silenceAnd(() => onSnooze(task.id, alarm.type, 5))}
          >
            Snooze 5 min
          </Button>
          <Button
            variant="outline"
            className="min-h-11"
            onClick={silenceAnd(() => onSnooze(task.id, alarm.type, 10))}
          >
            Snooze 10 min
          </Button>
          <Button variant="ghost" className="min-h-11" onClick={handleSkip}>
            Skip
          </Button>
          <Button className="min-h-11" onClick={handleComplete}>
            Mark done ✓
          </Button>
          <Button variant="ghost" className="min-h-11" onClick={silenceAnd(() => onDismiss(task.id, alarm.type))}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
