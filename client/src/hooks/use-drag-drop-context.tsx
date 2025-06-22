import { createContext, useContext, ReactNode } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';

interface DragDropContextType {
  handleDragEnd: (result: DropResult, contextId: string) => void;
  registerHandler: (contextId: string, handler: (result: DropResult) => void) => void;
  unregisterHandler: (contextId: string) => void;
}

const DragDropContextProvider = createContext<DragDropContextType | null>(null);

const dragHandlers = new Map<string, (result: DropResult) => void>();

export function GlobalDragDropProvider({ children }: { children: ReactNode }) {
  const handleDragEnd = (result: DropResult, contextId: string) => {
    const handler = dragHandlers.get(contextId);
    if (handler) {
      handler(result);
    }
  };

  const registerHandler = (contextId: string, handler: (result: DropResult) => void) => {
    dragHandlers.set(contextId, handler);
  };

  const unregisterHandler = (contextId: string) => {
    dragHandlers.delete(contextId);
  };

  const globalHandleDragEnd = (result: DropResult) => {
    // Determine which context this drag belongs to based on droppableId
    const droppableId = result.destination?.droppableId || result.source.droppableId;
    
    // Find the appropriate handler based on droppableId patterns
    if (droppableId.includes('dashboard')) {
      const handler = dragHandlers.get('dashboard');
      if (handler) handler(result);
    } else if (droppableId.includes('screw') || droppableId.includes('unassigned')) {
      const handler = dragHandlers.get('aba-materials');
      if (handler) handler(result);
    } else {
      // Default fallback - try all handlers until one handles it
      for (const [, handler] of dragHandlers) {
        handler(result);
        break; // Only use the first handler as fallback
      }
    }
  };

  return (
    <DragDropContextProvider.Provider value={{ handleDragEnd, registerHandler, unregisterHandler }}>
      <DragDropContext onDragEnd={globalHandleDragEnd}>
        {children}
      </DragDropContext>
    </DragDropContextProvider.Provider>
  );
}

export function useDragDropContext() {
  const context = useContext(DragDropContextProvider);
  if (!context) {
    throw new Error('useDragDropContext must be used within GlobalDragDropProvider');
  }
  return context;
}