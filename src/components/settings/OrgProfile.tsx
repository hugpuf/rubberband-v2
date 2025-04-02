
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganization } from "@/hooks/useOrganization";
import { Building, Save } from "lucide-react";

export function OrgProfile() {
  const { organization, isAdmin, updateOrganization } = useOrganization();
  
  const [name, setName] = useState(organization?.name || "");
  const [timezone, setTimezone] = useState("UTC");
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    
    setIsSubmitting(true);
    await updateOrganization({
      name,
      // In a real app, these would be columns in your organization table
      // timezone,
      // subscription_plan: subscriptionPlan
    });
    setIsSubmitting(false);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center space-x-4">
        <div className="rounded-full bg-rubberband-light p-2">
          <Building className="h-5 w-5 text-rubberband-primary" />
        </div>
        <div>
          <CardTitle>Organization Profile</CardTitle>
          <CardDescription>Manage your organization's details</CardDescription>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input 
              id="org-name"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Enter your organization name"
              disabled={!isAdmin}
              required
            />
            {!isAdmin && (
              <p className="text-xs text-muted-foreground">
                Only administrators can change the organization name
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={!isAdmin}>
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                <SelectItem value="EST">EST (Eastern Standard Time)</SelectItem>
                <SelectItem value="CST">CST (Central Standard Time)</SelectItem>
                <SelectItem value="PST">PST (Pacific Standard Time)</SelectItem>
                <SelectItem value="GMT">GMT (Greenwich Mean Time)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subscription">Subscription Plan</Label>
            <Select value={subscriptionPlan} onValueChange={setSubscriptionPlan} disabled={!isAdmin}>
              <SelectTrigger id="subscription">
                <SelectValue placeholder="Select subscription plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free Tier</SelectItem>
                <SelectItem value="basic">Basic ($10/month)</SelectItem>
                <SelectItem value="premium">Premium ($29/month)</SelectItem>
                <SelectItem value="enterprise">Enterprise ($99/month)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            disabled={!isAdmin || isSubmitting}
            className="ml-auto flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
