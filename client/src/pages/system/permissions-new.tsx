import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Define the API formats for permissions data
interface PermissionDTO {
  id: number;
  role: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active: boolean;
}

// Define the UI format for permissions data
interface Permission {
  id: number;
  role: string;
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive: boolean;
}

// All available modules in the system
const ALL_MODULES = [
  "Dashboard", 
  "Orders", 
  "Setup", 
  "Production",
  "Workflow", 
  "Warehouse",
  "Quality", 
  "Reports", 
  "System",
  "Tools",
  // Setup submodules
  "Categories", 
  "Products", 
  "Customers", 
  "Items", 
  "Sections", 
  "Machines", 
  "Users",
  // Warehouse submodules
  "Raw Materials", 
  "Final Products",
  // Production submodules
  "Mix Materials",
  // Quality submodules
  "Check Types", 
  "Quality Checks", 
  "Corrective Actions",
  // Tools submodules
  "Bag Weight Calculator", 
  "Ink Consumption", 
  "Utility Tools",
  // System submodules
  "Database", 
  "Permissions", 
  "Import & Export", 
  "SMS Management"
];

// Helper to convert API format to UI format
function apiToUiFormat(dto: PermissionDTO): Permission {
  return {
    id: dto.id,
    role: dto.role,
    module: dto.module,
    canView: dto.can_view,
    canCreate: dto.can_create,
    canEdit: dto.can_edit,
    canDelete: dto.can_delete,
    isActive: dto.is_active
  };
}

export default function Permissions() {
  // UI state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedModule, setSelectedModule] = useState("Dashboard");
  const [showInactive, setShowInactive] = useState(false);
  const { toast } = useToast();
  
  // Fetch permissions data
  const { 
    data: apiPermissions = [], 
    isLoading,
    refetch
  } = useQuery<PermissionDTO[]>({ 
    queryKey: ['/api/permissions']
  });
  
  // Convert API data to UI format
  const permissions: Permission[] = apiPermissions.map(apiToUiFormat);
  
  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, update }: { id: number, update: Record<string, boolean> }) => {
      console.log('Sending update:', JSON.stringify(update));
      
      const response = await fetch(`/api/permissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });
      
      const text = await response.text();
      
      if (!response.ok) {
        throw new Error(`Failed to update permission: ${text}`);
      }
      
      return text ? JSON.parse(text) : null;
    },
    onSuccess: () => {
      refetch();
      toast({
        title: "Success",
        description: "Permission updated successfully"
      });
    },
    onError: (error: Error) => {
      console.error("Update error:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update permission",
        variant: "destructive"
      });
    }
  });
  
  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (data: {
      role: string;
      module: string;
      can_view: boolean;
      can_create: boolean;
      can_edit: boolean;
      can_delete: boolean;
      is_active: boolean;
    }) => {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create permission: ${errorText}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      refetch();
      setRoleDialogOpen(false);
      setNewRoleName("");
      setSelectedModule("Dashboard");
      toast({
        title: "Success", 
        description: "New permission created successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create permission",
        variant: "destructive"
      });
    }
  });
  
  // Handle permission change directly
  const handlePermissionChange = (id: number, field: keyof Permission, value: boolean) => {
    // Prepare update based on the field
    const update: Record<string, boolean> = {};
    
    // Convert to API snake_case format
    switch(field) {
      case 'canView':
        update.can_view = value;
        break;
      case 'canCreate':
        update.can_create = value;
        break;
      case 'canEdit':
        update.can_edit = value;
        break;
      case 'canDelete':
        update.can_delete = value;
        break;
      case 'isActive':
        update.is_active = value;
        break;
      default:
        break;
    }
    
    // Show optimistic update feedback
    const affectedPermission = permissions.find(p => p.id === id);
    if (affectedPermission) {
      toast({
        title: "Updating Permission",
        description: `Changing ${field} for ${affectedPermission.role} - ${affectedPermission.module}`,
      });
    }
    
    // Send update to server
    updatePermissionMutation.mutate({ id, update });
  };
  
  // Handle adding new role
  const handleAddCustomRole = () => {
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "Role name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    createPermissionMutation.mutate({
      role: newRoleName.toLowerCase(),
      module: selectedModule,
      can_view: true,
      can_create: false,
      can_edit: false,
      can_delete: false,
      is_active: true
    });
  };
  
  // Filter permissions based on active status if needed
  const filteredPermissions = showInactive 
    ? permissions 
    : permissions.filter(p => p.isActive);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">User Permissions</h1>
        <Button onClick={() => refetch()}>
          <span className="material-icons text-sm mr-1">refresh</span>
          Refresh
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
          
          {/* Permissions Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary-50 text-secondary-600 border-b border-secondary-100">
                <tr>
                  <th className="py-3 px-4 text-left">Role</th>
                  <th className="py-3 px-4 text-left">Module</th>
                  <th className="py-3 px-4 text-center">View</th>
                  <th className="py-3 px-4 text-center">Create</th>
                  <th className="py-3 px-4 text-center">Edit</th>
                  <th className="py-3 px-4 text-center">Delete</th>
                  <th className="py-3 px-4 text-center">Active</th>
                </tr>
              </thead>
              <tbody className="text-secondary-800">
                {filteredPermissions.map(permission => (
                  <tr key={permission.id} className="border-b border-secondary-100">
                    <td className="py-3 px-4">{permission.role}</td>
                    <td className="py-3 px-4">{permission.module}</td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canView}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canView", Boolean(checked))
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canCreate}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canCreate", Boolean(checked))
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canEdit}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canEdit", Boolean(checked))
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canDelete}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canDelete", Boolean(checked))
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Switch 
                        checked={permission.isActive}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "isActive", checked)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center space-x-2">
              <Switch 
                id="disable-role" 
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
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
            <Button 
              variant="outline"
              onClick={() => setRoleDialogOpen(true)}
            >
              <span className="material-icons text-sm mr-1">add</span>
              Add Custom Role
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Add Custom Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Role</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="Enter role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="module">Module</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_MODULES.map((module: string) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCustomRole}
              disabled={createPermissionMutation.isPending}
            >
              {createPermissionMutation.isPending ? (
                <>
                  <span className="material-icons animate-spin text-sm mr-1">refresh</span>
                  Adding...
                </>
              ) : (
                'Add Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}