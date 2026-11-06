import { useSearchParams } from "react-router-dom";
import { TaskForm } from "../components/TaskForm";

export function AddTask() {
  const [params] = useSearchParams();
  const initialDate = params.get("date") ?? undefined;
  return <TaskForm mode="add" initialDate={initialDate} />;
}
