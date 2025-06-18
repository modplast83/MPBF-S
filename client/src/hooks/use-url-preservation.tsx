import { useCallback } from 'react';

const INTENDED_URL_KEY = 'intended_url';
const AUTH_PAGE = '/auth';

export function useUrlPreservation() {
  // Save the current URL if it's not the auth page
  const saveIntendedUrl = useCallback((url: string) => {
    if (url !== AUTH_PAGE && url !== '/') {
      localStorage.setItem(INTENDED_URL_KEY, url);
    }
  }, []);

  // Get the saved intended URL
  const getIntendedUrl = useCallback((): string | null => {
    return localStorage.getItem(INTENDED_URL_KEY);
  }, []);

  // Clear the saved intended URL
  const clearIntendedUrl = useCallback(() => {
    localStorage.removeItem(INTENDED_URL_KEY);
  }, []);

  // Check if we should preserve the current URL
  const shouldPreserveUrl = useCallback((currentUrl: string): boolean => {
    return currentUrl !== AUTH_PAGE && 
           currentUrl !== '/' && 
           !currentUrl.startsWith('/auth');
  }, []);

  return {
    saveIntendedUrl,
    getIntendedUrl,
    clearIntendedUrl,
    shouldPreserveUrl
  };
}