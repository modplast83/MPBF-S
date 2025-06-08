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
    
    console.log(`Checking permission for module: ${module}, action: ${action}, userRole: ${userRole}, userSection: ${userSection}`);
    
    // Administrator role has all permissions
    if (userRole === "administrator") return true;
    
    // If permissions are still loading, allow access for administrators to prevent blocking
    if (isLoading && userRole === "administrator") return true;
    
    // For non-administrators, check section-based permissions
    if (!userSection) {
      console.log(`User has no section assigned, denying access to ${module}`);
      return false;
    }
    
    // Find permission for this user's section and the requested module
    const userPermission = permissions.find(p => 
      p.sectionId === userSection && 
      (p.moduleId === module || (typeof p.moduleId === 'number' && p.moduleId.toString() === module))
    );
    
    if (!userPermission || !userPermission.isActive) {
      console.log(`No active permission found for section ${userSection} and module ${module}`);
      return false;
    }
    
    // Check specific action permission
    const hasActionPermission = action === 'view' ? userPermission.canView :
                               action === 'create' ? userPermission.canCreate :
                               action === 'edit' ? userPermission.canEdit :
                               action === 'delete' ? userPermission.canDelete : false;
    
    console.log(`Permission check result: ${hasActionPermission} for ${action} on ${module}`);
    return Boolean(hasActionPermission);
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