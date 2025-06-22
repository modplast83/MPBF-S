import React, { createContext, useContext, ReactNode } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';

interface DragDropContextType {
  handleDragEnd: (result: DropResult, handlers: Record<string, (result: DropResult) => void>) => void;
}

const DragDropContextProvider = createContext<DragDropContextType | null>(null);

interface DragDropProviderProps {
  children: ReactNode;
}

export function DragDropProvider({ children }: DragDropProviderProps) {
  const handleDragEnd = (result: DropResult, handlers: Record<string, (result: DropResult) => void>) => {
    // Extract the context ID from the droppable ID (format: "contextId:droppableId")
    const contextId = result.source.droppableId.split(':')[0];
    const handler = handlers[contextId];
    
    if (handler) {
      // Clean the result to remove context prefixes
      const cleanResult = {
        ...result,
        source: {
          ...result.source,
          droppableId: result.source.droppableId.split(':')[1] || result.source.droppableId
        },
        destination: result.destination ? {
          ...result.destination,
          droppableId: result.destination.droppableId.split(':')[1] || result.destination.droppableId
        } : null
      };
      
      handler(cleanResult);
    }
  };

  return (
    <DragDropContextProvider.Provider value={{ handleDragEnd }}>
      <DragDropContext onDragEnd={(result) => {
        // This will be handled by individual components registering their handlers
        const event = new CustomEvent('dragEnd', { detail: result });
        window.dispatchEvent(event);
      }}>
        {children}
      </DragDropContext>
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