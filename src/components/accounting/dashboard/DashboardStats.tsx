
import { DollarSign, CreditCard, BarChart2, PieChart } from "lucide-react";
import { StatCard } from "./StatCard";

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <StatCard
        title="Revenue"
        amount={50000}
        percentChange={20.1}
        trend="up"
        timeframe="last month"
        icon={DollarSign}
        iconColor="green-500"
      />
      
      <StatCard
        title="Expenses"
        amount={20000}
        percentChange={12.5}
        trend="down"
        timeframe="last month"
        icon={CreditCard}
        iconColor="red-500"
      />
      
      <StatCard
        title="Net Profit"
        amount={30000}
        percentChange={15.3}
        trend="up"
        timeframe="last month"
        icon={BarChart2}
        iconColor="blue-500"
      />
      
      <StatCard
        title="Tax Liability"
        amount={7500}
        percentChange={8.4}
        trend="up"
        timeframe="last quarter"
        icon={PieChart}
        iconColor="amber-500"
      />
    </div>
  );
}
