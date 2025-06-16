import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth-v2';
import { 
  Settings, 
  Plus, 
  Eye, 
  EyeOff, 
  Move, 
  Trash2,
  LayoutGrid,
  Save,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { WidgetLibrary } from './widget-library';
import { WidgetRenderer } from './widget-renderer';
import { DashboardWidget } from '@shared/schema';

interface DashboardPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface WidgetItem extends DashboardWidget {
  position: DashboardPosition;
}

interface DragDropDashboardProps {
  layoutName?: string;
  onLayoutChange?: (widgets: WidgetItem[]) => void;
}

export function DragDropDashboard({ layoutName = 'default', onLayoutChange }: DragDropDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
  const [widgets, setWidgets] = useState<WidgetItem[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch user's dashboard widgets
  const { data: userWidgets, isLoading } = useQuery({
    queryKey: ['/api/dashboard-widgets', user?.id, layoutName],
    enabled: !!user?.id,
  });

  // Save dashboard layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (widgets: WidgetItem[]) => {
      const response = await fetch('/api/dashboard-widgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          layoutName,
          widgets: widgets.map(w => ({
            widgetType: w.widgetType,
            widgetConfig: w.widgetConfig,
            position: w.position,
            isVisible: w.isVisible
          }))
        })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Dashboard layout saved successfully' });
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-widgets'] });
    },
    onError: () => {
      toast({ title: 'Failed to save dashboard layout', variant: 'destructive' });
    }
  });

  // Initialize widgets from API data
  useEffect(() => {
    if (Array.isArray(userWidgets) && userWidgets.length > 0) {
      setWidgets(userWidgets as WidgetItem[]);
    } else if (!isLoading && Array.isArray(userWidgets) && userWidgets.length === 0) {
      // Initialize with default widgets
      setWidgets(getDefaultWidgets());
    }
  }, [userWidgets, isLoading]);

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions based on new order
    const updatedWidgets = items.map((widget, index) => ({
      ...widget,
      position: {
        ...widget.position,
        y: Math.floor(index / 3) * 200, // 3 columns layout
        x: (index % 3) * 33.33
      }
    }));

    setWidgets(updatedWidgets);
    setHasUnsavedChanges(true);
    onLayoutChange?.(updatedWidgets);
  };

  // Add new widget
  const addWidget = (widgetType: string, config: any) => {
    const newWidget: WidgetItem = {
      id: Date.now(), // Temporary ID
      userId: user?.id || '',
      widgetType,
      widgetConfig: config,
      position: {
        x: (widgets.length % 3) * 33.33,
        y: Math.floor(widgets.length / 3) * 200,
        w: 33.33,
        h: 180
      },
      isVisible: true,
      dashboardLayout: layoutName,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setWidgets([...widgets, newWidget]);
    setHasUnsavedChanges(true);
    setShowWidgetLibrary(false);
  };

  // Remove widget
  const removeWidget = (widgetId: number) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
    setHasUnsavedChanges(true);
  };

  // Toggle widget visibility
  const toggleWidgetVisibility = (widgetId: number) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, isVisible: !w.isVisible } : w
    ));
    setHasUnsavedChanges(true);
  };

  // Save changes
  const saveChanges = () => {
    saveLayoutMutation.mutate(widgets);
  };

  // Reset to default
  const resetToDefault = () => {
    setWidgets(getDefaultWidgets());
    setHasUnsavedChanges(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dashboard Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Customizable Dashboard</h2>
          {hasUnsavedChanges && (
            <Badge variant="secondary">Unsaved changes</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWidgetLibrary(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Widget
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetToDefault}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              
              {hasUnsavedChanges && (
                <Button
                  size="sm"
                  onClick={saveChanges}
                  disabled={saveLayoutMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {saveLayoutMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              )}
            </>
          )}
          
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            <Settings className="h-4 w-4 mr-1" />
            {isEditMode ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-grid" direction="horizontal">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[400px] p-4 rounded-lg border-2 border-dashed transition-colors ${
                snapshot.isDraggingOver 
                  ? 'border-primary bg-primary/5' 
                  : isEditMode 
                    ? 'border-muted-foreground/30 bg-muted/20' 
                    : 'border-transparent'
              }`}
            >
              {widgets
                .filter(widget => widget.isVisible || isEditMode)
                .map((widget, index) => (
                <Draggable
                  key={widget.id}
                  draggableId={widget.id.toString()}
                  index={index}
                  isDragDisabled={!isEditMode}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`${
                        snapshot.isDragging ? 'rotate-2 scale-105' : ''
                      } transition-transform`}
                    >
                      <Card className={`relative ${
                        isEditMode ? 'ring-2 ring-primary/20' : ''
                      } ${!widget.isVisible ? 'opacity-50' : ''}`}>
                        {isEditMode && (
                          <div className="absolute top-2 right-2 z-10 flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => toggleWidgetVisibility(widget.id)}
                            >
                              {widget.isVisible ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => removeWidget(widget.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center h-6 w-6 cursor-move hover:bg-muted rounded"
                            >
                              <Move className="h-3 w-3" />
                            </div>
                          </div>
                        )}
                        
                        <CardContent className="p-4">
                          <WidgetRenderer
                            widgetType={widget.widgetType}
                            config={widget.widgetConfig}
                            isEditMode={isEditMode}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {/* Empty state for edit mode */}
              {isEditMode && widgets.filter(w => w.isVisible).length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No widgets yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add widgets to customize your dashboard
                  </p>
                  <Button onClick={() => setShowWidgetLibrary(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Your First Widget
                  </Button>
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Widget Library Modal */}
      {showWidgetLibrary && (
        <WidgetLibrary
          onAddWidget={addWidget}
          onClose={() => setShowWidgetLibrary(false)}
        />
      )}
    </div>
  );
}

// Default widget configuration
function getDefaultWidgets(): WidgetItem[] {
  return [
    {
      id: 1,
      userId: '',
      widgetType: 'stats-overview',
      widgetConfig: { title: 'Production Overview' },
      position: { x: 0, y: 0, w: 33.33, h: 180 },
      isVisible: true,
      dashboardLayout: 'default',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      userId: '',
      widgetType: 'recent-orders',
      widgetConfig: { title: 'Recent Orders', limit: 5 },
      position: { x: 33.33, y: 0, w: 33.33, h: 180 },
      isVisible: true,
      dashboardLayout: 'default',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      userId: '',
      widgetType: 'quality-metrics',
      widgetConfig: { title: 'Quality Metrics' },
      position: { x: 66.66, y: 0, w: 33.33, h: 180 },
      isVisible: true,
      dashboardLayout: 'default',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];
}