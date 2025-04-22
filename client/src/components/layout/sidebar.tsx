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

export default function Sidebar() {
  const [location] = useLocation();
  const { expanded, toggle } = useSidebar();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();

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

  return (
    <aside 
      className={cn(
        "bg-gradient-to-b from-primary-800 to-primary-900 text-white h-screen fixed top-0 z-50 flex flex-col transition-all duration-300 shadow-lg",
        expanded ? "w-[250px]" : "w-[64px]",
        isRTL ? "right-0" : "left-0"
      )}
    >
      <div className={`p-4 border-b border-primary-800/50 ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="flex justify-between items-center">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg shadow-inner">
              <img 
                src="/assets/company-logo.png" 
                alt="Modern Plastic Bag Factory" 
                className="h-8 w-8 object-contain"
              />
            </div>
            {!expanded && <span className="hidden"></span>}
          </div>
          <button 
            onClick={toggle} 
            className="text-white/80 hover:text-white focus:outline-none transition-colors"
          >
            <span className={`material-icons ${isRTL ? 'flip-in-rtl' : ''}`}>
              {expanded ? "menu_open" : "menu"}
            </span>
          </button>
        </div>
        {expanded && (
          <h1 className="text-sm font-semibold mt-3 whitespace-normal leading-tight text-white/90">
            {t("app.title")}
          </h1>
        )}
      </div>
      
      <nav className="mt-5 flex-grow overflow-y-auto">
        {SIDEBAR_ITEMS.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {expanded && (
              <div className="px-4 py-2 text-primary-100 text-xs font-semibold uppercase tracking-wider">
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
                        `flex items-center px-3 py-3 w-full rounded-md mx-2 my-1 hover:bg-primary-700 hover:shadow-md text-white hover:text-white transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`,
                        isActive(item.path) && "bg-primary-600 shadow-md text-white border-l-4 border-white"
                      )}
                    >
                      <span className={`material-icons text-primary-100 ${isRTL ? 'ml-3' : 'mr-3'}`}>{item.icon}</span>
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
                        {item.subItems.map((subItem, subIndex) => {
                          // Log the subItem details to debug
                          console.log(`Subitem: ${subItem.title}, Translation key: sidebar.${subItem.title.toLowerCase().replace(/ /g, '_')}`);
                          return (
                            <Link 
                              key={subIndex} 
                              href={subItem.path}
                              className={cn(
                                `flex items-center py-2 px-3 mx-3 my-1 rounded text-white hover:bg-primary-600/50 hover:text-white transition-colors text-sm ${isRTL ? 'pr-8 flex-row-reverse justify-end' : 'pl-8'}`,
                                isActive(subItem.path) && "bg-primary-600/50 text-white font-medium"
                              )}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-white/40 mr-2"></span>
                              {t(`sidebar.${subItem.title.toLowerCase().replace(/ /g, '_')}`)}
                            </Link>
                          );
                        })}
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                ) : (
                  <Link 
                    href={item.path}
                    className={cn(
                      `flex items-center px-3 py-3 rounded-md mx-2 my-1 hover:bg-primary-700 hover:shadow-md text-white hover:text-white transition-colors ${isRTL ? 'flex-row-reverse text-right' : ''}`,
                      isActive(item.path) && "bg-primary-600 shadow-md text-white border-l-4 border-white"
                    )}
                  >
                    <span className={`material-icons text-primary-100 ${isRTL ? 'ml-3' : 'mr-3'}`}>{item.icon}</span>
                    {expanded && <span className="font-medium text-sm">{t(`sidebar.${item.title.toLowerCase().replace(/ /g, '_')}`)}</span>}
                  </Link>
                )}
              </div>
            ))}
            
            {sectionIndex < SIDEBAR_ITEMS.length - 1 && (
              <Separator className="my-2 bg-gray-800 opacity-50" />
            )}
          </div>
        ))}
      </nav>
      
      <div className="mt-auto w-full border-t border-primary-800/50 p-4">
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="h-10 w-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full flex items-center justify-center text-white font-bold shadow-md">
            A
          </div>
          {expanded && (
            <div className={isRTL ? 'mr-3' : 'ml-3'}>
              <p className="text-sm font-medium text-white">{t("sidebar.admin_user")}</p>
              <p className="text-xs text-primary-300">{t("sidebar.administrator")}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
