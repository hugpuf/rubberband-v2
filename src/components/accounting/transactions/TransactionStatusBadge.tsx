
import { Badge } from "@/components/ui/badge";

interface TransactionStatusBadgeProps {
  status: 'draft' | 'posted' | 'voided';
}

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  const statusConfig = {
    draft: {
      label: "Draft",
      variant: "outline" as const
    },
    posted: {
      label: "Posted",
      variant: "default" as const
    },
    voided: {
      label: "Voided",
      variant: "destructive" as const
    }
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
