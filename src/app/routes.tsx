import { createBrowserRouter } from "react-router-dom";
import { Root } from "./pages/Root";
import { TodaySchedule } from "./pages/TodaySchedule";
import { Calendar } from "./pages/Calendar";
import { AddTask } from "./pages/AddTask";
import { Settings } from "./pages/Settings";
import { MusicPlayer } from "./pages/MusicPlayer";
import { DoodleDrawer } from "./pages/DoodleDrawer";
import { Notes } from "./pages/Notes";
import { Diary } from "./pages/Diary";
import { Goals } from "./pages/Goals";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <TodaySchedule /> },
      { path: "today", element: <TodaySchedule /> },
      { path: "calendar", element: <Calendar /> },
      { path: "add", element: <AddTask /> },
      { path: "goals", element: <Goals /> },
      { path: "notes", element: <Notes /> },
      { path: "diary", element: <Diary /> },
      { path: "doodle", element: <DoodleDrawer /> },
      { path: "music", element: <MusicPlayer /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);

export default router;
