import { BrowserRouter, Routes, Route } from "react-router";
import { BottomNav } from "./app/components/BottomNav";
import { InstallPrompt } from "./app/components/InstallPrompt";
import { PWASetup } from "./app/components/PWASetup";
import { TodaySchedule } from "./app/pages/TodaySchedule";
import { AddTask } from "./app/pages/AddTask";
import { Calendar } from "./app/pages/Calendar";
import { Notes } from "./app/pages/Notes";
import { Goals } from "./app/pages/Goals";
import { Settings } from "./app/pages/Settings";
import "./App.css";

function App() {
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
        </Routes>
      </div>
      <BottomNav />
      <InstallPrompt />
    </BrowserRouter>
  );
}

export default App;