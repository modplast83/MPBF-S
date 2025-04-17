import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface SmsDialogProps {
  recipientPhone?: string;
  recipientName?: string;
  customerId?: string;
  orderId?: number;
  jobOrderId?: number;
  defaultMessage?: string;
  messageType?: "order_notification" | "status_update" | "custom";
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface FormData {
  recipientPhone: string;
  message: string;
  recipientName: string;
}

export function SmsDialog({
  recipientPhone = "",
  recipientName = "",
  customerId,
  orderId,
  jobOrderId,
  defaultMessage = "",
  messageType = "custom",
  trigger,
  onSuccess,
}: SmsDialogProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    defaultValues: {
      recipientPhone,
      recipientName,
      message: defaultMessage,
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("/api/sms-messages", {
        method: "POST",
        data: {
          recipientPhone: data.recipientPhone,
          recipientName: data.recipientName || null,
          message: data.message,
          customerId: customerId || null,
          orderId: orderId || null,
          jobOrderId: jobOrderId || null,
          messageType,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "SMS sent successfully",
        description: "The message has been queued for delivery.",
      });
      
      // Invalidate related queries
      if (orderId) {
        queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId, "sms-messages"] });
      }
      if (jobOrderId) {
        queryClient.invalidateQueries({ queryKey: ["/api/job-orders", jobOrderId, "sms-messages"] });
      }
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "sms-messages"] });
      }
      
      // Close dialog and reset form
      setOpen(false);
      reset();
      
      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send SMS",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    sendMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || <Button variant="outline">Send SMS</Button>}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send SMS Message</DialogTitle>
          <DialogDescription>
            Send an SMS notification to the recipient. The message will be sent immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipientPhone" className="text-right">
                Phone
              </Label>
              <Input
                id="recipientPhone"
                placeholder="+1234567890"
                className="col-span-3"
                {...register("recipientPhone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^\+?[0-9\s\-()]+$/,
                    message: "Please enter a valid phone number",
                  },
                })}
              />
              {errors.recipientPhone && (
                <p className="col-span-3 col-start-2 text-sm text-destructive">
                  {errors.recipientPhone.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipientName" className="text-right">
                Name
              </Label>
              <Input
                id="recipientName"
                placeholder="Recipient name"
                className="col-span-3"
                {...register("recipientName")}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="message" className="text-right">
                Message
              </Label>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                className="col-span-3"
                rows={5}
                {...register("message", {
                  required: "Message is required",
                  maxLength: {
                    value: 1600,
                    message: "Message cannot exceed 1600 characters",
                  },
                })}
              />
              {errors.message && (
                <p className="col-span-3 col-start-2 text-sm text-destructive">
                  {errors.message.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}