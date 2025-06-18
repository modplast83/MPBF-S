import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";


type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterFormData) => Promise<void>;
};

type RegisterFormData = {
  username: string;
  password: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode | ((data: AuthContextType) => ReactNode) }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Fetch the current user
  const {
    data: user,
    isLoading,
    error,
    refetch
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache"
          }
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        return null;
      }
    },
    staleTime: 60000, // Consider data fresh for 1 minute
    retry: false,
    refetchOnWindowFocus: false
  });

  // Update isAuthenticated state when user data changes
  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      console.log("Attempting login with credentials:", { username, hasPassword: !!password });
      const response = await fetch("/api/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "Login failed");
      }
      
      const userData = await response.json();
      console.log("Login response received:", userData);
      return userData;
    },
    onSuccess: (userData: User) => {
      // Update the cache
      console.log("Login successful, user data:", userData);
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.username}!`,
      });
      
      // Check for intended URL from localStorage and navigate appropriately
      const intendedUrl = localStorage.getItem('intended_url');
      if (intendedUrl && intendedUrl !== '/auth' && intendedUrl !== '/') {
        console.log("Redirecting to intended page after login:", intendedUrl);
        localStorage.removeItem('intended_url');
        navigate(intendedUrl);
      } else {
        console.log("No intended URL, redirecting to dashboard");
        localStorage.removeItem('intended_url');
        navigate("/");
      }
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error("Logout failed");
      }
      
      return response.status === 200;
    },
    onSuccess: () => {
      // Clear the cache
      queryClient.setQueryData(["/api/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Routing will handle navigation based on authentication state
      console.log("Logout completed, authentication state updated");
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterFormData) => {
      const response = await fetch("/api/register", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Registration failed" }));
        throw new Error(errorData.message || "Registration failed");
      }
      
      return await response.json();
    },
    onSuccess: (userData: User) => {
      // Update the cache
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${userData.username}!`,
      });
      
      // Routing will handle navigation based on authentication state
      console.log("Registration completed, authentication state updated");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    }
  });

  // Login function
  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  // Register function
  const register = async (userData: RegisterFormData) => {
    await registerMutation.mutateAsync(userData);
  };

  // Return a stable context value
  const contextValue: AuthContextType = {
    user: user || null,
    isLoading,
    error: error || null,
    isAuthenticated,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {typeof children === 'function' ? children(contextValue) : children}
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