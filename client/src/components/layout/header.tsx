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
    <header className="bg-white shadow-sm backdrop-blur-md bg-white/90 sticky top-0 z-10">
      <div className={`flex justify-between items-center px-6 py-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <span className="h-8 w-1 bg-primary-600 rounded-full mr-3 shadow-md"></span>
            {getCurrentPageTitle()}
          </h2>
        </div>
        <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-4`}>
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="flex items-center justify-center text-primary-600 border-primary-200 shadow-sm hover:bg-primary-50">
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onSelect={() => setLanguage("en")} className={language === "en" ? "bg-primary-50" : ""}>
                <span className={`${language === "en" ? "font-bold text-primary-700" : ""}`}>{t("language.en")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLanguage("ar")} className={language === "ar" ? "bg-primary-50" : ""}>
                <span className={`${language === "ar" ? "font-bold text-primary-700" : ""}`}>{t("language.ar")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="icon" className="text-primary-600 border-primary-200 shadow-sm hover:bg-primary-50">
            <span className="material-icons">notifications</span>
          </Button>
          <Button variant="outline" size="icon" className="text-primary-600 border-primary-200 shadow-sm hover:bg-primary-50">
            <span className="material-icons">help_outline</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-2 pl-3 pr-2 border-primary-200 shadow-sm hover:bg-primary-50 group`}>
                <div className="h-7 w-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-medium mr-2 group-hover:bg-primary-200 transition-colors">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
                <span className={`material-icons text-primary-600 text-sm ${isRTL ? 'flip-in-rtl' : ''}`}>arrow_drop_down</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1 shadow-lg">
              <DropdownMenuItem className="rounded hover:bg-primary-50 cursor-pointer focus:bg-primary-50 py-2">
                <span className={`material-icons ${isRTL ? 'ml-2' : 'mr-2'} text-primary-600`}>person</span>
                <span>{t("common.profile")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded hover:bg-primary-50 cursor-pointer focus:bg-primary-50 py-2">
                <span className={`material-icons ${isRTL ? 'ml-2' : 'mr-2'} text-primary-600`}>settings</span>
                <span>{t("common.settings")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-gray-100" />
              <DropdownMenuItem onSelect={handleLogout} className="rounded hover:bg-red-50 cursor-pointer focus:bg-red-50 py-2">
                <span className={`material-icons ${isRTL ? 'ml-2' : 'mr-2'} text-red-600`}>logout</span>
                <span className="text-red-600">{t("common.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
