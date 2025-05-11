import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Permission, User } from "@shared/schema";

type PermissionsContextType = {
  hasPermission: (module: string, action?: "view" | "create" | "edit" | "delete") => boolean;
  hasWorkflowTabPermission: (tab: string) => boolean;
  isLoading: boolean;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

// Map section names to their corresponding workflow tabs
const SECTION_WORKFLOW_MAPPING: Record<string, string> = {
  'Extruding': 'extrusion',
  'Printing': 'printing',
  'Cutting': 'cutting'
};

export function PermissionsProvider({ 
  children, 
  user 
}: { 
  children: ReactNode;
  user: User | null;
}) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  
  // Fetch permissions for the current user's role
  const { 
    data: rolePermissions = [], 
    isLoading,
  } = useQuery<Permission[]>({ 
    queryKey: ['/api/permissions'],
    // Only fetch permissions if user is logged in
    enabled: !!user,
  });

  useEffect(() => {
    if (rolePermissions.length > 0) {
      setPermissions(rolePermissions);
    }
  }, [rolePermissions]);

  // Function to check if user has permission for a specific workflow tab
  const hasWorkflowTabPermission = (tab: string): boolean => {
    // If no user or user data is loading, deny permission
    if (!user) return false;
    
    // Get the user's role and section
    const userRole = user.role;
    const userSection = user.sectionId;
    
    // Administrator role has all permissions
    if (userRole === "administrator" || userRole === "supervisor") return true;

    // For section-specific roles, check if the tab matches their section
    if (userSection) {
      // First check if tab matches user's section (section-based permission)
      for (const [sectionName, workflowTab] of Object.entries(SECTION_WORKFLOW_MAPPING)) {
        // If the tab matches the workflow tab for the user's section, allow access
        if (tab === workflowTab && userRole === sectionName) {
          return true;
        }
      }
      
      // Check for specific workflow tab permissions based on section name
      // This handles cases like "Workflow-Extrusion Tab"
      const sectionTabModule = `Workflow-${tab.charAt(0).toUpperCase() + tab.slice(1)} Tab`;
      const permission = permissions.find(
        p => p.role === userRole && p.module === sectionTabModule && p.isActive
      );
      
      if (permission && permission.canView) {
        return true;
      }
    }
    
    // For operators without specific section assignment
    if (userRole === "operator") {
      return true; // All operators can see workflow tabs by default
    }
    
    return false;
  };

  // Function to check if user has permission for a specific module and action
  const hasPermission = (module: string, action: "view" | "create" | "edit" | "delete" = "view"): boolean => {
    // If no user or user data is loading, deny permission
    if (!user) return false;
    
    // Get the user's role and section
    const userRole = user.role;
    const userSection = user.sectionId;
    
    // Administrator role has all permissions
    if (userRole === "administrator") return true;
    
    // Supervisor has broad permissions
    if (userRole === "supervisor") {
      // Check if there are specific supervisor permissions defined
      const supervisorPermission = permissions.find(
        p => p.role === "supervisor" && p.module === module && p.isActive
      );
      
      if (supervisorPermission) {
        // Check for the specific permission action
        switch (action) {
          case "view": return supervisorPermission.canView === true;
          case "create": return supervisorPermission.canCreate === true;
          case "edit": return supervisorPermission.canEdit === true;
          case "delete": return supervisorPermission.canDelete === true;
          default: return false;
        }
      }
      
      // Default supervisor permissions if not explicitly defined
      return true;
    }

    // For section-specific roles (Extruding, Printing, Cutting, Warehouse)
    if (userSection) {
      // First check if there's a section-specific permission
      const sectionPermission = permissions.find(
        p => p.role === userSection && p.module === module && p.isActive
      );
      
      if (sectionPermission) {
        // Check for the specific permission action
        switch (action) {
          case "view": return sectionPermission.canView === true;
          case "create": return sectionPermission.canCreate === true;
          case "edit": return sectionPermission.canEdit === true;
          case "delete": return sectionPermission.canDelete === true;
          default: return false;
        }
      }
    }
    
    // Special case for operators - they can view workflow and mix materials
    if (userRole === "operator" && action === "view") {
      if (module === "Workflow" || module === "Mix Materials") {
        return true;
      }
    }
    
    // Find the permission for this role and module
    const permission = permissions.find(
      p => p.role === userRole && p.module === module && p.isActive
    );
    
    // If no permission found, deny access
    if (!permission) return false;
    
    // Check for the specific permission action
    switch (action) {
      case "view":
        return permission.canView === true;
      case "create":
        return permission.canCreate === true;
      case "edit":
        return permission.canEdit === true;
      case "delete":
        return permission.canDelete === true;
      default:
        return false;
    }
  };

  return (
    <PermissionsContext.Provider
      value={{
        hasPermission,
        hasWorkflowTabPermission,
        isLoading,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }
  return context;
}