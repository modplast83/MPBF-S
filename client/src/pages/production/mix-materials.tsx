import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/lib/constants";
import { MixMaterial, RawMaterial } from "@shared/schema";
import { formatDateString } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MixMaterialForm } from "@/components/production/mix-material-form";
import { MixDetails } from "@/components/production/mix-details";
import { AbaCalculator, AbaPrintTemplate } from "@/components/production/aba-calculator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function MixMaterialsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isRTL } = useLanguage();
  const [selectedMixId, setSelectedMixId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mixToDelete, setMixToDelete] = useState<number | null>(null);
  const [printableData, setPrintableData] = useState<{
    mix: any;
    items: any[];
    totalWeight: number;
    materialNames: {[key: number]: string};
  } | null>(null);

  // Fetch all mix materials
  const { data: mixMaterials, isLoading: mixLoading, refetch: refetchMixes } = useQuery<MixMaterial[]>({
    queryKey: [API_ENDPOINTS.MIX_MATERIALS],
  });

  // Fetch raw materials for the select dropdown in the form
  const { data: rawMaterials } = useQuery<RawMaterial[]>({
    queryKey: [API_ENDPOINTS.RAW_MATERIALS],
  });
  
  // Delete mix mutation
  const [abaCalculationData, setAbaCalculationData] = useState<any>(null);

  const deleteMixMutation = useMutation({
    mutationFn: async (mixId: number) => {
      await apiRequest(`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("common.delete_success"),
        variant: "default",
      });
      refetchMixes();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: `${t("common.delete_error")}: ${error}`,
        variant: "destructive",
      });
    }
  });

  const handleDeleteMix = (id: number) => {
    setMixToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (mixToDelete !== null) {
      deleteMixMutation.mutate(mixToDelete);
      setIsDeleteDialogOpen(false);
      setMixToDelete(null);
    }
  };

  // Machines no longer needed for mix materials

  // Table columns for mix materials
  const mixColumns = [
    {
      header: t('production.mix_materials.mix_id'),
      accessorKey: "id" as const,
    },
    {
      header: t('production.mix_materials.date'),
      accessorKey: "mixDate" as const,
      cell: (row: any) => formatDateString(row.mixDate.toString()),
    },
    {
      header: t('production.mix_materials.operator'),
      accessorKey: "mixPerson" as const,
    },
    {
      header: t('production.mix_materials.total_weight'),
      accessorKey: "totalQuantity" as const,
      cell: (row: { totalQuantity: number | null }) => row.totalQuantity?.toFixed(2) || "0.00",
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row: MixMaterial) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-500 hover:text-primary-700"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMixId(row.id);
              setIsViewDialogOpen(true);
            }}
          >
            <span className="material-icons text-sm">visibility</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-500 hover:text-primary-700"
            onClick={(e) => {
              e.stopPropagation();
              printMixLabel(row.id);
            }}
          >
            <span className="material-icons text-sm">print</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteMix(row.id);
            }}
          >
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];
  
  // Function to prepare the data for printing
  const preparePrintData = async (mixId: number) => {
    try {
      // Fetch mix details
      const response = await fetch(`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}`);
      const mixData = await response.json();
      
      // Fetch mix items
      const itemsResponse = await fetch(`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}/items`);
      const mixItems = await itemsResponse.json();
      
      // Calculate total weight
      const totalWeight = mixItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      
      // Get material names for the items
      const materialNames: {[key: number]: string} = {};
      if (rawMaterials) {
        rawMaterials.forEach(material => {
          materialNames[material.id] = material.name;
        });
      }
      
      // Store the data for the printable label
      setPrintableData({
        mix: mixData,
        items: mixItems,
        totalWeight,
        materialNames
      });
      
      // Trigger print immediately
      setTimeout(() => {
        window.print();
      }, 100);
    } catch (error) {
      console.error("Failed to prepare print data:", error);
    }
  };

  // Function to print a mix label directly
  const printMixLabel = (mixId: number) => {
    preparePrintData(mixId);
  };

  // Create printable label component
  const PrintableLabel = () => {
    if (!printableData) return null;
    
    const { mix, items, totalWeight, materialNames } = printableData;
    
    return (
      <div className="printable-label" style={{ width: "3in", height: "5in", padding: "0.25in" }}>
        <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "10px", textAlign: "center" }}>
          {t('production.mix_materials.mix_label')}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px solid #ccc", paddingBottom: "0.1in" }}>
          <div>{t('production.mix_materials.mix_id')}: {mix.id}</div>
          <div>{t('production.mix_materials.date')}: {formatDateString(mix.mixDate)}</div>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <div>{t('production.mix_materials.operator')}: {mix.mixPerson}</div>
          <div>{t('production.mix_materials.total_weight')}: {totalWeight.toFixed(2)} kg</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>{t('production.mix_materials.material')}</th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>{t('production.mix_materials.quantity')}</th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>{t('production.mix_materials.percentage')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const percentage = ((item.quantity / totalWeight) * 100).toFixed(1);
              const materialName = materialNames[item.rawMaterialId] || `Material ${item.rawMaterialId}`;
              return (
                <tr key={item.id}>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{materialName}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px", textAlign: "right" }}>{item.quantity.toFixed(2)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px", textAlign: "right" }}>{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ borderTop: "1px solid #ccc", paddingTop: "0.1in", display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "10px" }}>
          <div>Total: {items.length}</div>
          <div>{totalWeight.toFixed(2)} kg</div>
        </div>
        <div style={{ textAlign: "center", fontSize: "8pt", marginTop: "0.1in" }}>
          {new Date().toLocaleString()}<br/>
          Size: 3" x 5"
        </div>
      </div>
    );
  };
  
  // Mobile card view for mix materials
  const renderMobileCards = () => {
    if (!mixMaterials || mixMaterials.length === 0) {
      return (
        <div className="text-center py-8 px-4 bg-gray-50 rounded-md">
          <span className="material-icons text-gray-300 text-3xl mb-2">science</span>
          <p className="text-gray-500">{t('production.mix_materials.no_mixes')}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {mixMaterials.map((mix) => (
          <Card 
            key={mix.id} 
            className="overflow-hidden hover:shadow-md transition-all"
            onClick={() => {
              setSelectedMixId(mix.id);
              setIsViewDialogOpen(true);
            }}
          >
            <CardHeader className="p-3 pb-2 flex flex-row justify-between items-start bg-gray-50">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="material-icons text-xs text-primary-500">science</span>
                  <CardTitle className="text-sm font-semibold">
                    {t('production.mix_materials.mix_id')}: {mix.id}
                  </CardTitle>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateString(mix.mixDate.toString())}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-xs text-gray-500">{t('production.mix_materials.operator')}</p>
                  <p className="text-sm font-medium">{mix.mixPerson}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('production.mix_materials.total_weight')}</p>
                  <p className="text-sm font-medium">{mix.totalQuantity?.toFixed(2) || "0.00"} kg</p>
                </div>
              </div>
              
              <div className="mt-3 pt-2 flex justify-end items-center space-x-2 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    printMixLabel(mix.id);
                  }}
                  className="h-8 w-8 rounded-full text-primary-500 hover:text-primary-700 hover:bg-primary-50"
                >
                  <span className="material-icons text-sm">print</span>
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMix(mix.id);
                  }}
                  className="h-8 w-8 rounded-full text-error-500 hover:text-error-700 hover:bg-error-50"
                >
                  <span className="material-icons text-sm">delete</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  // Mobile loading state
  const renderMobileLoadingState = () => {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary-700">{t('production.mix_materials.title')}</h1>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <span className="material-icons text-sm">add</span>
                {isMobile ? "" : t('production.mix_materials.new_mix')}
              </Button>
            </DialogTrigger>
            <DialogContent className={isMobile ? "max-w-[95vw] p-4 sm:p-6" : "sm:max-w-[550px]"}>
              <DialogHeader>
                <DialogTitle>{t('production.mix_materials.new_mix')}</DialogTitle>
              </DialogHeader>
              <MixMaterialForm 
                rawMaterials={rawMaterials || []}
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  refetchMixes();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="mix_materials" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="mix_materials">
            <span className="material-icons text-sm mr-1">science</span>
            {t('production.mix_materials.title')}
          </TabsTrigger>
          <TabsTrigger value="aba_calculator">
            <span className="material-icons text-sm mr-1">calculate</span>
            {t('production.aba_calculator.title', 'ABA Calculator')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="mix_materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{t('production.mix_materials.title')}</span>
                {!isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchMixes()}
                    className="ml-auto"
                  >
                    <span className="material-icons text-sm mr-1">refresh</span>
                    {t('common.refresh')}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mixLoading ? (
                isMobile ? renderMobileLoadingState() : <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
              ) : isMobile ? (
                renderMobileCards()
              ) : (
                <DataTable 
                  data={mixMaterials || []}
                  columns={mixColumns as any}
                  onRowClick={(row) => {
                    setSelectedMixId(row.id);
                    setIsViewDialogOpen(true);
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="aba_calculator">
          <Card>
            <CardHeader>
              <CardTitle>{t('production.aba_calculator.title', 'ABA Calculator')}</CardTitle>
            </CardHeader>
            <CardContent>
              <AbaCalculator 
                onPrint={(data) => {
                  setAbaCalculationData(data);
                  setTimeout(() => {
                    window.print();
                  }, 100);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mix details dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className={isMobile ? "max-w-[95vw] p-4 overflow-y-auto max-h-[90vh]" : "sm:max-w-[750px]"}>
          <DialogHeader>
            <DialogTitle>{t('production.mix_materials.title')}</DialogTitle>
          </DialogHeader>
          {selectedMixId && (
            <MixDetails 
              mixId={selectedMixId} 
              rawMaterials={rawMaterials || []}
              onClose={() => setIsViewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden printable label that will only show when printing */}
      <div className="hidden print:block print:m-0 print:p-0">
        {abaCalculationData ? <AbaPrintTemplate data={abaCalculationData} /> : <PrintableLabel />}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className={isMobile ? "max-w-[95vw] p-4 sm:p-6" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("common.delete_confirmation_message", { item: t("production.mix_materials.title") })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isMobile ? "flex-col space-y-2" : ""}>
            <AlertDialogCancel className={isMobile ? "w-full mt-0" : ""}>
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className={`bg-red-600 hover:bg-red-700 text-white ${isMobile ? "w-full" : ""}`}
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}