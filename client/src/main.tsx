import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
// Import i18n configuration
import "./lib/i18n";
import { LanguageProvider } from "@/hooks/use-language";
import { AuthProvider } from "@/hooks/use-auth-v2";
import { HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <HelmetProvider>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </HelmetProvider>
    </LanguageProvider>
  </QueryClientProvider>
);
