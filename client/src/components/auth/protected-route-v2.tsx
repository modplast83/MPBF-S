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
  const { hasPermission, hasWorkflowTabPermission } = usePermissions();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Only redirect if not already on the auth page
    if (!isLoading && !isAuthenticated && location !== "/auth") {
      console.log("User is not authenticated and not on auth page, redirecting to auth");
      setLocation("/auth");
      return;
    }
    
    if (!isLoading && isAuthenticated) {
      // Check for workflow tab permission if specified
      if (workflowTab && !hasWorkflowTabPermission(workflowTab)) {
        console.log(`User doesn't have permission for workflow tab: ${workflowTab}, redirecting to dashboard`);
        setLocation("/");
        return;
      }
      
      // If module is specified, check if user has permission
      if (module && !hasPermission(module)) {
        console.log(`User doesn't have permission for module: ${module}, redirecting to dashboard`);
        setLocation("/");
        return;
      }
      
      // If sectionOnly is specified, ensure the user has a section assigned
      if (sectionOnly && user && (!user.sectionId || user.sectionId === "")) {
        console.log(`User doesn't have a section assigned, section is required for: ${path}, redirecting to dashboard`);
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