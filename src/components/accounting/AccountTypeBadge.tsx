
import { Badge } from "@/components/ui/badge";
import { AccountType } from "@/modules/accounting/types";

interface AccountTypeBadgeProps {
  type: AccountType;
}

export function AccountTypeBadge({ type }: AccountTypeBadgeProps) {
  const getTypeColorClass = () => {
    switch (type) {
      case "asset":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "liability":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "equity":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "revenue":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "expense":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getTypeLabel = () => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <Badge 
      variant="outline" 
      className={`font-medium ${getTypeColorClass()}`}
    >
      {getTypeLabel()}
    </Badge>
  );
}
