
import { UserManagement as UserManagementComponent } from "@/components/settings/UserManagement";

const UserManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage users in your organization
        </p>
      </div>
      
      <UserManagementComponent />
    </div>
  );
};

export default UserManagement;
