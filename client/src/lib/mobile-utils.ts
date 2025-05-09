/**
 * Utility functions for handling mobile-responsive design
 */

import { cn } from "./utils";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * Generate responsive class names for padding or margins
 */
export function responsiveSpacing(options: {
  type: "p" | "m"; // padding or margin
  sides?: "x" | "y" | "t" | "r" | "b" | "l" | "all";
  mobile: number;
  desktop: number;
}) {
  const { type, sides = "all", mobile, desktop } = options;
  
  // Use a specific type-safe approach
  let className: string;
  
  if (sides === "all") {
    className = `${type}-${mobile} sm:${type}-${desktop}`;
  } else {
    className = `${type}${sides}-${mobile} sm:${type}${sides}-${desktop}`;
  }
  
  return className;
}

/**
 * Generate responsive text size classes
 */
export function responsiveText(options: {
  mobile: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  desktop: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  weight?: "normal" | "medium" | "semibold" | "bold";
}) {
  const { mobile, desktop, weight } = options;
  
  let classes = `text-${mobile} sm:text-${desktop}`;
  
  if (weight) {
    classes += ` font-${weight}`;
  }
  
  return classes;
}

/**
 * Hook to get responsive class names based on the current viewport
 */
export function useResponsiveClasses() {
  const isMobile = useIsMobile();
  
  return {
    /**
     * Returns mobile or desktop classes based on viewport
     */
    getClasses: (mobileClasses: string, desktopClasses: string, commonClasses: string = "") => {
      return cn(commonClasses, isMobile ? mobileClasses : desktopClasses);
    },
    
    /**
     * Returns responsive padding classes
     */
    padding: (mobilePadding: number, desktopPadding: number, sides: "x" | "y" | "t" | "r" | "b" | "l" | "all" = "all") => {
      return responsiveSpacing({
        type: "p",
        sides,
        mobile: mobilePadding,
        desktop: desktopPadding
      });
    },
    
    /**
     * Returns responsive margin classes
     */
    margin: (mobileMargin: number, desktopMargin: number, sides: "x" | "y" | "t" | "r" | "b" | "l" | "all" = "all") => {
      return responsiveSpacing({
        type: "m",
        sides,
        mobile: mobileMargin,
        desktop: desktopMargin
      });
    },
    
    /**
     * Returns responsive text size and weight classes
     */
    text: (
      mobileSize: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl",
      desktopSize: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl",
      weight?: "normal" | "medium" | "semibold" | "bold"
    ) => {
      return responsiveText({
        mobile: mobileSize,
        desktop: desktopSize,
        weight
      });
    },
    
    /**
     * Returns touch-friendly size for UI elements
     */
    touchSize: () => {
      return isMobile ? "lg" : "default";
    },
    
    isMobile
  };
}