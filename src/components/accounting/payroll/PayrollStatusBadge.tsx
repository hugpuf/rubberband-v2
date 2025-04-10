
import { Badge } from "@/components/ui/badge";
import { PayrollRun, PayrollRunStatus } from "@/modules/accounting/types";

interface PayrollStatusBadgeProps {
  status: PayrollRun['status'];
}

export function PayrollStatusBadge({ status }: PayrollStatusBadgeProps) {
  const statusConfig = {
    [PayrollRunStatus.DRAFT]: {
      label: "Draft",
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800",
    },
    [PayrollRunStatus.PROCESSING]: {
      label: "Processing",
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800",
    },
    [PayrollRunStatus.COMPLETED]: {
      label: "Completed",
      className: "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
    },
    [PayrollRunStatus.ERROR]: {
      label: "Error",
      className: "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800",
    },
    [PayrollRunStatus.CANCELLED]: {
      label: "Cancelled",
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800",
    }
  };

  // Handle cases where status might not be in our config
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800",
  };
  
  return (
    <Badge className={config.className} variant="outline">
      {config.label}
    </Badge>
  );
}
