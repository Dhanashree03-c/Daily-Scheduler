import { useState } from "react";
import { useNavigate } from "react-router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../components/ui/select";
import { addItem } from "../utils/storage";
import type { NewTask, TaskType } from "../types";
import { requestNotificationPermission } from "../utils/notifications";

function getLocalDateStr() {
  const date = new Date();
  const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().split("T")[0];
}

export function AddTask() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TaskType>("task");
  const [date, setDate] = useState(getLocalDateStr());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [reminderMinutes, setReminderMinutes] = useState("10");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await requestNotificationPermission();

    const task: NewTask = {
      title,
      description: description || undefined,
      type,
      date,
      startTime,
      endTime,
      alarmEnabled,
      reminderMinutes: Number(reminderMinutes),
    };
    addItem(task);
    navigate("/today");
  }

  return (
    <form onSubmit={handleSubmit} className="page-shell space-y-4">
      <h1 className="page-title">Add task</h1>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          title="Task title"
          placeholder="Enter title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          title="Task description"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select
          value={type}
          onValueChange={(v: string) => setType(v as TaskType)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="appointment">Appointment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          title="Task date"
          placeholder="Select date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="startTime">Start</Label>
          <Input
            id="startTime"
            title="Start time"
            placeholder="Start time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="endTime">End</Label>
          <Input
            id="endTime"
            title="End time"
            placeholder="End time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="alarmEnabled"
          title="Enable reminder"
          aria-label="Enable reminder"
          checked={alarmEnabled}
          onChange={(e) => setAlarmEnabled(e.target.checked)}
        />
        <Label htmlFor="alarmEnabled">Enable reminder</Label>
      </div>

      {alarmEnabled && (
        <div>
          <Label htmlFor="reminderMinutes">Remind me before (minutes)</Label>
          <Input
            id="reminderMinutes"
            title="Reminder minutes"
            placeholder="Minutes before reminder"
            type="number"
            min={0}
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(e.target.value)}
          />
        </div>
      )}

      <Button type="submit" className="w-full">Save</Button>
    </form>
  );
}