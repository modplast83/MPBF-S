import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { JobOrder, CreateRoll, Roll } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/constants";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/useAuth";

interface RollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobOrder: JobOrder | null;
  onSubmit: (data: CreateRoll) => void;
  isLoading: boolean;
}

export function RollDialog({ open, onOpenChange, jobOrder, onSubmit, isLoading }: RollDialogProps) {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
  // Get auth context safely, with fallback to prevent errors if context is missing
  const auth = useAuth();
  const user = auth?.user || null;
  const [stage] = useState<string>("extrusion");
  const [currentQty, setCurrentQty] = useState<number>(0);
  const [exceedsLimit, setExceedsLimit] = useState<boolean>(false);
  const [excessAmount, setExcessAmount] = useState<number>(0);

  // Fetch existing rolls for this job order to calculate remaining quantity
  const { data: existingRolls = [] } = useQuery<Roll[]>({
    queryKey: [jobOrder ? `${API_ENDPOINTS.JOB_ORDERS}/${jobOrder.id}/rolls` : null],
    enabled: !!jobOrder,
  });

  // Calculate remaining quantity
  const totalExtrudedQty = existingRolls.reduce((total, roll) => 
    total + (roll.extrudingQty || 0), 0);
  const remainingQty = jobOrder ? Math.max(0, jobOrder.quantity - totalExtrudedQty) : 0;

  // Schema for roll creation (allowing exceeding job order quantity)
  const formSchema = z.object({
    extrudingQty: z.coerce
      .number()
      .positive(t('rolls.quantity_error')),
    jobOrderId: z.number().positive(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      extrudingQty: remainingQty > 0 ? remainingQty : 0, // Default to the remaining quantity
      jobOrderId: jobOrder?.id || 0,
    },
  });

  // Update form values when jobOrder or remaining quantity changes
  useEffect(() => {
    if (jobOrder) {
      form.reset({
        extrudingQty: remainingQty > 0 ? remainingQty : 0,
        jobOrderId: jobOrder.id
      });
    }
  }, [jobOrder, remainingQty, form]);
  
  // Watch for quantity changes and update warning state
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'extrudingQty' || name === undefined) {
        const currentValue = Number(value.extrudingQty || 0);
        setCurrentQty(currentValue);
        
        if (currentValue > remainingQty && remainingQty > 0) {
          setExceedsLimit(true);
          setExcessAmount(currentValue - remainingQty);
        } else {
          setExceedsLimit(false);
          setExcessAmount(0);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, remainingQty]);

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    console.log("Form submitted with values:", values);
    const rollData: CreateRoll = {
      jobOrderId: values.jobOrderId,
      extrudingQty: values.extrudingQty,
      printingQty: values.extrudingQty, // Auto-set printing qty equal to extrusion qty
      cuttingQty: 0, // Will be filled in later at cutting stage
      currentStage: "extrusion",
      status: "pending",
      createdById: user?.id || '0U41' // Include the current user's ID with fallback
    };
    console.log("Creating roll with user ID:", user?.id || '0U41');
    onSubmit(rollData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[425px] ${isRTL ? 'rtl' : ''}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t('rolls.new_roll')}
            <Badge variant="outline" className={`${isRTL ? 'mr-2' : 'ml-2'}`}>
              {stage === "extrusion" && (
                <span className="flex items-center text-primary-500">
                  <span className={`material-icons text-sm ${isRTL ? 'ml-1' : 'mr-1'}`}>merge_type</span>
                  {t('rolls.extrusion')}
                </span>
              )}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {jobOrder && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <div className="grid gap-4 py-2">
                <div className="grid gap-1">
                  <div className="text-sm font-medium">{t('job_orders.title')}</div>
                  <div className="text-sm">#{jobOrder.id}</div>
                </div>

                <div className="grid gap-1 bg-secondary-50 p-3 rounded-md">
                  <div className="text-sm font-medium">{t('job_orders.title')} {t('common.details')}</div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <div className="text-xs text-secondary-500">{t('orders.total_quantity')}</div>
                      <div className="text-sm font-medium">{jobOrder.quantity} kg</div>
                    </div>
                    <div>
                      <div className="text-xs text-secondary-500">{t('rolls.already_extruded')}</div>
                      <div className="text-sm font-medium">{totalExtrudedQty} kg</div>
                    </div>
                    <div>
                      <div className="text-xs text-secondary-500">{t('rolls.remaining_quantity')}</div>
                      <div className="text-sm font-medium text-primary-600">{remainingQty} kg</div>
                    </div>
                  </div>
                  {exceedsLimit && (
                    <div className={`mt-2 text-xs text-warning-600 bg-warning-50 p-2 rounded border border-warning-200 flex items-center ${isRTL ? 'space-x-reverse' : ''}`}>
                      <span className={`material-icons text-sm ${isRTL ? 'ml-1' : 'mr-1'}`}>warning</span>
                      {t('rolls.quantity_exceeds', { amount: excessAmount.toFixed(2) })}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="extrudingQty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('rolls.roll_quantity')}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={t('rolls.enter_quantity')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || Number(form.getValues().extrudingQty) <= 0}
                >
                  {isLoading ? t('common.creating') : t('rolls.create_roll')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}