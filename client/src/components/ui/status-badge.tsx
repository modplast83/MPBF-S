import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getColorClasses = () => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-700";
      case "extrusion":
        return "bg-blue-100 text-blue-700";
      case "printing":
        return "bg-yellow-100 text-yellow-700";
      case "cutting":
        return "bg-green-100 text-green-700";
      case "on hold":
        return "bg-orange-100 text-orange-700";
      case "in stock":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const displayText = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        "px-2.5 py-0.5 rounded-full text-xs font-medium",
        getColorClasses(),
        className
      )}
    >
      {displayText}
    </span>
  );
}
