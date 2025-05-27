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
    
    // Administrator role has all permissions - case insensitive check
    if (userRole.toLowerCase() === "administrator" || userRole.toLowerCase() === "supervisor") return true;

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
        p => p.role.toLowerCase() === userRole.toLowerCase() && 
           p.module === sectionTabModule && 
           p.is_active === true
      );
      
      if (permission && permission.can_view === true) {
        return true;
      }
    }
    
    // For operators without specific section assignment
    if (userRole.toLowerCase() === "operator") {
      return true; // All operators can see workflow tabs by default
    }
    
    return false;
  };

  // Function to check if user has permission for a specific module and action
  const hasPermission = (module: string, action: "view" | "create" | "edit" | "delete" = "view"): boolean => {
    // If no user or user data is loading, deny permission
    if (!user) return false;
    
    // Get the user's role and section
    const userRole = user?.role;
    const userSection = user?.sectionId;
    
    console.log(`Checking permission for module: ${module}, action: ${action}, userRole: ${userRole}`);
    console.log(`Available permissions:`, permissions.map(p => `${p.role}:${p.module}:${p.can_view}`));
    
    // Check if userRole exists before calling toLowerCase
    if (!userRole) return false;
    
    // Administrator role has all permissions - case insensitive check
    if (userRole.toLowerCase() === "administrator") return true;
    
    // Supervisor has broad permissions - case insensitive check
    if (userRole.toLowerCase() === "supervisor") {
      // Check if there are specific supervisor permissions defined - both exact and lowercase match
      const supervisorPermission = permissions.find(
        p => (p.role.toLowerCase() === "supervisor" || p.role === "Supervisor") && 
            p.module === module && p.is_active === true
      );
      
      console.log(`Supervisor permission found:`, supervisorPermission);
      
      if (supervisorPermission) {
        // Check for the specific permission action and explicitly handle null/undefined
        switch (action) {
          case "view": return Boolean(supervisorPermission.can_view);
          case "create": return Boolean(supervisorPermission.can_create);
          case "edit": return Boolean(supervisorPermission.can_edit);
          case "delete": return Boolean(supervisorPermission.can_delete);
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
        p => p.role.toLowerCase() === userSection.toLowerCase() && p.module === module && p.is_active === true
      );
      
      console.log(`Section permission found for section ${userSection}:`, sectionPermission);
      
      if (sectionPermission) {
        // Check for the specific permission action and explicitly handle null/undefined
        switch (action) {
          case "view": return Boolean(sectionPermission.can_view);
          case "create": return Boolean(sectionPermission.can_create);
          case "edit": return Boolean(sectionPermission.can_edit);
          case "delete": return Boolean(sectionPermission.can_delete);
          default: return false;
        }
      }
    }
    
    // Special case for operators - they can view workflow and mix materials
    if (userRole.toLowerCase() === "operator" && action === "view") {
      if (module === "Workflow" || module === "Mix Materials") {
        return true;
      }
    }
    
    // Find the permission for this role and module - case insensitive match
    const permission = permissions.find(
      p => p.role.toLowerCase() === userRole.toLowerCase() && p.module === module && p.is_active === true
    );
    
    // If no permission found, deny access
    if (!permission) return false;
    
    // Check for the specific permission action and handle SQL boolean values
    switch (action) {
      case "view":
        return Boolean(permission.can_view);
      case "create":
        return Boolean(permission.can_create);
      case "edit":
        return Boolean(permission.can_edit);
      case "delete":
        return Boolean(permission.can_delete);
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