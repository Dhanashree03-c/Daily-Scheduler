import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Link } from "react-router-dom";
import { Toaster } from "sonner";
import { BottomNav } from "./app/components/BottomNav";
import { InstallPrompt } from "./app/components/InstallPrompt";
import { NotificationWidget } from "./app/components/NotificationWidget";
import { PWASetup } from "./app/components/PWASetup";
import { AlarmDialog } from "./app/components/AlarmDialog";
import { SchedulerProvider, useSchedulerContext } from "./app/components/SchedulerContext";
import { TodaySchedule } from "./app/pages/TodaySchedule";
import { AddTask } from "./app/pages/AddTask";
import { EditTask } from "./app/pages/EditTask";
import { Calendar } from "./app/pages/Calendar";
import { Notes } from "./app/pages/Notes";
import { Goals } from "./app/pages/Goals";
import { Settings } from "./app/pages/Settings";
import { Diary } from "./app/pages/Diary";
import { DoodleDrawer } from "./app/pages/DoodleDrawer";
import { MusicPlayer } from "./app/pages/MusicPlayer";
import { completeItem, skipItem } from "./app/utils/storage";
import { Compass } from "lucide-react";

function ScrollRestoration() {
  const { pathname } = useLocation();
  useEffect(() => {
    // The shell scrolls inside #main (not the window) so the tab bar height stays fixed.
    document.getElementById("main")?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <main className="page-shell">
      <div className="empty-state" role="alert">
        <span className="empty-emoji" aria-hidden="true">🧭</span>
        <h1 className="page-title text-center">Lost your way?</h1>
        <p className="text-sm text-muted-foreground">That page doesn&apos;t exist — but your day is still waiting.</p>
        <Link
          to="/"
          className="mt-2 min-h-11 inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/25 hover:bg-primary/90"
        >
          <Compass className="size-4 mr-2" aria-hidden />
          Back to Today
        </Link>
      </div>
    </main>
  );
}

function Alarms() {
  const { tasks, getActiveAlarms, snoozeAlarm, dismissAlarm, refresh, currentTask, nextTask } =
    useSchedulerContext();
  const activeAlarms = getActiveAlarms();

  // Show one dialog at a time; the next appears after dismissal/snooze.
  const alarm = activeAlarms[0];
  const task = alarm ? tasks.find((t) => t.id === alarm.taskId) : undefined;
  return (
    <>
      {alarm && task && (
        <AlarmDialog
          key={`${alarm.taskId}-${alarm.type}`}
          alarm={alarm}
          task={task}
          onSnooze={snoozeAlarm}
          onDismiss={dismissAlarm}
          queueCount={activeAlarms.length}
          onComplete={(id) => {
            completeItem(id);
            refresh();
          }}
          onSkip={(id) => {
            skipItem(id);
            refresh();
          }}
        />
      )}
      {/* Keep context consumers happy without visual noise */}
      <span className="sr-only" aria-live="polite">
        {currentTask ? `Now: ${currentTask.title}` : "No task right now"}
        {nextTask ? `. Next: ${nextTask.title}` : ""}
      </span>
    </>
  );
}

function AppShell() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <PWASetup />
      <ScrollRestoration />
      <div id="main" className="app-main bg-background text-foreground">
        <Routes>
          <Route path="/" element={<TodaySchedule />} />
          <Route path="/today" element={<TodaySchedule />} />
          <Route path="/add" element={<AddTask />} />
          <Route path="/edit/:id" element={<EditTask />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/doodle" element={<DoodleDrawer />} />
          <Route path="/music" element={<MusicPlayer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <BottomNav />
      <InstallPrompt />
      <NotificationWidget />
      <Toaster
        position="top-center"
        richColors
        closeButton
        toastOptions={{ style: { width: "min(92vw, 400px)" } }}
      />
      <Alarms />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SchedulerProvider>
        <AppShell />
      </SchedulerProvider>
    </BrowserRouter>
  );
}

export default App;
