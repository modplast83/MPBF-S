import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth-v2";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Import company logo
import companyLogo from "/assets/company-logo.png";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  email: z.string().email("Please enter a valid email").optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { isAuthenticated, isLoading, loginMutation, registerMutation } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, setLocation] = useLocation();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }

  function onRegisterSubmit(data: RegisterFormValues) {
    const { confirmPassword, ...registerData } = data;
    registerMutation.mutate(registerData);
  }

  // If user is already authenticated, redirect to dashboard
  if (isAuthenticated) {
    console.log("User already authenticated, redirecting to dashboard");
    // Use direct DOM navigation to avoid React Router issues
    window.location.href = "/";
    return null;
  }
  
  // Show loading state while checking authentication
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
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
                <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("auth.username_placeholder")}
                              {...field}
                              autoComplete="username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.password")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("auth.password_placeholder")}
                              {...field}
                              autoComplete="current-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("auth.logging_in")}
                        </>
                      ) : (
                        t("auth.login")
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register" className="space-y-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("auth.username_placeholder")}
                              {...field}
                              autoComplete="username"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth.first_name")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("auth.first_name_placeholder")}
                                {...field}
                                autoComplete="given-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("auth.last_name")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("auth.last_name_placeholder")}
                                {...field}
                                autoComplete="family-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.email")}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t("auth.email_placeholder")}
                              {...field}
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.password")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("auth.password_placeholder")}
                              {...field}
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.confirm_password")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("auth.confirm_password_placeholder")}
                              {...field}
                              autoComplete="new-password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("auth.registering")}
                        </>
                      ) : (
                        t("auth.register")
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Hero Section */}
      <div className="hidden md:flex flex-1 bg-gradient-to-r from-primary to-primary-600 text-white p-12 flex-col justify-center">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-4xl font-bold">{t("auth.hero_title")}</h1>
          <p className="text-xl leading-relaxed">{t("auth.hero_description")}</p>
          <div className="space-y-4 mt-8">
            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-xl">{t("auth.feature_1_title")}</h3>
                <p className="text-white/80 mt-1">{t("auth.feature_1_description")}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-xl">{t("auth.feature_2_title")}</h3>
                <p className="text-white/80 mt-1">{t("auth.feature_2_description")}</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="rounded-full bg-white/20 p-2 mr-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-xl">{t("auth.feature_3_title")}</h3>
                <p className="text-white/80 mt-1">{t("auth.feature_3_description")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}