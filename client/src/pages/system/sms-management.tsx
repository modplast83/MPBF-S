import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Users,
  Bell,
  Settings,
  BarChart3,
  FileText,
  Zap,
  Phone,
  Calendar,
  Eye,
  Edit,
  Trash2,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
// Temporary type definitions until server routes are implemented
interface SmsMessage {
  id: number;
  recipientPhone: string;
  recipientName?: string;
  message: string;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  priority: string;
  category: string;
  messageType: string;
  orderId?: number;
  customerId?: string;
  retryCount?: number;
  templateId?: string;
  metadata?: any;
  errorMessage?: string;
  isScheduled?: boolean;
  scheduledFor?: Date;
  lastRetryAt?: Date;
  twilioMessageId?: string;
  sentBy?: string;
}

interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  messageType: string;
  template: string;
  variables?: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SmsNotificationRule {
  id: number;
  name: string;
  triggerEvent: string;
  templateId?: string;
  recipientRoles?: string[];
  recipientUsers?: string[];
  isActive: boolean;
  priority: string;
  cooldownMinutes?: number;
  workingHoursOnly: boolean;
  conditions?: any;
}

interface Order {
  id: number;
  customerId: string;
  status: string;
  date?: Date;
  note?: string;
}

interface Customer {
  id: string;
  name: string;
  code: string;
}

