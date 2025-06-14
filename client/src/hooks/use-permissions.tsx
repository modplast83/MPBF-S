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
  // Fetch permissions for the current user
  const { 
    data: permissions = [], 
    isLoading,
  } = useQuery<Permission[]>({ 
    queryKey: ['/api/permissions'],
    // Only fetch permissions if user is logged in
    enabled: !!user,
    // Refresh permissions more frequently to catch updates
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Fetch modules for permission checking
  const { data: modules = [], isLoading: modulesLoading } = useQuery<any[]>({ 
    queryKey: ['/api/modules'],
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  // Function to check if user has permission for a specific workflow tab
  const hasWorkflowTabPermission = (tab: string): boolean => {
    // If no user or user data is loading, deny permission
    if (!user) return false;
    
    // Get the user's admin status and section
    const isAdmin = user.isAdmin;
    const userSection = user.sectionId;
    
    // Administrator has all permissions
    if (isAdmin) return true;

    // Check if user has general Workflow module permission
    return hasPermission("Workflow", "view");
  };

  // Function to check if user has permission for a specific module and action
  const hasPermission = (module: string, action: "view" | "create" | "edit" | "delete" = "view"): boolean => {
    // If no user or user data is loading, deny permission
    if (!user) return false;
    
    // Get the user's admin status and section
    const isAdmin = user?.isAdmin;
    const userSection = user?.sectionId;
    

    
    // Administrator has all permissions
    if (isAdmin) return true;
    
    // If data is still loading, deny access for non-admins to prevent unauthorized access
    if (isLoading || modulesLoading || modules.length === 0 || permissions.length === 0) {
      return false;
    }
    
    // For non-administrators, check section-based permissions
    if (!userSection) {
      return false;
    }
    
    // Find permission for this user's section and the requested module
    const moduleMatch = modules.find((m: any) => m.name === module);
    const moduleId = moduleMatch?.id;
    
    const userPermission = permissions.find(p => 
      p.sectionId === userSection && p.moduleId === moduleId
    );
    
    if (!userPermission || !userPermission.isActive) {
      return false;
    }
    
    // Check specific action permission
    const hasActionPermission = action === 'view' ? userPermission.canView :
                               action === 'create' ? userPermission.canCreate :
                               action === 'edit' ? userPermission.canEdit :
                               action === 'delete' ? userPermission.canDelete : false;
    
    return Boolean(hasActionPermission);
  };

  return (
    <PermissionsContext.Provider
      value={{
        hasPermission,
        hasWorkflowTabPermission,
        isLoading: isLoading || modulesLoading,
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