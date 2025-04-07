
import { useState } from "react";
import { useAccounting } from "@/modules/accounting";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { AccountingModuleConfig } from "@/modules/accounting";

export function AccountingSettings() {
  const { state, updateModuleConfig } = useAccounting();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Create a form state based on current config
  const [formState, setFormState] = useState<AccountingModuleConfig>({
    defaultCurrency: state.config?.defaultCurrency || 'USD',
    fiscalYearStart: state.config?.fiscalYearStart || '01-01',
    taxRate: state.config?.taxRate || 0,
    isEnabled: state.config?.isEnabled || false
  });
  
  const handleFormChange = (field: keyof AccountingModuleConfig, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    try {
      await updateModuleConfig(formState);
      toast({
        title: "Settings updated",
        description: "Accounting module settings have been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating accounting settings:", error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "There was an error saving the accounting settings.",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accounting Module Settings</CardTitle>
        <CardDescription>
          Configure the accounting module for your organization
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="module-enabled" className="flex flex-col space-y-1">
              <span>Enable Accounting Module</span>
              <span className="font-normal text-sm text-muted-foreground">
                When enabled, the accounting module will be available to all users
              </span>
            </Label>
            <Switch 
              id="module-enabled"
              checked={formState.isEnabled}
              onCheckedChange={(checked) => handleFormChange('isEnabled', checked)}
            />
          </div>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="default-currency" className="text-right">
                Default Currency
              </Label>
              <div className="col-span-3">
                <Input
                  id="default-currency"
                  value={formState.defaultCurrency}
                  onChange={(e) => handleFormChange('defaultCurrency', e.target.value)}
                  placeholder="USD"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fiscal-year" className="text-right">
                Fiscal Year Start
              </Label>
              <div className="col-span-3">
                <Input
                  id="fiscal-year"
                  value={formState.fiscalYearStart}
                  onChange={(e) => handleFormChange('fiscalYearStart', e.target.value)}
                  placeholder="MM-DD (e.g., 01-01)"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tax-rate" className="text-right">
                Default Tax Rate (%)
              </Label>
              <div className="col-span-3">
                <Input
                  id="tax-rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formState.taxRate.toString()}
                  onChange={(e) => handleFormChange('taxRate', parseFloat(e.target.value))}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isUpdating}
              className="w-32"
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
