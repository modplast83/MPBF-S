import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { expanded } = useSidebar();
  const { user } = useAuth();
  const [location] = useLocation();
  
  const isAuthPage = location === "/auth";

  // For auth page, render without the navigation elements
  if (isAuthPage) {
    return <div className="h-screen overflow-hidden">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {user && <Sidebar />}
      <div 
        className={`flex flex-col flex-1 transition-all duration-300 ${
          user && expanded ? "ml-[250px]" : user ? "ml-[64px]" : "ml-0"
        }`}
      >
        {user && <Header />}
        <main className="flex-1 overflow-auto bg-secondary-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
