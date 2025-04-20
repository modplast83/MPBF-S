import { useState } from "react";
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
import { Redirect } from "wouter";
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
  const [activeTab, setActiveTab] = useState("login");
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage, isRTL } = useLanguage();

  // Create login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Create registration form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      role: "user",
      sectionId: null,
      isActive: true,
    },
  });

  // Handle login form submission
  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }

  // Handle registration form submission
  function onRegisterSubmit(data: RegisterFormValues) {
    registerMutation.mutate(data);
  }

  // If user is already authenticated, redirect to home page
  if (user) {
    return <Redirect to="/" />;
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
            <Tabs
              defaultValue="login"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
                <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("auth.enter_username")} {...field} />
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
                              placeholder={t("auth.enter_password")}
                              {...field}
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
                          <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} /> {t("auth.logging_in")}
                        </>
                      ) : (
                        t("auth.login")
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Registration Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.username")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("auth.choose_username")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.full_name")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("auth.enter_full_name")} {...field} />
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
                              placeholder={t("auth.choose_password")}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("auth.role")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("auth.enter_role")} {...field} />
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
                          <Loader2 className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4 animate-spin`} /> {t("auth.registering")}
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
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-xs text-center text-gray-500">
              {activeTab === "login" ? (
                <p>
                  {t("auth.no_account")}{" "}
                  <Button
                    variant="link"
                    onClick={() => setActiveTab("register")}
                    className="p-0 h-auto"
                  >
                    {t("auth.register")}
                  </Button>
                </p>
              ) : (
                <p>
                  {t("auth.have_account")}{" "}
                  <Button
                    variant="link"
                    onClick={() => setActiveTab("login")}
                    className="p-0 h-auto"
                  >
                    {t("auth.login")}
                  </Button>
                </p>
              )}
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