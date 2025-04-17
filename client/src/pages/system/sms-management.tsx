import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SmsDialog } from "@/components/ui/sms-dialog";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Customer, Order, JobOrder, SmsMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, RefreshCw } from "lucide-react";

export default function SmsManagementPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  
  // Fetch data for SMS management
  const { 
    data: messages = [],
    isLoading: messagesLoading,
    refetch: refetchMessages
  } = useQuery<SmsMessage[]>({
    queryKey: ["/api/sms-messages"],
    refetchOnWindowFocus: false,
  });
  
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    refetchOnWindowFocus: false,
  });
  
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
    refetchOnWindowFocus: false,
  });
  
  const { data: jobOrders = [] } = useQuery<JobOrder[]>({
    queryKey: ["/api/job-orders"],
    refetchOnWindowFocus: false,
  });
  
  // Handle message deletion mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("DELETE", `/api/sms-messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-messages"] });
      toast({
        title: "Message Deleted",
        description: "The SMS message has been deleted successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the SMS message.",
        variant: "destructive"
      });
    }
  });
  
  // Handle check message status mutation
  const checkStatusMutation = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("POST", `/api/sms-messages/${messageId}/check-status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-messages"] });
      toast({
        title: "Status Updated",
        description: "The SMS message status has been checked and updated."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to check the SMS message status.",
        variant: "destructive"
      });
    }
  });
  
  // Get message status badge color
  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-500";
      case "delivered":
        return "bg-green-700";
      case "failed":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };
  
  // Get entity name (customer, order, job order)
  const getEntityName = (message: SmsMessage) => {
    if (message.customerId) {
      const customer = customers.find(c => c.id === message.customerId);
      return customer ? `Customer: ${customer.name}` : "Unknown Customer";
    } else if (message.orderId) {
      return `Order #${message.orderId}`;
    } else if (message.jobOrderId) {
      const jobOrder = jobOrders.find(jo => jo.id === message.jobOrderId);
      const order = jobOrder ? orders.find(o => o.id === jobOrder.orderId) : null;
      return order ? `Job Order for Order #${order.id}` : `Job Order #${message.jobOrderId}`;
    }
    return "N/A";
  };
  
  // Filter messages based on search and filter criteria
  const filteredMessages = messages.filter(message => {
    // Filter by tab (message status)
    if (selectedTab !== "all" && message.status !== selectedTab) {
      return false;
    }
    
    // Filter by entity type if selected
    if (filterType) {
      if (filterType === "customer" && !message.customerId) return false;
      if (filterType === "order" && !message.orderId) return false;
      if (filterType === "jobOrder" && !message.jobOrderId) return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      return (
        message.recipientName?.toLowerCase().includes(lowerSearch) ||
        message.recipientPhone.toLowerCase().includes(lowerSearch) ||
        message.message.toLowerCase().includes(lowerSearch) ||
        getEntityName(message).toLowerCase().includes(lowerSearch)
      );
    }
    
    return true;
  });
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SMS Message Management</CardTitle>
              <CardDescription>
                Send and manage SMS messages to customers and track their delivery status
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchMessages()}
                disabled={messagesLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${messagesLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <SmsDialog
                recipientPhone=""
                messageType="custom"
                defaultMessage=""
                trigger={
                  <Button size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    New Message
                  </Button>
                }
                onSuccess={() => refetchMessages()}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={filterType || ""} onValueChange={value => setFilterType(value || null)}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entities</SelectItem>
                  <SelectItem value="customer">Customers</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="jobOrder">Job Orders</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Status tabs */}
          <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab} className="mb-6">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="delivered">Delivered</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
            
            {/* Message list table */}
            <TabsContent value={selectedTab}>
              <Table>
                <TableCaption>
                  {messagesLoading 
                    ? "Loading messages..." 
                    : filteredMessages.length === 0 
                      ? "No messages found" 
                      : `Total: ${filteredMessages.length} messages`
                  }
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Related To</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div className="font-medium">{message.recipientName || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">{message.recipientPhone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md overflow-hidden whitespace-normal">
                          {message.message.length > 100 
                            ? `${message.message.substring(0, 100)}...` 
                            : message.message
                          }
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Type: {message.messageType.replace('_', ' ')}
                        </div>
                      </TableCell>
                      <TableCell>{getEntityName(message)}</TableCell>
                      <TableCell>
                        {message.sentAt 
                          ? formatDistanceToNow(new Date(message.sentAt), { addSuffix: true }) 
                          : "Not sent"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={getMessageStatusColor(message.status)}>
                          {message.status}
                        </Badge>
                        {message.errorMessage && (
                          <div className="text-xs text-red-500 mt-1">
                            {message.errorMessage}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => checkStatusMutation.mutate(message.id)}
                            disabled={checkStatusMutation.isPending}
                          >
                            Check Status
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this message?')) {
                                deleteMessageMutation.mutate(message.id);
                              }
                            }}
                            disabled={deleteMessageMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}