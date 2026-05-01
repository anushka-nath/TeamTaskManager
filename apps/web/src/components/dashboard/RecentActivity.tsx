import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface RecentTask {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  project: { id: string; name: string };
}

interface RecentActivityProps {
  tasks: RecentTask[];
}

export function RecentActivity({ tasks }: RecentActivityProps) {
  const navigate = useNavigate();

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {tasks.map((task) => (
        <div
          key={task.id}
          onClick={() => navigate(`/projects/${task.project.id}/tasks/${task.id}`)}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
            <p className="text-xs text-gray-500">{task.project.name}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                task.status === "DONE"
                  ? "bg-green-50 text-green-700"
                  : task.status === "IN_PROGRESS"
                  ? "bg-blue-50 text-blue-700"
                  : task.status === "REVIEW"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-gray-50 text-gray-700"
              )}
            >
              {task.status.replace("_", " ")}
            </span>
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(task.updatedAt))} ago
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
