import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { SIDEBAR_ITEMS } from "@/lib/constants";
import { useSidebar } from "@/hooks/use-sidebar";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent 
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth-v2";
import { usePermissions } from "@/hooks/use-permissions";
import { ChevronDown, ChevronRight, Home, Settings, Factory, Users, BarChart3, Package, Wrench, FileText, Shield, HelpCircle } from "lucide-react";
import factoryLogo from "@assets/FactoryLogoHPNGW Green.png";

interface SidebarProps {
  onNavItemClick?: () => void;
  isMobile?: boolean;
}

// Icon mapping for modern design
const iconMap: Record<string, any> = {
  "dashboard": Home,
  "settings": Settings,
  "precision_manufacturing": Factory,
  "people": Users,
  "assessment": BarChart3,
  "inventory": Package,
  "build": Wrench,
  "description": FileText,
  "security": Shield,
  "help": HelpCircle
};

export default function Sidebar({ onNavItemClick, isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { expanded, toggle } = useSidebar();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Add safety check for permissions provider
  let hasPermission: (module: string) => boolean;
  let isLoading = true;
  
  try {
    const permissions = usePermissions();
    hasPermission = permissions.hasPermission;
    isLoading = permissions.isLoading;
  } catch (error) {
    // Fallback when permissions provider is not available
    hasPermission = () => true; // Allow all permissions as fallback
    isLoading = false;
  }

  // For storing open state of collapsible menu items
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Function to check if a path is active
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const toggleMenu = (title: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  // Filter sidebar items based on permissions
  const filterItemsByPermission = (items: any[]) => {
    return items.map(section => ({
      ...section,
      items: section.items
        .filter((item: any) => {
          // If it's a standalone item, check permission for it
          if (!item.subItems) {
            // Dashboard is always visible
            if (item.title === 'Dashboard') return true;
            return hasPermission(item.title);
          }

          // For items with subitems, check if any subitems have permission
          const filteredSubItems = (item.subItems || []).filter((subItem: any) => {
            // For Mix Materials, only show if user has a section assigned
            if (subItem.title === 'Mix Materials') {
              return hasPermission(subItem.title) && user?.sectionId && user.sectionId !== "";
            }
            // Special case for operators
            return (user?.role === 'operator' && (subItem.title === 'Workflow' || subItem.title === 'Mix Materials')) 
              || hasPermission(subItem.title);
          });
          
          // Only keep parent item if there are visible subitems
          return filteredSubItems.length > 0;
        })
        .map((item: any) => {
          // If item has subitems, filter those too
          if (item.subItems) {
            return {
              ...item,
              subItems: item.subItems.filter((subItem: any) => {
                // For Mix Materials, only show if user has a section assigned
                if (subItem.title === 'Mix Materials') {
                  return hasPermission(subItem.title) && user?.sectionId && user.sectionId !== "";
                }
                // Special case for operators
                return (user?.role === 'operator' && (subItem.title === 'Workflow' || subItem.title === 'Mix Materials')) 
                  || hasPermission(subItem.title);
              }),
            };
          }
          return item;
        }),
    }));
  };

  // Filter sidebar items based on user permissions
  const filteredSidebarItems = filterItemsByPermission(SIDEBAR_ITEMS);

  return (
    <aside 
      className={cn(
        "bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white h-full min-h-screen flex flex-col transition-all duration-300 shadow-2xl overflow-hidden backdrop-blur-sm",
        expanded ? "w-[280px]" : "w-[80px]",
        isMobile ? "static w-full" : "fixed top-0 z-50",
        !isMobile && (isRTL ? "right-0" : "left-0")
      )}
    >
      {/* Header with Logo */}
      <div className={`p-4 border-b border-slate-700/50 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center justify-between">
          {expanded ? (
            <div className="flex flex-col items-center w-full space-y-3">
              <div className="bg-white/95 p-3 rounded-2xl shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
                <img 
                  src={factoryLogo} 
                  alt="Modern Plastic Bag Factory" 
                  className="h-16 w-16 object-contain"
                />
              </div>
              <div className="text-center">
                <h1 className="text-lg text-white leading-tight font-semibold">MPBF</h1>
                <p className="text-xs text-slate-300 mt-1">
                  Manufacturing System
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <div className="bg-white/95 p-2 rounded-xl shadow-lg ring-1 ring-white/20">
                <img 
                  src={factoryLogo} 
                  alt="Factory Logo" 
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Toggle Button */}
        {!isMobile && (
          <Button
            onClick={toggle}
            variant="ghost"
            size="sm"
            className={cn(
              "absolute top-4 text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200",
              isRTL ? "left-4" : "right-4",
              expanded ? "translate-y-0" : "translate-y-2"
            )}
          >
            {expanded ? (
              isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : (
              isRTL ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto scrollbar-hide">
        {filteredSidebarItems.map((section, sectionIndex) => (
          section.items.length > 0 && (
            <div key={sectionIndex} className="space-y-1">
              {expanded && (
                <div className="px-3 py-2 text-slate-400 uppercase tracking-wider text-xs font-semibold">
                  {t(`sidebar.${section.title.toLowerCase()}`)}
                </div>
              )}
              
              {section.items.map((item: any, itemIndex: number) => {
                const IconComponent = iconMap[item.icon] || Home;
                
                return (
                  <div key={itemIndex}>
                    {item.subItems ? (
                      <Collapsible
                        open={openMenus[item.title]}
                        onOpenChange={() => toggleMenu(item.title)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 group",
                              isRTL && "flex-row-reverse",
                              isActive(item.path) && "bg-blue-600/20 text-blue-300 border-l-2 border-blue-400"
                            )}
                          >
                            <IconComponent className={cn("h-5 w-5", expanded && !isRTL && "mr-3", expanded && isRTL && "ml-3")} />
                            {expanded && (
                              <>
                                <span className="flex-1 text-left">{t(`sidebar.${item.title.toLowerCase().replace(/ /g, '_')}`)}</span>
                                {openMenus[item.title] ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
                                )}
                              </>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent className="space-y-1">
                          {item.subItems.map((subItem: any, subIndex: number) => (
                            <Link key={subIndex} href={subItem.path}>
                              <Button
                                variant="ghost"
                                onClick={onNavItemClick}
                                className={cn(
                                  "w-full justify-start text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 ml-6",
                                  isRTL && "flex-row-reverse mr-6 ml-0",
                                  isActive(subItem.path) && "bg-blue-600/30 text-blue-200 border-l-2 border-blue-400"
                                )}
                              >
                                <div className={cn("w-2 h-2 rounded-full bg-slate-500", expanded && !isRTL && "mr-3", expanded && isRTL && "ml-3")} />
                                {expanded && (
                                  <span className="text-sm">{t(`sidebar.${subItem.title.toLowerCase().replace(/ /g, '_')}`)}</span>
                                )}
                              </Button>
                            </Link>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <Link href={item.path}>
                        <Button
                          variant="ghost"
                          onClick={onNavItemClick}
                          className={cn(
                            "w-full justify-start text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-200 group",
                            isRTL && "flex-row-reverse",
                            isActive(item.path) && "bg-blue-600/20 text-blue-300 border-l-2 border-blue-400"
                          )}
                        >
                          <IconComponent className={cn("h-5 w-5", expanded && !isRTL && "mr-3", expanded && isRTL && "ml-3")} />
                          {expanded && (
                            <span className="text-sm font-medium">{t(`sidebar.${item.title.toLowerCase().replace(/ /g, '_')}`)}</span>
                          )}
                        </Button>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ))}
      </nav>
      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50">
        {expanded ? (
          <div className="text-center">
            <p className="text-xs text-slate-400">Version 2.0</p>
            <p className="text-xs text-slate-500 mt-1">© 2025 Modern Plastic</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-1 bg-slate-600 rounded-full"></div>
          </div>
        )}
      </div>
    </aside>
  );
}