import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Permission, User } from "@shared/schema";
import { useAuth } from "./useAuth";

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
  'Cutting': 'cutting',
  'Warehouse': 'warehouse'
};

// Map section names to the modules they should have access to (based on permissions.docx)
const SECTION_MODULE_ACCESS: Record<string, string[]> = {
  'Extruding': ['Dashboard', 'Orders', 'Mix Materials', 'Workflow', 'Workflow-Extrusion Tab'],
  'Printing': ['Dashboard', 'Workflow', 'Workflow-Printing Tab'],
  'Cutting': ['Dashboard', 'Orders', 'Workflow', 'Workflow-Cutting Tab'],
  'Warehouse': ['Dashboard', 'Orders', 'Warehouse', 'Raw Materials', 'Final Products', 'Inventory']
};

export function PermissionsProvider({ 
  children 
}: { 
  children: ReactNode;
}) {
  const { user } = useAuth();
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
        if (tab === workflowTab && userSection === sectionName) {
          return true;
        }
      }
      
      // Special case for warehouse - they need access to warehouse workflow tab
      if (userSection === 'Warehouse' && tab === 'warehouse') {
        return true;
      }
      
      // Check for specific workflow tab permissions based on section name and SECTION_MODULE_ACCESS mapping
      // This handles cases like "Workflow-Extrusion Tab"
      const sectionTabModule = `Workflow-${tab.charAt(0).toUpperCase() + tab.slice(1)} Tab`;
      
      if (userSection && SECTION_MODULE_ACCESS[userSection]) {
        // Either check for the specific tab module (e.g., "Workflow-Extrusion Tab")
        // or check for general workflow access
        if (SECTION_MODULE_ACCESS[userSection].includes(sectionTabModule) || 
            SECTION_MODULE_ACCESS[userSection].includes('Workflow')) {
          return true;
        }
      }
      
      // Fall back to permission check
      const permission = permissions.find(
        p => p.role === userSection && p.module === sectionTabModule && p.isActive
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
        if (action === "view") return supervisorPermission.canView === true;
        if (action === "create") return supervisorPermission.canCreate === true;
        if (action === "edit") return supervisorPermission.canEdit === true;
        if (action === "delete") return supervisorPermission.canDelete === true;
        return false;
      }
      
      // Default supervisor permissions if not explicitly defined
      return true;
    }

    // For section-specific roles (Extruding, Printing, Cutting, Warehouse)
    if (userSection) {
      // For view action, check section-specific permissions from the mapping
      if (action === "view" && SECTION_MODULE_ACCESS[userSection]) {
        // Check if this module is in the list of allowed modules for this section
        if (SECTION_MODULE_ACCESS[userSection].includes(module)) {
          return true;
        }
      }
      
      // For non-view actions or if the view permission wasn't granted above
      // Check if there's a specific permission defined for this section and module
      const sectionPermission = permissions.find(
        p => p.role === userSection && p.module === module && p.isActive
      );
      
      if (sectionPermission) {
        // Check for the specific permission action
        if (action === "view") return sectionPermission.canView === true;
        if (action === "create") return sectionPermission.canCreate === true;
        if (action === "edit") return sectionPermission.canEdit === true;
        if (action === "delete") return sectionPermission.canDelete === true;
        return false;
      }
    }
    
    // Special case for operators - they can view workflow and mix materials
    if (userRole === "operator") {
      // Operators can always view workflow and mix materials
      if (action === "view" && (module === "Workflow" || module === "Mix Materials")) {
        return true;
      }
      
      // Operators in Extruding section can create mix materials
      if (userSection === "Extruding" && module === "Mix Materials" && action === "create") {
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
    if (action === "view") return permission.canView === true;
    if (action === "create") return permission.canCreate === true;
    if (action === "edit") return permission.canEdit === true;
    if (action === "delete") return permission.canDelete === true;
    return false;
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