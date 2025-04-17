import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useSidebar } from "@/hooks/use-sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { expanded } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div 
        className={`flex flex-col flex-1 transition-all duration-300 ${
          expanded ? "ml-[250px]" : "ml-[64px]"
        }`}
      >
        <Header />
        <main className="flex-1 overflow-auto bg-secondary-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
