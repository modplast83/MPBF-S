import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
  logoutMutation: UseMutationResult<void, Error, void>;
};

type LoginData = Pick<InsertUser, "username" | "password">;
type RegisterData = InsertUser;

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
    queryFn: getQueryFn({ 
      on401: "returnNull" 
    }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      return await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(credentials)
      });
    },
    onSuccess: (user: SelectUser) => {
      // Update user data in cache
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
        variant: "default",
        duration: 2000, // 2 seconds
      });
      
      // Redirect to dashboard immediately after login
      setLocation("/");
      
      // Invalidate all queries to force refetch after login
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      return await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify(userData)
      });
    },
    onSuccess: (user: SelectUser) => {
      // Update user data in cache
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
        variant: "default",
        duration: 2000, // 2 seconds
      });
      
      // Redirect to dashboard after registration
      setLocation("/");
      
      // Invalidate all queries to force refetch after registration
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not register user",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/logout", {
        method: "POST"
      });
    },
    onSuccess: () => {
      // Clear user data from cache
      queryClient.setQueryData(["/api/user"], null);
      
      // Reset query cache
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Redirect to login page
      setLocation("/auth");
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