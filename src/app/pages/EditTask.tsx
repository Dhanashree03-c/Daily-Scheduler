import { useParams, Link } from "react-router-dom";
import { TaskForm } from "../components/TaskForm";
import { getTaskById } from "../utils/storage";
import { EmptyState } from "../components/EmptyState";

export function EditTask() {
  const { id } = useParams<{ id: string }>();
  const task = id ? getTaskById(id) : undefined;

  if (!task) {
    return (
      <main className="page-shell">
        <EmptyState
          emoji="🔍"
          title="Task not found"
          message="This task may have been deleted already."
          ctaLabel="Back to Today"
          ctaTo="/"
        />
        <Link to="/today" className="sr-only">Go to today</Link>
      </main>
    );
  }

  return <TaskForm mode="edit" initial={task} />;
}
