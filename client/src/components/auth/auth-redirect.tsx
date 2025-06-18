import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth-v2";
import { useUrlPreservation } from "@/hooks/use-url-preservation";

export function AuthRedirect() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const { getIntendedUrl, clearIntendedUrl, shouldPreserveUrl } = useUrlPreservation();
  
  // Effect to handle authentication redirection
  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;
    
    // Check if user is authenticated
    const isAuthenticated = !!user;
    
    // Determine if we're on the auth page
    const isAuthPage = location === "/auth";
    
    if (isAuthenticated && isAuthPage) {
      // If authenticated and on auth page, check for intended URL
      const intendedUrl = getIntendedUrl();
      
      if (intendedUrl && shouldPreserveUrl(intendedUrl)) {
        console.log("User is authenticated, redirecting to intended page:", intendedUrl);
        clearIntendedUrl();
        setLocation(intendedUrl);
      } else {
        // If no intended URL or it's not valid, redirect to dashboard
        console.log("User is authenticated but on auth page, redirecting to dashboard");
        clearIntendedUrl();
        setLocation("/");
      }
    } else if (!isAuthenticated && !isAuthPage) {
      // If not authenticated and not on auth page, save current URL and redirect to auth
      if (shouldPreserveUrl(location)) {
        console.log("User is not authenticated, saving current page and redirecting to auth");
        // URL preservation is handled by ProtectedRoute component
      } else {
        console.log("User is not authenticated and not on auth page, redirecting to auth");
      }
      setLocation("/auth");
    }
  }, [user, isLoading, location, setLocation, getIntendedUrl, clearIntendedUrl, shouldPreserveUrl]);
  
  // This component doesn't render anything
  return null;
}