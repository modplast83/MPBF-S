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
import { UserPlus, RefreshCcw, Filter, Settings, Save, Plus } from "lucide-react";
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

export default function Permissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [filterSection, setFilterSection] = useState<string | null>(null);
  const [filterModule, setFilterModule] = useState<number | null>(null);
  const [showInactive, setShowInactive] = useState(true);
  const { toast } = useToast();

  // Fetch permissions
  const permissionsQuery = useQuery({
    queryKey: ["/api/permissions"],
    select: (data: PermissionDTO[]) => data.map(apiToUiFormat),
  });

  // Fetch sections
  const sectionsQuery = useQuery<Section[]>({
    queryKey: ["/api/sections"],
  });

  // Fetch modules
  const modulesQuery = useQuery<Module[]>({
    queryKey: ["/api/modules"],
  });

  // Update local state when queries succeed
  useEffect(() => {
    if (permissionsQuery.data) {
      setPermissions(permissionsQuery.data);
    }
  }, [permissionsQuery.data]);

  useEffect(() => {
    if (sectionsQuery.data) {
      setSections(sectionsQuery.data);
    }
  }, [sectionsQuery.data]);

  useEffect(() => {
    if (modulesQuery.data) {
      setModules(modulesQuery.data);
    }
  }, [modulesQuery.data]);

  // Handle query errors
  useEffect(() => {
    if (permissionsQuery.error) {
      toast({
        title: "Error",
        description: "Failed to load permissions",
        variant: "destructive",
      });
    }
  }, [permissionsQuery.error, toast]);

  useEffect(() => {
    if (sectionsQuery.error) {
      toast({
        title: "Error",
        description: "Failed to load sections",
        variant: "destructive",
      });
    }
  }, [sectionsQuery.error, toast]);

  useEffect(() => {
    if (modulesQuery.error) {
      toast({
        title: "Error",
        description: "Failed to load modules",
        variant: "destructive",
      });
    }
  }, [modulesQuery.error, toast]);

  // Create permission mutation
  const createPermissionMutation = useMutation({
    mutationFn: async (permission: Partial<Permission>) => {
      return await apiRequest("POST", "/api/permissions", uiToApiFormat(permission));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({
        title: "Success",
        description: "Permission created successfully",
      });
      setIsDialogOpen(false);
      setEditingPermission(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create permission",
        variant: "destructive",
      });
    },
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ id, permission }: { id: number; permission: Partial<Permission> }) => {
      return await apiRequest("PATCH", `/api/permissions/${id}`, uiToApiFormat(permission));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({
        title: "Success",
        description: "Permission updated successfully",
      });
      setIsDialogOpen(false);
      setEditingPermission(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update permission",
        variant: "destructive",
      });
    },
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/permissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permissions"] });
      toast({
        title: "Success",
        description: "Permission deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete permission",
        variant: "destructive",
      });
    },
  });

  // Filter permissions
  const filteredPermissions = permissions.filter(permission => {
    if (!showInactive && !permission.isActive) return false;
    if (filterSection && permission.sectionId !== filterSection) return false;
    if (filterModule && permission.moduleId !== filterModule) return false;
    return true;
  });

  // Get section name by ID
  const getSectionName = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.name : sectionId;
  };

  // Get module name by ID
  const getModuleName = (moduleId: number) => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.name : `Module ${moduleId}`;
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterSection(null);
    setFilterModule(null);
    setShowInactive(true);
  };

  // Handle permission edit
  const handleEdit = (permission: Permission) => {
    setEditingPermission(permission);
    setIsDialogOpen(true);
  };

  // Handle permission save
  const handleSave = (permission: Partial<Permission>) => {
    if (editingPermission) {
      updatePermissionMutation.mutate({ id: editingPermission.id, permission });
    } else {
      createPermissionMutation.mutate(permission);
    }
  };

  // Group permissions by section
  const permissionsBySection = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.sectionId]) {
      acc[permission.sectionId] = [];
    }
    acc[permission.sectionId].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const renderSectionBasedPermissions = () => {
    if (Object.keys(permissionsBySection).length === 0) {
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

    return Object.entries(permissionsBySection).map(([sectionId, sectionPermissions]) => (
      <Card key={sectionId} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>{getSectionName(sectionId)}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {sectionPermissions.length} permissions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sectionPermissions.map((permission) => (
              <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{getModuleName(permission.moduleId)}</div>
                  <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                    <span className={`px-2 py-1 rounded text-xs ${permission.canView ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      View: {permission.canView ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${permission.canCreate ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Create: {permission.canCreate ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${permission.canEdit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Edit: {permission.canEdit ? 'Yes' : 'No'}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs ${permission.canDelete ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      Delete: {permission.canDelete ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={permission.isActive}
                    onCheckedChange={(checked) => {
                      updatePermissionMutation.mutate({
                        id: permission.id,
                        permission: { ...permission, isActive: checked }
                      });
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(permission)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePermissionMutation.mutate(permission.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Section-Based Permissions</h1>
          <p className="text-muted-foreground">
            Manage permissions by sections and modules
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Permission
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <Label htmlFor="section-filter">Section</Label>
              <Select
                value={filterSection || "all"}
                onValueChange={(value) => setFilterSection(value === "all" ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="module-filter">Module</Label>
              <Select
                value={filterModule?.toString() || "all"}
                onValueChange={(value) => setFilterModule(value === "all" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modules</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id.toString()}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive">Show inactive</Label>
            </div>

            <Button variant="outline" onClick={resetFilters}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Display */}
      <div className="space-y-4">
        {permissionsQuery.isLoading ? (
          <div className="text-center py-8">Loading permissions...</div>
        ) : (
          renderSectionBasedPermissions()
        )}
      </div>

      {/* Permission Dialog */}
      <PermissionDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingPermission(null);
        }}
        permission={editingPermission}
        sections={sections}
        modules={modules}
        onSave={handleSave}
        isLoading={createPermissionMutation.isPending || updatePermissionMutation.isPending}
      />
    </div>
  );
}

// Permission Dialog Component
interface PermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  permission: Permission | null;
  sections: Section[];
  modules: Module[];
  onSave: (permission: Partial<Permission>) => void;
  isLoading: boolean;
}

function PermissionDialog({
  isOpen,
  onClose,
  permission,
  sections,
  modules,
  onSave,
  isLoading
}: PermissionDialogProps) {
  const [formData, setFormData] = useState({
    sectionId: "",
    moduleId: 0,
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    isActive: true
  });

  useEffect(() => {
    if (permission) {
      setFormData({
        sectionId: permission.sectionId,
        moduleId: permission.moduleId,
        canView: permission.canView,
        canCreate: permission.canCreate,
        canEdit: permission.canEdit,
        canDelete: permission.canDelete,
        isActive: permission.isActive
      });
    } else {
      setFormData({
        sectionId: "",
        moduleId: 0,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        isActive: true
      });
    }
  }, [permission]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sectionId || formData.moduleId === 0) {
      // Add visual feedback for validation errors
      if (!formData.sectionId) {
        console.error("Please select a section");
      }
      if (formData.moduleId === 0) {
        console.error("Please select a module");
      }
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {permission ? "Edit Permission" : "Add Permission"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="section">Section</Label>
              <Select
                value={formData.sectionId}
                onValueChange={(value) => setFormData({ ...formData, sectionId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="module">Module</Label>
              <Select
                value={formData.moduleId.toString()}
                onValueChange={(value) => setFormData({ ...formData, moduleId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id.toString()}>
                      {module.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canView"
                  checked={formData.canView}
                  onCheckedChange={(checked) => setFormData({ ...formData, canView: !!checked })}
                />
                <Label htmlFor="canView">Can View</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canCreate"
                  checked={formData.canCreate}
                  onCheckedChange={(checked) => setFormData({ ...formData, canCreate: !!checked })}
                />
                <Label htmlFor="canCreate">Can Create</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canEdit"
                  checked={formData.canEdit}
                  onCheckedChange={(checked) => setFormData({ ...formData, canEdit: !!checked })}
                />
                <Label htmlFor="canEdit">Can Edit</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="canDelete"
                  checked={formData.canDelete}
                  onCheckedChange={(checked) => setFormData({ ...formData, canDelete: !!checked })}
                />
                <Label htmlFor="canDelete">Can Delete</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : permission ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}