import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { getQueryFn, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<void, Error, void>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Use a direct fetch approach to bypass any middleware interference
  const fetchUser = async (): Promise<SelectUser | null> => {
    try {
      // Use the browser's native fetch for user authentication
      const response = await fetch('/api/auth/debug', { 
        credentials: 'include', // Important for auth cookies
        headers: { 'Accept': 'application/json' }
      });
      
      console.log("Auth debug response status:", response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log("User is not authenticated");
          return null;
        }
        throw new Error(`Failed to fetch user status: ${response.status}`);
      }
      
      const authStatus = await response.json();
      console.log("Auth status:", authStatus);
      
      // If authenticated, get the user data
      if (authStatus.isAuthenticated) {
        // We know the user is authenticated, but we need to fetch actual data
        // This might still return HTML due to middleware issues, so we'll handle that case
        return { 
          // Use fallback values from session data if needed
          id: authStatus.user?.claims?.sub || 'unknown',
          username: authStatus.user?.claims?.username || 'user',
          email: authStatus.user?.claims?.email,
          firstName: authStatus.user?.claims?.first_name,
          lastName: authStatus.user?.claims?.last_name,
          bio: authStatus.user?.claims?.bio,
          profileImageUrl: authStatus.user?.claims?.profile_image_url,
          role: 'user', // Default role
          phone: null,
          isActive: true,
          sectionId: null,
          createdAt: null,
          updatedAt: null
        };
      }
      
      return null;
    } catch (err) {
      console.error("Error in fetchUser:", err);
      throw err;
    }
  };
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/auth/status"],
    queryFn: fetchUser,
    retry: 1, // Reduce retries for faster feedback during development
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      // Replit Auth doesn't use credentials, just redirect to /api/login
      window.location.href = "/api/login";
    },
    onError: (error: Error) => {
      console.error("Login redirect error:", error);
      toast({
        title: "Login failed",
        description: "Could not redirect to login page",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Redirect to logout endpoint
      window.location.href = "/api/logout";
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        isAuthenticated: !!user,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}