import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { formatDateString } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { FinalProduct, JobOrder, CustomerProduct, Order, Customer, Roll, Item } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";

export default function FinalProducts() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<FinalProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<FinalProduct | null>(null);
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  
  // Form state
  const [jobOrderId, setJobOrderId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [status, setStatus] = useState("in-stock");

  // Fetch final products and related data
  const { data: finalProducts, isLoading } = useQuery<FinalProduct[]>({
    queryKey: [API_ENDPOINTS.FINAL_PRODUCTS],
  });

  const { data: jobOrders } = useQuery<JobOrder[]>({
    queryKey: [API_ENDPOINTS.JOB_ORDERS],
  });

  const { data: customerProducts } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });

  const { data: orders } = useQuery<Order[]>({
    queryKey: [API_ENDPOINTS.ORDERS],
  });

  const { data: customers } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });
  
  const { data: items = [] } = useQuery<Item[]>({
    queryKey: [API_ENDPOINTS.ITEMS],
  });
  
  // Fetch all rolls to calculate cutting quantities
  const { data: rolls = [] } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS],
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { jobOrderId: number; quantity: number; status: string }) => {
      if (editProduct) {
        await apiRequest("PUT", `${API_ENDPOINTS.FINAL_PRODUCTS}/${editProduct.id}`, data);
      } else {
        await apiRequest("POST", API_ENDPOINTS.FINAL_PRODUCTS, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FINAL_PRODUCTS] });
      toast({
        title: `Final Product ${editProduct ? "Updated" : "Created"}`,
        description: `The final product has been ${editProduct ? "updated" : "created"} successfully.`,
      });
      handleCloseForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editProduct ? "update" : "create"} final product: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.FINAL_PRODUCTS}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.FINAL_PRODUCTS] });
      toast({
        title: "Final Product Deleted",
        description: "The final product has been deleted successfully.",
      });
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete final product: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: FinalProduct) => {
    setEditProduct(product);
    setJobOrderId(product.jobOrderId);
    setQuantity(product.quantity);
    setStatus(product.status);
    setFormOpen(true);
  };

  const handleDelete = (product: FinalProduct) => {
    setDeletingProduct(product);
  };

  const handleSave = () => {
    if (jobOrderId <= 0 || quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({ jobOrderId, quantity, status });
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditProduct(null);
    setJobOrderId(0);
    setQuantity(0);
    setStatus("in-stock");
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id);
    }
  };

  // Helper functions
  const getJobOrderDetails = (jobOrderId: number) => {
    const jobOrder = jobOrders?.find(jo => jo.id === jobOrderId);
    if (!jobOrder) return { 
      orderNumber: "Unknown", 
      productName: "Unknown", 
      customer: "Unknown",
      totalCutQty: 0,
      totalRequiredQty: 0,
      completionPercentage: 0
    };
    
    const order = orders?.find(o => o.id === jobOrder.orderId);
    const product = customerProducts?.find(cp => cp.id === jobOrder.customerProductId);
    const customer = order ? customers?.find(c => c.id === order.customerId) : null;
    
    // Get the actual item name from the items collection
    let itemName = "Unknown";
    if (product && product.itemId) {
      const item = items.find(i => i.id === product.itemId);
      if (item) {
        itemName = item.name;
      }
    }
    
    // Calculate total cut quantity from all completed rolls for this job order
    const jobOrderRolls = rolls.filter(roll => roll.jobOrderId === jobOrderId && roll.currentStage === "cutting" && roll.status === "completed");
    const totalCutQty = jobOrderRolls.reduce((total, roll) => total + (roll.cuttingQty || 0), 0);
    
    // Calculate completion percentage
    const totalRequiredQty = jobOrder.quantity || 0;
    const completionPercentage = totalRequiredQty > 0 
      ? Math.min(100, Math.round((totalCutQty / totalRequiredQty) * 100)) 
      : 0;
    
    return {
      orderNumber: order?.id.toString() || "Unknown",
      productName: itemName,
      customer: customer?.name || "Unknown",
      totalCutQty: totalCutQty,
      totalRequiredQty: totalRequiredQty,
      completionPercentage: completionPercentage
    };
  };

  // Define the column types explicitly
  type FinalProductColumnDef = {
    header: string;
    accessorKey?: keyof FinalProduct;
    cell?: (row: FinalProduct) => React.ReactNode;
  };

  const columns: FinalProductColumnDef[] = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: t('orders.title'),
      accessorKey: "jobOrderId",
      cell: (row) => {
        const details = getJobOrderDetails(row.jobOrderId);
        return `#${details.orderNumber}`;
      },
    },
    {
      header: t('job_orders.title'),
      accessorKey: "jobOrderId",
      cell: (row) => {
        return `JO #${row.jobOrderId}`;
      },
    },
    {
      header: t('setup.customers.title'),
      accessorKey: "jobOrderId",
      cell: (row) => {
        const details = getJobOrderDetails(row.jobOrderId);
        return details.customer;
      },
    },
    {
      header: t('orders.product'),
      accessorKey: "jobOrderId",
      cell: (row) => {
        const details = getJobOrderDetails(row.jobOrderId);
        return details.productName;
      },
    },
    {
      header: t('warehouse.quantity') + " (Kg)",
      accessorKey: "quantity",
    },
    {
      header: t('rolls.completed'),
      accessorKey: "completedDate",
      cell: (row) => formatDateString(row.completedDate),
    },
    {
      header: t('common.status'),
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t('common.actions'),
      cell: (row) => (
        <div className={`flex ${isRTL ? "space-x-reverse" : "space-x-2"}`}>
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)} className="text-primary-500 hover:text-primary-700">
            <span className="material-icons text-sm">edit</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} className="text-error-500 hover:text-error-700">
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const tableActions = (
    <Button onClick={() => setFormOpen(true)}>
      <span className="material-icons text-sm mr-1">add</span>
      {t('warehouse.add_new_material')}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t('warehouse.final_products')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t('warehouse.manage_final_products')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={finalProducts || []}
            columns={columns}
            isLoading={isLoading}
            actions={tableActions}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Final Product Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className={isRTL ? "rtl" : ""}>
          <DialogHeader>
            <DialogTitle>
              {editProduct ? t('warehouse.edit_material') : t('warehouse.add_new_material')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className={`grid ${isMobile ? "" : "grid-cols-4"} items-center gap-4`}>
              <Label htmlFor="jobOrder" className={isMobile ? "" : "text-right"}>
                {t('job_orders.title')}
              </Label>
              <Select 
                value={jobOrderId.toString()} 
                onValueChange={(value) => {
                  const id = parseInt(value);
                  setJobOrderId(id);
                  
                  // Auto-set quantity to total cut quantity when selecting a job order
                  const details = getJobOrderDetails(id);
                  if (details.totalCutQty > 0) {
                    setQuantity(details.totalCutQty);
                  }
                }}>
                <SelectTrigger className={isMobile ? "w-full" : "col-span-3"}>
                  <SelectValue placeholder={t('job_orders.select_job_order')} />
                </SelectTrigger>
                <SelectContent>
                  {jobOrders?.map((jo) => {
                    const details = getJobOrderDetails(jo.id);
                    return (
                      <SelectItem key={jo.id} value={jo.id.toString()}>
                        JO #{jo.id} - {details.customer} - {details.productName} - {details.totalCutQty}/{details.totalRequiredQty} kg ({details.completionPercentage}%)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className={`grid ${isMobile ? "" : "grid-cols-4"} items-center gap-4`}>
              <Label htmlFor="quantity" className={isMobile ? "" : "text-right"}>
                {t('warehouse.quantity')} (Kg)
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                className={isMobile ? "w-full" : "col-span-3"}
              />
            </div>
            <div className={`grid ${isMobile ? "" : "grid-cols-4"} items-center gap-4`}>
              <Label htmlFor="status" className={isMobile ? "" : "text-right"}>
                {t('common.status')}
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={isMobile ? "w-full" : "col-span-3"}>
                  <SelectValue placeholder={t('warehouse.select_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-stock">{t('status.in_stock')}</SelectItem>
                  <SelectItem value="reserved">{t('status.reserved')}</SelectItem>
                  <SelectItem value="shipped">{t('status.shipped')}</SelectItem>
                  <SelectItem value="delivered">{t('status.delivered')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className={`${isMobile ? "flex flex-col space-y-2" : ""} ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button variant="outline" onClick={handleCloseForm} className={isMobile ? "w-full" : ""}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              className={isMobile ? "w-full" : ""}
            >
              {saveMutation.isPending
                ? editProduct ? t('common.updating') : t('common.creating')
                : editProduct ? t('common.update') : t('common.create')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent className={isRTL ? "rtl" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.delete_confirmation', { item: t('warehouse.final_products') })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRTL ? "flex-row-reverse" : ""}>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-error-500 hover:bg-error-600"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
