import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronDown, ChevronUp, Eye, Trash, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { H3 } from "@/components/ui/typography";

interface PlatePricingHistoryProps {
  calculations: any[];
}

export default function PlatePricingHistory({ calculations }: PlatePricingHistoryProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  // Fetch customers for name display
  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  // Delete calculation mutation
  const deleteCalculation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/plate-calculations/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plate-calculations'] });
      setShowDeleteDialog(false);
      setSelectedCalculation(null);
      toast({
        title: t('cliches.calculationDeleted'),
        description: t('cliches.calculationDeletedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('cliches.deleteError'),
        description: t('common.errorTryAgain'),
        variant: 'destructive'
      });
    }
  });

  // Handle delete button click
  const handleDeleteClick = (calculation: any) => {
    setSelectedCalculation(calculation);
    setShowDeleteDialog(true);
  };

  // Handle view details button click
  const handleViewDetails = (calculation: any) => {
    setSelectedCalculation(calculation);
    setShowDetailsDialog(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedCalculation) {
      deleteCalculation.mutate(selectedCalculation.id);
    }
  };

  // Toggle expanded state for mobile view
  const toggleExpanded = (id: number) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id]
    );
  };

  // Get customer name by ID
  const getCustomerName = (customerId: string) => {
    if (!customerId) return t('cliches.noCustomer');
    const customer = customers?.find((c: any) => c.id === customerId);
    return customer ? customer.name : customerId;
  };

  // Format date
  const formatDate = (date: string) => {
    if (!date) return '';
    try {
      return format(new Date(date), 'PPP p');
    } catch (e) {
      return date;
    }
  };

  return (
    <div className="space-y-6">
      {calculations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t('cliches.noCalculations')}
          </CardContent>
        </Card>
      ) : (
        <div className={`${isMobile ? 'space-y-4' : ''}`}>
          {isMobile ? (
            // Mobile view - collapsible cards
            calculations.map((calculation) => (
              <Card key={calculation.id}>
                <Collapsible
                  open={expandedItems.includes(calculation.id)}
                  onOpenChange={() => toggleExpanded(calculation.id)}
                  className="w-full"
                >
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {calculation.description || t('cliches.calculationNumber', { number: calculation.id })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(calculation.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-lg font-bold">
                        ${calculation.calculatedPrice?.toFixed(2)}
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon">
                          {expandedItems.includes(calculation.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">{t('cliches.customer')}:</span>{' '}
                          {getCustomerName(calculation.customerId)}
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('cliches.dimensions')}:</span>{' '}
                          {calculation.width} × {calculation.height} cm
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('cliches.area')}:</span>{' '}
                          {calculation.area} cm²
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('cliches.colors')}:</span>{' '}
                          {calculation.colors}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleViewDetails(calculation)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          {t('common.details')}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive" 
                          onClick={() => handleDeleteClick(calculation)}
                        >
                          <Trash className="h-3.5 w-3.5 mr-1" />
                          {t('common.delete')}
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          ) : (
            // Desktop view - table
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('cliches.description')}</TableHead>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('cliches.customer')}</TableHead>
                  <TableHead>{t('cliches.dimensions')}</TableHead>
                  <TableHead>{t('cliches.area')}</TableHead>
                  <TableHead>{t('cliches.colors')}</TableHead>
                  <TableHead>{t('cliches.price')}</TableHead>
                  <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calculation) => (
                  <TableRow key={calculation.id}>
                    <TableCell className="font-medium">
                      {calculation.description || t('cliches.calculationNumber', { number: calculation.id })}
                    </TableCell>
                    <TableCell>{formatDate(calculation.createdAt)}</TableCell>
                    <TableCell>{getCustomerName(calculation.customerId)}</TableCell>
                    <TableCell>{calculation.width} × {calculation.height} cm</TableCell>
                    <TableCell>{calculation.area} cm²</TableCell>
                    <TableCell>{calculation.colors}</TableCell>
                    <TableCell className="font-bold">${calculation.calculatedPrice?.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(calculation)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(calculation)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cliches.deleteCalculation')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cliches.deleteCalculationConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteCalculation.isPending}
            >
              {deleteCalculation.isPending ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Calculation Details Dialog */}
      {selectedCalculation && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className={`sm:max-w-[550px] ${isMobile ? 'h-[70vh] overflow-y-auto' : ''}`}>
            <DialogHeader>
              <DialogTitle>
                {selectedCalculation.description || t('cliches.calculationDetails')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[calc(80vh-100px)] overflow-y-auto pr-1">
              <div>
                <H3>{t('cliches.calculationSummary')}</H3>
                <Separator className="my-2" />
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <Label>{t('cliches.price')}:</Label>
                    <div className="text-xl font-bold text-primary">
                      ${selectedCalculation.calculatedPrice?.toFixed(2)}
                    </div>
                  </div>
                  
                  <div>
                    <Label>{t('cliches.area')}:</Label>
                    <div className="font-medium">
                      {selectedCalculation.area} cm²
                    </div>
                  </div>
                  
                  <div>
                    <Label>{t('common.date')}:</Label>
                    <div className="font-medium">
                      {formatDate(selectedCalculation.createdAt)}
                    </div>
                  </div>
                  
                  <div>
                    <Label>{t('cliches.customer')}:</Label>
                    <div className="font-medium">
                      {getCustomerName(selectedCalculation.customerId)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <H3>{t('cliches.dimensions')}</H3>
                <Separator className="my-2" />
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <Label>{t('cliches.width')}:</Label>
                    <div className="font-medium">
                      {selectedCalculation.width} cm
                    </div>
                  </div>
                  
                  <div>
                    <Label>{t('cliches.height')}:</Label>
                    <div className="font-medium">
                      {selectedCalculation.height} cm
                    </div>
                  </div>
                  
                  <div>
                    <Label>{t('cliches.colors')}:</Label>
                    <div className="font-medium">
                      {selectedCalculation.colors}
                    </div>
                  </div>
                  
                  {selectedCalculation.thickness > 0 && (
                    <div>
                      <Label>{t('cliches.thickness')}:</Label>
                      <div className="font-medium">
                        {selectedCalculation.thickness} mm
                      </div>
                    </div>
                  )}
                  
                  {selectedCalculation.customerDiscount > 0 && (
                    <div>
                      <Label>{t('cliches.appliedDiscount')}:</Label>
                      <div className="font-medium">
                        {selectedCalculation.customerDiscount}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedCalculation.notes && (
                <div>
                  <H3>{t('cliches.notes')}</H3>
                  <Separator className="my-2" />
                  <div className="text-sm whitespace-pre-wrap">
                    {selectedCalculation.notes}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}