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
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import { Loader2, Globe } from "lucide-react";

export default function Header() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  
  // Function to handle logout
  const handleLogout = () => {
    // Confirm logout
    if (confirm(t("common.logout_confirm"))) {
      logoutMutation.mutate();
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
    <header className="bg-white shadow-sm">
      <div className={`flex justify-between items-center px-6 py-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-secondary-800">
            {getCurrentPageTitle()}
          </h2>
        </div>
        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="flex items-center justify-center">
                <Globe className="h-5 w-5 text-secondary-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={() => setLanguage("en")} className={language === "en" ? "bg-secondary-100" : ""}>
                <span className={`${language === "en" ? "font-bold" : ""}`}>{t("language.en")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLanguage("ar")} className={language === "ar" ? "bg-secondary-100" : ""}>
                <span className={`${language === "ar" ? "font-bold" : ""}`}>{t("language.ar")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="icon">
            <span className="material-icons text-secondary-600">notifications</span>
          </Button>
          <Button variant="ghost" size="icon">
            <span className="material-icons text-secondary-600">help_outline</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2`}>
                <span className="text-sm font-medium text-secondary-700">{user?.name || 'User'}</span>
                <span className={`material-icons text-secondary-600 text-sm ${isRTL ? 'flip-in-rtl' : ''}`}>arrow_drop_down</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <span className={`material-icons ${isRTL ? 'ml-2' : 'mr-2'} text-sm`}>person</span>
                <span>{t("common.profile")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className={`material-icons ${isRTL ? 'ml-2' : 'mr-2'} text-sm`}>settings</span>
                <span>{t("common.settings")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <span className={`material-icons ${isRTL ? 'ml-2' : 'mr-2'} text-sm`}>logout</span>
                <span>{t("common.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
