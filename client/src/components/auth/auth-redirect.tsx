import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function AuthRedirect() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Effect to handle authentication redirection
  useEffect(() => {
    // Wait for auth check to complete
    if (isLoading) return;
    
    // Check if user is authenticated
    const isAuthenticated = !!user;
    
    // Determine if we're on the auth page
    const isAuthPage = location === "/auth";
    
    if (isAuthenticated && isAuthPage) {
      // If authenticated and on auth page, redirect to dashboard
      console.log("User is authenticated but on auth page, redirecting to dashboard");
      window.location.href = "/";
    } else if (!isAuthenticated && !isAuthPage) {
      // If not authenticated and not on auth page, redirect to auth
      console.log("User is not authenticated and not on auth page, redirecting to auth");
      window.location.href = "/auth";
    }
  }, [user, isLoading, location]);
  
  // This component doesn't render anything
  return null;
}