// Simple Send SMS Dialog Component
const SendSmsDialog = ({ children, onSuccess, customers = [], orders = [], templates = [] }: { 
  children: React.ReactNode; 
  onSuccess?: () => void; 
  customers?: Customer[]; 
  orders?: Order[]; 
  templates?: SmsTemplate[] 
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipientPhone: "",
    recipientName: "",
    message: "",
    priority: "normal",
    category: "general",
    messageType: "custom"
  });

  const sendMessage = async () => {
    try {
      await apiRequest("POST", "/api/sms-messages", formData);
      toast({ title: "SMS Sent", description: "Message sent successfully" });
      setOpen(false);
      setFormData({
        recipientPhone: "",
        recipientName: "",
        message: "",
        priority: "normal",
        category: "general",
        messageType: "custom"
      });
      onSuccess?.();
    } catch (error) {
      toast({ title: "Error", description: "Failed to send SMS", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Send SMS Message</DialogTitle>
          <DialogDescription>
            Send an SMS message to a specific phone number with customizable content and priority.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Phone Number</Label>
            <Input 
              value={formData.recipientPhone}
              onChange={(e) => setFormData({...formData, recipientPhone: e.target.value})}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <Label>Recipient Name</Label>
            <Input 
              value={formData.recipientName}
              onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
              placeholder="Optional"
            />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea 
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder="Enter your message..."
              className="min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={sendMessage} disabled={!formData.recipientPhone || !formData.message}>
              <Send className="h-4 w-4 mr-2" />
              Send SMS
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Simple Template Dialog Component
const SmsTemplateDialog = ({ children, onSuccess, template }: { 
  children: React.ReactNode; 
  onSuccess?: () => void; 
  template?: SmsTemplate 
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{template ? "Edit" : "Create"} SMS Template</DialogTitle>
          <DialogDescription>
            {template ? "Modify an existing SMS template" : "Create a new reusable SMS template"} for automated messaging.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 text-center text-gray-500">
          Template management functionality would be implemented here with form fields for template creation and editing.
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { setOpen(false); onSuccess?.(); }}>Save Template</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Simple Notification Rule Dialog Component
const NotificationRuleDialog = ({ children, onSuccess, rule, templates = [] }: { 
  children: React.ReactNode; 
  onSuccess?: () => void; 
  rule?: SmsNotificationRule; 
  templates?: SmsTemplate[] 
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{rule ? "Edit" : "Create"} Notification Rule</DialogTitle>
          <DialogDescription>
            {rule ? "Modify notification rule settings" : "Configure automated SMS notification triggers"} for system events.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 text-center text-gray-500">
          Notification rule management functionality would be implemented here with form fields for rule configuration.
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { setOpen(false); onSuccess?.(); }}>Save Rule</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Simple Message Details Dialog
const SmsMessageDetails = ({ message, open, onOpenChange, customer, order }: { 
  message?: SmsMessage; 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  customer?: Customer; 
  order?: Order 
}) => {
  if (!open || !message) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>SMS Message Details</DialogTitle>
          <DialogDescription>
            View detailed information about this SMS message including delivery status and content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">Recipient</Label>
              <p>{message.recipientName || "Unknown"}</p>
              <p className="text-sm text-gray-500">{message.recipientPhone}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Status</Label>
              <Badge variant={getStatusBadge(message.status)}>{message.status}</Badge>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-500">Message</Label>
            <div className="p-3 bg-gray-50 rounded border">
              <p className="text-sm">{message.message}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <Label className="text-sm font-medium text-gray-500">Priority</Label>
              <Badge variant={getPriorityBadge(message.priority)}>{message.priority}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Category</Label>
              <Badge variant="outline">{message.category}</Badge>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">Type</Label>
              <Badge variant="outline">{message.messageType}</Badge>
            </div>
          </div>
          {message.sentAt && (
            <div>
              <Label className="text-sm font-medium text-gray-500">Sent At</Label>
              <p className="text-sm">{format(new Date(message.sentAt), "MMM dd, yyyy 'at' HH:mm")}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Simple Analytics Component
const SmsAnalytics = ({ messages }: { messages: SmsMessage[] }) => {
  const totalMessages = messages.length;
  const deliveredCount = messages.filter(m => m.status === "delivered").length;
  const failedCount = messages.filter(m => m.status === "failed").length;
  const pendingCount = messages.filter(m => m.status === "pending").length;
  const deliveryRate = totalMessages > 0 ? (deliveredCount / totalMessages * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">SMS Analytics</h3>
        <p className="text-sm text-gray-500">Overview of SMS messaging performance</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Total Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Delivery Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryRate}%</div>
            <div className="text-xs text-gray-500">{deliveredCount} delivered</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Failed Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedCount}</div>
            <div className="text-xs text-gray-500">{pendingCount} pending</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Unique Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(messages.map(m => m.recipientPhone)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {messages.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No SMS Data Available</h3>
            <p className="text-gray-500 text-center">
              Start sending SMS messages to see analytics and insights here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default function SmsManagementPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<SmsMessage | null>(null);
  const [activeTab, setActiveTab] = useState("messages");

  // Fetch SMS messages
  const { 
    data: smsMessages = [], 
    isLoading: messagesLoading, 
    refetch: refetchMessages 
  } = useQuery<SmsMessage[]>({
    queryKey: ["/api/sms-messages"],
    refetchOnWindowFocus: false,
  });

  // Fetch SMS templates
  const { 
    data: smsTemplates = [], 
    isLoading: templatesLoading, 
    refetch: refetchTemplates 
  } = useQuery<SmsTemplate[]>({
    queryKey: ["/api/sms-templates"],
    refetchOnWindowFocus: false,
  });

  // Fetch notification rules
  const { 
    data: notificationRules = [], 
    isLoading: rulesLoading, 
    refetch: refetchRules 
  } = useQuery<SmsNotificationRule[]>({
    queryKey: ["/api/sms-notification-rules"],
    refetchOnWindowFocus: false,
  });

  // Fetch orders for tracking
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchOnWindowFocus: false,
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    refetchOnWindowFocus: false,
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("DELETE", `/api/sms-messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-messages"] });
      toast({
        title: "Message Deleted",
        description: "SMS message has been deleted successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete SMS message.",
        variant: "destructive"
      });
    }
  });

  // Resend message mutation
  const resendMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("POST", `/api/sms-messages/${messageId}/resend`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-messages"] });
      toast({
        title: "Message Resent",
        description: "SMS message has been resent successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resend SMS message.",
        variant: "destructive"
      });
    }
  });

  // Filter messages
  const filteredMessages = smsMessages.filter(message => {
    const matchesSearch = 
      message.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.recipientPhone.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || message.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || message.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive";
      case "high":
        return "default";
      case "normal":
        return "secondary";
      case "low":
        return "outline";
      default:
        return "outline";
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "production":
        return <BarChart3 className="h-4 w-4" />;
      case "quality":
        return <CheckCircle className="h-4 w-4" />;
      case "maintenance":
        return <Settings className="h-4 w-4" />;
      case "hr":
        return <Users className="h-4 w-4" />;
      case "management":
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">SMS Management</h1>
          <p className="text-gray-600">Professional notifications and order tracking system</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="rules">Notification Rules</TabsTrigger>
          <TabsTrigger value="tracking">Order Tracking</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search messages..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="management">Management</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => refetchMessages()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <SendSmsDialog 
                customers={customers} 
                orders={orders} 
                templates={smsTemplates}
                onSuccess={() => refetchMessages()}
              >
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send SMS
                </Button>
              </SendSmsDialog>
            </div>
          </div>

          {/* Messages Grid */}
          {messagesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMessages.map((message) => (
                <Card key={message.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(message.category)}
                        <div>
                          <CardTitle className="text-sm line-clamp-1">
                            {message.recipientName || message.recipientPhone}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            <Phone className="h-3 w-3 inline mr-1" />
                            {message.recipientPhone}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge variant={getStatusBadge(message.status)} className="text-xs">
                          {message.status}
                        </Badge>
                        <Badge variant={getPriorityBadge(message.priority)} className="text-xs">
                          {message.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {message.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {message.sentAt ? format(new Date(message.sentAt), "MMM dd, HH:mm") : "Not sent"}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {message.category}
                      </Badge>
                    </div>

                    {message.orderId && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <FileText className="h-3 w-3" />
                        Order #{message.orderId}
                      </div>
                    )}

                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedMessage(message)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      {message.status === "failed" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => resendMessageMutation.mutate(message.id)}
                          disabled={resendMessageMutation.isPending}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteMessageMutation.mutate(message.id)}
                        disabled={deleteMessageMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredMessages.length === 0 && !messagesLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages found</h3>
                <p className="text-gray-500 text-center mb-4">
                  {searchQuery || statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your filters to see more messages."
                    : "Get started by sending your first SMS message."}
                </p>
                <SendSmsDialog 
                  customers={customers} 
                  orders={orders} 
                  templates={smsTemplates}
                  onSuccess={() => refetchMessages()}
                >
                  <Button>
                    <Send className="h-4 w-4 mr-2" />
                    Send First SMS
                  </Button>
                </SendSmsDialog>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">SMS Templates</h3>
              <p className="text-sm text-gray-500">Create and manage reusable message templates</p>
            </div>
            <SmsTemplateDialog onSuccess={() => refetchTemplates()}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </SmsTemplateDialog>
          </div>

          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {smsTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>
                          <Badge variant="outline" className="text-xs mr-2">
                            {template.category}
                          </Badge>
                          {template.messageType}
                        </CardDescription>
                      </div>
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {template.template}
                    </p>
                    <div className="flex gap-2">
                      <SmsTemplateDialog template={template} onSuccess={() => refetchTemplates()}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </SmsTemplateDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notification Rules Tab */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Notification Rules</h3>
              <p className="text-sm text-gray-500">Automated notification triggers and conditions</p>
            </div>
            <NotificationRuleDialog templates={smsTemplates} onSuccess={() => refetchRules()}>
              <Button>
                <Bell className="h-4 w-4 mr-2" />
                New Rule
              </Button>
            </NotificationRuleDialog>
          </div>

          {rulesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {notificationRules.map((rule) => (
                <Card key={rule.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{rule.name}</CardTitle>
                        <CardDescription>
                          Trigger: {rule.triggerEvent} • Priority: {rule.priority}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {rule.workingHoursOnly ? "Business Hours" : "24/7"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Recipients:</span>{" "}
                        {rule.recipientRoles?.join(", ") || "None"}
                      </div>
                      {rule.cooldownMinutes > 0 && (
                        <div>
                          <span className="font-medium">Cooldown:</span>{" "}
                          {rule.cooldownMinutes} minutes
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <NotificationRuleDialog 
                        rule={rule} 
                        templates={smsTemplates} 
                        onSuccess={() => refetchRules()}
                      >
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </NotificationRuleDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Order Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Order Tracking</h3>
            <p className="text-sm text-gray-500">Monitor SMS notifications for orders</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.slice(0, 12).map((order) => {
              const orderMessages = smsMessages.filter(msg => msg.orderId === order.id);
              const customer = customers.find(c => c.id === order.customerId);
              
              return (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm">Order #{order.id}</CardTitle>
                        <CardDescription className="text-xs">
                          {customer?.name}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span>SMS Sent:</span>
                        <span className="font-medium">{orderMessages.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Delivered:</span>
                        <span className="font-medium text-green-600">
                          {orderMessages.filter(m => m.status === "delivered").length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>Failed:</span>
                        <span className="font-medium text-red-600">
                          {orderMessages.filter(m => m.status === "failed").length}
                        </span>
                      </div>
                      {order.date && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 pt-2">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(order.date), "MMM dd, yyyy")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <SmsAnalytics messages={smsMessages} />
        </TabsContent>
      </Tabs>

      {/* Message Details Dialog */}
      {selectedMessage && (
        <SmsMessageDetails 
          message={selectedMessage}
          open={!!selectedMessage}
          onOpenChange={() => setSelectedMessage(null)}
          customer={customers.find(c => c.id === selectedMessage.customerId)}
          order={orders.find(o => o.id === selectedMessage.orderId)}
        />
      )}
    </div>
  );
}