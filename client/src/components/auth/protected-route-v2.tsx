import { useEffect } from "react";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-v2";
import { usePermissions } from "@/hooks/use-permissions";


type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  module?: string; // Optional module name for permissions
  sectionOnly?: boolean; // If true, only allow access if user has section-specific permissions
  workflowTab?: string; // Optional workflow tab name for section-specific access
};

export function ProtectedRoute({ 
  path, 
  component: Component,
  module,
  sectionOnly = false,
  workflowTab
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Add safety check for permissions provider
  let hasPermission = (module: string) => true;
  let hasWorkflowTabPermission = (tab: string) => true;
  
  try {
    const permissions = usePermissions();
    hasPermission = permissions.hasPermission;
    hasWorkflowTabPermission = permissions.hasWorkflowTabPermission;
  } catch (error) {
    // Fallback when permissions provider is not available
    console.warn("Permissions provider not available, allowing access");
  }

  useEffect(() => {
    // Only redirect if not already on the auth page
    if (!isLoading && !isAuthenticated && location !== "/auth") {
      // Save the current URL before redirecting to auth (simple localStorage approach)
      if (location !== '/auth' && location !== '/') {
        localStorage.setItem('intended_url', location);
      }
      setLocation("/auth");
      return;
    }
    
    if (!isLoading && isAuthenticated) {
      // Check for workflow tab permission if specified
      if (workflowTab && !hasWorkflowTabPermission(workflowTab)) {
        setLocation("/");
        return;
      }
      
      // If module is specified, check if user has permission
      if (module && !hasPermission(module)) {
        setLocation("/");
        return;
      }
      
      // If sectionOnly is specified, ensure the user has a section assigned
      if (sectionOnly && user && (!user.sectionId || user.sectionId === "")) {
        setLocation("/");
        return;
      }
    }
  }, [
    isLoading, 
    isAuthenticated, 
    module, 
    workflowTab,
    hasPermission, 
    hasWorkflowTabPermission, 
    location, 
    setLocation,
    sectionOnly,
    user,
    path
  ]);

  // Loader while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Show the component if authenticated
  if (isAuthenticated) {
    return (
      <Route path={path}>
        <Component />
      </Route>
    );
  }

  // Return null if not authenticated (will be redirected by useEffect)
  return null;
}