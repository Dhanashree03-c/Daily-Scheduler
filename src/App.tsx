import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { BottomNav } from "./app/components/BottomNav";
import { InstallPrompt } from "./app/components/InstallPrompt";
import { PWASetup } from "./app/components/PWASetup";
import { AlarmDialog } from "./app/components/AlarmDialog";
import { useScheduler } from "./app/hooks/useScheduler";
import { TodaySchedule } from "./app/pages/TodaySchedule";
import { AddTask } from "./app/pages/AddTask";
import { Calendar } from "./app/pages/Calendar";
import { Notes } from "./app/pages/Notes";
import { Goals } from "./app/pages/Goals";
import { Settings } from "./app/pages/Settings";
import { Diary } from "./app/pages/Diary";
import { DoodleDrawer } from "./app/pages/DoodleDrawer";
import { MusicPlayer } from "./app/pages/MusicPlayer";
import "./App.css";

function App() {
  const { tasks, getActiveAlarms, snoozeAlarm, dismissAlarm } = useScheduler();
  const activeAlarms = getActiveAlarms();

  return (
    <BrowserRouter>
      <PWASetup />
      <div className="min-h-screen bg-background text-foreground pb-16">
        <Routes>
          <Route path="/" element={<TodaySchedule />} />
          <Route path="/today" element={<TodaySchedule />} />
          <Route path="/add" element={<AddTask />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/doodle" element={<DoodleDrawer />} />
          <Route path="/music" element={<MusicPlayer />} />
        </Routes>
      </div>
      <BottomNav />
      <InstallPrompt />
      <Toaster position="top-center" />

      {activeAlarms.map((alarm) => {
        const task = tasks.find((t) => t.id === alarm.taskId);
        return (
          <AlarmDialog
            key={`${alarm.taskId}-${alarm.type}`}
            alarm={alarm}
            task={task}
            onSnooze={snoozeAlarm}
            onDismiss={dismissAlarm}
          />
        );
      })}
    </BrowserRouter>
  );
}

export default App;