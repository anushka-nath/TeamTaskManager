import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateProjectInput, UpdateProjectInput, InviteMemberInput } from "@ttm/shared";

async function fetchProjects() {
  const res = await api.get("/projects");
  return res.data.data;
}

async function fetchProject(id: string) {
  const res = await api.get(`/projects/${id}`);
  return res.data.data;
}

async function createProject(data: CreateProjectInput) {
  const res = await api.post("/projects", data);
  return res.data.data;
}

async function updateProject({ id, data }: { id: string; data: UpdateProjectInput }) {
  const res = await api.patch(`/projects/${id}`, data);
  return res.data.data;
}

async function deleteProject(id: string) {
  const res = await api.delete(`/projects/${id}`);
  return res.data.data;
}

async function inviteMember({ projectId, data }: { projectId: string; data: InviteMemberInput }) {
  const res = await api.post(`/projects/${projectId}/members`, data);
  return res.data.data;
}

async function removeMember({ projectId, userId }: { projectId: string; userId: string }) {
  const res = await api.delete(`/projects/${projectId}/members/${userId}`);
  return res.data.data;
}

async function updateMemberRole({
  projectId,
  userId,
  role,
}: {
  projectId: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
}) {
  const res = await api.patch(`/projects/${projectId}/members/${userId}`, { role });
  return res.data.data;
}

export function useProjects() {
  return useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
}

export function useProject(id: string) {
  return useQuery({ queryKey: ["project", id], queryFn: () => fetchProject(id), enabled: !!id });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateProject,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["project", vars.id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inviteMember,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["project", vars.projectId] });
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: removeMember,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["project", vars.projectId] });
    },
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMemberRole,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["project", vars.projectId] });
    },
  });
}
