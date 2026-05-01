import { FolderKanban, CheckSquare, AlertCircle, CheckCircle, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboardStats, useOverdueTasks, useRecentActivity } from "@/hooks/useDashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { OverdueList } from "@/components/dashboard/OverdueList";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: overdue, isLoading: overdueLoading } = useOverdueTasks();
  const { data: recent, isLoading: recentLoading } = useRecentActivity();

  const isLoading = statsLoading || overdueLoading || recentLoading;

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Task Status Distribution</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6 h-64 flex items-center justify-center">
              <Spinner size="md" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Overdue Tasks</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6 h-64 flex items-center justify-center">
              <Spinner size="md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Projects"
          value={stats?.totalProjects || 0}
          icon={FolderKanban}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Active Tasks"
          value={stats?.activeTasks || 0}
          icon={CheckSquare}
          color="bg-yellow-50 text-yellow-600"
        />
        <StatCard
          label="Overdue Tasks"
          value={stats?.overdueTasks || 0}
          icon={AlertCircle}
          color="bg-red-50 text-red-600"
        />
        <StatCard
          label="Completed This Week"
          value={stats?.completedThisWeek || 0}
          icon={CheckCircle}
          color="bg-green-50 text-green-600"
        />
      </div>

      {stats?.totalProjects === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-1">Welcome! Let's get started</h2>
              <p className="text-blue-700 text-sm">
                Create your first project to start adding tasks and inviting team members.
              </p>
            </div>
            <button
              onClick={() => navigate("/projects")}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Create Project
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-md p-3 border border-blue-100">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Step 1</div>
              <div className="text-sm font-medium text-gray-900">Create a Project</div>
              <div className="text-xs text-gray-500 mt-0.5">You become the project admin</div>
            </div>
            <div className="bg-white rounded-md p-3 border border-blue-100">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Step 2</div>
              <div className="text-sm font-medium text-gray-900">Invite Members</div>
              <div className="text-xs text-gray-500 mt-0.5">Add admins or members by email</div>
            </div>
            <div className="bg-white rounded-md p-3 border border-blue-100">
              <div className="text-xs font-medium text-gray-500 uppercase mb-1">Step 3</div>
              <div className="text-sm font-medium text-gray-900">Add Tasks</div>
              <div className="text-xs text-gray-500 mt-0.5">Create and assign tasks to your team</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Task Status Distribution</h2>
          <StatusChart counts={stats?.taskStatusCounts || {}} />
        </div>
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Overdue Tasks</h2>
          <OverdueList tasks={overdue || []} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Activity</h2>
        {recent && recent.length > 0 ? (
          <RecentActivity tasks={recent} />
        ) : (
          <EmptyState title="No recent activity" description="Tasks you update will appear here." icon={CheckSquare} />
        )}
      </div>
    </div>
  );
}
