import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
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
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";

// Define role permission interface
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

// Define API structures for permissions
interface ApiPermission {
  id: number;
  role: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  is_active: boolean;
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

export default function Permissions() {
  // Local state for the component
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedModule, setSelectedModule] = useState("Dashboard");
  const [showInactive, setShowInactive] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [changedPermissions, setChangedPermissions] = useState<Record<number, Partial<Permission>>>({});
  
  // Fetch permissions from the API
  const { data: apiPermissions, isLoading: isLoadingPermissions } = useQuery<ApiPermission[]>({ 
    queryKey: ['/api/permissions'],
  });

  // Process API data when it's available
  useEffect(() => {
    if (apiPermissions) {
      // Transform API data to component format
      const transformedPermissions = apiPermissions.map(p => ({
        id: p.id,
        role: p.role,
        module: p.module,
        canView: p.can_view,
        canCreate: p.can_create,
        canEdit: p.can_edit,
        canDelete: p.can_delete,
        isActive: p.is_active
      }));
      setPermissions(transformedPermissions);
      setIsLoading(false);
    }
  }, [apiPermissions]);

  // Handle loading error
  useEffect(() => {
    if (!isLoading && !apiPermissions && !isLoadingPermissions) {
      toast({
        title: "Error",
        description: "Failed to load permissions data",
        variant: "destructive"
      });
    }
  }, [isLoading, apiPermissions, isLoadingPermissions]);
  
  // Mutation for updating permissions
  const updatePermissionMutation = useMutation({
    mutationFn: async (permission: { id: number, data: Partial<Permission> }) => {
      // Convert to API format
      const apiFormat = {
        role: permission.data.role,
        module: permission.data.module,
        can_view: permission.data.canView,
        can_create: permission.data.canCreate,
        can_edit: permission.data.canEdit,
        can_delete: permission.data.canDelete,
        is_active: permission.data.isActive
      };
      
      const response = await fetch(`/api/permissions/${permission.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiFormat)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update permission');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
    }
  });
  
  // Mutation for creating permissions
  const createPermissionMutation = useMutation({
    mutationFn: async (newPermission: Omit<Permission, 'id'>) => {
      // Convert to API format
      const apiFormat = {
        role: newPermission.role,
        module: newPermission.module,
        can_view: newPermission.canView,
        can_create: newPermission.canCreate,
        can_edit: newPermission.canEdit,
        can_delete: newPermission.canDelete,
        is_active: newPermission.isActive
      };
      
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiFormat)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create permission');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
    }
  });
  
  // Function to handle permission changes
  const handlePermissionChange = (id: number, field: keyof Permission, value: boolean) => {
    // Update the local state
    const updatedPermissions = permissions.map(permission => 
      permission.id === id 
        ? { ...permission, [field]: value } 
        : permission
    );
    setPermissions(updatedPermissions);
    
    // Track the changes to be saved later
    setChangedPermissions(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
    
    const changedPermission = updatedPermissions.find(p => p.id === id);
    toast({
      title: "Permission Updated Locally",
      description: `${changedPermission?.role} ${field} for ${changedPermission?.module} has been ${value ? 'enabled' : 'disabled'}. Click Save Changes to apply.`,
    });
  };
  
  // Function to handle save changes
  const handleSaveChanges = async () => {
    if (Object.keys(changedPermissions).length === 0) {
      toast({
        title: "No Changes",
        description: "No changes to save.",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Process all changed permissions
      const updatePromises = Object.entries(changedPermissions).map(([idStr, changes]) => {
        const id = parseInt(idStr);
        return updatePermissionMutation.mutateAsync({ id, data: changes });
      });
      
      await Promise.all(updatePromises);
      
      // Clear the tracked changes
      setChangedPermissions({});
      
      toast({
        title: "Changes Saved",
        description: "Permission changes have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save permission changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to handle adding a new custom role
  const handleAddCustomRole = async () => {
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "Role name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Create new permission entry for the selected module
      await createPermissionMutation.mutateAsync({
        role: newRoleName.toLowerCase(),
        module: selectedModule,
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        isActive: true
      });
      
      toast({
        title: "Role Added",
        description: `New role '${newRoleName}' has been added successfully.`,
      });
      
      // Reset form and close dialog
      setNewRoleName("");
      setSelectedModule("Dashboard");
      setRoleDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new permission",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Filter permissions based on active state if needed
  const filteredPermissions = showInactive 
    ? permissions 
    : permissions.filter(p => p.isActive);

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
                          handlePermissionChange(permission.id, "canView", checked as boolean)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canCreate}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canCreate", checked as boolean)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canEdit}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canEdit", checked as boolean)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canDelete}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canDelete", checked as boolean)
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
            <Button onClick={handleAddCustomRole}>
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}