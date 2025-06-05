import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SIDEBAR_ITEMS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-v2";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import { Loader2, Menu, HelpCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthenticationButton } from "@/components/authentication-button";
import { NotificationBell } from "@/components/notifications/notification-bell";
import AnimatedLanguageToggle from "@/components/ui/animated-language-toggle";

interface HeaderProps {
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
}

export default function Header({ mobileMenuOpen, setMobileMenuOpen }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  // Logout is now handled by the AuthenticationButton component
  
  // Function to toggle mobile sidebar
  const toggleMobileSidebar = () => {
    if (setMobileMenuOpen) {
      setMobileMenuOpen(!mobileMenuOpen);
    }
  };
  
  // Function to get current page title based on location
  const getCurrentPageTitle = () => {
    // First check for exact matches
    for (const section of SIDEBAR_ITEMS) {
      for (const item of section.items) {
        if (item.path === location) {
          return t(`sidebar.${item.title.toLowerCase()}`);
        }
        
        // Check subItems if they exist
        if (item.subItems) {
          for (const subItem of item.subItems) {
            if (subItem.path === location) {
              return t(`sidebar.${subItem.title.toLowerCase().replace(/ /g, '_')}`);
            }
          }
        }
      }
    }
    
    // Check for path startsWith for nested routes
    for (const section of SIDEBAR_ITEMS) {
      for (const item of section.items) {
        if (location.startsWith(item.path) && item.path !== "/") {
          return t(`sidebar.${item.title.toLowerCase()}`);
        }
        
        // Check subItems if they exist
        if (item.subItems) {
          for (const subItem of item.subItems) {
            if (location.startsWith(subItem.path)) {
              return t(`sidebar.${subItem.title.toLowerCase().replace(/ /g, '_')}`);
            }
          }
        }
      }
    }
    
    // Default to Dashboard
    return t("sidebar.dashboard");
  };

  return (
    <header className="bg-white/95 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
      <div className={`flex justify-between items-center px-4 sm:px-6 py-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center space-x-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              onClick={toggleMobileSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex flex-col">
            <h1 className={`text-xl sm:text-2xl font-bold text-slate-800 ${isMobile ? 'truncate max-w-[180px]' : ''}`}>
              {getCurrentPageTitle()}
            </h1>
            <p className="text-sm text-slate-500 hidden sm:block">
              Modern Plastic Manufacturing System
            </p>
          </div>
        </div>
        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 sm:space-x-4`}>
          {/* Animated Language Toggle */}
          <AnimatedLanguageToggle variant="dropdown" showNames={!isMobile} />
          
          {/* Notification Bell - available on all screen sizes for authenticated users */}
          {user && <NotificationBell />}
          
          {/* Only show help button on larger screens */}
          {!isMobile && (
            <Button variant="outline" size="icon" className="text-slate-600 border-slate-200 shadow-sm hover:bg-slate-50">
              <HelpCircle className="h-5 w-5" />
            </Button>
          )}
          
          {/* Use new AuthenticationButton component for Replit Auth */}
          <AuthenticationButton />
        </div>
      </div>
    </header>
  );
}
