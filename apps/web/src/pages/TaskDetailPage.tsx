import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, UserCircle, Trash2, Clock } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useTask, useUpdateTask, useDeleteTask } from "@/hooks/useTasks";
import { useProject } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { PriorityBadge } from "@/components/task/PriorityBadge";
import { Spinner } from "@/components/ui/Spinner";
import { TaskForm } from "@/components/task/TaskForm";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function TaskDetailPage() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const { data: task, isLoading } = useTask(projectId!, taskId!);
  const { data: project } = useProject(projectId!);
  const { user } = useAuth();
  const navigate = useNavigate();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [showEdit, setShowEdit] = useState(false);

  const isAdmin = project?.members?.some(
    (m: any) => m.user.id === user?.id && m.role === "ADMIN"
  );
  const isAssignee = task?.assigneeId === user?.id;
  const canEdit = isAdmin || isAssignee;
  const canDelete = isAdmin;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Task not found</p>
        <Link to={`/projects/${projectId}`} className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Back to project
        </Link>
      </div>
    );
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/projects/${projectId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to project
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <PriorityBadge priority={task.priority} />
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
              {isOverdue && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                  Overdue
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => setShowEdit(true)}
                className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100"
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => {
                  if (confirm("Delete this task?")) {
                    deleteTask.mutate(
                      { projectId: projectId!, taskId: taskId! },
                      { onSuccess: () => navigate(`/projects/${projectId}`) }
                    );
                  }
                }}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {task.description && (
          <p className="text-gray-700 text-sm mb-6">{task.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <UserCircle className="w-4 h-4" />
            <span>Assignee: {task.assignee?.name || "Unassigned"}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <UserCircle className="w-4 h-4" />
            <span>Created by: {task.creator?.name}</span>
          </div>
          {task.dueDate && (
            <div className={cn("flex items-center gap-2", isOverdue && "text-red-600 font-medium")}>
              <Calendar className="w-4 h-4" />
              <span>Due: {format(new Date(task.dueDate), "PPP p")}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Created {formatDistanceToNow(new Date(task.createdAt))} ago</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Updated {formatDistanceToNow(new Date(task.updatedAt))} ago</span>
          </div>
        </div>

        {!isAdmin && isAssignee && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
            <select
              value={task.status}
              onChange={(e) =>
                updateTask.mutate({
                  projectId: projectId!,
                  taskId: taskId!,
                  data: { status: e.target.value as any },
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        )}
      </div>

      {showEdit && (
        <TaskForm
          mode="edit"
          projectId={projectId!}
          task={task}
          projectMembers={project?.members || []}
          onClose={() => setShowEdit(false)}
          onSubmit={() => setShowEdit(false)}
        />
      )}
    </div>
  );
}
