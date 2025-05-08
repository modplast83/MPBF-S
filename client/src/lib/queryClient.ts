import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText;
    try {
      // Try to parse as JSON first
      const errorData = await res.json();
      errorText = errorData.message || JSON.stringify(errorData);
    } catch (e) {
      // If not JSON, get as text
      try {
        errorText = await res.text();
      } catch (e2) {
        // Fallback to statusText if both fail
        errorText = res.statusText;
      }
    }
    throw new Error(`${res.status}: ${errorText}`);
  }
}

export async function apiRequest(
  method: string,
  endpoint: string,
  data?: any
): Promise<any> {
  console.log(`API Request: ${method} ${endpoint}`, data ? { hasData: true } : { hasData: false });
  
  // Add timestamp to prevent caching for POST requests
  const url = method === 'POST' ? 
    `${endpoint}${endpoint.includes('?') ? '&' : '?'}_t=${Date.now()}` : 
    endpoint;
  
  const options: RequestInit = {
    method,
    credentials: "include",
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      // Add cache control headers
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`Fetching ${url} with options:`, {
      method: method,
      credentials: options.credentials,
      headers: options.headers,
      hasBody: !!options.body
    });
    
    const res = await fetch(url, options);
    console.log(`Response status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      await throwIfResNotOk(res);
    }
    
    const result = await res.json();
    console.log(`API Response data:`, result);
    return result;
  } catch (error) {
    console.error(`API Request error for ${method} ${endpoint}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 300000, // 5 minutes instead of Infinity
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
