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
import { Textarea } from "@/components/ui/textarea";
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                <Input placeholder="https://example.com/logo.png" {...field} />
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
        <Button type="submit" disabled={isLoading}>
          Update organization
        </Button>
      </form>
    </Form>
  );
}
