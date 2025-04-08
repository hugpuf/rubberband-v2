
import { Badge } from "@/components/ui/badge";

interface TransactionStatusBadgeProps {
  status: "draft" | "posted" | "voided";
}

export function TransactionStatusBadge({ status }: TransactionStatusBadgeProps) {
  switch (status) {
    case "draft":
      return <Badge variant="outline" className="bg-slate-100 text-slate-700">Draft</Badge>;
    case "posted":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Posted</Badge>;
    case "voided":
      return <Badge variant="default" className="bg-red-500 hover:bg-red-600">Voided</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
}
