import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/lib/constants";
import { MixMaterial, RawMaterial, User } from "@shared/schema";
import { formatDateString } from "@/lib/utils";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MixMaterialForm } from "@/components/production/mix-material-form";
import { MixDetails } from "@/components/production/mix-details";
import { AbaCalculator, AbaPrintTemplate } from "@/components/production/aba-calculator";

import { AbaMaterialsDnd } from "@/components/production/aba-materials-dnd";

import type { MaterialDistribution as DndMaterialDistribution } from "@/components/production/aba-materials-dnd";
import { FilterSummary } from "@/components/production/filter-summary";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth-v2";
import { usePermissions } from "@/hooks/use-permissions";
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

// Define the interface for print data
interface PrintData {
  mix: any;
  items: any[];
  totalWeight: number;
  materialNames: {[key: number]: string};
  userData?: any[];
}

// Note: Material distribution conversion functions removed with ABA configs

export default function MixMaterialsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [selectedMixId, setSelectedMixId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [mixToDelete, setMixToDelete] = useState<number | null>(null);
  const [printableData, setPrintableData] = useState<PrintData | null>(null);
  
  // Check if user has permissions for various actions
  const canCreate = hasPermission("Mix Materials", "create");
  const canEdit = hasPermission("Mix Materials", "edit");
  const canDelete = hasPermission("Mix Materials", "delete");

  // Fetch all mix materials
  const { data: mixMaterials, isLoading: mixLoading, refetch: refetchMixes } = useQuery<MixMaterial[]>({
    queryKey: [API_ENDPOINTS.MIX_MATERIALS],
  });
  
  // Filter mix materials by date, week, or month
  const getFilteredMixMaterials = () => {
    if (!mixMaterials) return [];
    
    if (filterMode === 'all') return mixMaterials;
    
    return mixMaterials.filter(mix => {
      const mixDate = parseISO(mix.mixDate.toString());
      
      if (filterMode === 'date' && filterDate) {
        const filterDateObj = new Date(filterDate);
        return format(mixDate, 'yyyy-MM-dd') === format(filterDateObj, 'yyyy-MM-dd');
      }
      
      if (filterMode === 'week' && filterWeek) {
        const [year, week] = filterWeek.split('-W');
        const startDate = startOfWeek(new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7));
        const endDate = endOfWeek(startDate);
        
        return isWithinInterval(mixDate, { start: startDate, end: endDate });
      }
      
      if (filterMode === 'month' && filterMonth) {
        const [year, month] = filterMonth.split('-');
        const startDate = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
        const endDate = endOfMonth(startDate);
        
        return isWithinInterval(mixDate, { start: startDate, end: endDate });
      }
      
      return true;
    });
  };

  // Fetch raw materials for the select dropdown in the form
  const { data: rawMaterials } = useQuery<RawMaterial[]>({
    queryKey: [API_ENDPOINTS.RAW_MATERIALS],
  });
  
  // Fetch users to map operator IDs to names
  const { data: users } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
  });
  
  // Function to get operator name from ID
  const getOperatorName = (operatorId: string) => {
    if (!users || !Array.isArray(users)) return operatorId;
    const user = users.find(user => user.id === operatorId);
    if (!user) return operatorId;
    
    // Create a full name from firstName and lastName
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    
    // Fallback to username if no name components available
    return user.username || operatorId;
  };
  
  // Delete mix mutation
  const [abaCalculationData, setAbaCalculationData] = useState<any>(null);
  // Note: ABA material types removed with config functionality

  // Note: Material conversion functions removed with ABA config functionality

  const convertDndToConfig = (
    dnd: DndMaterialType[], 
    aTotalWeight: number = 155, 
    bTotalWeight: number = 515
  ): ConfigMaterialType[] => {
    return dnd.map((item) => {
      // Calculate kg values based on percentages and the provided total weights
      const aKg = (item.screwAPercentage / 100) * aTotalWeight;
      const bKg = (item.screwBPercentage / 100) * bTotalWeight;
      
      return {
        material: item.materialName,
        aKg: aKg,
        bKg: bKg,
        totalKg: aKg + bKg,
        aPercentage: item.screwAPercentage,
        bPercentage: item.screwBPercentage,
        color: getRandomColor() // Generate a color for visual representation
      };
    });
  };
  
  // Function to generate a random pastel color
  const getRandomColor = (): string => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 80%)`;
  };
  
  const [materialDistributions, setMaterialDistributions] = useState<DndMaterialType[]>([]);
  const [configName, setConfigName] = useState<string>("");
  const [configDescription, setConfigDescription] = useState<string>("");
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  
  // Date filtering states - Default to today's date filter
  const [filterMode, setFilterMode] = useState<'all' | 'date' | 'week' | 'month'>('date');
  const [filterDate, setFilterDate] = useState<Date | null>(new Date());
  const [filterWeek, setFilterWeek] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  
  // Define AbaConfig type
  interface AbaConfig {
    id: number;
    name: string;
    description: string | null;
    configData: DndMaterialDistribution[];
    isDefault: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string | null;
  }
  
  // Note: ABA material configs have been removed from the database

  const deleteMixMutation = useMutation({
    mutationFn: async (mixId: number) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.MIX_MATERIALS}/${mixId}`);
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
      cell: (row: any) => getOperatorName(row.mixPerson),
    },
    {
      header: t('production.mix_materials.total_weight'),
      accessorKey: "totalQuantity" as const,
      cell: (row: { totalQuantity: number | null }) => row.totalQuantity?.toFixed(2) || "0.00",
    },
    {
      header: "Screw",
      accessorKey: "mixScrew" as const,
      cell: (row: { mixScrew: string | null }) => row.mixScrew || "-",
    },
    {
      header: t('common.actions'),
      id: "actions",
      cell: (row: MixMaterial) => (
        <div className="flex space-x-2">
          {/* View button is always available */}
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
          
          {/* Print button is always available */}
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
          
          {/* Delete button only if user has delete permission */}
          {canDelete && (
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
          )}
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
      
      // Make sure we have the users data to display proper operator name
      let userData = users;
      if (!userData) {
        // Fetch users if not already loaded
        const usersResponse = await fetch(API_ENDPOINTS.USERS);
        userData = await usersResponse.json();
      }
      
      // Store the data for the printable label
      setPrintableData({
        mix: mixData,
        items: mixItems,
        totalWeight,
        materialNames,
        userData
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
    
    const { mix, items, totalWeight, materialNames, userData } = printableData as PrintData;
    
    // Function to get operator name specifically for the print label
    const getPrintOperatorName = (operatorId: string) => {
      if (!userData) return operatorId;
      const user = userData.find((user: any) => user.id === operatorId);
      if (!user) return operatorId;
      
      // Create a full name from firstName and lastName
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      
      if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
      }
      
      // Fallback to username if no name components available
      return user.username || operatorId;
    };
    
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
          <div>{t('production.mix_materials.operator')}: {getPrintOperatorName(mix.mixPerson)}</div>
          <div>{t('production.mix_materials.total_weight')}: {totalWeight.toFixed(2)} kg</div>
          <div>{t('production.mix_materials.screw')}: {mix.mixScrew || "-"}</div>
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
            {items.map((item: { id: number; quantity: number; rawMaterialId: number }) => {
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
    const filteredMixMaterials = getFilteredMixMaterials();
    
    if (!filteredMixMaterials || filteredMixMaterials.length === 0) {
      return (
        <div className="text-center py-12 px-4 bg-gray-50 rounded-lg">
          <span className="material-icons text-gray-300 text-4xl mb-3 block">science</span>
          <p className="text-gray-500 text-sm">{t('production.mix_materials.no_mixes')}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {filteredMixMaterials.map((mix) => (
          <Card 
            key={mix.id} 
            className="overflow-hidden hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary-500"
            onClick={() => {
              setSelectedMixId(mix.id);
              setIsViewDialogOpen(true);
            }}
          >
            <CardHeader className="p-4 pb-3 bg-gradient-to-r from-gray-50 to-primary-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary-100 rounded-full">
                    <span className="material-icons text-sm text-primary-600">science</span>
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900">
                      Mix #{mix.id}
                    </CardTitle>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {formatDateString(mix.mixDate.toString())}
                    </p>
                  </div>
                </div>
                <span className="material-icons text-gray-400 text-lg">chevron_right</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t('production.mix_materials.operator')}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{getOperatorName(mix.mixPerson)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">{t('production.mix_materials.total_weight')}</p>
                  <p className="text-sm font-medium text-gray-900">{mix.totalQuantity?.toFixed(2) || "0.00"} kg</p>
                </div>
              </div>
              
              {mix.mixScrew && (
                <div className="bg-blue-50 p-3 rounded-lg mb-3">
                  <p className="text-xs text-blue-600 mb-1">{t('production.mix_materials.screw')}</p>
                  <p className="text-sm font-medium text-blue-900">{mix.mixScrew}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <div className="flex items-center text-xs text-gray-500">
                  <span className="material-icons text-xs mr-1">touch_app</span>
                  Tap to view details
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      printMixLabel(mix.id);
                    }}
                    className="h-9 w-9 rounded-full text-primary-600 hover:text-primary-700 hover:bg-primary-100"
                  >
                    <span className="material-icons text-sm">print</span>
                  </Button>
                  {canDelete && (
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMix(mix.id);
                      }}
                      className="h-9 w-9 rounded-full text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      <span className="material-icons text-sm">delete</span>
                    </Button>
                  )}
                </div>
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
      <div className="space-y-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="h-16 bg-gradient-to-r from-gray-100 to-gray-200"></div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-gray-100 rounded-lg"></div>
                <div className="h-12 bg-gray-100 rounded-lg"></div>
              </div>
              <div className="h-4 bg-gray-100 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // ABA Config selector component
  const AbaConfigSelector = () => {
    return (
      <div className="mb-4">
        <div className="text-center py-4 px-2 bg-gray-50 rounded-md mb-4">
          <p className="text-gray-500">ABA configurations have been removed from the database</p>
        </div>
      </div>
    );
  };
  
  // Note: ABA material config mutations have been removed
  
  // Handle saving ABA material configurations (disabled - configs removed)
  const handleSaveAbaConfig = (distributions: DndMaterialDistribution[]) => {
    setMaterialDistributions(distributions);
    // ABA config save functionality has been removed
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-optimized header */}
      <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex justify-between items-center'} mb-4 sm:mb-6`}>
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-primary-700`}>
          {t('production.mix_materials.title')}
        </h1>
        {canCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className={`${isMobile ? 'w-full justify-center' : 'flex items-center gap-1'}`}>
                <span className="material-icons text-sm">add</span>
                <span className="ml-1">{t('production.mix_materials.new_mix')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className={isMobile ? "max-w-[95vw] max-h-[95vh] p-3 sm:p-6 overflow-y-auto" : "sm:max-w-[550px]"}>
              <DialogHeader>
                <DialogTitle className={isMobile ? 'text-lg' : ''}>{t('production.mix_materials.new_mix')}</DialogTitle>
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
        )}
      </div>

      <Tabs defaultValue="mix_materials" className="w-full">
        <TabsList className={`grid w-full mb-4 ${isMobile ? 'grid-cols-1 gap-1 h-auto p-1' : 'grid-cols-3'}`}>
          <TabsTrigger value="mix_materials" className={isMobile ? 'w-full justify-start py-3 px-4' : ''}>
            <span className="material-icons text-sm mr-2">science</span>
            <span className={isMobile ? 'text-sm' : ''}>{t('production.mix_materials.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="aba_calculator" className={isMobile ? 'w-full justify-start py-3 px-4' : ''}>
            <span className="material-icons text-sm mr-2">calculate</span>
            <span className={isMobile ? 'text-sm' : ''}>{t('production.aba_calculator.title')}</span>
          </TabsTrigger>
          <TabsTrigger value="aba_config" className={isMobile ? 'w-full justify-start py-3 px-4' : ''}>
            <span className="material-icons text-sm mr-2">settings</span>
            <span className={isMobile ? 'text-sm' : ''}>{t('production.aba_calculator.config_tab')}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="mix_materials">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{t('production.mix_materials.title')}</span>
                <div className="flex items-center gap-2">
                  {isMobile && filterMode !== 'all' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFilterMode('all');
                        setFilterDate(null);
                        setFilterWeek(null);
                        setFilterMonth(null);
                      }}
                      className="h-8 w-8 p-0 rounded-full"
                    >
                      <span className="material-icons text-sm">filter_alt_off</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchMixes()}
                    className="ml-auto"
                  >
                    <span className="material-icons text-sm mr-1">refresh</span>
                    {!isMobile && t('common.refresh')}
                  </Button>
                </div>
              </CardTitle>
              
              {/* Date/Week/Month Filter Controls */}
              <div className="mt-4 flex flex-wrap gap-3 items-center">
                {!isMobile ? (
                  <>
                    <div className="flex">
                      <Button 
                        variant={filterMode === 'all' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setFilterMode('all')}
                        className="rounded-r-none"
                      >
                        All
                      </Button>
                      <Button 
                        variant={filterMode === 'date' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setFilterMode('date')}
                        className="rounded-none border-x-0"
                      >
                        Date
                      </Button>
                      <Button 
                        variant={filterMode === 'week' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setFilterMode('week')}
                        className="rounded-none border-r-0"
                      >
                        Week
                      </Button>
                      <Button 
                        variant={filterMode === 'month' ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setFilterMode('month')}
                        className="rounded-l-none"
                      >
                        Month
                      </Button>
                    </div>
                    
                    {filterMode === 'date' && (
                      <div className="flex-1 min-w-[200px]">
                        <input 
                          type="date" 
                          value={filterDate ? format(new Date(filterDate), 'yyyy-MM-dd') : ''} 
                          onChange={(e) => setFilterDate(e.target.value ? new Date(e.target.value) : null)}
                          className="w-full px-3 py-1 border rounded"
                        />
                      </div>
                    )}
                    
                    {filterMode === 'week' && (
                      <div className="flex-1 min-w-[200px]">
                        <input 
                          type="week" 
                          value={filterWeek || ''} 
                          onChange={(e) => setFilterWeek(e.target.value)}
                          className="w-full px-3 py-1 border rounded"
                        />
                      </div>
                    )}
                    
                    {filterMode === 'month' && (
                      <div className="flex-1 min-w-[200px]">
                        <input 
                          type="month" 
                          value={filterMonth || ''} 
                          onChange={(e) => setFilterMonth(e.target.value)}
                          className="w-full px-3 py-1 border rounded"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  /* Mobile filters */
                  <div className="w-full flex gap-2">
                    <select 
                      className="flex-1 p-2 border rounded"
                      value={filterMode}
                      onChange={(e) => {
                        setFilterMode(e.target.value as 'all' | 'date' | 'week' | 'month');
                      }}
                    >
                      <option value="all">All Mixes</option>
                      <option value="date">Filter by Date</option>
                      <option value="week">Filter by Week</option>
                      <option value="month">Filter by Month</option>
                    </select>
                    
                    {filterMode === 'date' && (
                      <input 
                        type="date" 
                        value={filterDate ? format(new Date(filterDate), 'yyyy-MM-dd') : ''} 
                        onChange={(e) => setFilterDate(e.target.value ? new Date(e.target.value) : null)}
                        className="flex-1 p-2 border rounded"
                      />
                    )}
                    
                    {filterMode === 'week' && (
                      <input 
                        type="week" 
                        value={filterWeek || ''} 
                        onChange={(e) => setFilterWeek(e.target.value)}
                        className="flex-1 p-2 border rounded"
                      />
                    )}
                    
                    {filterMode === 'month' && (
                      <input 
                        type="month" 
                        value={filterMonth || ''} 
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="flex-1 p-2 border rounded"
                      />
                    )}
                  </div>
                )}
              </div>
              
              {/* Filter summary */}
              {filterMode !== 'all' && (
                <div className="mt-3 p-2 bg-blue-50 text-blue-700 rounded-md flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="material-icons text-sm mr-2">filter_list</span>
                    <span className="text-sm font-medium">
                      {filterMode === 'date' && filterDate && 
                        `Showing mixes for: ${format(new Date(filterDate), 'MMMM d, yyyy')}`}
                      {filterMode === 'week' && filterWeek && 
                        `Showing mixes for week: ${filterWeek.replace('-W', ', Week ')}`}
                      {filterMode === 'month' && filterMonth && 
                        `Showing mixes for: ${format(new Date(`${filterMonth}-01`), 'MMMM yyyy')}`}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setFilterMode('all');
                      setFilterDate(null);
                      setFilterWeek(null);
                      setFilterMonth(null);
                    }}
                    className="h-7 text-blue-700 hover:bg-blue-100"
                  >
                    <span className="material-icons text-sm mr-1">clear</span>
                    Clear
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {mixLoading ? (
                isMobile ? renderMobileLoadingState() : <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
              ) : isMobile ? (
                renderMobileCards()
              ) : (
                <DataTable 
                  data={getFilteredMixMaterials()}
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
              <CardTitle>{t('production.aba_calculator.title')}</CardTitle>
              <CardDescription>
                {t('production.aba_calculator.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* ABA calculator component has been removed */}
              <div className="text-center py-8 px-4 bg-gray-50 rounded-md">
                <p className="text-gray-600">ABA Calculator has been removed from the system</p>
              </div>


            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="aba_config">
          <Card>
            <CardHeader className={`${isMobile ? 'p-4 pb-2' : 'pb-0'}`}>
              <CardTitle className={isMobile ? 'text-lg' : ''}>{t('production.aba_calculator.config_tab')}</CardTitle>
              <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center justify-between'} mt-1`}>
                <CardDescription className={isMobile ? 'text-sm' : ''}>
                  {t('production.aba_calculator.drag_help')}
                </CardDescription>
                <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex space-x-2'}`}>
                  {selectedConfigId && (
                    <Button 
                      variant="outline" 
                      size={isMobile ? "default" : "sm"}
                      onClick={() => {
                        setSelectedConfigId(null);
                        setConfigName("");
                        setConfigDescription("");
                        setMaterialDistributions([]);
                      }}
                      className={isMobile ? 'w-full justify-center' : ''}
                    >
                      <span className="material-icons text-xs mr-1">add</span>
                      {t('production.aba_calculator.new_config')}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Filter summary */}
              {filterMode !== 'all' && (
                <div className="mt-3 p-2 bg-blue-50 text-blue-700 rounded-md flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="material-icons text-sm mr-2">filter_list</span>
                    <span className="text-sm font-medium">
                      {filterMode === 'date' && filterDate && 
                        `Showing mixes for: ${format(new Date(filterDate), 'MMMM d, yyyy')}`}
                      {filterMode === 'week' && filterWeek && 
                        `Showing mixes for week: ${filterWeek.replace('-W', ', Week ')}`}
                      {filterMode === 'month' && filterMonth && 
                        `Showing mixes for: ${format(new Date(`${filterMonth}-01`), 'MMMM yyyy')}`}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setFilterMode('all');
                      setFilterDate(null);
                      setFilterWeek(null);
                      setFilterMonth(null);
                    }}
                    className="h-7 text-blue-700 hover:bg-blue-100"
                  >
                    <span className="material-icons text-sm mr-1">clear</span>
                    Clear
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                {selectedConfigId ? (
                  <div className="p-3 mb-4 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-sm">{t('production.aba_calculator.editing_config')}</h3>
                        <p className="text-primary-600 font-medium">{configName}</p>
                        {configDescription && (
                          <p className="text-sm text-gray-600 mt-1">{configDescription}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-primary-600"
                        onClick={() => {
                          const newName = prompt(t('production.aba_calculator.update_config_name'), configName);
                          if (newName) {
                            const newDesc = prompt(t('production.aba_calculator.update_config_desc'), configDescription);
                            setConfigName(newName);
                            setConfigDescription(newDesc || "");
                            
                            // ABA config update disabled - configs removed from database
                            console.log("ABA config update disabled");
                          }
                        }}
                      >
                        <span className="material-icons text-xs mr-1">edit</span>
                        {t('common.edit')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 mb-4 bg-blue-50 border border-blue-100 rounded-md">
                    <p className="text-blue-700 text-sm">
                      <span className="material-icons text-xs mr-1 align-middle">info</span>
                      {t('production.aba_calculator.create_new_config_info')}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <AbaMaterialsDnd
                    rawMaterials={rawMaterials || []}
                    onSave={handleSaveAbaConfig}
                    initialDistributions={materialDistributions}
                  />
                </div>
                <div className="lg:col-span-1">
                  <div className="text-center py-4 px-2 bg-gray-50 rounded-md">
                    <p className="text-gray-500">ABA configurations have been removed</p>
                  </div>
                </div>
              </div>
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