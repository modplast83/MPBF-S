import React, { createContext, useContext, ReactNode } from 'react';

interface DragDropContextType {
  // Placeholder for future drag and drop functionality
  isEnabled: boolean;
}

const DragDropContextProvider = createContext<DragDropContextType | null>(null);

interface DragDropProviderProps {
  children: ReactNode;
}

export function DragDropProvider({ children }: DragDropProviderProps) {
  return (
    <DragDropContextProvider.Provider value={{ isEnabled: false }}>
      {children}
    </DragDropContextProvider.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContextProvider);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}