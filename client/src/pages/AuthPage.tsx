import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth-v2";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// Import company logo
import companyLogo from "/assets/company-logo.png";

export default function AuthPage() {
  const { t } = useTranslation();
  const { language, setLanguage, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>("login");
  const { isAuthenticated, isLoading, login, register: registerUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Create validation schemas with translation function
  const loginSchema = z.object({
    username: z.string().min(1, t("auth.validation.username_required")),
    password: z.string().min(1, t("auth.validation.password_required")),
  });

  const registerSchema = z.object({
    username: z.string().min(3, t("auth.validation.username_min_length")),
    password: z.string().min(6, t("auth.validation.password_min_length")),
    confirmPassword: z.string().min(1, t("auth.validation.confirm_password_required")),
    email: z.string().optional().or(z.literal("")),
    firstName: z.string().optional().or(z.literal("")),
    lastName: z.string().optional().or(z.literal("")),
  }).refine(data => data.password === data.confirmPassword, {
    message: t("auth.validation.passwords_no_match"),
    path: ["confirmPassword"],
  });
  
  type LoginFormValues = z.infer<typeof loginSchema>;
  type RegisterFormValues = z.infer<typeof registerSchema>;
  
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

  const [, setLocation] = useLocation();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  async function onLoginSubmit(data: LoginFormValues) {
    try {
      setIsSubmitting(true);
      await login(data.username, data.password);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onRegisterSubmit(data: RegisterFormValues) {
    try {
      setIsSubmitting(true);
      const registerData = {
        username: data.username,
        password: data.password,
        email: data.email || undefined,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
      };
      await registerUser(registerData);
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render the auth form if already authenticated
  if (isAuthenticated) {
    return null;
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
            <CardTitle className="text-3xl font-bold">{t("welcome")}</CardTitle>
            <CardDescription>
              Welcome in MPBF Production System 
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
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
                              placeholder={t("Enter your username")}
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
                          <FormLabel>{t("Password")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("Enter your password")}
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("Logging in")}
                        </>
                      ) : (
                        t("Login")
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
                          <FormLabel>{t("Username")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("Username")}
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
                            <FormLabel>{t("First Name")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("Enter your first name")}
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
                            <FormLabel>{t("Last Name")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("Enter your last name")}
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
                          <FormLabel>{t("Email")}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder={t("Enter your email")}
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
                          <FormLabel>{t("Password")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("Enter your password")}
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
                          <FormLabel>{t("Confirm Password")}</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("Enter your password again")}
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
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
      <div className={`hidden md:flex flex-1 bg-gradient-to-r from-primary to-primary-600 text-white p-12 flex-col justify-center ${isRTL ? 'text-right' : 'text-left'}`}>
        <div className="max-w-md mx-auto space-y-6 flex flex-col items-center text-center">
          <img src={companyLogo} alt="MPBF Logo" className="h-32 w-32 mb-6" />
          <h1 className="text-4xl font-bold">Modern Plastic Bag Factory</h1>
          <h2 className="text-2xl font-semibold">MPBF System</h2>
          <p className="text-xl leading-relaxed">Production Management System</p>
        </div>
      </div>
    </div>
  );
}