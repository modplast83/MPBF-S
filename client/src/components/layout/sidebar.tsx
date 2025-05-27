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
        "bg-white border-r border-gray-200 text-gray-800 h-full min-h-screen flex flex-col transition-all duration-300 shadow-xl overflow-hidden",
        expanded ? "w-[280px]" : "w-[72px]",
        isMobile ? "static w-full" : "fixed top-0 z-50",
        !isMobile && (isRTL ? "right-0" : "left-0")
      )}
    >
      <div className={`p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex justify-between items-center">
          {expanded ? (
            <div className="flex flex-col items-center w-full">
              <div className="bg-white p-3 rounded-xl shadow-lg ring-1 ring-gray-100 mx-auto">
                <img 
                  src="/assets/company-logo.png" 
                  alt="Modern Plastic Bag Factory" 
                  className="h-12 w-12 object-contain"
                />
              </div>
              <h1 className="text-sm font-bold mt-3 whitespace-normal leading-tight text-gray-700 text-center">
                {t("app.title")}
              </h1>
            </div>
          ) : (
            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="bg-white p-2 rounded-xl shadow-lg ring-1 ring-gray-100">
                <img 
                  src="/assets/company-logo.png" 
                  alt="Modern Plastic Bag Factory" 
                  className="h-8 w-8 object-contain"
                />
              </div>
            </div>
          )}
          
          <button 
            onClick={toggle} 
            className={`text-gray-600 hover:text-blue-600 focus:outline-none transition-colors p-2 rounded-lg hover:bg-white/70 ${expanded ? 'absolute right-4' : ''}`}
          >
            <span className={`material-icons text-xl ${isRTL ? 'flip-in-rtl' : ''}`}>
              {expanded ? "menu_open" : "menu"}
            </span>
          </button>
        </div>
      </div>
      <nav className="mt-6 flex-grow overflow-y-auto scrollbar-hide px-3">
        {filteredSidebarItems.map((section, sectionIndex) => (
          // Only show sections that have items
          (section.items.length > 0 ? (<div key={sectionIndex} className="mb-6">
            {expanded && (
              <div className="px-3 py-2 text-gray-500 uppercase tracking-wider text-xs font-semibold border-b border-gray-100 mb-3">
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
                        `flex items-center px-4 py-3 w-full rounded-xl my-1 hover:bg-blue-50 hover:shadow-sm text-gray-700 hover:text-blue-700 transition-all duration-200 group ${isRTL ? 'text-right' : ''}`,
                        isActive(item.path) && "bg-blue-100 shadow-sm text-blue-700 border border-blue-200 font-medium"
                      )}
                    >
                      {isRTL ? (
                        <>
                          {expanded && (
                            <>
                              <span className={`material-icons text-sm text-gray-500 group-hover:text-blue-600 ${isRTL ? 'flip-in-rtl' : ''}`}>
                                {openMenus[item.title] ? "expand_less" : "expand_more"}
                              </span>
                              <span className="flex-1 font-medium text-sm mr-3">{t(`sidebar.${item.title.toLowerCase().replace(/ /g, '_')}`)}</span>
                            </>
                          )}
                          <span className="material-icons text-gray-600 group-hover:text-blue-600">{item.icon}</span>
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-gray-600 group-hover:text-blue-600 mr-3">{item.icon}</span>
                          {expanded && (
                            <>
                              <span className="flex-1 font-medium text-sm">{t(`sidebar.${item.title.toLowerCase().replace(/ /g, '_')}`)}</span>
                              <span className="material-icons text-sm text-gray-500 group-hover:text-blue-600">
                                {openMenus[item.title] ? "expand_less" : "expand_more"}
                              </span>
                            </>
                          )}
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
                              `flex items-center py-2.5 px-4 mx-2 my-0.5 rounded-lg text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 text-sm ${isRTL ? 'pr-8 flex-row-reverse justify-end' : 'pl-8'}`,
                              isActive(subItem.path) && "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500"
                            )}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full bg-gray-400 ${isRTL ? 'ml-2' : 'mr-2'}`}></span>
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
                      `flex items-center px-4 py-3 rounded-xl my-1 hover:bg-blue-50 hover:shadow-sm text-gray-700 hover:text-blue-700 transition-all duration-200 group ${isRTL ? 'text-right' : ''}`,
                      isActive(item.path) && "bg-blue-100 shadow-sm text-blue-700 border border-blue-200 font-medium"
                    )}
                  >
                    {isRTL ? (
                      <>
                        {expanded && <span className="font-medium text-sm mr-3">{t(`sidebar.${item.title.toLowerCase().replace(/ /g, '_')}`)}</span>}
                        <span className="material-icons text-gray-600 group-hover:text-blue-600">{item.icon}</span>
                      </>
                    ) : (
                      <>
                        <span className="material-icons text-gray-600 group-hover:text-blue-600 mr-3">{item.icon}</span>
                        {expanded && <span className="font-medium text-sm">{t(`sidebar.${item.title.toLowerCase().replace(/ /g, '_')}`)}</span>}
                      </>
                    )}
                  </Link>
                )}
              </div>
            ))}
            {sectionIndex < filteredSidebarItems.length - 1 && 
              filteredSidebarItems[sectionIndex + 1].items.length > 0 && (
                <Separator className="my-4 bg-gray-200" />
            )}
          </div>) : null)
        ))}
      </nav>
      <div className="mt-auto w-full border-t border-gray-200 p-4 bg-gray-50">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-blue-100">
            {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
          </div>
          {expanded && (
            <div className={isRTL ? 'mr-3' : 'ml-3'}>
              <p className="text-sm font-semibold text-gray-800">{user?.username || t("sidebar.user")}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">{user?.role || t("sidebar.role")}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
