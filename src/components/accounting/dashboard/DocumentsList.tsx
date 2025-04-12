
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "../CurrencyDisplay";
import { LucideIcon } from "lucide-react";

interface ListItem {
  id: number;
  name: string;
  entity: string;
  amount: number;
  status: "Paid" | "Pending" | "Overdue";
}

interface DocumentsListProps {
  title: string;
  description: string;
  items: ListItem[];
  icon: LucideIcon;
  viewAllText: string;
}

export function DocumentsList({
  title,
  description,
  items,
  icon: Icon,
  viewAllText,
}: DocumentsListProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Overdue":
        return "destructive";
      case "Pending":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.entity}</p>
              </div>
              <div className="flex items-center space-x-4">
                <p className="font-medium">
                  <CurrencyDisplay amount={item.amount} />
                </p>
                <Badge variant={getStatusVariant(item.status)}>
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full" size="sm">
            <Icon className="h-4 w-4 mr-2" />
            {viewAllText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
