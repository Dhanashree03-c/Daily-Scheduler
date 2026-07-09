import type { Task } from "../types";
import type { Alarm, AlarmType } from "../hooks/useScheduler";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";

export interface AlarmDialogProps {
  alarm: Alarm;
  task?: Task;
  onSnooze: (taskId: string, type: AlarmType, minutes?: number) => void;
  onDismiss: (taskId: string, type: AlarmType) => void;
}

const MESSAGES: Record<AlarmType, (title: string) => { heading: string; body: string }> = {
  start: (t) => ({ heading: `Now: ${t}`, body: "Time to get started." }),
  end: (t) => ({ heading: `Time's up: ${t}`, body: "Move on to your next task." }),
  reminder: (t) => ({ heading: `Upcoming: ${t}`, body: "Starting soon." }),
};

export function AlarmDialog({ alarm, task, onSnooze, onDismiss }: AlarmDialogProps) {
  if (!task) return null;
  const msg = MESSAGES[alarm.type](task.title);

  return (
    <Dialog open onOpenChange={(open: boolean) => !open && onDismiss(alarm.taskId, alarm.type)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{msg.heading}</DialogTitle>
          <DialogDescription>{msg.body}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onSnooze(alarm.taskId, alarm.type, 5)}>
            Snooze 5 min
          </Button>
          <Button onClick={() => onDismiss(alarm.taskId, alarm.type)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}