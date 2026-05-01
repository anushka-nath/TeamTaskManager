import { useState } from "react";
import { Plus, FolderOpen } from "lucide-react";
import { useProjects, useCreateProject, useUpdateProject } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectForm } from "@/components/project/ProjectForm";
import { ProjectCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CreateProjectInput } from "@ttm/shared";

export function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  async function handleCreate(data: CreateProjectInput) {
    await createProject.mutateAsync(data);
  }

  function handleArchive(id: string) {
    updateProject.mutate({ id, data: { status: "ARCHIVED" } });
  }

  const filteredProjects = showArchived
    ? projects
    : projects?.filter((p: { status: string }) => p.status === "ACTIVE");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show archived
        </label>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
          <ProjectCardSkeleton />
        </div>
      )}

      {!isLoading && (!filteredProjects || filteredProjects.length === 0) && (
        <EmptyState
          title="No projects yet"
          description="Create your first project to get started."
          icon={FolderOpen}
        />
      )}

      {!isLoading && filteredProjects && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project: any) => (
            <ProjectCard key={project.id} project={project} onArchive={() => handleArchive(project.id)} />
          ))}
        </div>
      )}

      {showForm && (
        <ProjectForm mode="create" onClose={() => setShowForm(false)} onSubmit={handleCreate} />
      )}
    </div>
  );
}
