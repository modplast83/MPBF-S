import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface JobOrder {
  id: number;
  orderId: number;
  customerProductId: number;
  quantity: number;
  productionQty: number;
  status: string;
  customerId: string;
  customerName?: string;
  productName?: string;
  orderDate?: string;
}

interface FinalProduct {
  id: number;
  jobOrderId: number;
  quantity: number;
  completedDate: string;
  status: string;
}

export default function FinalProductsPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);

  // Fetch job orders with production quantity
  const { data: jobOrders = [], isLoading } = useQuery<JobOrder[]>({
    queryKey: ['/api/job-orders/with-production'],
    refetchOnWindowFocus: false,
  });

  // Fetch final products to know which job orders have been confirmed
  const { data: finalProducts = [] } = useQuery<FinalProduct[]>({
    queryKey: ['/api/final-products'],
    refetchOnWindowFocus: false,
  });

  // Create final product mutation
  const createFinalProduct = useMutation({
    mutationFn: (data: { jobOrderId: number; quantity: number }) => 
      apiRequest('/api/final-products', 'POST', data),
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("finalProduct.confirmSuccess"),
      });
      setConfirmOpen(false);
      setSelectedJobOrder(null);
      queryClient.invalidateQueries({ queryKey: ['/api/final-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-orders/with-production'] });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("finalProduct.confirmError"),
        variant: "destructive",
      });
    }
  });

  // Filter job orders based on search term
  const filteredJobOrders = jobOrders.filter(
    (jobOrder) =>
      jobOrder.id.toString().includes(searchTerm) ||
      (jobOrder.customerName && jobOrder.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (jobOrder.productName && jobOrder.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Check if a job order has been confirmed
  const isJobOrderConfirmed = (jobOrderId: number) => {
    return finalProducts.some(fp => fp.jobOrderId === jobOrderId);
  };

  // Handle confirm dialog open
  const handleConfirmClick = (jobOrder: JobOrder) => {
    setSelectedJobOrder(jobOrder);
    setQuantity(jobOrder.productionQty);
    setConfirmOpen(true);
  };

  // Handle confirm final product
  const handleConfirm = () => {
    if (selectedJobOrder && quantity > 0) {
      createFinalProduct.mutate({
        jobOrderId: selectedJobOrder.id,
        quantity: quantity
      });
    } else {
      toast({
        title: t("error"),
        description: t("finalProduct.quantityRequired"),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("finalProduct.title")}</h1>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("search")}
            className="w-full md:w-[200px] pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {isMobile ? (
            // Mobile view with cards
            <div className="grid gap-4">
              {filteredJobOrders.map((jobOrder) => {
                const confirmed = isJobOrderConfirmed(jobOrder.id);
                return (
                  <Card key={jobOrder.id} className={confirmed ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>
                          {t("jobOrder.number")}: {jobOrder.id}
                        </CardTitle>
                        <Badge variant={confirmed ? "success" : "outline"}>
                          {confirmed ? t("finalProduct.confirmed") : t("finalProduct.pending")}
                        </Badge>
                      </div>
                      <CardDescription>
                        {jobOrder.customerName} - {jobOrder.productName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>{t("jobOrder.quantity")}</Label>
                          <p className="font-semibold">{jobOrder.quantity} kg</p>
                        </div>
                        <div>
                          <Label>{t("finalProduct.productionQty")}</Label>
                          <p className="font-semibold">{jobOrder.productionQty} kg</p>
                        </div>
                        <div>
                          <Label>{t("jobOrder.status")}</Label>
                          <p className="font-semibold">
                            {t(`jobOrder.statuses.${jobOrder.status}`)}
                          </p>
                        </div>
                        <div>
                          <Label>{t("order.date")}</Label>
                          <p className="font-semibold">{jobOrder.orderDate}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {!confirmed && (
                        <Button 
                          onClick={() => handleConfirmClick(jobOrder)}
                          className="w-full"
                          disabled={jobOrder.productionQty <= 0}
                        >
                          {t("finalProduct.confirmButton")}
                        </Button>
                      )}
                      {confirmed && (
                        <div className="flex items-center w-full text-green-600 gap-2 justify-center">
                          <CheckCircle className="h-5 w-5" />
                          <span>{t("finalProduct.alreadyConfirmed")}</span>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Desktop view with table
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("jobOrder.number")}</TableHead>
                  <TableHead>{t("customer.title")}</TableHead>
                  <TableHead>{t("item.name")}</TableHead>
                  <TableHead>{t("order.date")}</TableHead>
                  <TableHead className="text-right">{t("jobOrder.quantity")}</TableHead>
                  <TableHead className="text-right">{t("finalProduct.productionQty")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobOrders.map((jobOrder) => {
                  const confirmed = isJobOrderConfirmed(jobOrder.id);
                  return (
                    <TableRow key={jobOrder.id} className={confirmed ? "bg-green-50 dark:bg-green-950/20" : ""}>
                      <TableCell>{jobOrder.id}</TableCell>
                      <TableCell>{jobOrder.customerName}</TableCell>
                      <TableCell>{jobOrder.productName}</TableCell>
                      <TableCell>{jobOrder.orderDate}</TableCell>
                      <TableCell className="text-right">{jobOrder.quantity} kg</TableCell>
                      <TableCell className="text-right">{jobOrder.productionQty} kg</TableCell>
                      <TableCell>
                        <Badge variant={confirmed ? "success" : "outline"}>
                          {confirmed ? t("finalProduct.confirmed") : t("finalProduct.pending")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {!confirmed && (
                          <Button 
                            onClick={() => handleConfirmClick(jobOrder)}
                            size="sm"
                            disabled={jobOrder.productionQty <= 0}
                          >
                            {t("finalProduct.confirmButton")}
                          </Button>
                        )}
                        {confirmed && (
                          <div className="flex items-center text-green-600 gap-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>{t("finalProduct.confirmed")}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("finalProduct.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {selectedJobOrder && (
                <>
                  {t("finalProduct.confirmDescription")}
                  <div className="mt-2">
                    <p><strong>{t("jobOrder.number")}:</strong> {selectedJobOrder.id}</p>
                    <p><strong>{t("customer.title")}:</strong> {selectedJobOrder.customerName}</p>
                    <p><strong>{t("item.name")}:</strong> {selectedJobOrder.productName}</p>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                {t("finalProduct.quantity")}
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t("cancel")}
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={createFinalProduct.isPending || quantity <= 0}
            >
              {createFinalProduct.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                t("finalProduct.confirmButton")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredJobOrders.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">{t("noDataFound")}</h3>
          <p className="text-muted-foreground">
            {searchTerm ? t("noSearchResults") : t("finalProduct.noJobOrders")}
          </p>
        </div>
      )}
    </div>
  );
}