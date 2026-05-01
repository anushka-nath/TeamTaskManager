import { useNavigate } from "react-router-dom";
import { Calendar, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PriorityBadge } from "@/components/task/PriorityBadge";
import { cn } from "@/lib/utils";

interface OverdueTask {
  id: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string;
  status: string;
  project: { id: string; name: string };
  assignee?: { id: string; name: string } | null;
}

interface OverdueListProps {
  tasks: OverdueTask[];
}

export function OverdueList({ tasks }: OverdueListProps) {
  const navigate = useNavigate();

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">No overdue tasks</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => navigate(`/projects/${task.project.id}/tasks/${task.id}`)}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-red-400"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
            <p className="text-xs text-gray-500">{task.project.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PriorityBadge priority={task.priority} />
            <div className={cn("flex items-center gap-1 text-xs text-gray-500")}>
              <Calendar className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(task.dueDate))} ago</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
