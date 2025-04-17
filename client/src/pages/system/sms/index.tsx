import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, RefreshCw, Plus, Send, Search, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Types for SMS messages
interface SmsMessage {
  id: number;
  message: string;
  status: string;
  recipientPhone: string;
  recipientName: string | null;
  sentBy: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  messageType: string;
  customerId: string | null;
  orderId: number | null;
  jobOrderId: number | null;
  twilioMessageId: string | null;
  errorMessage: string | null;
}

// Create SMS form schema
const sendSmsSchema = z.object({
  recipientPhone: z.string().min(7, "Phone number is required"),
  recipientName: z.string().optional().nullable(),
  message: z.string().min(1, "Message is required"),
  customerId: z.string().optional().nullable(),
  messageType: z.enum(["custom", "status_update"]).default("custom"),
});

type SendSmsFormValues = z.infer<typeof sendSmsSchema>;

export default function SmsManagementPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFiltered, setIsFiltered] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [showNewSmsDialog, setShowNewSmsDialog] = useState(false);

  // Form for sending new SMS
  const sendSmsForm = useForm<SendSmsFormValues>({
    resolver: zodResolver(sendSmsSchema),
    defaultValues: {
      recipientPhone: "",
      recipientName: "",
      message: "",
      customerId: null,
      messageType: "custom",
    },
  });

  // Get all SMS messages
  const { data: smsMessages, isLoading, refetch } = useQuery<SmsMessage[]>({
    queryKey: [API_ENDPOINTS.SMS_MESSAGES],
    queryFn: getQueryFn,
  });

  // Function to get SMS messages
  async function getQueryFn() {
    const response = await fetch(API_ENDPOINTS.SMS_MESSAGES);
    if (!response.ok) {
      throw new Error("Failed to fetch SMS messages");
    }
    return response.json();
  }

  // Send new SMS mutation
  const sendSmsMutation = useMutation({
    mutationFn: async (data: SendSmsFormValues) => {
      const response = await apiRequest("POST", API_ENDPOINTS.SMS_MESSAGES, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "SMS Sent",
        description: "The SMS message was sent successfully.",
      });
      setShowNewSmsDialog(false);
      sendSmsForm.reset();
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.SMS_MESSAGES] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send SMS",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle send SMS form submission
  function onSubmitSendSms(data: SendSmsFormValues) {
    sendSmsMutation.mutate(data);
  }

  // Filter SMS messages based on search query and status filter
  const filteredSmsMessages = smsMessages?.filter(sms => {
    const matchesSearch = searchQuery
      ? sms.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sms.recipientPhone.includes(searchQuery) ||
        (sms.recipientName && sms.recipientName.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesStatus = statusFilter ? sms.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  // Get unique status values for filter
  const statusOptions = smsMessages
    ? Array.from(new Set(smsMessages.map(sms => sms.status)))
    : [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        heading="SMS Management"
        text="View and send SMS messages to customers"
      >
        <MessageSquare className="h-6 w-6 mb-2" />
      </PageHeader>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search SMS messages..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>

          <div className="relative">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                  {isFiltered && (
                    <Badge variant="secondary" className="ml-2">
                      1
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Filter SMS Messages</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <FormLabel>Status</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={statusFilter === null ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          setStatusFilter(null);
                          setIsFiltered(false);
                        }}
                      >
                        All
                      </Button>
                      {statusOptions.map(status => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => {
                            setStatusFilter(status);
                            setIsFiltered(true);
                          }}
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter(null);
                      setIsFiltered(false);
                    }}
                  >
                    Reset Filters
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showNewSmsDialog} onOpenChange={setShowNewSmsDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New SMS
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Send New SMS Message</DialogTitle>
              </DialogHeader>
              <Form {...sendSmsForm}>
                <form onSubmit={sendSmsForm.handleSubmit(onSubmitSendSms)} className="space-y-4">
                  <FormField
                    control={sendSmsForm.control}
                    name="recipientPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={sendSmsForm.control}
                    name="recipientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Name (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={sendSmsForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your message here..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowNewSmsDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={sendSmsMutation.isPending}>
                      {sendSmsMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send SMS
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SMS Messages Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sent At</TableHead>
              <TableHead>Delivered At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">Loading SMS messages...</p>
                </TableCell>
              </TableRow>
            ) : filteredSmsMessages?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <p className="text-sm text-gray-500">No SMS messages found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSmsMessages?.map(sms => (
                <TableRow key={sms.id}>
                  <TableCell>
                    <div className="font-medium">{sms.recipientPhone}</div>
                    {sms.recipientName && (
                      <div className="text-sm text-gray-500">{sms.recipientName}</div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate">{sms.message}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sms.status === "delivered"
                          ? "default"
                          : sms.status === "failed"
                          ? "destructive"
                          : sms.status === "sent"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {sms.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{sms.messageType}</TableCell>
                  <TableCell>
                    {sms.sentAt ? format(new Date(sms.sentAt), "MMM dd, yyyy HH:mm") : "-"}
                  </TableCell>
                  <TableCell>
                    {sms.deliveredAt ? format(new Date(sms.deliveredAt), "MMM dd, yyyy HH:mm") : "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}