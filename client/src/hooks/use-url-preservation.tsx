import { useEffect } from 'react';
import { useLocation } from 'wouter';

const INTENDED_URL_KEY = 'intended_url';
const AUTH_PAGE = '/auth';

export function useUrlPreservation() {
  const [location] = useLocation();

  // Save the current URL if it's not the auth page
  const saveIntendedUrl = (url: string) => {
    if (url !== AUTH_PAGE && url !== '/') {
      localStorage.setItem(INTENDED_URL_KEY, url);
    }
  };

  // Get the saved intended URL
  const getIntendedUrl = (): string | null => {
    return localStorage.getItem(INTENDED_URL_KEY);
  };

  // Clear the saved intended URL
  const clearIntendedUrl = () => {
    localStorage.removeItem(INTENDED_URL_KEY);
  };

  // Check if we should preserve the current URL
  const shouldPreserveUrl = (currentUrl: string): boolean => {
    return currentUrl !== AUTH_PAGE && 
           currentUrl !== '/' && 
           !currentUrl.startsWith('/auth');
  };

  return {
    saveIntendedUrl,
    getIntendedUrl,
    clearIntendedUrl,
    shouldPreserveUrl,
    currentLocation: location
  };
}