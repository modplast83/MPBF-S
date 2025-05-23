import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function SimpleCombinedApp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [subPage, setSubPage] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in on mount
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      // Simple login for development
      if (username && password) {
        // Store login state in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        localStorage.setItem('role', 'Admin');
        
        toast({
          title: "Login successful",
          description: `Welcome, ${username}!`,
        });
        
        // Update state
        setIsLoggedIn(true);
      } else {
        throw new Error("Please enter both username and password");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setIsLoggedIn(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const navigateTo = (page: string, sub: string = "") => {
    // Update the current page and subpage
    setCurrentPage(page);
    setSubPage(sub);
    
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
    
    // For debugging purposes - helps track navigation flow
    console.log(`Navigation: ${page}${sub ? '/' + sub : ''}`);
  };

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Login to Production System</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-sm">
                <p>
                  <strong>Note:</strong> Enter any username and password to log in for development.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard view when logged in
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden mr-2"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">Production Management System</h1>
        </div>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:hidden top-16 bottom-0 left-0 w-64 bg-white shadow-lg z-50 transition-transform duration-300 ease-in-out overflow-y-auto`}>
          <nav className="p-4">
            <h2 className="text-lg font-semibold mb-4">Navigation</h2>
            <div className="space-y-4">
              <div>
                <button 
                  onClick={() => navigateTo('dashboard')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  Dashboard
                </button>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  Orders
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('orders', 'list')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Order List
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('orders', 'create')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      New Order
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('orders', 'job')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Job Orders
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10m-6 10V4M6 20v-6"></path>
                  </svg>
                  Production
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('production', 'dashboard')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('production', 'mix')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Mix Materials
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('production', 'extrusion')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Extrusion
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('production', 'printing')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Printing
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('production', 'cutting')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Cutting
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Quality
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('quality', 'dashboard')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('quality', 'checks')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Quality Checks
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('quality', 'violations')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Violations
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('quality', 'actions')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Corrective Actions
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  Maintenance
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('maintenance', 'dashboard')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('maintenance', 'requests')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Requests
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('maintenance', 'schedule')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Schedule
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('maintenance', 'spare-parts')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Spare Parts
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <button 
                  onClick={() => navigateTo('workflow')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"></path>
                  </svg>
                  Workflow
                </button>
              </div>
              
              <div>
                <button 
                  onClick={() => navigateTo('cliches')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                  </svg>
                  Cliches
                </button>
              </div>
              
              <div>
                <button 
                  onClick={() => navigateTo('reports')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  Reports
                </button>
              </div>
              
              <div>
                <button 
                  onClick={() => navigateTo('tools')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 7.63v14"></path>
                    <path d="M10 7.63v14"></path>
                    <path d="M6 7.63v14"></path>
                    <path d="M18 7.63v14"></path>
                    <path d="M4 4.63h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2Z"></path>
                  </svg>
                  Tools
                </button>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Setup
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('setup', 'products')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Products
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('setup', 'customers')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Customers
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('setup', 'categories')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Categories
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('setup', 'machines')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Machines
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('setup', 'users')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Users
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path>
                  </svg>
                  System
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('system', 'permissions')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Permissions
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('system', 'database')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Database
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('system', 'sms')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      SMS Management
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('system', 'settings')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Settings
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </div>
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white shadow-lg overflow-y-auto">
          <nav className="p-4">
            <h2 className="text-lg font-semibold mb-4">Navigation</h2>
            <div className="space-y-4">
              <div>
                <button 
                  onClick={() => navigateTo('dashboard')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  Dashboard
                </button>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  Orders
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('orders', 'list')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Order List
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('orders', 'create')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      New Order
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('orders', 'job')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Job Orders
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10m-6 10V4M6 20v-6"></path>
                  </svg>
                  Production
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('production', 'dashboard')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('production', 'mix')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Mix Materials
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('production', 'extrusion')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Extrusion
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('production', 'printing')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Printing
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('production', 'cutting')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Cutting
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Quality
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('quality', 'dashboard')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('quality', 'checks')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Quality Checks
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('quality', 'violations')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Violations
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('quality', 'actions')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Corrective Actions
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  Maintenance
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('maintenance', 'dashboard')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Dashboard
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('maintenance', 'requests')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Requests
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('maintenance', 'schedule')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Schedule
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('maintenance', 'spare-parts')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Spare Parts
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <button 
                  onClick={() => navigateTo('workflow')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"></path>
                  </svg>
                  Workflow
                </button>
              </div>
              
              <div>
                <button 
                  onClick={() => navigateTo('cliches')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                  </svg>
                  Cliches
                </button>
              </div>
              
              <div>
                <button 
                  onClick={() => navigateTo('reports')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  Reports
                </button>
              </div>
              
              <div>
                <button 
                  onClick={() => navigateTo('tools')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 7.63v14"></path>
                    <path d="M10 7.63v14"></path>
                    <path d="M6 7.63v14"></path>
                    <path d="M18 7.63v14"></path>
                    <path d="M4 4.63h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2Z"></path>
                  </svg>
                  Tools
                </button>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Setup
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('setup', 'products')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Products
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('setup', 'customers')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Customers
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('setup', 'categories')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Categories
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('setup', 'machines')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Machines
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('setup', 'users')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Users
                    </button>
                  </li>
                </ul>
              </div>
              
              <div>
                <div className="flex items-center p-2 text-sm font-medium text-gray-600 border-b">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"></path>
                  </svg>
                  System
                </div>
                <ul className="pl-7 mt-1 space-y-1">
                  <li>
                    <button 
                      onClick={() => navigateTo('system', 'permissions')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Permissions
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('system', 'database')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Database
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('system', 'sms')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      SMS Management
                    </button>
                  </li>
                  <li>
                    <button 
                      onClick={() => navigateTo('system', 'settings')}
                      className="w-full text-left p-1 text-sm hover:bg-gray-100 rounded"
                    >
                      Settings
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </div>
        
        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={toggleSidebar}
          ></div>
        )}
        
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Dashboard */}
          {currentPage === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Active Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">42</p>
                    <p className="text-sm text-gray-500">O #: Orders | JO #: Job Orders</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Production Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">85%</p>
                    <p className="text-sm text-gray-500">Efficiency Rate</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Quality Check</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">97%</p>
                    <p className="text-sm text-gray-500">Pass Rate</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Orders Module */}
          {currentPage === 'orders' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Orders Management
                {subPage && <span className="text-gray-500 ml-2">/ {subPage.charAt(0).toUpperCase() + subPage.slice(1)}</span>}
              </h2>
              
              {/* Orders List */}
              {(!subPage || subPage === 'list') && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Recent Orders</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto text-left">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2">O #</th>
                            <th className="p-2">Customer</th>
                            <th className="p-2">JO Counts</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2">1001</td>
                            <td className="p-2">ABC Company</td>
                            <td className="p-2">3</td>
                            <td className="p-2">2025-05-20</td>
                            <td className="p-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">1002</td>
                            <td className="p-2">XYZ Industries</td>
                            <td className="p-2">5</td>
                            <td className="p-2">2025-05-21</td>
                            <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Processing</span></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">1003</td>
                            <td className="p-2">123 Enterprises</td>
                            <td className="p-2">2</td>
                            <td className="p-2">2025-05-22</td>
                            <td className="p-2"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">Pending</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <Button onClick={() => navigateTo('orders', 'create')}>Create New Order</Button>
                </div>
              )}
              
              {/* Create Order Form */}
              {subPage === 'create' && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Create New Order</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customer">Customer</Label>
                        <Input id="customer" placeholder="Select customer" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orderDate">Order Date</Label>
                        <Input id="orderDate" type="date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryAddress">Delivery Address</Label>
                      <Input id="deliveryAddress" placeholder="Enter delivery address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Order Notes</Label>
                      <Input id="notes" placeholder="Any special instructions" />
                    </div>
                    <div className="flex space-x-2">
                      <Button>Save Order</Button>
                      <Button variant="outline" onClick={() => navigateTo('orders', 'list')}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Job Orders */}
              {subPage === 'job' && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Job Orders</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto text-left">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2">JO #</th>
                          <th className="p-2">Related O #</th>
                          <th className="p-2">Product</th>
                          <th className="p-2">Quantity</th>
                          <th className="p-2">Stage</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">JO-2025-001</td>
                          <td className="p-2">1001</td>
                          <td className="p-2">Heavy-duty bags</td>
                          <td className="p-2">5,000</td>
                          <td className="p-2">Extrusion</td>
                          <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">In Progress</span></td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">JO-2025-002</td>
                          <td className="p-2">1001</td>
                          <td className="p-2">Medium bags</td>
                          <td className="p-2">8,000</td>
                          <td className="p-2">Printing</td>
                          <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">In Progress</span></td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">JO-2025-003</td>
                          <td className="p-2">1002</td>
                          <td className="p-2">Biodegradable bags</td>
                          <td className="p-2">10,000</td>
                          <td className="p-2">Cutting</td>
                          <td className="p-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Production Module */}
          {currentPage === 'production' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Production Management
                {subPage && <span className="text-gray-500 ml-2">/ {subPage.charAt(0).toUpperCase() + subPage.slice(1)}</span>}
              </h2>
              
              {/* Production Dashboard */}
              {(!subPage || subPage === 'dashboard') && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Active Production</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">12</p>
                        <p className="text-sm text-gray-500">Job orders in progress</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Today's Output</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">24,520</p>
                        <p className="text-sm text-gray-500">Units produced</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Efficiency</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">85%</p>
                        <p className="text-sm text-gray-500">Overall efficiency rate</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Production Schedule</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto text-left">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2">JO #</th>
                            <th className="p-2">Product</th>
                            <th className="p-2">Quantity</th>
                            <th className="p-2">Stage</th>
                            <th className="p-2">Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2">JO #1042</td>
                            <td className="p-2">Heavy-duty shopping bags</td>
                            <td className="p-2">5,000</td>
                            <td className="p-2">Extrusion</td>
                            <td className="p-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                              </div>
                              <span className="text-xs text-gray-500">45%</span>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">JO #1043</td>
                            <td className="p-2">Biodegradable produce bags</td>
                            <td className="p-2">10,000</td>
                            <td className="p-2">Printing</td>
                            <td className="p-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                              </div>
                              <span className="text-xs text-gray-500">75%</span>
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">JO #1044</td>
                            <td className="p-2">Custom logo bags</td>
                            <td className="p-2">2,500</td>
                            <td className="p-2">Cutting</td>
                            <td className="p-2">
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                              </div>
                              <span className="text-xs text-gray-500">90%</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Production Mix Materials */}
              {subPage === 'mix' && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Mix Materials</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mixCode">Mix Code</Label>
                        <Input id="mixCode" placeholder="Enter mix code" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mixName">Mix Name</Label>
                        <Input id="mixName" placeholder="Enter mix name" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Material Components</Label>
                      <div className="border p-4 rounded-md">
                        <table className="w-full mb-2">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Material</th>
                              <th className="text-left p-2">Percentage</th>
                              <th className="text-left p-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-2">HDPE Virgin</td>
                              <td className="p-2">70%</td>
                              <td className="p-2">
                                <Button variant="ghost" size="sm">Edit</Button>
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">Recycled PE</td>
                              <td className="p-2">25%</td>
                              <td className="p-2">
                                <Button variant="ghost" size="sm">Edit</Button>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2">Color Masterbatch</td>
                              <td className="p-2">5%</td>
                              <td className="p-2">
                                <Button variant="ghost" size="sm">Edit</Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <Button size="sm">Add Material</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input id="notes" placeholder="Any special instructions" />
                    </div>
                    <div className="flex space-x-2">
                      <Button>Save Mix</Button>
                      <Button variant="outline" onClick={() => navigateTo('production', 'dashboard')}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Other Production Stages */}
              {(subPage === 'extrusion' || subPage === 'printing' || subPage === 'cutting') && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">{subPage.charAt(0).toUpperCase() + subPage.slice(1)} Stage</h3>
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">JO #</th>
                          <th className="p-2 text-left">Product</th>
                          <th className="p-2 text-left">Quantity</th>
                          <th className="p-2 text-left">Machine</th>
                          <th className="p-2 text-left">Operator</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">JO-2025-001</td>
                          <td className="p-2">Heavy-duty bags</td>
                          <td className="p-2">5,000</td>
                          <td className="p-2">{subPage === 'extrusion' ? 'Extruder #2' : (subPage === 'printing' ? 'Printer #3' : 'Cutter #1')}</td>
                          <td className="p-2">John Doe</td>
                          <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">In Progress</span></td>
                          <td className="p-2">
                            <Button size="sm">View</Button>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">JO-2025-002</td>
                          <td className="p-2">Medium bags</td>
                          <td className="p-2">8,000</td>
                          <td className="p-2">{subPage === 'extrusion' ? 'Extruder #1' : (subPage === 'printing' ? 'Printer #2' : 'Cutter #2')}</td>
                          <td className="p-2">Jane Smith</td>
                          <td className="p-2"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">Pending</span></td>
                          <td className="p-2">
                            <Button size="sm">View</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <Button onClick={() => navigateTo('production', 'dashboard')}>Back to Dashboard</Button>
                </div>
              )}
            </div>
          )}
          
          {/* Quality Module */}
          {currentPage === 'quality' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Quality Control
                {subPage && <span className="text-gray-500 ml-2">/ {subPage.charAt(0).toUpperCase() + subPage.slice(1)}</span>}
              </h2>
              
              {/* Quality Dashboard */}
              {(!subPage || subPage === 'dashboard') && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Quality Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-3xl font-bold text-green-600">97%</p>
                            <p className="text-sm text-gray-500">Pass Rate</p>
                          </div>
                          <div>
                            <p className="text-3xl font-bold text-red-600">3%</p>
                            <p className="text-sm text-gray-500">Fail Rate</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Open Violations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">5</p>
                        <p className="text-sm text-gray-500">Requiring corrective action</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Today's Checks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">24</p>
                        <p className="text-sm text-gray-500">Completed quality checks</p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h3 className="text-lg font-semibold mb-2">Recent Quality Violations</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto text-left">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2">ID</th>
                            <th className="p-2">Job Order</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Reported By</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2">QV-2025-018</td>
                            <td className="p-2">JO #1042</td>
                            <td className="p-2">Color mismatch</td>
                            <td className="p-2">John Smith</td>
                            <td className="p-2"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Open</span></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">QV-2025-019</td>
                            <td className="p-2">JO #1043</td>
                            <td className="p-2">Seal integrity</td>
                            <td className="p-2">Maria Garcia</td>
                            <td className="p-2"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">In Review</span></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">QV-2025-020</td>
                            <td className="p-2">JO #1039</td>
                            <td className="p-2">Dimension error</td>
                            <td className="p-2">Ahmed Hassan</td>
                            <td className="p-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Resolved</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quality Checks */}
              {subPage === 'checks' && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Quality Checks</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jobOrder">Job Order</Label>
                        <Input id="jobOrder" placeholder="Select job order" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="checkType">Check Type</Label>
                        <Input id="checkType" placeholder="Select check type" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checklistItems">Checklist Items</Label>
                      <div className="border p-4 rounded-md space-y-2">
                        <div className="flex items-center">
                          <input type="checkbox" id="item1" className="mr-2" />
                          <Label htmlFor="item1">Dimensions match specifications</Label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="item2" className="mr-2" />
                          <Label htmlFor="item2">Color matches approved sample</Label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="item3" className="mr-2" />
                          <Label htmlFor="item3">Seal strength within tolerance</Label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="item4" className="mr-2" />
                          <Label htmlFor="item4">Print quality acceptable</Label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="item5" className="mr-2" />
                          <Label htmlFor="item5">No visual defects</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Input id="notes" placeholder="Any issues or observations" />
                    </div>
                    <div className="flex space-x-2">
                      <Button>Save Check</Button>
                      <Button variant="outline" onClick={() => navigateTo('quality', 'dashboard')}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Quality Violations */}
              {subPage === 'violations' && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Quality Violations</h3>
                  <div className="mb-4 overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">ID</th>
                          <th className="p-2 text-left">Date</th>
                          <th className="p-2 text-left">Job Order</th>
                          <th className="p-2 text-left">Type</th>
                          <th className="p-2 text-left">Reported By</th>
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">QV-2025-018</td>
                          <td className="p-2">2025-05-18</td>
                          <td className="p-2">JO #1042</td>
                          <td className="p-2">Color mismatch</td>
                          <td className="p-2">John Smith</td>
                          <td className="p-2"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Open</span></td>
                          <td className="p-2">
                            <Button size="sm" onClick={() => navigateTo('quality', 'actions')}>Action</Button>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">QV-2025-019</td>
                          <td className="p-2">2025-05-19</td>
                          <td className="p-2">JO #1043</td>
                          <td className="p-2">Seal integrity</td>
                          <td className="p-2">Maria Garcia</td>
                          <td className="p-2"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">In Review</span></td>
                          <td className="p-2">
                            <Button size="sm">View</Button>
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">QV-2025-020</td>
                          <td className="p-2">2025-05-20</td>
                          <td className="p-2">JO #1039</td>
                          <td className="p-2">Dimension error</td>
                          <td className="p-2">Ahmed Hassan</td>
                          <td className="p-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Resolved</span></td>
                          <td className="p-2">
                            <Button size="sm">View</Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <Button onClick={() => navigateTo('quality', 'dashboard')}>Back to Dashboard</Button>
                </div>
              )}
              
              {/* Corrective Actions */}
              {subPage === 'actions' && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Corrective Actions</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="violationId">Violation ID</Label>
                        <Input id="violationId" value="QV-2025-018" readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actionDate">Action Date</Label>
                        <Input id="actionDate" type="date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actionType">Action Type</Label>
                      <Input id="actionType" placeholder="Select action type" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actionTaken">Action Taken</Label>
                      <Input id="actionTaken" placeholder="Describe action taken" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preventiveMeasures">Preventive Measures</Label>
                      <Input id="preventiveMeasures" placeholder="Describe preventive measures" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responsible">Responsible Person</Label>
                      <Input id="responsible" placeholder="Select responsible person" />
                    </div>
                    <div className="flex space-x-2">
                      <Button>Save Action</Button>
                      <Button variant="outline" onClick={() => navigateTo('quality', 'violations')}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Maintenance Module */}
          {currentPage === 'maintenance' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Maintenance
                {subPage && <span className="text-gray-500 ml-2">/ {subPage.charAt(0).toUpperCase() + subPage.slice(1)}</span>}
              </h2>
              
              {/* Maintenance Dashboard */}
              {(!subPage || subPage === 'dashboard') && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Active Requests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">8</p>
                        <div className="mt-2 flex gap-2">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Critical: 2</span>
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">High: 3</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Medium: 3</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Machine Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between">
                          <div>
                            <p className="text-3xl font-bold text-green-600">12</p>
                            <p className="text-sm text-gray-500">Operational</p>
                          </div>
                          <div>
                            <p className="text-3xl font-bold text-red-600">3</p>
                            <p className="text-sm text-gray-500">Down</p>
                          </div>
                          <div>
                            <p className="text-3xl font-bold text-amber-600">2</p>
                            <p className="text-sm text-gray-500">Maintenance</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-2">Recent Maintenance Requests</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto text-left">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="p-2">ID</th>
                            <th className="p-2">Machine</th>
                            <th className="p-2">Issue</th>
                            <th className="p-2">Priority</th>
                            <th className="p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="p-2">MR-2025-042</td>
                            <td className="p-2">Extruder #3</td>
                            <td className="p-2">Temperature control malfunction</td>
                            <td className="p-2"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Critical</span></td>
                            <td className="p-2"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">In Progress</span></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">MR-2025-043</td>
                            <td className="p-2">Printing Machine #2</td>
                            <td className="p-2">Ink alignment issue</td>
                            <td className="p-2"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">High</span></td>
                            <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Assigned</span></td>
                          </tr>
                          <tr className="border-b">
                            <td className="p-2">MR-2025-044</td>
                            <td className="p-2">Cutting Machine #1</td>
                            <td className="p-2">Blade replacement needed</td>
                            <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Medium</span></td>
                            <td className="p-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Scheduled</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Maintenance Requests */}
              {subPage === 'requests' && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Maintenance Requests</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="machine">Machine</Label>
                        <Input id="machine" placeholder="Select machine" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Input id="priority" placeholder="Select priority" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="requestDate">Request Date</Label>
                        <Input id="requestDate" type="date" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="issue">Issue Description</Label>
                      <Input id="issue" placeholder="Describe the issue" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="requestedBy">Requested By</Label>
                      <Input id="requestedBy" placeholder="Enter your name" />
                    </div>
                    <div className="flex space-x-2">
                      <Button>Submit Request</Button>
                      <Button variant="outline" onClick={() => navigateTo('maintenance', 'dashboard')}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Other Maintenance Sections */}
              {(subPage === 'schedule' || subPage === 'spare-parts') && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">{subPage === 'schedule' ? 'Maintenance Schedule' : 'Spare Parts Inventory'}</h3>
                  {subPage === 'schedule' ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Machine</th>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Scheduled Date</th>
                              <th className="p-2 text-left">Assignee</th>
                              <th className="p-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-2">Extruder #1</td>
                              <td className="p-2">Preventive</td>
                              <td className="p-2">2025-06-15</td>
                              <td className="p-2">John Smith</td>
                              <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Scheduled</span></td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">Printing Machine #3</td>
                              <td className="p-2">Preventive</td>
                              <td className="p-2">2025-06-18</td>
                              <td className="p-2">Maria Garcia</td>
                              <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Scheduled</span></td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">Cutting Machine #2</td>
                              <td className="p-2">Preventive</td>
                              <td className="p-2">2025-06-20</td>
                              <td className="p-2">Ahmed Hassan</td>
                              <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Scheduled</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <Button onClick={() => navigateTo('maintenance', 'dashboard')}>Back to Dashboard</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Part ID</th>
                              <th className="p-2 text-left">Part Name</th>
                              <th className="p-2 text-left">Compatible Machines</th>
                              <th className="p-2 text-left">In Stock</th>
                              <th className="p-2 text-left">Reorder Level</th>
                              <th className="p-2 text-left">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-2">SP-001</td>
                              <td className="p-2">Heating Element</td>
                              <td className="p-2">Extruder #1, #2, #3</td>
                              <td className="p-2">5</td>
                              <td className="p-2">3</td>
                              <td className="p-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Sufficient</span></td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">SP-002</td>
                              <td className="p-2">Ink Cartridge (Black)</td>
                              <td className="p-2">Printing Machine #1, #2</td>
                              <td className="p-2">2</td>
                              <td className="p-2">4</td>
                              <td className="p-2"><span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Low Stock</span></td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">SP-003</td>
                              <td className="p-2">Cutting Blade</td>
                              <td className="p-2">Cutting Machine #1, #2, #3</td>
                              <td className="p-2">8</td>
                              <td className="p-2">5</td>
                              <td className="p-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Sufficient</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <Button onClick={() => navigateTo('maintenance', 'dashboard')}>Back to Dashboard</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Workflow Module */}
          {currentPage === 'workflow' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Workflow Management</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Active Workflows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">14</p>
                    <p className="text-sm text-gray-500">Currently running workflows</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Completed Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">7</p>
                    <p className="text-sm text-gray-500">Workflows completed today</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">92%</p>
                    <p className="text-sm text-gray-500">Overall workflow efficiency</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Current Workflows</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Job Order</th>
                        <th className="p-2 text-left">Current Stage</th>
                        <th className="p-2 text-left">Time in Stage</th>
                        <th className="p-2 text-left">Next Stage</th>
                        <th className="p-2 text-left">Overall Progress</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">JO #1042</td>
                        <td className="p-2">Extrusion</td>
                        <td className="p-2">4h 25m</td>
                        <td className="p-2">Printing</td>
                        <td className="p-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                          <span className="text-xs text-gray-500">45%</span>
                        </td>
                        <td className="p-2">
                          <Button size="sm">View</Button>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">JO #1043</td>
                        <td className="p-2">Printing</td>
                        <td className="p-2">2h 10m</td>
                        <td className="p-2">Cutting</td>
                        <td className="p-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                          </div>
                          <span className="text-xs text-gray-500">75%</span>
                        </td>
                        <td className="p-2">
                          <Button size="sm">View</Button>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">JO #1044</td>
                        <td className="p-2">Cutting</td>
                        <td className="p-2">1h 45m</td>
                        <td className="p-2">Quality Check</td>
                        <td className="p-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                          </div>
                          <span className="text-xs text-gray-500">90%</span>
                        </td>
                        <td className="p-2">
                          <Button size="sm">View</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {/* Cliches Module */}
          {currentPage === 'cliches' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Cliches Management</h2>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Cliches Inventory</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Cliche ID</th>
                        <th className="p-2 text-left">Customer</th>
                        <th className="p-2 text-left">Design Name</th>
                        <th className="p-2 text-left">Dimensions</th>
                        <th className="p-2 text-left">Status</th>
                        <th className="p-2 text-left">Last Used</th>
                        <th className="p-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">C-2025-001</td>
                        <td className="p-2">ABC Company</td>
                        <td className="p-2">Logo Design</td>
                        <td className="p-2">25cm x 15cm</td>
                        <td className="p-2"><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Available</span></td>
                        <td className="p-2">2025-05-15</td>
                        <td className="p-2">
                          <Button size="sm">View</Button>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">C-2025-002</td>
                        <td className="p-2">XYZ Industries</td>
                        <td className="p-2">Product Illustration</td>
                        <td className="p-2">30cm x 20cm</td>
                        <td className="p-2"><span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">In Use</span></td>
                        <td className="p-2">2025-05-20</td>
                        <td className="p-2">
                          <Button size="sm">View</Button>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">C-2025-003</td>
                        <td className="p-2">123 Enterprises</td>
                        <td className="p-2">Text Design</td>
                        <td className="p-2">15cm x 10cm</td>
                        <td className="p-2"><span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">Maintenance</span></td>
                        <td className="p-2">2025-05-10</td>
                        <td className="p-2">
                          <Button size="sm">View</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4">
                  <Button>Add New Cliche</Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Reports Module */}
          {currentPage === 'reports' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Production Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>
                        <Button variant="outline" className="w-full justify-start">Daily Production Summary</Button>
                      </li>
                      <li>
                        <Button variant="outline" className="w-full justify-start">Weekly Performance Report</Button>
                      </li>
                      <li>
                        <Button variant="outline" className="w-full justify-start">Monthly Output Analysis</Button>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>
                        <Button variant="outline" className="w-full justify-start">Quality Violations Summary</Button>
                      </li>
                      <li>
                        <Button variant="outline" className="w-full justify-start">Corrective Actions Report</Button>
                      </li>
                      <li>
                        <Button variant="outline" className="w-full justify-start">Quality Metrics Dashboard</Button>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>
                        <Button variant="outline" className="w-full justify-start">Equipment Downtime Analysis</Button>
                      </li>
                      <li>
                        <Button variant="outline" className="w-full justify-start">Maintenance Cost Report</Button>
                      </li>
                      <li>
                        <Button variant="outline" className="w-full justify-start">Preventive Maintenance Schedule</Button>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li>
                        <Button variant="outline" className="w-full justify-start">Cost Per Order Analysis</Button>
                      </li>
                      <li>
                        <Button variant="outline" className="w-full justify-start">Revenue by Product Type</Button>
                      </li>
                      <li>
                        <Button variant="outline" className="w-full justify-start">Profitability Report</Button>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Tools Module */}
          {currentPage === 'tools' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Unit Converter</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="from">From</Label>
                      <Input id="from" placeholder="Enter value" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fromUnit">Unit</Label>
                      <Input id="fromUnit" placeholder="Select unit" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toUnit">To Unit</Label>
                      <Input id="toUnit" placeholder="Select unit" />
                    </div>
                    <Button className="w-full">Convert</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Material Calculator</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="length">Length (m)</Label>
                      <Input id="length" placeholder="Enter length" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="width">Width (m)</Label>
                      <Input id="width" placeholder="Enter width" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thickness">Thickness (mm)</Label>
                      <Input id="thickness" placeholder="Enter thickness" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="density">Density (g/cm³)</Label>
                      <Input id="density" placeholder="Enter density" />
                    </div>
                    <Button className="w-full">Calculate Weight</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Production Time Estimator</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input id="quantity" placeholder="Enter quantity" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="machineSpeed">Machine Speed (units/hour)</Label>
                      <Input id="machineSpeed" placeholder="Enter speed" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="setupTime">Setup Time (minutes)</Label>
                      <Input id="setupTime" placeholder="Enter setup time" />
                    </div>
                    <Button className="w-full">Calculate Time</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          
          {/* Setup Module */}
          {currentPage === 'setup' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                Setup
                {subPage && <span className="text-gray-500 ml-2">/ {subPage.charAt(0).toUpperCase() + subPage.slice(1)}</span>}
              </h2>
              
              {/* Setup Dashboard */}
              {!subPage && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-3">Manage product catalog and specifications</p>
                      <Button className="w-full" size="sm" onClick={() => navigateTo('setup', 'products')}>
                        Manage Products
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-3">Manage customer accounts and details</p>
                      <Button className="w-full" size="sm" onClick={() => navigateTo('setup', 'customers')}>
                        Manage Customers
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-3">Manage product categories and classifications</p>
                      <Button className="w-full" size="sm" onClick={() => navigateTo('setup', 'categories')}>
                        Manage Categories
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Machines</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-3">Manage production machines and equipment</p>
                      <Button className="w-full" size="sm" onClick={() => navigateTo('setup', 'machines')}>
                        Manage Machines
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-3">Manage system users and access rights</p>
                      <Button className="w-full" size="sm" onClick={() => navigateTo('setup', 'users')}>
                        Manage Users
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Setup Subpages */}
              {subPage && (
                <div className="bg-white p-4 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">{subPage.charAt(0).toUpperCase() + subPage.slice(1)} Management</h3>
                  
                  <div className="flex justify-end mb-4">
                    <Button>Add New {subPage.slice(0, -1)}</Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">ID</th>
                          <th className="p-2 text-left">Name</th>
                          {subPage === 'products' && (
                            <>
                              <th className="p-2 text-left">Category</th>
                              <th className="p-2 text-left">Price</th>
                            </>
                          )}
                          {subPage === 'customers' && (
                            <>
                              <th className="p-2 text-left">Contact</th>
                              <th className="p-2 text-left">Email</th>
                            </>
                          )}
                          {subPage === 'machines' && (
                            <>
                              <th className="p-2 text-left">Type</th>
                              <th className="p-2 text-left">Status</th>
                            </>
                          )}
                          {subPage === 'users' && (
                            <>
                              <th className="p-2 text-left">Email</th>
                              <th className="p-2 text-left">Role</th>
                            </>
                          )}
                          <th className="p-2 text-left">Status</th>
                          <th className="p-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[1, 2, 3].map((item) => (
                          <tr key={item} className="border-b">
                            <td className="p-2">{`${subPage.slice(0, 3).toUpperCase()}-${1000 + item}`}</td>
                            <td className="p-2">{`Sample ${subPage.slice(0, -1)} ${item}`}</td>
                            {subPage === 'products' && (
                              <>
                                <td className="p-2">{`Category ${item}`}</td>
                                <td className="p-2">${(50 * item).toFixed(2)}</td>
                              </>
                            )}
                            {subPage === 'customers' && (
                              <>
                                <td className="p-2">{`John Doe ${item}`}</td>
                                <td className="p-2">{`contact${item}@example.com`}</td>
                              </>
                            )}
                            {subPage === 'machines' && (
                              <>
                                <td className="p-2">{item === 1 ? 'Extruder' : item === 2 ? 'Printer' : 'Cutter'}</td>
                                <td className="p-2">
                                  <span className={`px-2 py-1 ${item === 1 ? 'bg-green-100 text-green-800' : item === 2 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'} rounded-full text-xs`}>
                                    {item === 1 ? 'Active' : item === 2 ? 'Maintenance' : 'Idle'}
                                  </span>
                                </td>
                              </>
                            )}
                            {subPage === 'users' && (
                              <>
                                <td className="p-2">{`user${item}@example.com`}</td>
                                <td className="p-2">{item === 1 ? 'Admin' : item === 2 ? 'Manager' : 'Operator'}</td>
                              </>
                            )}
                            <td className="p-2">
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                            </td>
                            <td className="p-2">
                              <div className="flex space-x-2">
                                <Button size="sm">Edit</Button>
                                <Button size="sm" variant="outline">Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4">
                    <Button variant="outline" onClick={() => navigateTo('setup')}>Back to Setup</Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* System Module */}
          {currentPage === 'system' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">
                System Administration
                {subPage && <span className="text-gray-500 ml-2">/ {subPage.charAt(0).toUpperCase() + subPage.slice(1)}</span>}
              </h2>
              
              {/* System Dashboard */}
              {!subPage && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>Permissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500 mb-3">Manage user roles and permissions</p>
                      <Button className="w-full" onClick={() => navigateTo('system', 'permissions')}>
                        Manage Permissions
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>Database</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500 mb-3">Backup and restore database</p>
                      <Button className="w-full" onClick={() => navigateTo('system', 'database')}>
                        Manage Database
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>SMS Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500 mb-3">Manage SMS notifications and settings</p>
                      <Button className="w-full" onClick={() => navigateTo('system', 'sms')}>
                        Manage SMS
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>System Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-500 mb-3">Configure system-wide settings</p>
                      <Button className="w-full" onClick={() => navigateTo('system', 'settings')}>
                        Manage Settings
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* System Subpages */}
              {subPage && (
                <div className="bg-white p-4 rounded-lg shadow">
                  {subPage === 'permissions' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-2">Role & Permission Management</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Role</th>
                              <th className="p-2 text-left">Dashboard</th>
                              <th className="p-2 text-left">Orders</th>
                              <th className="p-2 text-left">Production</th>
                              <th className="p-2 text-left">Quality</th>
                              <th className="p-2 text-left">Maintenance</th>
                              <th className="p-2 text-left">Reports</th>
                              <th className="p-2 text-left">Setup</th>
                              <th className="p-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-2">Admin</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2">
                                <Button size="sm">Edit</Button>
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">Manager</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">-</td>
                              <td className="p-2">
                                <Button size="sm">Edit</Button>
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">Operator</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">View Only</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">✓</td>
                              <td className="p-2 text-center">View Only</td>
                              <td className="p-2 text-center">-</td>
                              <td className="p-2 text-center">-</td>
                              <td className="p-2">
                                <Button size="sm">Edit</Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-between">
                        <Button onClick={() => navigateTo('system')}>Back</Button>
                        <Button>Add New Role</Button>
                      </div>
                    </div>
                  )}
                  
                  {subPage === 'database' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-2">Database Management</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Backup Database</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-500 mb-3">Create a backup of the current database</p>
                            <Button className="w-full">Create Backup</Button>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle>Restore Database</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-500 mb-3">Restore from an existing backup</p>
                            <Input id="backupFile" type="file" className="mb-3" />
                            <Button className="w-full">Restore Backup</Button>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="bg-white p-4 rounded-lg border">
                        <h4 className="font-semibold mb-2">Backup History</h4>
                        <table className="w-full">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Date</th>
                              <th className="p-2 text-left">File Name</th>
                              <th className="p-2 text-left">Size</th>
                              <th className="p-2 text-left">Created By</th>
                              <th className="p-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-2">2025-05-22</td>
                              <td className="p-2">backup_20250522_083045.sql</td>
                              <td className="p-2">24.5 MB</td>
                              <td className="p-2">admin</td>
                              <td className="p-2">
                                <Button size="sm">Download</Button>
                              </td>
                            </tr>
                            <tr className="border-b">
                              <td className="p-2">2025-05-15</td>
                              <td className="p-2">backup_20250515_142230.sql</td>
                              <td className="p-2">23.8 MB</td>
                              <td className="p-2">admin</td>
                              <td className="p-2">
                                <Button size="sm">Download</Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <Button onClick={() => navigateTo('system')}>Back</Button>
                    </div>
                  )}
                  
                  {subPage === 'sms' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-2">SMS Management</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smsProvider">SMS Provider</Label>
                          <Input id="smsProvider" value="Twilio" readOnly />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apiKey">API Key</Label>
                          <Input id="apiKey" type="password" value="············" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="defaultSender">Default Sender Number</Label>
                        <Input id="defaultSender" value="+1234567890" />
                      </div>
                      <div className="space-y-2">
                        <Label>SMS Notifications</Label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input type="checkbox" id="notification1" className="mr-2" checked />
                            <Label htmlFor="notification1">Order status updates</Label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="notification2" className="mr-2" checked />
                            <Label htmlFor="notification2">Quality violations</Label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="notification3" className="mr-2" checked />
                            <Label htmlFor="notification3">Maintenance alerts</Label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="notification4" className="mr-2" />
                            <Label htmlFor="notification4">Daily production summary</Label>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button onClick={() => navigateTo('system')}>Back</Button>
                        <Button>Save Settings</Button>
                      </div>
                    </div>
                  )}
                  
                  {subPage === 'settings' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold mb-2">System Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="companyName">Company Name</Label>
                          <Input id="companyName" value="Plastic Bag Factory" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Timezone</Label>
                          <Input id="timezone" value="UTC+3" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dateFormat">Date Format</Label>
                          <Input id="dateFormat" value="YYYY-MM-DD" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="language">Default Language</Label>
                          <Input id="language" value="English" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>System Features</Label>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <input type="checkbox" id="feature1" className="mr-2" checked />
                            <Label htmlFor="feature1">Quality control module</Label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="feature2" className="mr-2" checked />
                            <Label htmlFor="feature2">Maintenance module</Label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="feature3" className="mr-2" checked />
                            <Label htmlFor="feature3">Reporting module</Label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="feature4" className="mr-2" checked />
                            <Label htmlFor="feature4">SMS notifications</Label>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <Button onClick={() => navigateTo('system')}>Back</Button>
                        <Button>Save Settings</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}