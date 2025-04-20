import React, { createContext, useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// Define available languages
export type Language = "en" | "ar";

// Language context type
type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
};

// Create language context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language provider props
interface LanguageProviderProps {
  children: React.ReactNode;
}

// Language provider component
export function LanguageProvider({ children }: LanguageProviderProps) {
  // Initialize language from localStorage or default to 'en'
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem("language") as Language) || "en"
  );
  const { i18n } = useTranslation();
  
  // Track if the current language is RTL
  const isRTL = language === "ar";

  // Function to set language
  const setLanguage = (newLanguage: Language) => {
    // Change language in i18next
    i18n.changeLanguage(newLanguage);
    // Store in localStorage
    localStorage.setItem("language", newLanguage);
    // Update state
    setLanguageState(newLanguage);
    // Update HTML lang and dir attributes
    updateHtmlAttributes(newLanguage);
  };
  
  // Function to toggle between available languages
  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ar" : "en";
    setLanguage(newLanguage);
  };
  
  // Function to update HTML document attributes
  const updateHtmlAttributes = (lang: Language) => {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute("lang", lang);
    htmlElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    
    // Add or remove RTL class on body for global styling
    if (lang === "ar") {
      document.body.classList.add("rtl");
    } else {
      document.body.classList.remove("rtl");
    }
  };
  
  // Initialize language on component mount
  useEffect(() => {
    // Make sure the language in state is applied
    setLanguage(language);
  }, []);
  
  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isRTL
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  
  return context;
}