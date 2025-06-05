import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

interface GestureAction {
  id: string;
  name: string;
  gesture: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  endpoint?: string;
}

const GESTURE_ACTIONS: GestureAction[] = [
  {
    id: 'start_production',
    name: 'Start Production',
    gesture: 'swipe_right',
    icon: <Play className="w-6 h-6" />,
    color: 'bg-green-500',
    description: 'Swipe right to start production',
    endpoint: '/api/production/start'
  },
  {
    id: 'pause_production',
    name: 'Pause Production',
    gesture: 'swipe_left',
    icon: <Pause className="w-6 h-6" />,
    color: 'bg-yellow-500',
    description: 'Swipe left to pause production',
    endpoint: '/api/production/pause'
  },
  {
    id: 'report_issue',
    name: 'Report Issue',
    gesture: 'swipe_up',
    icon: <AlertTriangle className="w-6 h-6" />,
    color: 'bg-red-500',
    description: 'Swipe up to report an issue',
    endpoint: '/api/issues'
  },
  {
    id: 'mark_complete',
    name: 'Mark Complete',
    gesture: 'swipe_down',
    icon: <CheckCircle className="w-6 h-6" />,
    color: 'bg-blue-500',
    description: 'Swipe down to mark task complete',
    endpoint: '/api/tasks/complete'
  },
  {
    id: 'quality_check',
    name: 'Quality Check',
    gesture: 'double_tap',
    icon: <XCircle className="w-6 h-6" />,
    color: 'bg-purple-500',
    description: 'Double tap for quality check',
    endpoint: '/api/quality-checks'
  },
  {
    id: 'reset_machine',
    name: 'Reset Machine',
    gesture: 'long_press',
    icon: <RotateCcw className="w-6 h-6" />,
    color: 'bg-orange-500',
    description: 'Long press to reset machine',
    endpoint: '/api/machines/reset'
  }
];

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export function GestureInterface() {
  const [isActive, setIsActive] = useState(false);
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const gestureAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Touch tracking state
  const [touchStart, setTouchStart] = useState<TouchPoint | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchPoint | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const doubleTapTimer = useRef<NodeJS.Timeout>();

  // Mutation for executing actions
  const executeActionMutation = useMutation({
    mutationFn: async ({ actionId, payload }: { actionId: string; payload?: any }) => {
      const action = GESTURE_ACTIONS.find(a => a.id === actionId);
      if (!action?.endpoint) return;
      
      return apiRequest('POST', action.endpoint, payload || {
        timestamp: new Date().toISOString(),
        source: 'gesture_interface'
      });
    },
    onSuccess: (data, variables) => {
      const action = GESTURE_ACTIONS.find(a => a.id === variables.actionId);
      queryClient.invalidateQueries({ queryKey: ['/api/production'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quality-checks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-orders'] });
      
      toast({
        title: "Action Completed",
        description: `${action?.name} executed successfully`,
        duration: 3000,
      });
    },
    onError: (error, variables) => {
      const action = GESTURE_ACTIONS.find(a => a.id === variables.actionId);
      console.error(`Failed to execute ${action?.name}:`, error);
      
      toast({
        title: "Action Failed",
        description: `Failed to execute ${action?.name}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isActive) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const touchPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    
    setTouchStart(touchPoint);
    setTouchEnd(null);
    setIsLongPress(false);
    
    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      executeAction('reset_machine');
      navigator.vibrate?.(200); // Haptic feedback
    }, 800);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isActive || !touchStart) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    setTouchEnd({
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isActive || !touchStart) return;
    e.preventDefault();
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    if (isLongPress) {
      setIsLongPress(false);
      return;
    }
    
    if (!touchEnd) {
      // This was a tap
      handleTap();
      return;
    }
    
    // Calculate swipe direction and distance
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Minimum swipe distance threshold
    if (distance < 50) {
      handleTap();
      return;
    }
    
    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        executeAction('start_production');
        setDetectedGesture('swipe_right');
      } else {
        executeAction('pause_production');
        setDetectedGesture('swipe_left');
      }
    } else {
      // Vertical swipe
      if (deltaY < 0) {
        executeAction('report_issue');
        setDetectedGesture('swipe_up');
      } else {
        executeAction('mark_complete');
        setDetectedGesture('swipe_down');
      }
    }
    
    navigator.vibrate?.(100); // Haptic feedback
  };

  const handleTap = () => {
    setTapCount(prev => prev + 1);
    
    if (doubleTapTimer.current) {
      clearTimeout(doubleTapTimer.current);
    }
    
    doubleTapTimer.current = setTimeout(() => {
      if (tapCount + 1 >= 2) {
        executeAction('quality_check');
        setDetectedGesture('double_tap');
        navigator.vibrate?.(150);
      }
      setTapCount(0);
    }, 300);
  };

  const executeAction = (actionId: string) => {
    const action = GESTURE_ACTIONS.find(a => a.id === actionId);
    if (!action) return;
    
    setLastAction(action.name);
    
    // Execute the action through API
    executeActionMutation.mutate({ actionId });
    
    // Clear gesture detection after a delay
    setTimeout(() => {
      setDetectedGesture(null);
    }, 2000);
  };

  const resetGestureArea = () => {
    setDetectedGesture(null);
    setLastAction(null);
    setTapCount(0);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Gesture Controls
            <Button
              onClick={() => {
                setIsActive(!isActive);
                if (!isActive) resetGestureArea();
              }}
              variant={isActive ? "destructive" : "default"}
              size="sm"
            >
              {isActive ? "Disable" : "Enable"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Gesture Area */}
            <div
              ref={gestureAreaRef}
              className={`
                relative w-full h-64 border-2 border-dashed rounded-lg
                ${isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
                flex items-center justify-center touch-none select-none
                ${executeActionMutation.isPending ? 'opacity-50' : ''}
              `}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {isActive ? (
                <div className="text-center">
                  {executeActionMutation.isPending ? (
                    <div className="space-y-2">
                      <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-600">Executing...</p>
                    </div>
                  ) : detectedGesture ? (
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-lg p-2">
                        {detectedGesture.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {lastAction && (
                        <p className="text-sm text-gray-600">{lastAction}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-blue-600">
                        Gesture Area Active
                      </p>
                      <p className="text-sm text-gray-500">
                        Perform gestures here
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-500">Tap "Enable" to activate gesture controls</p>
                </div>
              )}
            </div>

            {/* Status Display */}
            {isActive && (
              <div className="text-center space-y-2">
                <Badge variant={detectedGesture ? "default" : "outline"}>
                  {detectedGesture ? `Last: ${detectedGesture}` : "Ready for gestures"}
                </Badge>
                {executeActionMutation.isPending && (
                  <Badge variant="secondary">Processing...</Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gesture Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Gestures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {GESTURE_ACTIONS.map((action) => (
              <div
                key={action.id}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className={`p-2 rounded-full ${action.color} text-white`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{action.name}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                <div className="text-right">
                  {action.gesture === 'swipe_right' && <ArrowRight className="w-4 h-4" />}
                  {action.gesture === 'swipe_left' && <ArrowLeft className="w-4 h-4" />}
                  {action.gesture === 'swipe_up' && <ArrowUp className="w-4 h-4" />}
                  {action.gesture === 'swipe_down' && <ArrowDown className="w-4 h-4" />}
                  {action.gesture === 'double_tap' && <span className="text-xs">2x</span>}
                  {action.gesture === 'long_press' && <span className="text-xs">⌐</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {GESTURE_ACTIONS.slice(0, 4).map((action) => (
              <Button
                key={action.id}
                onClick={() => executeAction(action.id)}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center space-y-1"
                disabled={!isActive || executeActionMutation.isPending}
              >
                {action.icon}
                <span className="text-xs">{action.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}