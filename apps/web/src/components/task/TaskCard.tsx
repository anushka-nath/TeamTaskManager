import { useNavigate } from "react-router-dom";
import { Calendar, UserCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { PriorityBadge } from "./PriorityBadge";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: string;
    dueDate?: string | null;
    assignee?: { id: string; name: string } | null;
    projectId?: string;
  };
  onStatusChange?: (status: string) => void;
}

export function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const navigate = useNavigate();
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div
      onClick={() => navigate(`/projects/${task.projectId}/tasks/${task.id}`)}
      className={cn(
        "bg-white rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow",
        isOverdue ? "border-red-300" : "border-gray-200"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{task.title}</h4>
        {isOverdue && <AlertCircle className="w-4 h-4 text-red-500 shrink-0 ml-2" />}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <UserCircle className="w-3.5 h-3.5" />
          <span>{task.assignee?.name || "Unassigned"}</span>
        </div>
        {task.dueDate && (
          <div className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(task.dueDate), "MMM d")}</span>
          </div>
        )}
      </div>
      {onStatusChange && (
        <div className="mt-3 pt-2 border-t border-gray-100 flex gap-1">
          {["TODO", "IN_PROGRESS", "REVIEW", "DONE"].map((s) => (
            <button
              key={s}
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(s);
              }}
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded border transition-colors",
                task.status === s
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              )}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
