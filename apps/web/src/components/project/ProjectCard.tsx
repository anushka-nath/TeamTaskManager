import { useNavigate } from "react-router-dom";
import { Folder, Users, CheckSquare, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    status: string;
    _count: { members: number; tasks: number };
  };
  onArchive?: () => void;
}

export function ProjectCard({ project, onArchive }: ProjectCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-5 cursor-pointer hover:shadow-md transition-shadow",
        project.status === "ARCHIVED" && "opacity-75"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Folder className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">{project.name}</h3>
        </div>
        {project.status === "ARCHIVED" && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            <Archive className="w-3 h-3" />
            Archived
          </span>
        )}
      </div>
      {project.description && (
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{project.description}</p>
      )}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{project._count.members}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckSquare className="w-4 h-4" />
          <span>{project._count.tasks}</span>
        </div>
      </div>
      {onArchive && project.status === "ACTIVE" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          className="mt-3 text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Archive
        </button>
      )}
    </div>
  );
}
