import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { expanded } = useSidebar();
  const { user } = useAuth();
  const { isRTL } = useLanguage();
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
          user && expanded 
            ? isRTL ? "mr-[250px]" : "ml-[250px]" 
            : user 
              ? isRTL ? "mr-[64px]" : "ml-[64px]" 
              : "mx-0"
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
