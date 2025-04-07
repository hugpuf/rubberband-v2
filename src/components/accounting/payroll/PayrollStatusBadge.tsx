
import { Badge } from "@/components/ui/badge";

interface PayrollStatusBadgeProps {
  status: "draft" | "processing" | "completed" | "error";
}

export function PayrollStatusBadge({ status }: PayrollStatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: "Draft",
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800",
    },
    processing: {
      label: "Processing",
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800",
    },
    completed: {
      label: "Completed",
      className: "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
    },
    error: {
      label: "Error",
      className: "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800",
    },
  };

  const config = statusConfig[status];
  
  return (
    <Badge className={config.className} variant="outline">
      {config.label}
    </Badge>
  );
}
