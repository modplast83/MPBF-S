import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SmsDialog } from "@/components/ui/sms-dialog";
import { MessageSquare, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Customer, Order, SmsMessage } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

interface OrderSmsProps {
  order: Order;
  customer: Customer;
}

export function OrderSms({ order, customer }: OrderSmsProps) {
  const {
    data: messages = [] as SmsMessage[],
    isLoading,
    isError,
    refetch,
  } = useQuery<SmsMessage[]>({
    queryKey: ["/api/orders", order.id, "sms-messages"],
    retry: false,
    refetchOnWindowFocus: false,
  });

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

  // Default message for order notification
  const defaultMessage = `Hello ${customer.name},\nYour order #${order.id} has been ${order.status}. Thank you for choosing our service.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>SMS Messages</span>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Send and view SMS messages related to this order
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading messages...</div>
        ) : isError ? (
          <div className="text-center py-4 text-red-500">Failed to load messages</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">No messages sent yet</div>
        ) : (
          <div className="space-y-4">
            {messages.map((message: SmsMessage) => (
              <div key={message.id} className="border rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold">{message.recipientName || message.recipientPhone}</span>
                  <Badge className={getMessageStatusColor(message.status)}>{message.status}</Badge>
                </div>
                <p className="whitespace-pre-wrap mb-2">{message.message}</p>
                <div className="text-xs text-muted-foreground">
                  Sent {message.sentAt ? formatDistanceToNow(new Date(message.sentAt), { addSuffix: true }) : "N/A"}
                </div>
                {message.errorMessage && (
                  <div className="mt-2 text-xs text-red-500">{message.errorMessage}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        {/* Using code as phone number since phone isn't in the schema */}
        <SmsDialog
          recipientPhone={customer.code || ""}
          recipientName={customer.name}
          customerId={customer.id}
          orderId={order.id}
          messageType="order_notification"
          defaultMessage={defaultMessage}
          trigger={
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send New Message
            </Button>
          }
          onSuccess={() => refetch()}
        />
      </CardFooter>
    </Card>
  );
}