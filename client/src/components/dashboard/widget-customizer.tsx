import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { 
  PieChart, 
  BarChart4, 
  LineChart, 
  GaugeCircle, 
  AlertTriangle,
  ClipboardCheck,
  LayoutDashboard,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Define widget types and their properties
const AVAILABLE_WIDGETS = [
  {
    id: 'performance',
    title: 'Performance Overview',
    description: 'Overview of production performance metrics',
    icon: <GaugeCircle className="h-5 w-5" />,
    defaultEnabled: true,
    size: 'large' as const,
    defaultPosition: 0
  },
  {
    id: 'orders',
    title: 'Active Orders',
    description: 'Currently active production orders',
    icon: <BarChart4 className="h-5 w-5" />,
    defaultEnabled: true,
    size: 'medium' as const,
    defaultPosition: 1
  },
  {
    id: 'quality',
    title: 'Quality Metrics',
    description: 'Key quality performance indicators',
    icon: <ClipboardCheck className="h-5 w-5" />,
    defaultEnabled: true,
    size: 'medium' as const,
    defaultPosition: 2
  },
  {
    id: 'production',
    title: 'Production Trends',
    description: 'Production volume trends over time',
    icon: <LineChart className="h-5 w-5" />,
    defaultEnabled: true,
    size: 'medium' as const,
    defaultPosition: 3
  },
  {
    id: 'violations',
    title: 'Quality Violations',
    description: 'Recent quality violations and issues',
    icon: <AlertTriangle className="h-5 w-5" />,
    defaultEnabled: false,
    size: 'medium' as const,
    defaultPosition: 4
  },
  {
    id: 'productivity',
    title: 'Productivity Analysis',
    description: 'Worker and machine productivity metrics',
    icon: <PieChart className="h-5 w-5" />,
    defaultEnabled: false,
    size: 'medium' as const,
    defaultPosition: 5
  }
];

interface WidgetSettings {
  enabled: boolean;
  position: number;
  size?: 'small' | 'medium' | 'large';
}

type UserWidgetPreferences = Record<string, WidgetSettings>;

interface WidgetCustomizerProps {
  onSettingsChange: (settings: UserWidgetPreferences) => void;
  initialSettings?: UserWidgetPreferences;
}

const getDefaultSettings = (): UserWidgetPreferences => {
  return AVAILABLE_WIDGETS.reduce((acc, widget) => {
    acc[widget.id] = {
      enabled: widget.defaultEnabled,
      position: widget.defaultPosition,
      size: widget.size
    };
    return acc;
  }, {} as UserWidgetPreferences);
};

export function WidgetCustomizer({ onSettingsChange, initialSettings }: WidgetCustomizerProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<UserWidgetPreferences>(() => {
    // Initialize settings from props or defaults
    return initialSettings || getDefaultSettings();
  });
  const [activeWidgets, setActiveWidgets] = useState<typeof AVAILABLE_WIDGETS>([]);

  // Update active widgets when settings change
  useEffect(() => {
    const enabled = AVAILABLE_WIDGETS
      .filter(widget => settings[widget.id]?.enabled)
      .sort((a, b) => {
        return (settings[a.id]?.position || 0) - (settings[b.id]?.position || 0);
      });
    setActiveWidgets(enabled);
  }, [settings]);

  // Toggle widget enabled state
  const toggleWidget = (id: string) => {
    setSettings(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        enabled: !prev[id].enabled
      }
    }));
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(activeWidgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update position for all widgets
    const updatedSettings = { ...settings };
    items.forEach((item, index) => {
      updatedSettings[item.id] = {
        ...updatedSettings[item.id],
        position: index
      };
    });
    
    setSettings(updatedSettings);
  };

  // Handle saving settings
  const handleSave = () => {
    onSettingsChange(settings);
    localStorage.setItem('dashboardWidgetSettings', JSON.stringify(settings));
    toast({
      title: t('dashboard.settings_saved'),
      description: t('dashboard.widget_preferences_updated'),
    });
    setIsOpen(false);
  };

  // Reset to defaults
  const handleReset = () => {
    const defaultSettings = getDefaultSettings();
    setSettings(defaultSettings);
    toast({
      title: t('dashboard.reset_to_defaults'),
      description: t('dashboard.widget_preferences_reset'),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden md:inline">{t('dashboard.customize')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('dashboard.customize_widgets')}
          </DialogTitle>
          <DialogDescription>
            {t('dashboard.customize_description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <h3 className="font-medium text-sm mb-2">{t('dashboard.available_widgets')}</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto p-2">
              {AVAILABLE_WIDGETS.map(widget => (
                <div 
                  key={widget.id} 
                  className="flex items-center justify-between space-x-2 border p-3 rounded-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      {widget.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t(`dashboard.widgets.${widget.id}.title`)}</p>
                      <p className="text-xs text-muted-foreground">{t(`dashboard.widgets.${widget.id}.description`)}</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings[widget.id]?.enabled || false}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-sm mb-2">{t('dashboard.active_widgets')}</h3>
            <div className="border rounded-md p-3 min-h-[300px]">
              {activeWidgets.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  {t('dashboard.no_active_widgets')}
                </div>
              ) : (
                <div className="space-y-2">
                  {activeWidgets.map((widget, index) => (
                    <div
                      key={widget.id}
                      className="border rounded-md p-2 bg-background flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-primary/10 text-primary">
                          {widget.icon}
                        </div>
                        <span className="text-sm">{t(`dashboard.widgets.${widget.id}.title`)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-md px-2 py-0.5">
                          {t(`dashboard.position`, { position: index + 1 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('dashboard.drag_to_reorder')}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
          >
            {t('dashboard.reset_defaults')}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t('dashboard.save_preferences')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}