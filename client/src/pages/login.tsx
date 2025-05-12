import { FormEvent, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth-v2";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAuth();

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    setLocation('/');
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      if (username.trim() && password.trim()) {
        await login(username, password);
        // Login success is handled in the auth hook with proper redirect
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 overflow-hidden rounded-2xl shadow-2xl bg-white">
        {/* Left side - Login form */}
        <div className="p-8 flex flex-col justify-center relative">
          <Card className="border-0 shadow-none">
            <CardHeader className="space-y-1 p-0 mb-6">
              <div className="flex items-center mb-1">
                <span className="material-icons text-primary-600 mr-2">vpn_key</span>
                <CardTitle className="text-2xl font-bold text-gray-800">Welcome Back</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                Enter your credentials to access the system
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700">Username</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-icons">person</span>
                    <Input 
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 py-6 border-gray-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 rounded-lg"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700">Password</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-icons">lock</span>
                    <Input 
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 py-6 border-gray-200 focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 rounded-lg"
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-6 rounded-lg text-base font-medium transition-colors" 
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col items-start pt-6 p-0 mt-8 border-t border-gray-100">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm w-full">
                <div className="flex items-start">
                  <span className="material-icons text-blue-600 mr-2 mt-0.5">info</span>
                  <p>
                    <span className="font-medium">Note:</span> Enter your username and password to access the system.
                  </p>
                </div>
              </div>
            </CardFooter>
          </Card>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-primary-100 rounded-full opacity-70"></div>
          <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-primary-50 rounded-full opacity-70"></div>
        </div>
        
        {/* Right side - Features */}
        <div className="relative hidden md:flex flex-col justify-center bg-gradient-to-br from-primary-700 to-primary-800 text-white p-10 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600 rounded-full opacity-30 translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary-900 rounded-full opacity-20 -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="text-center mb-10">
              <img 
                src="/assets/company-logo.png" 
                alt="Modern Plastic Bag Factory" 
                className="w-40 h-40 mx-auto mb-6 drop-shadow-lg"
              />
              <h2 className="text-3xl font-bold mb-2 text-white">
                Production Management System
              </h2>
              <div className="h-1 w-20 bg-white/30 mx-auto rounded-full"></div>
            </div>
            
            {/* Features */}
            <p className="text-white/90 mb-8 text-center max-w-md mx-auto">
              A comprehensive solution for managing all aspects of your 
              plastic bag manufacturing process from order to delivery.
            </p>
            
            <ul className="space-y-4 text-white/90 max-w-md mx-auto">
              <li className="flex items-center bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <span className="material-icons mr-3 text-primary-200 bg-white/20 p-2 rounded-lg">receipt_long</span>
                <span>Complete Order Management System</span>
              </li>
              <li className="flex items-center bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <span className="material-icons mr-3 text-primary-200 bg-white/20 p-2 rounded-lg">precision_manufacturing</span>
                <span>Production Workflow Tracking</span>
              </li>
              <li className="flex items-center bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <span className="material-icons mr-3 text-primary-200 bg-white/20 p-2 rounded-lg">verified</span>
                <span>Quality Control Integration</span>
              </li>
              <li className="flex items-center bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <span className="material-icons mr-3 text-primary-200 bg-white/20 p-2 rounded-lg">insights</span>
                <span>Comprehensive Analytics & Reporting</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}