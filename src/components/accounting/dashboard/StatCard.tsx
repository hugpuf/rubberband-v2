
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrencyDisplay } from "../CurrencyDisplay";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  amount: number;
  percentChange: number;
  trend: "up" | "down";
  timeframe: string;
  icon: LucideIcon;
  iconColor: string;
}

export function StatCard({
  title,
  amount,
  percentChange,
  trend,
  timeframe,
  icon: Icon,
  iconColor,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span>{title}</span>
          <Icon className={`h-4 w-4 text-${iconColor}`} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <CurrencyDisplay amount={amount} />
        </div>
        <div className="flex items-center mt-1">
          <Badge 
            className={`bg-${trend === 'up' ? 'green' : 'red'}-100 
                       text-${trend === 'up' ? 'green' : 'red'}-800 
                       hover:bg-${trend === 'up' ? 'green' : 'red'}-100 
                       flex items-center gap-1`}
          >
            {trend === "up" ? "↑" : "↓"} <span>{percentChange}%</span>
          </Badge>
          <span className="text-xs text-muted-foreground ml-2">from {timeframe}</span>
        </div>
      </CardContent>
    </Card>
  );
}
