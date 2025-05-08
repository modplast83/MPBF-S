import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth-v2";
import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose 
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  // Always declare all hooks at the top level, regardless of conditions
  const { expanded } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { isRTL } = useLanguage();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  
  const isAuthPage = location === "/auth";

  // We're removing the automatic sidebar closing on navigation
  // This will allow the sidebar to stay open when navigating between pages
  
  // Separate return for auth page to avoid conditional rendering of components with hooks
  if (isAuthPage) {
    return <div className="h-screen overflow-hidden">{children}</div>;
  }

  // Handler for mobile menu toggle
  const handleMobileMenuToggle = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar - fixed position */}
      {isAuthenticated && !isMobile && <Sidebar isMobile={false} />}
      
      {/* Mobile sidebar as a sheet for better mobile experience */}
      {isAuthenticated && isMobile && (
        <Sheet open={isOpen} onOpenChange={handleMobileMenuToggle}>
          <SheetContent 
            side={isRTL ? "right" : "left"} 
            className="p-0 m-0 border-0 shadow-xl w-[85%] max-w-[300px] h-full min-h-[100dvh] bg-transparent overflow-hidden"
          >
            <VisuallyHidden>
              <div id="mobile-sidebar-title">Navigation Menu</div>
            </VisuallyHidden>
            <Sidebar isMobile={true} onNavItemClick={() => setIsOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      
      <div 
        className={`flex flex-col flex-1 transition-all duration-300 ${
          !isMobile && isAuthenticated && expanded 
            ? isRTL ? "mr-[250px]" : "ml-[250px]" 
            : !isMobile && isAuthenticated 
              ? isRTL ? "mr-[64px]" : "ml-[64px]" 
              : "mx-0"
        }`}
      >
        {isAuthenticated && <Header mobileMenuOpen={isOpen} setMobileMenuOpen={handleMobileMenuToggle} />}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
