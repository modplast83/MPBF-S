import { useState, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Menu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Import permissions provider wrapper for compatibility
import { PermissionsProvider } from "@/hooks/use-permissions";

// Page imports
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import Setup from "@/pages/setup";
import WorkflowPage from "@/pages/workflow";
import Products from "@/pages/setup/products";
import Customers from "@/pages/setup/customers";
import Categories from "@/pages/setup/categories";
import Items from "@/pages/setup/items";
import Sections from "@/pages/setup/sections";
import Users from "@/pages/setup/users";
import Machines from "@/pages/setup/machines";
import Orders from "@/pages/orders";
import WarehousePage from "@/pages/warehouse";
import ReportsPage from "@/pages/reports";
import RawMaterials from "@/pages/warehouse/raw-materials";
import FinalProducts from "@/pages/warehouse/final-products";
import QualityPage from "@/pages/quality";
import QualityCheckTypes from "@/pages/quality/check-types";
import QualityChecks from "@/pages/quality/checks";
import QualityViolations from "@/pages/quality/violations";
import CorrectiveActions from "@/pages/quality/corrective-actions";
import QualityPenalties from "@/pages/quality/penalties";
import Permissions from "@/pages/system/permissions";
import DatabasePage from "@/pages/system/database";
import ClichesPage from "@/pages/cliches";
import ToolsPage from "@/pages/tools";
import SMSManagement from "@/pages/system/sms";
import MixMaterials from "@/pages/production/mix-materials";
import ProductionPage from "@/pages/production";
import MaintenanceDashboard from "@/pages/maintenance";
import MaintenanceRequests from "@/pages/maintenance/requests";

export function IntegratedApp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, navigate] = useLocation();
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
    // Navigate to home after logout
    navigate("/");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    // Close sidebar on navigation (mobile only)
    setSidebarOpen(false);
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

  // Main application when logged in
  return (
    <div className="min-h-screen flex flex-col">
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
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigate("/")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/orders")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  Orders
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/production")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10m-6 10V4M6 20v-6"></path>
                  </svg>
                  Production
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/quality")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Quality
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/maintenance")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  Maintenance
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/reports")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  Reports
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/tools")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  Tools
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/setup")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Setup
                </button>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 bg-white shadow-lg overflow-y-auto">
          <nav className="p-4">
            <h2 className="text-lg font-semibold mb-4">Navigation</h2>
            <ul className="space-y-2">
              <li>
                <button onClick={() => handleNavigate("/")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                  </svg>
                  Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/orders")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  Orders
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/production")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10m-6 10V4M6 20v-6"></path>
                  </svg>
                  Production
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/quality")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Quality
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/maintenance")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  Maintenance
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/reports")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  Reports
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/tools")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  Tools
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate("/setup")} className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left">
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Setup
                </button>
              </li>
            </ul>
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
          <Switch>
            {/* Home route */}
            <Route path="/">
              <Dashboard />
            </Route>
            
            {/* Setup section */}
            <Route path="/setup">
              <Setup />
            </Route>
            <Route path="/setup/products">
              <Products />
            </Route>
            <Route path="/setup/customers">
              <Customers />
            </Route>
            <Route path="/setup/categories">
              <Categories />
            </Route>
            <Route path="/setup/items">
              <Items />
            </Route>
            <Route path="/setup/sections">
              <Sections />
            </Route>
            <Route path="/setup/users">
              <Users />
            </Route>
            <Route path="/setup/machines">
              <Machines />
            </Route>
            
            {/* Orders */}
            <Route path="/orders">
              <Orders />
            </Route>
            
            {/* Workflow */}
            <Route path="/workflow">
              <WorkflowPage />
            </Route>
            
            {/* Production */}
            <Route path="/production">
              <ProductionPage />
            </Route>
            <Route path="/production/mix-materials">
              <MixMaterials />
            </Route>
            
            {/* Warehouse */}
            <Route path="/warehouse">
              <WarehousePage />
            </Route>
            <Route path="/warehouse/raw-materials">
              <RawMaterials />
            </Route>
            <Route path="/warehouse/final-products">
              <FinalProducts />
            </Route>
            
            {/* Quality */}
            <Route path="/quality">
              <QualityPage />
            </Route>
            <Route path="/quality/check-types">
              <QualityCheckTypes />
            </Route>
            <Route path="/quality/checks">
              <QualityChecks />
            </Route>
            <Route path="/quality/violations">
              <QualityViolations />
            </Route>
            <Route path="/quality/corrective-actions">
              <CorrectiveActions />
            </Route>
            <Route path="/quality/penalties">
              <QualityPenalties />
            </Route>
            
            {/* Maintenance */}
            <Route path="/maintenance">
              <MaintenanceDashboard />
            </Route>
            <Route path="/maintenance/requests">
              <MaintenanceRequests />
            </Route>
            
            {/* Reports */}
            <Route path="/reports">
              <ReportsPage />
            </Route>
            
            {/* Tools */}
            <Route path="/tools">
              <ToolsPage />
            </Route>
            
            {/* Cliches */}
            <Route path="/cliches">
              <ClichesPage />
            </Route>
            
            {/* System settings */}
            <Route path="/system/permissions">
              <Permissions />
            </Route>
            <Route path="/system/database">
              <DatabasePage />
            </Route>
            <Route path="/system/sms">
              <SMSManagement />
            </Route>
            
            {/* Fallback route */}
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}