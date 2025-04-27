import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { format } from "date-fns";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Import typography components
import Typography from "@/components/ui/typography";
const { H3, H4 } = Typography;
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Search, FileText, Trash2 } from "lucide-react";

export default function History() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCalculation, setSelectedCalculation] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch calculations
  const { data: calculations, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PLATE_CALCULATIONS],
    enabled: true,
  });

  // Fetch customers for reference
  const { data: customers } = useQuery({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
    enabled: true,
  });

  // Delete calculation mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`${API_ENDPOINTS.PLATE_CALCULATIONS}/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PLATE_CALCULATIONS] });
      toast({
        title: t("common.success"),
        description: t("Calculation deleted successfully"),
      });
      setIsDeleteDialogOpen(false);
      setSelectedCalculation(null);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // View calculation details
  const handleViewDetails = (calculation: any) => {
    setSelectedCalculation(calculation);
    setIsDetailsOpen(true);
  };

  // Delete calculation
  const handleDelete = (calculation: any) => {
    setSelectedCalculation(calculation);
    setIsDeleteDialogOpen(true);
  };

  // Confirm deletion
  const confirmDelete = () => {
    if (selectedCalculation) {
      deleteMutation.mutate(selectedCalculation.id);
    }
  };

  // Get customer name by ID
  const getCustomerName = (customerId: string) => {
    if (!customers) return t("common.unknown_customer");
    const customer = customers.find((c: any) => c.id === customerId);
    return customer ? (isRTL && customer.nameAr ? customer.nameAr : customer.name) : t("common.unknown_customer");
  };

  // Filter calculations by search term
  const filteredCalculations = calculations
    ? calculations.filter((calc: any) => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        const customerName = calc.customerId 
          ? getCustomerName(calc.customerId).toLowerCase() 
          : "";
        
        return (
          customerName.includes(searchLower) ||
          (calc.notes && calc.notes.toLowerCase().includes(searchLower)) ||
          calc.plateType.toLowerCase().includes(searchLower) ||
          calc.calculatedPrice.toString().includes(searchTerm)
        );
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("cliches.historyTitle")}
          </p>
        </div>
        <div className="w-full sm:w-auto relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("common.search")}
            className="pl-8 w-full sm:w-[250px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className={isMobile ? "space-y-4" : ""}>
              {isMobile ? (
                <div className="space-y-4">
                  {filteredCalculations.length > 0 ? filteredCalculations.map((calculation: any) => (
                    <Card key={calculation.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 p-4">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-base font-medium">
                            {calculation.customerId ? getCustomerName(calculation.customerId) : t("cliches.noCustomer")}
                          </CardTitle>
                          <Badge variant="outline" className="ml-2">
                            {calculation.plateType}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(calculation.createdAt), "MMM dd, yyyy HH:mm")}
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              {t("cliches.dimensions")}
                            </span>
                            <span className="text-sm font-medium">
                              {calculation.width} × {calculation.height} cm
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              {t("cliches.area")}
                            </span>
                            <span className="text-sm font-medium">
                              {calculation.area.toFixed(2)} cm²
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              {t("cliches.colors")}
                            </span>
                            <span className="text-sm font-medium">
                              {calculation.colors}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              {t("cliches.price")}
                            </span>
                            <span className="text-sm font-bold text-primary">
                              ${calculation.calculatedPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewDetails(calculation)}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={isDeleteDialogOpen && selectedCalculation?.id === calculation.id}
                            onOpenChange={(open) => {
                              if (!open) setIsDeleteDialogOpen(false);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDelete(calculation)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("common.delete_confirmation")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("common.delete_confirmation_message", { item: "calculation" })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t("common.cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={confirmDelete}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t("common.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {searchTerm 
                          ? t("No matching calculations found") 
                          : t("No calculation history found")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead>{t("cliches.customer")}</TableHead>
                      <TableHead>{t("cliches.dimensions")}</TableHead>
                      <TableHead>{t("cliches.area")}</TableHead>
                      <TableHead>{t("cliches.colors")}</TableHead>
                      <TableHead>{t("cliches.thickness")}</TableHead>
                      <TableHead>{t("common.type")}</TableHead>
                      <TableHead>{t("cliches.price")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCalculations.length > 0 ? filteredCalculations.map((calculation: any) => (
                      <TableRow key={calculation.id}>
                        <TableCell>
                          {format(new Date(calculation.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {calculation.customerId 
                            ? getCustomerName(calculation.customerId) 
                            : t("cliches.noCustomer")}
                        </TableCell>
                        <TableCell>
                          {calculation.width} × {calculation.height} cm
                        </TableCell>
                        <TableCell>
                          {calculation.area.toFixed(2)} cm²
                        </TableCell>
                        <TableCell>
                          {calculation.colors}
                        </TableCell>
                        <TableCell>
                          {calculation.thickness ? `${calculation.thickness} mm` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{calculation.plateType}</Badge>
                        </TableCell>
                        <TableCell className="font-bold text-primary">
                          ${calculation.calculatedPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleViewDetails(calculation)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              {t("common.view")}
                            </Button>
                            <AlertDialog
                              open={isDeleteDialogOpen && selectedCalculation?.id === calculation.id}
                              onOpenChange={(open) => {
                                if (!open) setIsDeleteDialogOpen(false);
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDelete(calculation)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  {t("common.delete")}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("common.delete_confirmation")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("common.delete_confirmation_message", { item: "calculation" })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t("common.cancel")}
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={confirmDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t("common.delete")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-6">
                          <p className="text-muted-foreground">
                            {searchTerm 
                              ? t("No matching calculations found") 
                              : t("No calculation history found")}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Calculation Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {t("cliches.calculationDetails")}
            </DialogTitle>
            <DialogDescription>
              {selectedCalculation && format(new Date(selectedCalculation.createdAt), "MMMM dd, yyyy HH:mm:ss")}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCalculation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("cliches.customer")}
                  </Label>
                  <div className="font-medium mt-1">
                    {selectedCalculation.customerId 
                      ? getCustomerName(selectedCalculation.customerId) 
                      : t("cliches.noCustomer")}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("common.type")}
                  </Label>
                  <div className="font-medium mt-1">
                    {selectedCalculation.plateType}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("cliches.dimensions")}
                  </Label>
                  <div className="font-medium mt-1">
                    {selectedCalculation.width} × {selectedCalculation.height} cm
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("cliches.area")}
                  </Label>
                  <div className="font-medium mt-1">
                    {selectedCalculation.area.toFixed(2)} cm²
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("cliches.colors")}
                  </Label>
                  <div className="font-medium mt-1">
                    {selectedCalculation.colors}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("cliches.thickness")}
                  </Label>
                  <div className="font-medium mt-1">
                    {selectedCalculation.thickness ? `${selectedCalculation.thickness} mm` : "-"}
                  </div>
                </div>
              </div>
              
              <H4>{t("cliches.pricingFactors")}</H4>
              
              <div className="grid grid-cols-2 gap-4 pb-2">
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("cliches.basePrice")}
                  </Label>
                  <div className="font-medium mt-1">
                    ${selectedCalculation.basePricePerUnit}/cm²
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("cliches.colorFactor")}
                  </Label>
                  <div className="font-medium mt-1">
                    {selectedCalculation.colorMultiplier.toFixed(2)}x
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("cliches.thicknessFactor")}
                  </Label>
                  <div className="font-medium mt-1">
                    {selectedCalculation.thicknessMultiplier.toFixed(2)}x
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("cliches.appliedDiscount")}
                  </Label>
                  <div className="font-medium mt-1">
                    {selectedCalculation.customerDiscount || 0}%
                  </div>
                </div>
              </div>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <Label className="text-sm">{t("cliches.price")}</Label>
                <div className="text-3xl font-bold text-primary mt-1">
                  ${selectedCalculation.calculatedPrice.toFixed(2)}
                </div>
              </div>
              
              {selectedCalculation.notes && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t("cliches.notes")}
                  </Label>
                  <div className="bg-muted/30 p-3 rounded mt-1">
                    {selectedCalculation.notes}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setIsDetailsOpen(false)}>
              {t("common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}