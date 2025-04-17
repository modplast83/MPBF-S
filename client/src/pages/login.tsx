import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { user, login } = useAuth();

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(username, password);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-50 p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 shadow-xl bg-white rounded-xl overflow-hidden">
        <div className="p-6 flex flex-col justify-center">
          <Card className="border-0 shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username"
                    type="text"
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
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-start border-t pt-4">
              <p className="text-sm text-secondary-500">
                Demo Credentials:
              </p>
              <p className="text-xs text-secondary-500">
                Username: <span className="font-mono">admin</span>
              </p>
              <p className="text-xs text-secondary-500">
                Password: <span className="font-mono">admin</span>
              </p>
            </CardFooter>
          </Card>
        </div>
        <div className="hidden md:block bg-gradient-to-br from-blue-800 to-blue-600 text-white p-10 flex flex-col justify-center">
          <div className="text-center mb-6">
            <img 
              src="/assets/company-logo.png" 
              alt="Modern Plastic Bag Factory" 
              className="w-32 h-32 mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold mb-4">
            Production Management System
          </h2>
          <p className="text-blue-100 mb-4">
            A comprehensive solution for managing all aspects of your 
            plastic bag manufacturing process from order to delivery.
          </p>
          <ul className="space-y-2 text-blue-100">
            <li className="flex items-center">
              <span className="material-icons mr-2 text-blue-300">check_circle</span>
              Order Management
            </li>
            <li className="flex items-center">
              <span className="material-icons mr-2 text-blue-300">check_circle</span>
              Production Workflow
            </li>
            <li className="flex items-center">
              <span className="material-icons mr-2 text-blue-300">check_circle</span>
              Quality Control
            </li>
            <li className="flex items-center">
              <span className="material-icons mr-2 text-blue-300">check_circle</span>
              Real-time Status Tracking
            </li>
            <li className="flex items-center">
              <span className="material-icons mr-2 text-blue-300">check_circle</span>
              Comprehensive Reporting
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}