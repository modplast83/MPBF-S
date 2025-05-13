import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect, useLocation } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
  module?: string; // Optional module name for permission checking
};

export function ProtectedRoute({ path, component: Component, module }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Simplified approach to reduce race conditions and redirect issues
  // Avoid excessive debugging and complex redirect logic
  
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Only show a protected component when user is authenticated
  // Otherwise render nothing, letting the app handle navigation
  return (
    <Route path={path}>
      {user ? <Component /> : null}
    </Route>
  );
}