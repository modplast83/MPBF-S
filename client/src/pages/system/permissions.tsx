import { useState } from "react";
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
  // State for custom role dialog
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [availableModules] = useState(["Dashboard", "Orders", "Inventory", "Reports", "Setup", "System", "Tools", "Warehouse", "Workflow", "Quality"]);
  const [selectedModule, setSelectedModule] = useState("Dashboard");
  const [showInactive, setShowInactive] = useState(false);
  
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
  
  // Function to handle adding a new custom role
  const handleAddCustomRole = () => {
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "Role name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    // Generate a new ID by getting the max ID and incrementing it
    const maxId = Math.max(...permissions.map(p => parseInt(p.id)));
    const newId = (maxId + 1).toString();
    
    // Create new permission entry for the selected module
    const newPermission: RolePermission = {
      id: newId,
      role: newRoleName,
      module: selectedModule,
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      isActive: true,
    };
    
    setPermissions([...permissions, newPermission]);
    
    toast({
      title: "Role Added",
      description: `New role '${newRoleName}' has been added successfully.`,
    });
    
    // Reset form and close dialog
    setNewRoleName("");
    setSelectedModule("Dashboard");
    setRoleDialogOpen(false);
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
                  {availableModules.map(module => (
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