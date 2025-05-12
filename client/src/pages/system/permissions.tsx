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

// All available modules in the system - includes all modules mentioned in permissions.docx
const ALL_MODULES = [
  // Main modules
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
  "Inventory",
  // Section-specific workflow tabs
  "Workflow-Extrusion Tab",
  "Workflow-Printing Tab",
  "Workflow-Cutting Tab",
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
  "ABA Calculator",
  // Quality submodules
  "Check Types", 
  "Quality Checks", 
  "Corrective Actions",
  // Tools submodules
  "Bag Weight Calculator", 
  "Ink Consumption", 
  "Utility Tools",
  "Cost",
  // System submodules
  "Database", 
  "Permissions", 
  "Import & Export", 
  "SMS",
  "SMS Management",
  "System Settings",
  "Cliches"
];

// Helper to convert API format to UI format
function apiToUiFormat(dto: PermissionDTO): Permission {
  console.log('Converting permission:', dto); // Debug log
  return {
    id: dto.id,
    role: dto.role,
    module: dto.module,
    // Make sure to convert null to false and handle type conversion
    canView: dto.can_view === true,
    canCreate: dto.can_create === true,
    canEdit: dto.can_edit === true,
    canDelete: dto.can_delete === true,
    isActive: dto.is_active === true
  };
}

// Helper to convert UI format to API format for updates
function uiToApiFormat(field: keyof Permission, value: boolean): Record<string, boolean> {
  const update: Record<string, boolean> = {};
  
  // Convert from UI camelCase to API snake_case format
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
  
  return update;
}

export default function Permissions() {
  // UI state
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedModule, setSelectedModule] = useState("Dashboard");
  const [showInactive, setShowInactive] = useState(true);
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
  
  // Group permissions by role for better organization
  const permissionsByRole: Record<string, Permission[]> = {};
  permissions.forEach(permission => {
    if (!permissionsByRole[permission.role]) {
      permissionsByRole[permission.role] = [];
    }
    permissionsByRole[permission.role].push(permission);
  });
  
  // Get unique roles
  const roles = Object.keys(permissionsByRole).sort();
  
  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, update }: { id: number, update: Record<string, boolean> }) => {
      console.log('Sending update to server:', JSON.stringify(update));
      
      try {
        const response = await fetch(`/api/permissions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        });
        
        // Try to parse the response as JSON first
        let data;
        const text = await response.text();
        
        if (text) {
          try {
            data = JSON.parse(text);
            console.log('Received response:', data);
          } catch (parseError) {
            console.error("Failed to parse response:", text);
            data = { message: text };
          }
        }
        
        if (!response.ok) {
          throw new Error(data?.message || `Server error: ${response.status}`);
        }
        
        return data;
      } catch (networkError) {
        console.error('Network error during update:', networkError);
        throw networkError;
      }
    },
    onSuccess: (data) => {
      console.log('Update successful:', data);
      
      // Force a refetch to get updated data
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      
      toast({
        title: "Success",
        description: "Permission updated successfully",
        duration: 2000
      });
    },
    onError: (error: Error) => {
      console.error("Update failed:", error);
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update permission",
        variant: "destructive",
        duration: 3000
      });
      
      // Force a refetch to reset UI state
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
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
      console.log('Creating permission with data:', JSON.stringify(data));
      
      try {
        const response = await fetch('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          credentials: 'include' // Ensure cookies are sent for authentication
        });
        
        // Get the response text first for debugging
        const responseText = await response.text();
        console.log('Server response:', responseText);
        
        if (!response.ok) {
          throw new Error(`Failed to create permission: ${responseText}`);
        }
        
        // Try to parse the response as JSON if it's valid
        let parsedResponse;
        try {
          parsedResponse = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Invalid JSON response: ${responseText}`);
        }
        
        return parsedResponse;
      } catch (err) {
        console.error('Permission creation error:', err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log('Successfully created permission:', data);
      // Force a refetch to get updated data
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      
      setRoleDialogOpen(false);
      setNewRoleName("");
      setSelectedModule("Dashboard");
      toast({
        title: "Success", 
        description: "New permission created successfully"
      });
    },
    onError: (error: Error) => {
      console.error('Creation error details:', error);
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create permission",
        variant: "destructive"
      });
    }
  });
  
  // Handle permission change directly
  const handlePermissionChange = (id: number, field: keyof Permission, value: boolean) => {
    // Prepare update using our conversion function
    const update = uiToApiFormat(field, value);
    
    // Show optimistic update feedback
    const affectedPermission = permissions.find(p => p.id === id);
    if (affectedPermission) {
      // Update the local state optimistically for better UX
      const updatedPermissions = permissions.map(p => {
        if (p.id === id) {
          return { ...p, [field]: value };
        }
        return p;
      });
      
      // Log the update
      console.log(`Updating permission ${id}:`, field, value);
      console.log('Update payload:', update);
      
      toast({
        title: "Updating Permission",
        description: `Changing ${field} for ${affectedPermission.role} - ${affectedPermission.module}`,
        duration: 2000
      });
    } else {
      console.error(`Permission with ID ${id} not found`);
      toast({
        title: "Error",
        description: `Could not find permission with ID ${id}`,
        variant: "destructive",
        duration: 2000
      });
      return;
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
          
          {/* Role-Based Permissions Tabs */}
          <div className="overflow-x-auto">
            {roles.map(role => {
              // Get filtered permissions for this role
              const rolePermissions = showInactive 
                ? permissionsByRole[role]
                : permissionsByRole[role].filter(p => p.isActive);
              
              if (rolePermissions.length === 0) return null;
              
              return (
                <div key={role} className="mb-8">
                  <div className="bg-secondary-50 p-3 rounded-t-md border border-secondary-200">
                    <h3 className="text-lg font-semibold capitalize text-primary-700 flex items-center">
                      <span className="material-icons mr-2 text-primary-500">
                        {role === 'administrator' ? 'admin_panel_settings' : 
                         role === 'manager' ? 'manage_accounts' : 
                         role === 'operator' ? 'engineering' : 'person'}
                      </span>
                      {role}
                    </h3>
                  </div>
                  <table className="w-full text-sm border border-secondary-200 border-t-0">
                    <thead className="bg-secondary-50 text-secondary-600 border-b border-secondary-100">
                      <tr>
                        <th className="py-3 px-4 text-left">Module</th>
                        <th className="py-3 px-4 text-center">View</th>
                        <th className="py-3 px-4 text-center">Create</th>
                        <th className="py-3 px-4 text-center">Edit</th>
                        <th className="py-3 px-4 text-center">Delete</th>
                        <th className="py-3 px-4 text-center">Active</th>
                      </tr>
                    </thead>
                    <tbody className="text-secondary-800">
                      {rolePermissions.map(permission => (
                        <tr key={permission.id} className="border-b border-secondary-100">
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
              );
            })}
          </div>
          
          <div className="mt-6">
            <div className="flex items-center space-x-2 p-3 bg-secondary-50 rounded-md border border-secondary-200">
              <Switch 
                id="disable-role" 
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="disable-role" className="font-medium">
                Show inactive roles and modules
                <span className="text-sm block text-secondary-500">
                  {showInactive ? "Showing all permissions" : "Only showing active permissions"}
                </span>
              </Label>
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