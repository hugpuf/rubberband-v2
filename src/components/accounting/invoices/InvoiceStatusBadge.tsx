
import { Badge } from "@/components/ui/badge";

interface InvoiceStatusBadgeProps {
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "partially_paid";
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: "Draft",
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800",
    },
    sent: {
      label: "Sent",
      className: "bg-blue-100 text-blue-800 hover:bg-blue-100 hover:text-blue-800",
    },
    paid: {
      label: "Paid",
      className: "bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800",
    },
    partially_paid: {
      label: "Partially Paid",
      className: "bg-amber-100 text-amber-800 hover:bg-amber-100 hover:text-amber-800",
    },
    overdue: {
      label: "Overdue",
      className: "bg-red-100 text-red-800 hover:bg-red-100 hover:text-red-800",
    },
    cancelled: {
      label: "Cancelled",
      className: "bg-gray-100 text-gray-800 hover:bg-gray-100 hover:text-gray-800",
    },
  };

  const config = statusConfig[status === "partially_paid" ? "partially_paid" : status];
  
  return (
    <Badge className={config.className} variant="outline">
      {config.label}
    </Badge>
  );
}
