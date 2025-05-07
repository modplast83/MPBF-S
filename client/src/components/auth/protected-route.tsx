import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect, useLocation } from "wouter";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
};

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      {user ? (
        <Component />
      ) : (
        (() => {
          console.log("User not authenticated, redirecting to auth page");
          setTimeout(() => {
            setLocation("/auth");
          }, 100);
          return null;
        })()
      )}
    </Route>
  );
}