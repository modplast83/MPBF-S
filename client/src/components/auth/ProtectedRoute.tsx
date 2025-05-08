import { useEffect } from "react";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // If authentication check is complete and user is not authenticated,
    // redirect to the auth page
    if (!isLoading && !isAuthenticated) {
      console.log(`User not authenticated on protected route: ${path}, redirecting to auth page`);
      window.location.href = "/auth";
    }
  }, [isLoading, isAuthenticated, path]);

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isAuthenticated ? (
        <Component />
      ) : null}
    </Route>
  );
}