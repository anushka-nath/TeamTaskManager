import { useState } from "react";
import { X } from "lucide-react";
import { useCreateTask, useUpdateTask } from "@/hooks/useTasks";
import type { CreateTaskInput, UpdateTaskInput } from "@ttm/shared";

interface TaskFormProps {
  mode: "create" | "edit";
  projectId: string;
  task?: {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    dueDate?: string | null;
    assigneeId?: string | null;
    status: string;
  };
  projectMembers: { user: { id: string; name: string; email: string } }[];
  onClose: () => void;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => void;
}

export function TaskForm({ mode, projectId, task, projectMembers, onClose }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<string>(task?.priority ?? "MEDIUM");
  const [dueDate, setDueDate] = useState<string>(
    task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ""
  );
  const [assigneeId, setAssigneeId] = useState<string>(task?.assigneeId ?? "");
  const [error, setError] = useState("");

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const data: CreateTaskInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority as any,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      assigneeId: assigneeId || null,
    };

    if (mode === "create") {
      createTask.mutate(
        { projectId, data },
        {
          onError: (err: any) => {
            setError(err.response?.data?.error?.message || "Failed to create task");
          },
          onSuccess: () => onClose(),
        }
      );
    } else if (task) {
      updateTask.mutate(
        { projectId, taskId: task.id, data },
        {
          onError: (err: any) => {
            setError(err.response?.data?.error?.message || "Failed to update task");
          },
          onSuccess: () => onClose(),
        }
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {mode === "create" ? "New Task" : "Edit Task"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Task title"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {projectMembers.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} ({m.user.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              {mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
