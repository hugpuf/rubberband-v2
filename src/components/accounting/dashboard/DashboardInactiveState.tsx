
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

export function DashboardInactiveState() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center text-center p-6">
          <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Accounting Module Not Activated</h3>
          <p className="text-muted-foreground mt-2">
            The accounting module is not enabled for your organization.
          </p>
          <Button className="mt-4">Activate Module</Button>
        </div>
      </CardContent>
    </Card>
  );
}
