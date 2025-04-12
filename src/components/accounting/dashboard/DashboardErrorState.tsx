
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export function DashboardErrorState() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center text-center p-6">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Failed to load accounting module</h3>
          <p className="text-muted-foreground mt-2">
            There was an error loading the accounting data. Please try again later.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
