import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Define role permission interface
interface RolePermission {
  id: string;
  role: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive: boolean;
}

export default function Permissions() {
  // Sample permissions data (in a real app, this would come from the API)
  const [permissions, setPermissions] = useState<RolePermission[]>([
    {
      id: "1",
      role: "Administrator",
      module: "Dashboard",
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      isActive: true,
    },
    {
      id: "2",
      role: "Administrator",
      module: "Orders",
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      isActive: true,
    },
    {
      id: "3",
      role: "Administrator",
      module: "Inventory",
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      isActive: true,
    },
    {
      id: "4",
      role: "Manager",
      module: "Dashboard",
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      isActive: true,
    },
    {
      id: "5",
      role: "Manager",
      module: "Orders",
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      isActive: true,
    },
    {
      id: "6",
      role: "Manager",
      module: "Inventory",
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: false,
      isActive: true,
    },
    {
      id: "7",
      role: "Operator",
      module: "Dashboard",
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      isActive: true,
    },
    {
      id: "8",
      role: "Operator",
      module: "Orders",
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      isActive: true,
    },
    {
      id: "9",
      role: "Operator",
      module: "Inventory",
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      isActive: true,
    },
  ]);
  
  // Function to handle permission changes
  const handlePermissionChange = (id: string, field: keyof RolePermission, value: boolean) => {
    const updatedPermissions = permissions.map(permission => 
      permission.id === id 
        ? { ...permission, [field]: value } 
        : permission
    );
    setPermissions(updatedPermissions);
    
    const changedPermission = updatedPermissions.find(p => p.id === id);
    toast({
      title: "Permission Updated",
      description: `${changedPermission?.role} ${field} for ${changedPermission?.module} has been ${value ? 'enabled' : 'disabled'}.`,
    });
  };
  
  // Function to handle save changes
  const handleSaveChanges = () => {
    toast({
      title: "Changes Saved",
      description: "Permission changes have been saved successfully.",
    });
  };
  
  const columns = [
    {
      header: "Role",
      accessorKey: "role",
    },
    {
      header: "Module",
      accessorKey: "module",
    },
    {
      header: "View",
      accessorKey: "canView",
      cell: (row: RolePermission) => (
        <Checkbox 
          checked={row.canView} 
          onCheckedChange={(checked) => 
            handlePermissionChange(row.id, "canView", checked as boolean)
          }
          className="data-[state=checked]:bg-primary-500"
        />
      ),
    },
    {
      header: "Create",
      accessorKey: "canCreate",
      cell: (row: RolePermission) => (
        <Checkbox 
          checked={row.canCreate} 
          onCheckedChange={(checked) => 
            handlePermissionChange(row.id, "canCreate", checked as boolean)
          }
          className="data-[state=checked]:bg-primary-500"
        />
      ),
    },
    {
      header: "Edit",
      accessorKey: "canEdit",
      cell: (row: RolePermission) => (
        <Checkbox 
          checked={row.canEdit} 
          onCheckedChange={(checked) => 
            handlePermissionChange(row.id, "canEdit", checked as boolean)
          }
          className="data-[state=checked]:bg-primary-500"
        />
      ),
    },
    {
      header: "Delete",
      accessorKey: "canDelete",
      cell: (row: RolePermission) => (
        <Checkbox 
          checked={row.canDelete} 
          onCheckedChange={(checked) => 
            handlePermissionChange(row.id, "canDelete", checked as boolean)
          }
          className="data-[state=checked]:bg-primary-500"
        />
      ),
    },
    {
      header: "Active",
      accessorKey: "isActive",
      cell: (row: RolePermission) => (
        <Switch 
          checked={row.isActive} 
          onCheckedChange={(checked) => 
            handlePermissionChange(row.id, "isActive", checked)
          }
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">User Permissions</h1>
        <Button onClick={handleSaveChanges}>
          <span className="material-icons text-sm mr-1">save</span>
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role-Based Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-warning-50 border border-warning-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <span className="material-icons text-warning-500 mr-2">info</span>
              <div>
                <h3 className="font-medium text-secondary-900">Caution: Permission Changes</h3>
                <p className="text-sm text-secondary-600">
                  Changes to permissions will affect user access immediately.
                  Be careful when modifying Administrator permissions to avoid locking yourself out.
                </p>
              </div>
            </div>
          </div>
          
          <DataTable 
            data={permissions}
            columns={columns}
          />
          
          <div className="mt-6">
            <div className="flex items-center space-x-2">
              <Switch id="disable-role" />
              <Label htmlFor="disable-role">Show inactive roles and modules</Label>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Custom Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-secondary-600 mb-4">
            Create custom permissions and roles for specialized access needs.
          </p>
          
          <div className="flex justify-end">
            <Button variant="outline">
              <span className="material-icons text-sm mr-1">add</span>
              Add Custom Role
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}