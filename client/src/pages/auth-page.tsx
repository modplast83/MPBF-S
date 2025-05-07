import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useTranslation } from "react-i18next";
import { Redirect, useLocation } from "wouter";
import { Loader2, Globe } from "lucide-react";
// Import company logo
// Use inline image to avoid import issues
const companyLogo = "/assets/company-logo.png";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(2, "Role is required"),
  sectionId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage, isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Effect to redirect to Replit Auth when the page loads
  useEffect(() => {
    // If not authenticated, redirect to Replit Auth login
    if (!isLoading && !isAuthenticated) {
      console.log("Auth page: User not authenticated, redirecting to Replit Auth");
      const redirectUrl = "/api/login";
      // Store current URL or intended destination to redirect back after login
      const currentUrl = window.location.pathname;
      if (currentUrl !== "/auth") {
        sessionStorage.setItem("redirectAfterLogin", currentUrl);
      }
      
      // Add a small delay to make sure the redirect doesn't happen too fast during debugging
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 300);
    } else if (isAuthenticated) {
      console.log("Auth page: User is already authenticated");
    } else {
      console.log("Auth page: Still checking authentication status");
    }
  }, [isLoading, isAuthenticated]);

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/";
    return <Redirect to={redirectPath} />;
  }
  
  // Show loading state while checking authentication or redirecting
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* Login Form Column */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 flex flex-col items-center">
            <div className="flex justify-end w-full">
              {/* Language Switcher */}
              <div className="inline-flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-3 py-1 rounded-r-none ${language === "en" ? "bg-secondary-100" : ""}`}
                  onClick={() => setLanguage("en")}
                >
                  {t("language.en")}
                </Button>
                <span className="h-5 border-l" />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`px-3 py-1 rounded-l-none ${language === "ar" ? "bg-secondary-100" : ""}`}
                  onClick={() => setLanguage("ar")}
                >
                  {t("language.ar")}
                </Button>
              </div>
            </div>
            <img src={companyLogo} alt="MPBF Logo" className="h-20 mb-4" />
            <CardTitle className="text-3xl font-bold">{t("auth.welcome")}</CardTitle>
            <CardDescription>
              {t("auth.sign_in_description")}
            </CardDescription>
          </CardHeader>
          <CardContent className={isRTL ? 'rtl' : ''}>
            <div className="text-center space-y-6 p-4">
              <p className="text-lg text-muted-foreground">
                {t("auth.redirecting_to_login")}
              </p>
              <Button 
                className="w-full"
                onClick={() => window.location.href = "/api/login"}
              >
                {t("auth.login_with_replit")}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-xs text-center text-gray-500">
              <p>
                {t("auth.secure_login_message")}
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Hero Column */}
      <div className="hidden lg:flex flex-1 bg-primary text-primary-foreground p-12 items-center justify-center">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-6">{t("app.full_title")}</h1>
          <h2 className="text-2xl font-semibold mb-4">{t("auth.production_system")}</h2>
          <p className="text-xl mb-6">
            {t("auth.system_description")}
          </p>
          <ul className={`space-y-2 text-lg ${isRTL ? 'rtl text-right' : ''}`}>
            <li className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className={isRTL ? 'ml-2' : 'mr-2'}>✓</span> {t("auth.feature_tracking")}
            </li>
            <li className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className={isRTL ? 'ml-2' : 'mr-2'}>✓</span> {t("auth.feature_roll")}
            </li>
            <li className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className={isRTL ? 'ml-2' : 'mr-2'}>✓</span> {t("auth.feature_quality")}
            </li>
            <li className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className={isRTL ? 'ml-2' : 'mr-2'}>✓</span> {t("auth.feature_customer")}
            </li>
            <li className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <span className={isRTL ? 'ml-2' : 'mr-2'}>✓</span> {t("auth.feature_production")}
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}