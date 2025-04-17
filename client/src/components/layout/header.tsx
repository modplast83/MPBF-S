import { useState, useEffect } from "react";
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

export default function Header() {
  const [location, setLocation] = useLocation();
  const [username, setUsername] = useState<string>("admin@mpbf.com");
  const { toast } = useToast();
  
  // Load username from localStorage if available
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);
  
  // Function to handle logout
  const handleLogout = () => {
    // Confirm logout
    if (confirm("Are you sure you want to log out?")) {
      // Remove login state
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      
      // Show toast notification
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Redirect to login page
      setLocation('/login');
    }
  };
  
  // Function to get current page title based on location
  const getCurrentPageTitle = () => {
    // First check for exact matches
    for (const section of SIDEBAR_ITEMS) {
      for (const item of section.items) {
        if (item.path === location) {
          return item.title;
        }
        
        // Check subItems if they exist
        if (item.subItems) {
          for (const subItem of item.subItems) {
            if (subItem.path === location) {
              return subItem.title;
            }
          }
        }
      }
    }
    
    // Check for path startsWith for nested routes
    for (const section of SIDEBAR_ITEMS) {
      for (const item of section.items) {
        if (location.startsWith(item.path) && item.path !== "/") {
          return item.title;
        }
        
        // Check subItems if they exist
        if (item.subItems) {
          for (const subItem of item.subItems) {
            if (location.startsWith(subItem.path)) {
              return subItem.title;
            }
          }
        }
      }
    }
    
    // Default to Dashboard
    return "Dashboard";
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center px-6 py-3">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-secondary-800">
            {getCurrentPageTitle()}
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon">
            <span className="material-icons text-secondary-600">notifications</span>
          </Button>
          <Button variant="ghost" size="icon">
            <span className="material-icons text-secondary-600">help_outline</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2">
                <span className="text-sm font-medium text-secondary-700">{username}</span>
                <span className="material-icons text-secondary-600 text-sm">arrow_drop_down</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <span className="material-icons mr-2 text-sm">person</span>
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="material-icons mr-2 text-sm">settings</span>
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout}>
                <span className="material-icons mr-2 text-sm">logout</span>
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
