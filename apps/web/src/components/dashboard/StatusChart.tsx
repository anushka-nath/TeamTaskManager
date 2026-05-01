import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface StatusChartProps {
  counts: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: "#9ca3af",
  IN_PROGRESS: "#3b82f6",
  REVIEW: "#f59e0b",
  DONE: "#22c55e",
};

export function StatusChart({ counts }: StatusChartProps) {
  const data = Object.entries(counts).map(([status, value]) => ({
    name: status.replace("_", " "),
    value,
    color: STATUS_COLORS[status] || "#9ca3af",
  }));

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center h-64 text-gray-400 text-sm">
        No task data
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
