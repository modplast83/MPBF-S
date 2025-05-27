import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { SIDEBAR_ITEMS } from "@/lib/constants";
import { useSidebar } from "@/hooks/use-sidebar";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import { 
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent 
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth-v2";
import { usePermissions } from "@/hooks/use-permissions";

interface SidebarProps {
  onNavItemClick?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ onNavItemClick, isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { expanded, toggle } = useSidebar();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

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
        .filter(item => {
          // If it's a standalone item, check permission for it
          if (!item.subItems) {
            // Dashboard is always visible
            if (item.title === 'Dashboard') return true;
            return hasPermission(item.title);
          }

          // For items with subitems, check if any subitems have permission
          const filteredSubItems = (item.subItems || []).filter(subItem => {
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
        .map(item => {
          // If item has subitems, filter those too
          if (item.subItems) {
            return {
              ...item,
              subItems: item.subItems.filter(subItem => {
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
        "bg-gradient-to-b from-gray-900 to-black text-white h-full min-h-screen flex flex-col transition-all duration-300 shadow-lg overflow-hidden",
        expanded ? "w-[250px]" : "w-[64px]",
        isMobile ? "static w-full" : "fixed top-0 z-50",
        !isMobile && (isRTL ? "right-0" : "left-0")
      )}
    >
      <div className={`p-4 border-b border-gray-700/50 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex justify-between items-center">
          {expanded ? (
            <div className="flex flex-col items-center w-full">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg shadow-inner mx-auto">
                <img 
                  src="/assets/company-logo.png" 
                  alt="Modern Plastic Bag Factory" 
                  className="h-12 w-12 object-contain"
                />
              </div>
              <h1 className="text-sm font-semibold mt-3 whitespace-normal leading-tight text-white/90 text-center">
                {t("app.title")}
              </h1>
            </div>
          ) : (
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg shadow-inner">
                <img 
                  src="/assets/company-logo.png" 
                  alt="Modern Plastic Bag Factory" 
                  className="h-10 w-10 object-contain"
                />
              </div>
            </div>
          )}
          
          <button 
            onClick={toggle} 
            className={`text-white/80 hover:text-white focus:outline-none transition-colors ${expanded ? 'absolute right-4' : ''}`}
          >
            <span className={`material-icons ${isRTL ? 'flip-in-rtl' : ''}`}>
              {expanded ? "menu_open" : "menu"}
            </span>
          </button>
        </div>
      </div>
      <nav className="mt-5 flex-grow overflow-y-auto scrollbar-hide">
        {filteredSidebarItems.map((section, sectionIndex) => (
          // Only show sections that have items
          (section.items.length > 0 ? (<div key={sectionIndex}>
            {expanded && (
              <div className="px-4 py-2 text-gray-300 uppercase tracking-wider text-[18px] font-bold">
                {t(`sidebar.${section.title.toLowerCase()}`)}
              </div>
            )}
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex}>
                {item.subItems ? (
                  <Collapsible
                    open={openMenus[item.title]}
                    onOpenChange={() => toggleMenu(item.title)}
                  >
                    <CollapsibleTrigger
                      className={cn(
                        `flex items-center px-3 py-3 w-full rounded-md mx-2 my-1 hover:bg-gray-700 hover:shadow-md text-white hover:text-white transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`,
                        isActive(item.path) && "bg-gray-700 shadow-md text-white border-l-4 border-white"
                      )}
                    >
                      <span className={`material-icons text-white ${isRTL ? 'ml-3' : 'mr-3'}`}>{item.icon}</span>
                      {expanded && (
                        <>
                          <span className="flex-1 font-medium text-sm">{t(`sidebar.${item.title.toLowerCase().replace(/ /g, '_')}`)}</span>
                          <span className={`material-icons text-sm opacity-70 ${isRTL ? 'flip-in-rtl' : ''}`}>
                            {openMenus[item.title] ? "expand_less" : "expand_more"}
                          </span>
                        </>
                      )}
                    </CollapsibleTrigger>
                    
                    {expanded && (
                      <CollapsibleContent>
                        {item.subItems.map((subItem, subIndex) => (
                          <Link 
                            key={subIndex} 
                            href={subItem.path}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Close mobile menu if callback provided
                              if (onNavItemClick) onNavItemClick();
                            }}
                            className={cn(
                              `flex items-center py-2 px-3 mx-3 my-1 rounded text-white hover:bg-gray-600/50 hover:text-white transition-colors text-sm ${isRTL ? 'pr-8 flex-row-reverse justify-end' : 'pl-8'}`,
                              isActive(subItem.path) && "bg-gray-600/50 text-white font-medium"
                            )}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full bg-white/40 ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
                            {t(`sidebar.${subItem.title.toLowerCase().replace(/ /g, '_')}`)}
                          </Link>
                        ))}
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                ) : (
                  <Link 
                    href={item.path}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Close mobile menu if callback provided
                      if (onNavItemClick) onNavItemClick();
                    }}
                    className={cn(
                      `flex items-center px-3 py-3 rounded-md mx-2 my-1 hover:bg-gray-700 hover:shadow-md text-white hover:text-white transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`,
                      isActive(item.path) && "bg-gray-700 shadow-md text-white border-l-4 border-white"
                    )}
                  >
                    <span className={`material-icons text-white ${isRTL ? 'ml-3' : 'mr-3'}`}>{item.icon}</span>
                    {expanded && <span className="font-medium text-sm">{t(`sidebar.${item.title.toLowerCase().replace(/ /g, '_')}`)}</span>}
                  </Link>
                )}
              </div>
            ))}
            {sectionIndex < filteredSidebarItems.length - 1 && 
              filteredSidebarItems[sectionIndex + 1].items.length > 0 && (
                <Separator className="my-2 bg-gray-600 opacity-50" />
            )}
          </div>) : null)
        ))}
      </nav>
      <div className="mt-auto w-full border-t border-gray-700/50 p-4">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-10 w-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold shadow-md">
            {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
          </div>
          {expanded && (
            <div className={isRTL ? 'mr-3' : 'ml-3'}>
              <p className="text-sm font-medium text-white">{user?.username || t("sidebar.user")}</p>
              <p className="text-xs text-gray-300">{user?.role || t("sidebar.role")}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
