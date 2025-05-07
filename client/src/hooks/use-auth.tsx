import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type LoginCredentials = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  loginMutation: UseMutationResult<SelectUser, Error, LoginCredentials>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: true,
    initialData: null // Set initial data to null to avoid undefined
  });

  const loginMutation = useMutation<SelectUser, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      console.log("Attempting login with credentials:", {username: credentials.username, hasPassword: !!credentials.password});
      const response = await apiRequest("POST", "/api/login", credentials);
      console.log("Login response received:", response);
      return response;
    },
    onSuccess: (userData) => {
      console.log("Login successful, user data:", userData);
      
      // Set the user data in the cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // Force refetch to make sure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
      
      // Redirect to home page
      setLocation("/");
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation<SelectUser, Error, RegisterData>({
    mutationFn: async (userData) => {
      console.log("Attempting registration with data:", {username: userData.username, hasPassword: !!userData.password});
      const response = await apiRequest("POST", "/api/register", userData);
      console.log("Registration response received:", response);
      return response;
    },
    onSuccess: (userData) => {
      console.log("Registration successful, user data:", userData);
      
      // Set the user data in the cache
      queryClient.setQueryData(["/api/user"], userData);
      
      // Force refetch to make sure we have the latest data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.username}!`,
      });
      
      // Redirect to home page immediately
      setLocation("/");
    },
    onError: (error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      console.log("Attempting logout");
      const response = await apiRequest("POST", "/api/logout");
      console.log("Logout response received:", response);
      return response;
    },
    onSuccess: () => {
      console.log("Logout successful");
      
      // Clear the query cache for user data
      queryClient.setQueryData(["/api/user"], null);
      
      // Clear all queries to ensure fresh data on next login
      queryClient.removeQueries();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to auth page
      window.location.href = "/auth"; // Use window.location to force full page reload
    },
    onError: (error) => {
      console.error("Logout error:", error);
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
        registerMutation,
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