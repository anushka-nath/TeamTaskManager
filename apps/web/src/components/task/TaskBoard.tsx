import { useState } from "react";
import { Plus } from "lucide-react";
import { StatusColumn } from "./StatusColumn";
import { TaskForm } from "./TaskForm";
import { useTasks, useUpdateTask } from "@/hooks/useTasks";
import { Spinner } from "@/components/ui/Spinner";

interface TaskBoardProps {
  projectId: string;
  isAdmin: boolean;
  projectMembers: { user: { id: string; name: string; email: string } }[];
}

const statuses = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;

export function TaskBoard({ projectId, isAdmin, projectMembers }: TaskBoardProps) {
  const { data: tasks, isLoading } = useTasks(projectId);
  const updateTask = useUpdateTask();
  const [showForm, setShowForm] = useState(false);

  function handleStatusChange(taskId: string, status: string) {
    updateTask.mutate({ projectId, taskId, data: { status: status as any } });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const tasksByStatus = statuses.map((status) => ({
    status,
    items: tasks?.filter((t: any) => t.status === status) || [],
  }));

  return (
    <div>
      {isAdmin && (
        <div className="mb-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tasksByStatus.map(({ status, items }) => (
          <StatusColumn
            key={status}
            status={status}
            tasks={items}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
      {showForm && (
        <TaskForm
          mode="create"
          projectId={projectId}
          projectMembers={projectMembers}
          onClose={() => setShowForm(false)}
          onSubmit={() => {
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
}
