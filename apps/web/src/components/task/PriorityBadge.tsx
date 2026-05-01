import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

const styles = {
  LOW: "bg-blue-50 text-blue-700 border-blue-200",
  MEDIUM: "bg-green-50 text-green-700 border-green-200",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200",
  URGENT: "bg-red-50 text-red-700 border-red-200",
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block text-xs font-medium px-2 py-0.5 rounded-full border",
        styles[priority]
      )}
    >
      {priority}
    </span>
  );
}
