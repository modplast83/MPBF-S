import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import type { SmsMessage, Customer, Order } from "shared/schema";

interface SmsMessageDetailsProps {
  message: SmsMessage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
  order?: Order;
}

export function SmsMessageDetails({ 
  message, 
  open, 
  onOpenChange, 
  customer, 
  order 
}: SmsMessageDetailsProps) {
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "sent":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-50 border-green-200";
      case "sent":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      case "pending":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            SMS Message Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor(message.status)}`}>
              {getStatusIcon(message.status)}
              <span className="font-medium capitalize">{message.status}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getPriorityColor(message.priority)} className="capitalize">
                {message.priority}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {message.category}
              </Badge>
            </div>
          </div>

          {/* Recipient Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Recipient Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Name</div>
                  <div className="flex items-center gap-2">
                    {message.recipientName || "Unknown"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Phone Number</div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {message.recipientPhone}
                  </div>
                </div>
              </div>

              {customer && (
                <div className="pt-2 border-t">
                  <div className="text-sm font-medium text-gray-500">Customer</div>
                  <div className="flex items-center gap-2">
                    <span>{customer.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {customer.code}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message Content
              </CardTitle>
              <CardDescription>
                Type: {message.messageType.replace(/_/g, ' ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-gray-50 rounded-lg border">
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>{message.message.length} characters</span>
                {message.templateId && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Template: {message.templateId}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timing Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {message.sentAt && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Sent At</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {format(new Date(message.sentAt), "MMM dd, yyyy 'at' HH:mm")}
                    </div>
                  </div>
                )}

                {message.deliveredAt && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">Delivered At</div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {format(new Date(message.deliveredAt), "MMM dd, yyyy 'at' HH:mm")}
                    </div>
                  </div>
                )}

                {message.scheduledFor && (
                  <div>
                    <div className="text-sm font-medium text-gray-500">
                      {message.isScheduled ? "Scheduled For" : "Was Scheduled For"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      {format(new Date(message.scheduledFor), "MMM dd, yyyy 'at' HH:mm")}
                    </div>
                  </div>
                )}
              </div>

              {message.retryCount > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-sm font-medium text-gray-500">Retry Information</div>
                  <div className="flex items-center gap-2">
                    <span>Retried {message.retryCount} time(s)</span>
                    {message.lastRetryAt && (
                      <span className="text-gray-500">
                        • Last retry: {format(new Date(message.lastRetryAt), "MMM dd, HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Information */}
          {order && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Related Order
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Order #{order.id}</div>
                    <div className="text-sm text-gray-500">
                      Status: <Badge variant="outline" className="text-xs">{order.status}</Badge>
                    </div>
                    {order.date && (
                      <div className="text-xs text-gray-500">
                        Created: {format(new Date(order.date), "MMM dd, yyyy")}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-500">Message ID</div>
                  <div className="font-mono text-xs">{message.id}</div>
                </div>
                
                {message.twilioMessageId && (
                  <div>
                    <div className="font-medium text-gray-500">Twilio Message ID</div>
                    <div className="font-mono text-xs">{message.twilioMessageId}</div>
                  </div>
                )}

                {message.sentBy && (
                  <div>
                    <div className="font-medium text-gray-500">Sent By</div>
                    <div>{message.sentBy}</div>
                  </div>
                )}
              </div>

              {message.errorMessage && (
                <div className="pt-2 border-t">
                  <div className="font-medium text-red-600">Error Message</div>
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
                    {message.errorMessage}
                  </div>
                </div>
              )}

              {message.metadata && (
                <div className="pt-2 border-t">
                  <div className="font-medium text-gray-500">Metadata</div>
                  <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">
                    {JSON.stringify(message.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}