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
import { UserPlus, RefreshCcw, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

// Define the API format from server (section-based)
interface PermissionDTO {
  id: number;
  sectionId: string;
  moduleId: number;
  canView: boolean | null;
  canCreate: boolean | null;
  canEdit: boolean | null;
  canDelete: boolean | null;
  isActive: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// Define UI format for permissions
interface Permission {
  id: number;
  sectionId: string;
  moduleId: number;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

// Section interface
interface Section {
  id: string;
  name: string;
  code: string;
  nameAr: string | null;
  userId: string | null;
  plateDrawerCode: string | null;
}

// Module interface
interface Module {
  id: number;
  name: string;
  category: string;
  description: string | null;
  isActive: boolean;
  createdAt: string | null;
}

// Transform API to UI format
function apiToUiFormat(dto: PermissionDTO): Permission {
  return {
    id: dto.id,
    sectionId: dto.sectionId,
    moduleId: dto.moduleId,
    canView: dto.canView ?? false,
    canCreate: dto.canCreate ?? false,
    canEdit: dto.canEdit ?? false,
    canDelete: dto.canDelete ?? false,
    isActive: dto.isActive ?? true,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt
  };
}

// Transform UI to API format
function uiToApiFormat(permission: Partial<Permission>): Partial<PermissionDTO> {
  return {
    id: permission.id,
    sectionId: permission.sectionId,
    moduleId: permission.moduleId,
    canView: permission.canView,
    canCreate: permission.canCreate,
    canEdit: permission.canEdit,
    canDelete: permission.canDelete,
    isActive: permission.isActive,
    createdAt: permission.createdAt,
    updatedAt: permission.updatedAt
  };
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
  "Raw Materials", 
  "Final Products",
  "Categories", 
  "Items", 
  "Sections", 
  "Machines", 
  "Products", 
  "Customers", 
  "Users",
  "Mix Materials",
  // Quality submodules
  "Check Types", 
  "Quality Checks", 
  "Corrective Actions",
  // Tools submodules
  "Bag Weight Calculator", 
  "Ink Consumption", 
  "Utility Tools",
  "Mix Colors",
  "Cost Calculator",
  // System submodules
  "Database", 
  "Permissions", 
  "Import & Export", 
  "SMS Management",
  "Cliches"
];

export default function Permissions() {
  // UI state
  const [activeTab, setActiveTab] = useState<string>("roles"); // "roles" or "modules"
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedModule, setSelectedModule] = useState("Dashboard");
  const [showInactive, setShowInactive] = useState(true);
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<string | null>(null);
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
  
  // Group permissions by module for the module view
  const permissionsByModule: Record<string, Permission[]> = {};
  permissions.forEach(permission => {
    if (!permissionsByModule[permission.module]) {
      permissionsByModule[permission.module] = [];
    }
    permissionsByModule[permission.module].push(permission);
  });
  
  // Get unique roles and modules
  const roles = Object.keys(permissionsByRole).sort();
  const modules = Object.keys(permissionsByModule).sort();
  
  // Apply filtering
  const filteredPermissions = permissions.filter(p => {
    if (!showInactive && !p.isActive) return false;
    if (filterRole && p.role !== filterRole) return false;
    if (filterModule && p.module !== filterModule) return false;
    return true;
  });
  
  // Group filtered permissions
  const filteredPermissionsByRole: Record<string, Permission[]> = {};
  const filteredPermissionsByModule: Record<string, Permission[]> = {};
  
  filteredPermissions.forEach(permission => {
    // By role
    if (!filteredPermissionsByRole[permission.role]) {
      filteredPermissionsByRole[permission.role] = [];
    }
    filteredPermissionsByRole[permission.role].push(permission);
    
    // By module
    if (!filteredPermissionsByModule[permission.module]) {
      filteredPermissionsByModule[permission.module] = [];
    }
    filteredPermissionsByModule[permission.module].push(permission);
  });
  
  // Get filtered unique roles and modules
  const filteredRoles = Object.keys(filteredPermissionsByRole).sort();
  const filteredModules = Object.keys(filteredPermissionsByModule).sort();
  
  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, update }: { id: number, update: Partial<Permission> }) => {
      // Convert UI format to API format
      const apiUpdate = uiToApiFormat(update);
      console.log('Sending update to server:', JSON.stringify(apiUpdate));
      
      const response = await apiRequest('PUT', `/api/permissions/${id}`, apiUpdate);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      // Force a refetch to get updated data
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      
      toast({
        title: "Success",
        description: "Permission updated successfully"
      });
    },
    onError: (error: Error) => {
      console.error("Update failed:", error);
      
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update permission",
        variant: "destructive"
      });
      
      // Force a refetch to reset UI state
      refetch();
    }
  });
  
  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (newPermission: Partial<Permission>) => {
      const apiData = uiToApiFormat(newPermission);
      console.log('Creating permission with data:', JSON.stringify(apiData));
      
      const response = await apiRequest('POST', '/api/permissions', apiData);
      return await response.json();
    },
    onSuccess: () => {
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
      toast({
        title: "Error", 
        description: error.message || "Failed to create permission",
        variant: "destructive"
      });
    }
  });
  
  // Handle permission change directly
  const handlePermissionChange = (id: number, field: keyof Permission, value: boolean) => {
    // Prepare update based on the field
    const update: Partial<Permission> = {
      [field]: value
    };
    
    // Show optimistic update feedback
    const affectedPermission = permissions.find(p => p.id === id);
    if (affectedPermission) {
      toast({
        title: "Updating Permission",
        description: `Changing ${field} for ${affectedPermission.role} - ${affectedPermission.module}`
      });
    } else {
      console.error(`Permission with ID ${id} not found`);
      toast({
        title: "Error",
        description: `Could not find permission with ID ${id}`,
        variant: "destructive"
      });
      return;
    }
    
    // Send update to server
    updatePermissionMutation.mutate({ id, update });
  };
  
  // Create a new permission
  const handleCreatePermission = () => {
    if (!newRoleName) {
      toast({ 
        title: "Error", 
        description: "Role name is required",
        variant: "destructive"
      });
      return;
    }
    
    // Check if this role and module combination already exists
    const exists = permissions.some(
      p => p.role.toLowerCase() === newRoleName.toLowerCase() && 
           p.module === selectedModule
    );
    
    if (exists) {
      toast({ 
        title: "Error", 
        description: `Permission for ${newRoleName} to access ${selectedModule} already exists`,
        variant: "destructive"
      });
      return;
    }
    
    createPermissionMutation.mutate({
      role: newRoleName,
      module: selectedModule,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      isActive: true
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilterRole(null);
    setFilterModule(null);
    setShowInactive(true);
  };
  
  // Format role name for display
  const formatRoleName = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };
  
  // Helper function to group permissions by role
  const renderRoleBasedPermissions = () => {
    if (filteredRoles.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">No permissions match the current filters</p>
          <Button variant="outline" onClick={resetFilters}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      );
    }
    
    return filteredRoles.map(role => {
      const rolePermissions = filteredPermissionsByRole[role];
      
      return (
        <div key={role} className="mb-8">
          <div className="bg-secondary-50 p-3 rounded-t-md border border-secondary-200">
            <h3 className="text-lg font-semibold capitalize text-primary-700 flex items-center">
              {formatRoleName(role)}
              <span className="text-xs text-muted-foreground ml-2 font-normal">
                ({rolePermissions.length} {rolePermissions.length === 1 ? 'permission' : 'permissions'})
              </span>
            </h3>
          </div>
          
          <div className="overflow-x-auto border border-t-0 border-secondary-200 rounded-b-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Module</th>
                  <th className="py-3 px-4 text-center font-medium">View</th>
                  <th className="py-3 px-4 text-center font-medium">Create</th>
                  <th className="py-3 px-4 text-center font-medium">Edit</th>
                  <th className="py-3 px-4 text-center font-medium">Delete</th>
                  <th className="py-3 px-4 text-center font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {rolePermissions.map(permission => (
                  <tr key={permission.id} className="border-t border-secondary-100">
                    <td className="py-3 px-4">{permission.module}</td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canView}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canView", checked === true)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canCreate}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canCreate", checked === true)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canEdit}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canEdit", checked === true)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canDelete}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canDelete", checked === true)
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
        </div>
      );
    });
  };
  
  // Helper function to group permissions by module
  const renderModuleBasedPermissions = () => {
    if (filteredModules.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">No permissions match the current filters</p>
          <Button variant="outline" onClick={resetFilters}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset Filters
          </Button>
        </div>
      );
    }
    
    return filteredModules.map(module => {
      const modulePermissions = filteredPermissionsByModule[module];
      
      return (
        <div key={module} className="mb-8">
          <div className="bg-secondary-50 p-3 rounded-t-md border border-secondary-200">
            <h3 className="text-lg font-semibold text-primary-700 flex items-center">
              {module}
              <span className="text-xs text-muted-foreground ml-2 font-normal">
                ({modulePermissions.length} {modulePermissions.length === 1 ? 'role' : 'roles'})
              </span>
            </h3>
          </div>
          
          <div className="overflow-x-auto border border-t-0 border-secondary-200 rounded-b-md">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Role</th>
                  <th className="py-3 px-4 text-center font-medium">View</th>
                  <th className="py-3 px-4 text-center font-medium">Create</th>
                  <th className="py-3 px-4 text-center font-medium">Edit</th>
                  <th className="py-3 px-4 text-center font-medium">Delete</th>
                  <th className="py-3 px-4 text-center font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {modulePermissions.map(permission => (
                  <tr key={permission.id} className="border-t border-secondary-100">
                    <td className="py-3 px-4 capitalize">{formatRoleName(permission.role)}</td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canView}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canView", checked === true)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canCreate}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canCreate", checked === true)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canEdit}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canEdit", checked === true)
                        }
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Checkbox 
                        checked={permission.canDelete}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.id, "canDelete", checked === true)
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
        </div>
      );
    });
  };
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Role-Based Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-warning-50 border border-warning-200 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <div>
                <h3 className="font-medium text-secondary-900">Caution: Permission Changes</h3>
                <p className="text-sm text-secondary-600">
                  Changes to permissions will affect user access immediately.
                  Be careful when modifying Administrator permissions to avoid locking yourself out.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={filterRole || "all_roles"} onValueChange={(value) => setFilterRole(value === "all_roles" ? null : value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_roles">All roles</SelectItem>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>
                      {formatRoleName(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterModule || "all_modules"} onValueChange={(value) => setFilterModule(value === "all_modules" ? null : value)}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_modules">All modules</SelectItem>
                  {modules.map(module => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="show-inactive" 
                  checked={showInactive}
                  onCheckedChange={setShowInactive}
                />
                <Label htmlFor="show-inactive">
                  Show inactive
                </Label>
              </div>
              
              {(filterRole || filterModule || !showInactive) && (
                <Button variant="outline" onClick={resetFilters} className="sm:self-start">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
            
            <Button onClick={() => setRoleDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Permission
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="roles">Group by Role</TabsTrigger>
              <TabsTrigger value="modules">Group by Module</TabsTrigger>
            </TabsList>
            
            <TabsContent value="roles" className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderRoleBasedPermissions()
              )}
            </TabsContent>
            
            <TabsContent value="modules" className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                renderModuleBasedPermissions()
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Dialog for adding new permission */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Permission</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input 
                id="role-name" 
                value={newRoleName} 
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g. operator, supervisor, sales"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="module">Module</Label>
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger id="module">
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_MODULES.map(module => (
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
            <Button onClick={handleCreatePermission} disabled={createPermissionMutation.isPending}>
              {createPermissionMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-current rounded-full"></div>
                  Creating...
                </>
              ) : (
                'Create Permission'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}