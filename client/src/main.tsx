import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
// Import i18n configuration
import "./lib/i18n";
import { LanguageProvider } from "@/hooks/use-language";
import { HelmetProvider } from "react-helmet-async";
import { SimpleCombinedApp } from "./simple-combined-app";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <HelmetProvider>
        <SimpleCombinedApp />
        <Toaster />
      </HelmetProvider>
    </LanguageProvider>
  </QueryClientProvider>
);
