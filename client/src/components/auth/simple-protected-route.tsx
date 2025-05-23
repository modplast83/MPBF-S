import { useEffect } from "react";
import { Route, useLocation } from "wouter";
import { Loader2 } from "lucide-react";

type SimpleProtectedRouteProps = {
  path: string;
  component: React.ComponentType;
};

export function SimpleProtectedRoute({ 
  path, 
  component: Component
}: SimpleProtectedRouteProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
      // Redirect to login page
      setLocation("/login");
    }
  }, [setLocation]);

  // Check if user is logged in
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  
  // Show loading spinner while checking authentication
  if (isLoggedIn === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render the route with the component if authenticated
  return <Route path={path} component={Component} />;
}