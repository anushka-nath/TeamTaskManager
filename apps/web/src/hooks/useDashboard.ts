import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

async function fetchStats() {
  const res = await api.get("/dashboard/stats");
  return res.data.data;
}

async function fetchOverdue() {
  const res = await api.get("/dashboard/overdue");
  return res.data.data;
}

async function fetchRecent() {
  const res = await api.get("/dashboard/recent");
  return res.data.data;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchStats,
    refetchInterval: 60000,
  });
}

export function useOverdueTasks() {
  return useQuery({
    queryKey: ["dashboard", "overdue"],
    queryFn: fetchOverdue,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "recent"],
    queryFn: fetchRecent,
  });
}
