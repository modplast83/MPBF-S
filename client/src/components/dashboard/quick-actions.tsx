import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import {
  Plus,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Wrench,
  BarChart3,
  FileText,
  Zap,
  RefreshCw,
  ArrowRight,
  Settings,
  Factory
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  category: 'production' | 'quality' | 'maintenance' | 'orders' | 'reports';
  requiredRole?: string[];
  action: () => void;
  shortcut?: string;
}

interface QuickOrderForm {
  customerId: string;
  items: Array<{
    customerProductId: number;
    quantity: number;
  }>;
  notes?: string;
}

interface QuickMaintenanceForm {
  machineId: string;
  damageType: string;
  severity: 'low' | 'normal' | 'high';
  description: string;
}

export function QuickActions() {
  const { t } = useTranslation();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [orderForm, setOrderForm] = useState<QuickOrderForm>({
    customerId: '',
    items: [{ customerProductId: 0, quantity: 0 }]
  });
  const [maintenanceForm, setMaintenanceForm] = useState<QuickMaintenanceForm>({
    machineId: '',
    damageType: '',
    severity: 'normal',
    description: ''
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: QuickOrderForm) => {
      const orderData = {
        customerId: data.customerId,
        notes: data.notes || '',
        status: 'pending'
      };
      
      const order = await apiRequest('POST', '/api/orders', orderData);
      
      // Create job orders for each item
      for (const item of data.items) {
        if (item.customerProductId && item.quantity > 0) {
          await apiRequest('POST', '/api/job-orders', {
            orderId: order.id,
            customerProductId: item.customerProductId,
            quantity: item.quantity,
            status: 'pending'
          });
        }
      }
      
      return order;
    },
    onSuccess: () => {
      toast({
        title: 'Order Created',
        description: 'New order has been created successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setOrderDialogOpen(false);
      setOrderForm({
        customerId: '',
        items: [{ customerProductId: 0, quantity: 0 }]
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create order',
        variant: 'destructive'
      });
    }
  });

  // Create maintenance request mutation
  const createMaintenanceMutation = useMutation({
    mutationFn: async (data: QuickMaintenanceForm) => {
      return apiRequest('POST', '/api/maintenance/requests', {
        ...data,
        requestedBy: user?.id,
        status: 'pending',
        priority: data.severity === 'high' ? 'urgent' : data.severity === 'normal' ? 'high' : 'normal'
      });
    },
    onSuccess: () => {
      toast({
        title: 'Maintenance Request Created',
        description: 'Maintenance request has been submitted successfully'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/requests'] });
      setMaintenanceDialogOpen(false);
      setMaintenanceForm({
        machineId: '',
        damageType: '',
        severity: 'normal',
        description: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create maintenance request',
        variant: 'destructive'
      });
    }
  });

  const quickActions: QuickAction[] = [
    {
      id: 'new-order',
      title: t('quick_actions.new_order'),
      description: t('quick_actions.new_order_desc'),
      icon: Plus,
      color: 'bg-blue-500 hover:bg-blue-600',
      category: 'orders',
      requiredRole: ['administrator', 'supervisor', 'manager'],
      action: () => setOrderDialogOpen(true),
      shortcut: 'Ctrl+N'
    },
    {
      id: 'start-production',
      title: t('quick_actions.start_production'),
      description: t('quick_actions.start_production_desc'),
      icon: Play,
      color: 'bg-green-500 hover:bg-green-600',
      category: 'production',
      requiredRole: ['administrator', 'supervisor', 'operator'],
      action: () => setLocation('/workflow'),
      shortcut: 'Ctrl+P'
    },
    {
      id: 'quality-check',
      title: t('quick_actions.quality_check'),
      description: t('quick_actions.quality_check_desc'),
      icon: CheckCircle,
      color: 'bg-purple-500 hover:bg-purple-600',
      category: 'quality',
      requiredRole: ['administrator', 'supervisor', 'operator'],
      action: () => setLocation('/quality/checks'),
      shortcut: 'Ctrl+Q'
    },
    {
      id: 'maintenance-request',
      title: t('quick_actions.report_issue'),
      description: t('quick_actions.report_issue_desc'),
      icon: AlertTriangle,
      color: 'bg-red-500 hover:bg-red-600',
      category: 'maintenance',
      action: () => setMaintenanceDialogOpen(true),
      shortcut: 'Ctrl+M'
    },
    {
      id: 'production-metrics',
      title: t('quick_actions.update_metrics'),
      description: t('quick_actions.update_metrics_desc'),
      icon: BarChart3,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      category: 'production',
      requiredRole: ['administrator', 'supervisor', 'operator'],
      action: () => setLocation('/production/metrics-input')
    },
    {
      id: 'warehouse-status',
      title: t('quick_actions.warehouse'),
      description: t('quick_actions.warehouse_desc'),
      icon: Package,
      color: 'bg-orange-500 hover:bg-orange-600',
      category: 'orders',
      requiredRole: ['administrator', 'supervisor', 'manager'],
      action: () => setLocation('/warehouse')
    },
    {
      id: 'mix-materials',
      title: t('quick_actions.mix_materials'),
      description: t('quick_actions.mix_materials_desc'),
      icon: RefreshCw,
      color: 'bg-teal-500 hover:bg-teal-600',
      category: 'production',
      requiredRole: ['administrator', 'supervisor', 'operator'],
      action: () => setLocation('/production/mix-materials')
    },
    {
      id: 'reports',
      title: t('quick_actions.quick_report'),
      description: t('quick_actions.quick_report_desc'),
      icon: FileText,
      color: 'bg-gray-500 hover:bg-gray-600',
      category: 'reports',
      requiredRole: ['administrator', 'supervisor', 'manager'],
      action: () => setLocation('/reports')
    }
  ];

  // Filter actions based on user role
  const userRole = user?.role?.toLowerCase();
  const filteredActions = quickActions.filter(action => 
    !action.requiredRole || action.requiredRole.includes(userRole || 'operator')
  );

  const addOrderItem = () => {
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { customerProductId: 0, quantity: 0 }]
    }));
  };

  const removeOrderItem = (index: number) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateOrderItem = (index: number, field: 'customerProductId' | 'quantity', value: number) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          {t("dashboard.quick_actions")}
        </CardTitle>
        <CardDescription>
          {t("dashboard.quick_actions_description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-3 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
          {filteredActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                className={`h-auto p-3 flex flex-col items-center gap-2 ${action.color} text-white border-0 transition-all duration-200 hover:scale-105`}
                onClick={action.action}
                title={action.shortcut ? `${action.description} (${action.shortcut})` : action.description}
              >
                <IconComponent className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                <div className="text-center">
                  <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {action.title}
                  </div>
                  {!isMobile && (
                    <div className="text-xs opacity-90 mt-1">
                      {action.description}
                    </div>
                  )}
                  {action.shortcut && !isMobile && (
                    <Badge variant="secondary" className="text-xs mt-1 bg-white/20">
                      {action.shortcut}
                    </Badge>
                  )}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Quick Order Dialog */}
        <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('quick_actions.create_quick_order')}</DialogTitle>
              <DialogDescription>
                {t('quick_actions.create_quick_order_desc')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerId">{t('quick_actions.customer')}</Label>
                <Select 
                  value={orderForm.customerId} 
                  onValueChange={(value) => setOrderForm(prev => ({ ...prev, customerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('quick_actions.select_customer')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CID001">Customer A</SelectItem>
                    <SelectItem value="CID002">Customer B</SelectItem>
                    <SelectItem value="CID003">Customer C</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('quick_actions.order_items')}</Label>
                {orderForm.items.map((item, index) => (
                  <div key={index} className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      placeholder={t('quick_actions.product_id')}
                      value={item.customerProductId || ''}
                      onChange={(e) => updateOrderItem(index, 'customerProductId', parseInt(e.target.value) || 0)}
                    />
                    <Input
                      type="number"
                      placeholder={t('quick_actions.quantity')}
                      value={item.quantity || ''}
                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)}
                    />
                    {orderForm.items.length > 1 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => removeOrderItem(index)}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addOrderItem} className="mt-2">
                  {t('quick_actions.add_item')}
                </Button>
              </div>

              <div>
                <Label htmlFor="notes">{t('quick_actions.notes_optional')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('quick_actions.order_notes')}
                  value={orderForm.notes || ''}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => createOrderMutation.mutate(orderForm)}
                  disabled={createOrderMutation.isPending || !orderForm.customerId}
                  className="flex-1"
                >
                  {createOrderMutation.isPending ? t('quick_actions.creating') : t('quick_actions.create_order')}
                </Button>
                <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Maintenance Dialog */}
        <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('quick_actions.report_maintenance_issue')}</DialogTitle>
              <DialogDescription>
                {t('quick_actions.submit_maintenance_request')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="machineId">{t('quick_actions.machine')}</Label>
                <Select 
                  value={maintenanceForm.machineId} 
                  onValueChange={(value) => setMaintenanceForm(prev => ({ ...prev, machineId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('quick_actions.select_machine')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXT001">Extruder 1</SelectItem>
                    <SelectItem value="EXT002">Extruder 2</SelectItem>
                    <SelectItem value="PRT001">Printer 1</SelectItem>
                    <SelectItem value="CUT001">Cutter 1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="damageType">{t('quick_actions.issue_type')}</Label>
                <Select 
                  value={maintenanceForm.damageType} 
                  onValueChange={(value) => setMaintenanceForm(prev => ({ ...prev, damageType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('quick_actions.select_issue_type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mechanical">Mechanical Issue</SelectItem>
                    <SelectItem value="electrical">Electrical Issue</SelectItem>
                    <SelectItem value="software">Software Issue</SelectItem>
                    <SelectItem value="cleaning">Cleaning Required</SelectItem>
                    <SelectItem value="calibration">Calibration Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="severity">{t('quick_actions.severity')}</Label>
                <Select 
                  value={maintenanceForm.severity} 
                  onValueChange={(value: 'low' | 'normal' | 'high') => setMaintenanceForm(prev => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('quick_actions.select_severity')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('quick_actions.low_severity')}</SelectItem>
                    <SelectItem value="normal">{t('quick_actions.normal_severity')}</SelectItem>
                    <SelectItem value="high">{t('quick_actions.high_severity')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">{t('quick_actions.description')}</Label>
                <Textarea
                  id="description"
                  placeholder={t('quick_actions.describe_issue')}
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => createMaintenanceMutation.mutate(maintenanceForm)}
                  disabled={createMaintenanceMutation.isPending || !maintenanceForm.machineId || !maintenanceForm.description}
                  className="flex-1"
                >
                  {createMaintenanceMutation.isPending ? t('quick_actions.submitting') : t('quick_actions.submit_request')}
                </Button>
                <Button variant="outline" onClick={() => setMaintenanceDialogOpen(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}