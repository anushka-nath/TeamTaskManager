import { FolderKanban, CheckSquare, AlertCircle, CheckCircle } from "lucide-react";
import { useDashboardStats, useOverdueTasks, useRecentActivity } from "@/hooks/useDashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusChart } from "@/components/dashboard/StatusChart";
import { OverdueList } from "@/components/dashboard/OverdueList";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Spinner } from "@/components/ui/Spinner";

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: overdue, isLoading: overdueLoading } = useOverdueTasks();
  const { data: recent, isLoading: recentLoading } = useRecentActivity();

  const isLoading = statsLoading || overdueLoading || recentLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
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
        <RecentActivity tasks={recent || []} />
      </div>
    </div>
  );
}
