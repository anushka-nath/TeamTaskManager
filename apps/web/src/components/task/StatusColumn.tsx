import { TaskCard } from "./TaskCard";

interface Task {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: string;
  dueDate?: string | null;
  assignee?: { id: string; name: string } | null;
}

interface StatusColumnProps {
  status: string;
  tasks: Task[];
  onStatusChange: (taskId: string, status: string) => void;
}

const statusLabels: Record<string, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  DONE: "Done",
};

export function StatusColumn({ status, tasks, onStatusChange }: StatusColumnProps) {
  const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const sorted = [...tasks].sort((a, b) => {
    const pa = priorityOrder[a.priority] || 0;
    const pb = priorityOrder[b.priority] || 0;
    return pb - pa;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-gray-700">{statusLabels[status] || status}</h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div className="flex-1 space-y-3 min-h-[120px]">
        {sorted.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onStatusChange={(s) => onStatusChange(task.id, s)}
          />
        ))}
      </div>
    </div>
  );
}
