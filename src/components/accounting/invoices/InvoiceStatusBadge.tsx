
import { Badge } from "@/components/ui/badge";

interface InvoiceStatusBadgeProps {
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
}

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: "Draft",
      variant: "outline" as const,
    },
    sent: {
      label: "Sent",
      variant: "secondary" as const,
    },
    paid: {
      label: "Paid",
      variant: "default" as const,
    },
    overdue: {
      label: "Overdue",
      variant: "destructive" as const,
    },
    cancelled: {
      label: "Cancelled",
      variant: "outline" as const,
    },
  };

  const config = statusConfig[status];
  
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
