import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { SIDEBAR_ITEMS } from "@/lib/constants";
import { useSidebar } from "@/hooks/use-sidebar";
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
        "bg-primary-700 text-white h-screen fixed z-10 overflow-y-auto transition-all duration-300",
        expanded ? "w-[250px]" : "w-[64px]"
      )}
    >
      <div className="p-4 flex justify-between items-center border-b border-primary-600">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
            MP
          </div>
          {expanded && <h1 className="text-lg font-semibold whitespace-nowrap">MPBF System</h1>}
        </div>
        <button 
          onClick={toggle} 
          className="text-white focus:outline-none"
        >
          <span className="material-icons">
            {expanded ? "menu_open" : "menu"}
          </span>
        </button>
      </div>
      
      <nav className="mt-5">
        {SIDEBAR_ITEMS.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {expanded && (
              <div className="px-4 py-2 text-primary-200 text-xs font-semibold uppercase">
                {section.title}
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
                        "flex items-center px-4 py-3 w-full hover:bg-primary-600 text-white",
                        isActive(item.path) && "bg-primary-600"
                      )}
                    >
                      <span className="material-icons mr-3">{item.icon}</span>
                      {expanded && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          <span className="material-icons text-sm">
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
                            className={cn(
                              "flex items-center pl-11 py-2 hover:bg-primary-600 text-white",
                              isActive(subItem.path) && "bg-primary-600"
                            )}
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                ) : (
                  <Link 
                    href={item.path}
                    className={cn(
                      "flex items-center px-4 py-3 hover:bg-primary-600 text-white",
                      isActive(item.path) && "bg-primary-600"
                    )}
                  >
                    <span className="material-icons mr-3">{item.icon}</span>
                    {expanded && <span>{item.title}</span>}
                  </Link>
                )}
              </div>
            ))}
            
            {sectionIndex < SIDEBAR_ITEMS.length - 1 && (
              <Separator className="my-2 bg-primary-600 opacity-50" />
            )}
          </div>
        ))}
      </nav>
      
      <div className="absolute bottom-0 w-full border-t border-primary-600 p-4">
        <div className="flex items-center">
          <div className="h-9 w-9 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
            A
          </div>
          {expanded && (
            <div className="ml-3">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-primary-200">Administrator</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
