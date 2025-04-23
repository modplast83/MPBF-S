import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Permission } from "@shared/schema";

type PermissionsContextType = {
  hasPermission: (module: string, action?: "view" | "create" | "edit" | "delete") => boolean;
  isLoading: boolean;
};

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
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

  // Function to check if user has permission for a specific module and action
  const hasPermission = (module: string, action: "view" | "create" | "edit" | "delete" = "view") => {
    // If no user or user data is loading, deny permission
    if (!user) return false;
    
    // Get the user's role
    const userRole = user.role;
    
    // Administrator role has all permissions
    if (userRole === "administrator") return true;
    
    // Find the permission for this role and module
    const permission = permissions.find(
      p => p.role === userRole && p.module === module && p.isActive
    );
    
    // If no permission found, deny access
    if (!permission) return false;
    
    // Check for the specific permission action
    switch (action) {
      case "view":
        return permission.canView;
      case "create":
        return permission.canCreate;
      case "edit":
        return permission.canEdit;
      case "delete":
        return permission.canDelete;
      default:
        return false;
    }
  };

  return (
    <PermissionsContext.Provider
      value={{
        hasPermission,
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