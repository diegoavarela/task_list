import { UserManagement } from '@/components/collaboration/UserManagement';

export function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground">
            Manage workspace members, roles, and permissions.
          </p>
        </div>
      </div>
      
      <UserManagement />
    </div>
  );
}