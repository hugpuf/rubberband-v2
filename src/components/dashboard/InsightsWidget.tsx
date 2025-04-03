
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

// Placeholder insights
const insights = [
  {
    id: "1",
    title: "Revenue Optimization",
    description: "Based on your recent sales data, consider increasing focus on Product X which has shown 30% higher conversion rates.",
  },
  {
    id: "2",
    title: "Team Productivity",
    description: "Team collaboration appears to peak on Wednesdays. Consider scheduling important meetings mid-week for maximum engagement.",
  },
  {
    id: "3",
    title: "Cost Reduction",
    description: "Our analysis suggests you could save 15% on operational costs by optimizing your supply chain process.",
  },
];

export function InsightsWidget() {
  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader className="flex flex-row items-center space-x-4 pb-4">
        <div className="rounded-full bg-[#F5F5F7] p-2">
          <Lightbulb className="h-5 w-5 text-[#6E7FFE] stroke-[1.5px]" />
        </div>
        <div>
          <CardTitle className="text-lg font-medium text-[#1C1C1E]">Suggested Insights</CardTitle>
          <CardDescription className="text-[#636366] tracking-wide text-sm">AI-powered recommendations for your business</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight) => (
            <div 
              key={insight.id} 
              className="rounded-lg border border-gray-100 p-4 hover:bg-[#F5F5F7] cursor-pointer transition-all duration-200"
            >
              <h4 className="font-medium text-[#1C1C1E]">{insight.title}</h4>
              <p className="text-sm text-[#636366] mt-1 tracking-wide">{insight.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
