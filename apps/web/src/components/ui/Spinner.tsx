interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-4",
  lg: "w-12 h-12 border-4",
};

export function Spinner({ size = "md" }: SpinnerProps) {
  return (
    <div
      className={`inline-block rounded-full border-gray-300 border-t-blue-600 animate-spin ${sizeClasses[size]}`}
      role="status"
      aria-label="Loading"
    />
  );
}
