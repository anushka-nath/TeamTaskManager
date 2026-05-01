import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateTaskInput, UpdateTaskInput } from "@ttm/shared";

async function fetchTasks(projectId: string) {
  const res = await api.get(`/projects/${projectId}/tasks`);
  return res.data.data;
}

async function fetchTask(projectId: string, taskId: string) {
  const res = await api.get(`/projects/${projectId}/tasks/${taskId}`);
  return res.data.data;
}

async function createTask({ projectId, data }: { projectId: string; data: CreateTaskInput }) {
  const res = await api.post(`/projects/${projectId}/tasks`, data);
  return res.data.data;
}

async function updateTask({
  projectId,
  taskId,
  data,
}: {
  projectId: string;
  taskId: string;
  data: UpdateTaskInput;
}) {
  const res = await api.patch(`/projects/${projectId}/tasks/${taskId}`, data);
  return res.data.data;
}

async function deleteTask({ projectId, taskId }: { projectId: string; taskId: string }) {
  const res = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
  return res.data.data;
}

export function useTasks(projectId: string) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => fetchTasks(projectId),
    enabled: !!projectId,
  });
}

export function useTask(projectId: string, taskId: string) {
  return useQuery({
    queryKey: ["task", projectId, taskId],
    queryFn: () => fetchTask(projectId, taskId),
    enabled: !!projectId && !!taskId,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTask,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.projectId] });
      qc.invalidateQueries({ queryKey: ["project", vars.projectId] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTask,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.projectId] });
      qc.invalidateQueries({ queryKey: ["task", vars.projectId, vars.taskId] });
      qc.invalidateQueries({ queryKey: ["project", vars.projectId] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["tasks", vars.projectId] });
      qc.invalidateQueries({ queryKey: ["project", vars.projectId] });
    },
  });
}
