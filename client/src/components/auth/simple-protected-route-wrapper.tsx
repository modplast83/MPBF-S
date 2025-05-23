import React from 'react';
import { SimpleProtectedRoute } from './simple-protected-route';

type SimpleProtectedRouteWrapperProps = {
  children: React.ReactNode;
  requiredModules?: string[];
  showSidebar?: boolean;
};

export function SimpleProtectedRouteWrapper({ 
  children, 
  requiredModules, 
  showSidebar 
}: SimpleProtectedRouteWrapperProps) {
  // A simple wrapper that works with our SimpleProtectedRoute
  const Component = () => <>{children}</>;
  
  return (
    <SimpleProtectedRoute 
      path="/" 
      component={Component} 
    />
  );
}