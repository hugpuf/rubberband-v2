
import { Badge } from "@/components/ui/badge";

type BillStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";

interface BillStatusBadgeProps {
  status: string;
}

export function BillStatusBadge({ status }: BillStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft":
        return { variant: "outline" as const, label: "Draft" };
      case "pending":
        return { variant: "secondary" as const, label: "Awaiting Payment" };
      case "paid":
        return { variant: "default" as const, label: "Paid" };
      case "overdue":
        return { variant: "destructive" as const, label: "Overdue" };
      case "cancelled":
        return { variant: "outline" as const, label: "Cancelled" };
      default:
        return { variant: "outline" as const, label: status };
    }
  };

  const { variant, label } = getStatusConfig(status);

  return <Badge variant={variant}>{label}</Badge>;
}
