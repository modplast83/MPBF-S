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

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    // Close sidebar on mobile after navigation
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
            <ul className="space-y-2">
              <li>
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
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('orders')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  Orders
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('production')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10m-6 10V4M6 20v-6"></path>
                  </svg>
                  Production
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('quality')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Quality
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('maintenance')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  Maintenance
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('reports')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  Reports
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('tools')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  Tools
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('setup')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
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
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('orders')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                  </svg>
                  Orders
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('production')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10m-6 10V4M6 20v-6"></path>
                  </svg>
                  Production
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('quality')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4"></polyline>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                  </svg>
                  Quality
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('maintenance')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  Maintenance
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('reports')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                  Reports
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('tools')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
                  <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                  </svg>
                  Tools
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigateTo('setup')}
                  className="w-full flex items-center p-2 rounded-md hover:bg-gray-100 text-left"
                >
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
          {/* Current page display */}
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
          
          {currentPage === 'orders' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Orders Management</h2>
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
                <Button>Create New Order</Button>
              </div>
            </div>
          )}
          
          {currentPage === 'maintenance' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Maintenance Dashboard</h2>
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
          
          {currentPage === 'quality' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Quality Control</h2>
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
          
          {currentPage === 'production' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Production Management</h2>
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
          
          {(currentPage === 'tools' || currentPage === 'setup') && (
            <div>
              <h2 className="text-2xl font-bold mb-6">{currentPage === 'tools' ? 'Tools' : 'Setup'}</h2>
              <p className="text-gray-500 mb-4">This page is under construction.</p>
              <Button onClick={() => navigateTo('dashboard')}>Return to Dashboard</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}