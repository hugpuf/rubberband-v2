
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export function FinancialChart() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
        <CardDescription>
          Revenue and expense trends over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AspectRatio ratio={16 / 6} className="bg-slate-50 rounded-md">
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Financial chart coming soon</p>
          </div>
        </AspectRatio>
      </CardContent>
    </Card>
  );
}
