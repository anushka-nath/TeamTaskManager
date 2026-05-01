import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Settings, Users, CheckSquare } from "lucide-react";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { MemberList } from "@/components/project/MemberList";
import { ProjectForm } from "@/components/project/ProjectForm";
import { TaskBoard } from "@/components/task/TaskBoard";
import { TaskCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

type Tab = "tasks" | "members" | "settings";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id!);
  const { user } = useAuth();
  const updateProject = useUpdateProject();
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [showEditForm, setShowEditForm] = useState(false);

  const isAdmin = project?.members?.some(
    (m: any) => m.user.id === user?.id && m.role === "ADMIN"
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-8 w-64 bg-gray-200 rounded" />
        </div>
        <div className="h-10 w-full bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <TaskCardSkeleton />
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Project not found</p>
        <Link to="/projects" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Back to projects
        </Link>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "tasks", label: "Tasks", icon: CheckSquare },
    { key: "members", label: "Members", icon: Users },
  ];

  if (isAdmin) {
    tabs.push({ key: "settings", label: "Settings", icon: Settings });
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="text-gray-600 mt-1">{project.description}</p>
            )}
          </div>
          {project.status === "ARCHIVED" && (
            <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
              Archived
            </span>
          )}
        </div>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "tasks" && (
        project.tasks?.length === 0 ? (
          <EmptyState
            title="No tasks yet"
            description="Create your first task to track progress."
            icon={CheckSquare}
          />
        ) : (
          <TaskBoard
            projectId={project.id}
            isAdmin={!!isAdmin}
            projectMembers={project.members || []}
          />
        )
      )}

      {activeTab === "members" && (
        <MemberList
          projectId={project.id}
          members={project.members || []}
          isAdmin={!!isAdmin}
        />
      )}

      {activeTab === "settings" && isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 max-w-xl space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Project Settings</h3>
          <button
            onClick={() => setShowEditForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Edit Project
          </button>
          {project.status === "ACTIVE" && (
            <button
              onClick={() => updateProject.mutate({ id: project.id, data: { status: "ARCHIVED" } })}
              className="ml-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Archive Project
            </button>
          )}
          {project.status === "ARCHIVED" && (
            <button
              onClick={() => updateProject.mutate({ id: project.id, data: { status: "ACTIVE" } })}
              className="ml-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Unarchive Project
            </button>
          )}
        </div>
      )}

      {showEditForm && (
        <ProjectForm
          mode="edit"
          project={project}
          onClose={() => setShowEditForm(false)}
          onSubmit={(data) => {
            updateProject.mutate({ id: project.id, data });
            setShowEditForm(false);
          }}
        />
      )}
    </div>
  );
}
