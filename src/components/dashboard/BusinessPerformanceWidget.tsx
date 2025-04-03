
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

// Placeholder data for demo purposes
const data = [
  { name: "Jan", value: 800 },
  { name: "Feb", value: 1200 },
  { name: "Mar", value: 1000 },
  { name: "Apr", value: 1500 },
  { name: "May", value: 2000 },
  { name: "Jun", value: 2400 },
];

export function BusinessPerformanceWidget() {
  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="flex flex-row items-center space-x-4 pb-4">
        <div className="rounded-full bg-[#F5F5F7] p-2">
          <TrendingUp className="h-5 w-5 text-[#6E7FFE] stroke-[1.5px]" />
        </div>
        <div>
          <CardTitle className="text-lg font-medium text-[#1C1C1E]">Overall Business Performance</CardTitle>
          <CardDescription className="text-[#636366] tracking-wide text-sm">Key metrics across all modules</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="value" stroke="#6E7FFE" strokeWidth={2} />
              <CartesianGrid stroke="#ECECEC" strokeDasharray="5 5" />
              <XAxis dataKey="name" stroke="#636366" fontSize={12} />
              <YAxis stroke="#636366" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #ECECEC",
                  borderRadius: "8px",
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
