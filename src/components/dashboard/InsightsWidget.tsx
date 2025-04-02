
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center space-x-4">
        <div className="rounded-full bg-rubberband-light p-2">
          <Lightbulb className="h-5 w-5 text-rubberband-primary" />
        </div>
        <div>
          <CardTitle>Suggested Insights</CardTitle>
          <CardDescription>AI-powered recommendations for your business</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="rounded-md border p-4 hover:bg-muted/50 cursor-pointer hover-effect">
              <h4 className="font-semibold">{insight.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
