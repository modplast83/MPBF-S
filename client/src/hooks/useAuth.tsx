import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

/**
 * Hook to check authentication status using Replit Auth
 */
export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/user"],
    retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes to check token validity
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}

/**
 * Redirects to login page
 */
export function login() {
  window.location.href = "/api/login";
}

/**
 * Performs logout
 */
export function logout() {
  window.location.href = "/api/logout";
}