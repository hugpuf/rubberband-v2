
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { logUserAction } from "@/services/userLogs";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters.",
  }),
  logo_url: z.string().url({
    message: "Please enter a valid URL.",
  }).optional().nullable(),
  country: z.string().optional().nullable(),
  workspace_handle: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
});

export function OrgProfile() {
  const { organization, updateOrganization } = useOrganization();
  const { toast } = useToast();
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(
    organization?.logo_url || null
  );
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization?.name || "",
      logo_url: organization?.logo_url || "",
      country: organization?.country || "",
      workspace_handle: organization?.workspace_handle || "",
      timezone: organization?.timezone || "",
    },
    mode: "onChange",
  });
  
  const isLoading = !organization;
  const orgName = organization?.name || "";
  const orgInitials = orgName.substring(0, 2).toUpperCase();

  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    form.setValue("logo_url", url);
    setLogoPreviewUrl(url);
  };

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      await updateOrganization(data);
      
      // Log the organization update
      logUserAction({
        module: "Settings",
        action: "update",
        metadata: { 
          section: "Organization Profile",
          changes: Object.keys(data)
        }
      });
      
      toast({
        title: "Organization updated",
        description: "Your organization profile has been updated successfully."
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update organization profile"
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center">
        <Card className="w-full max-w-[200px]">
          <CardContent className="p-4 flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border border-gray-200">
                <AvatarImage src={logoPreviewUrl || ""} alt={orgName} />
                <AvatarFallback className="text-2xl">{orgInitials}</AvatarFallback>
              </Avatar>
              <label 
                htmlFor="logo-url-input" 
                className="absolute bottom-0 right-0 bg-white rounded-full p-1 cursor-pointer shadow-sm border border-gray-200"
              >
                <PlusCircle className="h-5 w-5 text-primary" />
              </label>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Organization Logo
            </p>
          </CardContent>
        </Card>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="logo_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input 
                      id="logo-url-input"
                      placeholder="https://example.com/logo.png" 
                      {...field} 
                      onChange={handleLogoUrlChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workspace_handle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workspace Handle</FormLabel>
                  <FormControl>
                    <Input placeholder="acme-corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timezone</FormLabel>
                  <FormControl>
                    <Input placeholder="America/Los_Angeles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <Button type="submit" disabled={isLoading}>
            Update organization
          </Button>
        </form>
      </Form>
    </div>
  );
}
