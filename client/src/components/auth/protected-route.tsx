import { ReactNode } from "react";
import { Redirect, useLocation, Route, RouteComponentProps } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  module?: string; // Module name for permission check
}

export function ProtectedRoute({ path, component: Component, module }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = usePermissions();
  const [location] = useLocation();
  const isLoading = authLoading || permissionsLoading;

  // Check if this is a special allowed route for operators
  const isOperatorAllowedRoute = 
    module === "Workflow" || 
    module === "Mix Materials";

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!isAuthenticated) {
    // Store the current location to redirect back after login
    sessionStorage.setItem("redirectAfterLogin", location);
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If a module is specified, check permission
  if (module && !hasPermission(module, "view") && !isOperatorAllowedRoute) {
    return (
      <Route path={path}>
        <div className="min-h-screen p-8 flex flex-col items-center justify-center">
          <Alert className="max-w-lg mb-4 bg-destructive/15 border-destructive/30">
            <AlertTitle className="text-destructive text-xl">Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              You don't have permission to access this module. 
              Please contact your administrator if you believe you should have access.
            </AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
          >
            Return to Dashboard
          </Button>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      {(params) => <Component {...params} />}
    </Route>
  );
}