import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LoginApp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is logged in on component mount
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

  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Production Management System</h1>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </header>
        
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold mb-6">Welcome to Production Management System</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Dashboard Card */}
            <Card>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p>View production statistics and key metrics.</p>
                <Button className="mt-4 w-full" onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
            
            {/* Orders Card */}
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Manage customer orders and job orders.</p>
                <Button className="mt-4 w-full" onClick={() => window.location.href = '/orders'}>
                  View Orders
                </Button>
              </CardContent>
            </Card>
            
            {/* Production Card */}
            <Card>
              <CardHeader>
                <CardTitle>Production</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Track production processes and workflows.</p>
                <Button className="mt-4 w-full" onClick={() => window.location.href = '/production'}>
                  Production Status
                </Button>
              </CardContent>
            </Card>
            
            {/* Quality Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quality Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Manage quality checks and violations.</p>
                <Button className="mt-4 w-full" onClick={() => window.location.href = '/quality'}>
                  Quality Reports
                </Button>
              </CardContent>
            </Card>
            
            {/* Maintenance Card */}
            <Card>
              <CardHeader>
                <CardTitle>Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Track maintenance requests and schedules.</p>
                <Button className="mt-4 w-full" onClick={() => window.location.href = '/maintenance'}>
                  Maintenance Center
                </Button>
              </CardContent>
            </Card>
            
            {/* Reports Card */}
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Generate and view production reports.</p>
                <Button className="mt-4 w-full" onClick={() => window.location.href = '/reports'}>
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Login screen
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