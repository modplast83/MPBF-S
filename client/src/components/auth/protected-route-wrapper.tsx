import React from 'react';
import { ProtectedRoute } from './protected-route-v2';

type ProtectedRouteWrapperProps = {
  children: React.ReactNode;
  requiredModules?: string[];
};

export function ProtectedRouteWrapper({ children, requiredModules }: ProtectedRouteWrapperProps) {
  // This is a simple wrapper around ProtectedRoute component to use it without path and component props
  // which is useful for nested routes in App.tsx
  
  // Create a simple component to render the children
  const Component = () => <>{children}</>;
  
  // Use a dummy path that will be overridden by the actual Route in App.tsx
  return (
    <ProtectedRoute 
      path="/" 
      component={Component} 
      module={requiredModules?.[0]} 
    />
  );
}