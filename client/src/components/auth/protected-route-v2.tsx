import { useEffect } from "react";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-v2";
import { usePermissions } from "@/hooks/use-permissions";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  module?: string; // Optional module name for permissions
};

export function ProtectedRoute({ 
  path, 
  component: Component,
  module 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // If authentication check is complete and user is not authenticated,
    // redirect to the auth page
    if (!isLoading && !isAuthenticated) {
      console.log("User is not authenticated and not on auth page, redirecting to auth");
      window.location.href = "/auth";
    }
    
    // If module is specified, check if user has permission
    if (!isLoading && isAuthenticated && module && !hasPermission(module)) {
      console.log(`User doesn't have permission for module: ${module}, redirecting to dashboard`);
      window.location.href = "/";
    }
  }, [isLoading, isAuthenticated, module, hasPermission, location]);

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