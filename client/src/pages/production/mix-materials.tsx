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
import { AbaMaterialsDnd, MaterialDistribution } from "@/components/production/aba-materials-dnd";
import { FilterSummary } from "@/components/production/filter-summary";
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

// Define the interface for print data
interface PrintData {
  mix: any;
  items: any[];
  totalWeight: number;
  materialNames: {[key: number]: string};
  userData?: any[];
}

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
  const [printableData, setPrintableData] = useState<PrintData | null>(null);

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
  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
    staleTime: 5 * 60 * 1000, // 5 minutes stale time
  });
  
  // Function to get operator name from ID
  const getOperatorName = (operatorId: string) => {
    // If users are still loading or operatorId is empty, show loading indicator
    if (usersLoading) return `${t('common.loading')}...`;
    if (!operatorId) return t('common.not_available');
    if (!users || users.length === 0) return operatorId;
    
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
  const [materialDistributions, setMaterialDistributions] = useState<MaterialDistribution[]>([]);
  const [configName, setConfigName] = useState<string>("");
  const [configDescription, setConfigDescription] = useState<string>("");
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  
  // Date filtering states
  const [filterMode, setFilterMode] = useState<'all' | 'date' | 'week' | 'month'>('all');
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterWeek, setFilterWeek] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState<string | null>(null);
  
  // Define AbaConfig type
  interface AbaConfig {
    id: number;
    name: string;
    description: string | null;
    configData: MaterialDistribution[];
    isDefault: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt: string | null;
  }
  
  // Fetch saved ABA material configurations from the database
  const { data: abaConfigs, isLoading: configsLoading, refetch: refetchConfigs } = useQuery<AbaConfig[]>({
    queryKey: [API_ENDPOINTS.ABA_MATERIAL_CONFIGS],
    initialData: [],
  });
  
  // Fetch the default configuration if available
  const { data: defaultConfig } = useQuery<AbaConfig>({
    queryKey: [`${API_ENDPOINTS.ABA_MATERIAL_CONFIGS}/default`],
    enabled: true,
  });
  
  // Update state when default config is fetched
  useEffect(() => {
    if (defaultConfig && defaultConfig.configData) {
      setMaterialDistributions(defaultConfig.configData);
      setConfigName(defaultConfig.name);
      setConfigDescription(defaultConfig.description || "");
      setSelectedConfigId(defaultConfig.id);
    }
  }, [defaultConfig]);

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
      cell: (row: any) => {
        const operatorName = getOperatorName(row.mixPerson);
        return (
          <div className="flex items-center">
            <span className="material-icons text-sm mr-2 text-gray-500">person</span>
            <span>{operatorName}</span>
          </div>
        );
      },
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
        <div className="text-center py-8 px-4 bg-gray-50 rounded-md">
          <span className="material-icons text-gray-300 text-3xl mb-2">science</span>
          <p className="text-gray-500">{t('production.mix_materials.no_mixes')}</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredMixMaterials.map((mix) => (
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
                  <div className="flex items-center mt-1">
                    <span className="material-icons text-xs mr-1 text-gray-500">person</span>
                    <p className="text-sm font-medium">{getOperatorName(mix.mixPerson)}</p>
                  </div>
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
  
  // ABA Config selector component
  const AbaConfigSelector = () => {
    if (configsLoading) {
      return <div className="h-24 animate-pulse bg-gray-100 rounded-md"></div>;
    }
    
    if (abaConfigs.length === 0) {
      return (
        <div className="text-center py-4 px-2 bg-gray-50 rounded-md mb-4">
          <p className="text-gray-500">{t('production.aba_calculator.no_saved_configs')}</p>
        </div>
      );
    }
    
    return (
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">{t('production.aba_calculator.saved_configurations')}</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {abaConfigs.map((config) => (
            <div 
              key={config.id} 
              className={`flex items-center justify-between p-2 rounded-md border ${
                selectedConfigId === config.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
              }`}
            >
              <div className="flex-1 mr-2">
                <div className="flex items-center">
                  <span className="font-medium text-sm">{config.name}</span>
                  {config.isDefault && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                      {t('common.default')}
                    </span>
                  )}
                </div>
                {config.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{config.description}</p>
                )}
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 rounded-full"
                  title={t('common.load')}
                  onClick={() => {
                    setMaterialDistributions(config.configData);
                    setConfigName(config.name);
                    setConfigDescription(config.description || "");
                    setSelectedConfigId(config.id);
                  }}
                >
                  <span className="material-icons text-xs">file_open</span>
                </Button>
                {!config.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-full"
                    title={t('production.aba_calculator.set_as_default')}
                    onClick={() => setDefaultConfigMutation.mutate(config.id)}
                  >
                    <span className="material-icons text-xs">star</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 rounded-full text-error-500 hover:text-error-700"
                  title={t('common.delete')}
                  onClick={() => {
                    if (confirm(t('common.delete_confirmation'))) {
                      deleteConfigMutation.mutate(config.id);
                    }
                  }}
                >
                  <span className="material-icons text-xs">delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Create ABA material config mutation
  const createConfigMutation = useMutation({
    mutationFn: async (data: { name: string, description: string, configData: MaterialDistribution[], isDefault: boolean }) => {
      return await apiRequest("POST", API_ENDPOINTS.ABA_MATERIAL_CONFIGS, data);
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("production.aba_calculator.configuration_saved"),
        duration: 2000,
      });
      refetchConfigs();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: `${t("common.save_error")}: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Update ABA material config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: { name: string, description: string, configData: MaterialDistribution[], isDefault: boolean } }) => {
      return await apiRequest("PUT", `${API_ENDPOINTS.ABA_MATERIAL_CONFIGS}/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("production.aba_calculator.configuration_updated"),
        duration: 2000,
      });
      refetchConfigs();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: `${t("common.update_error")}: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete ABA material config mutation
  const deleteConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `${API_ENDPOINTS.ABA_MATERIAL_CONFIGS}/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("production.aba_calculator.configuration_deleted"),
        duration: 2000,
      });
      setSelectedConfigId(null);
      setConfigName("");
      setConfigDescription("");
      setMaterialDistributions([]);
      refetchConfigs();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: `${t("common.delete_error")}: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Set config as default mutation
  const setDefaultConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("POST", `${API_ENDPOINTS.ABA_MATERIAL_CONFIGS}/${id}/set-default`);
    },
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("production.aba_calculator.default_configuration_set"),
        duration: 2000,
      });
      refetchConfigs();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: `${t("common.update_error")}: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle saving ABA material configurations
  const handleSaveAbaConfig = (distributions: MaterialDistribution[]) => {
    setMaterialDistributions(distributions);
    
    // If we have a selected config, update it
    if (selectedConfigId !== null) {
      updateConfigMutation.mutate({
        id: selectedConfigId,
        data: {
          name: configName,
          description: configDescription,
          configData: distributions,
          isDefault: false // Don't change default status when updating
        }
      });
    } else {
      // Otherwise, create a new config
      // Show dialog to input name and description
      const name = prompt(t("production.aba_calculator.enter_config_name"), "");
      if (name) {
        const description = prompt(t("production.aba_calculator.enter_config_description"), "");
        createConfigMutation.mutate({
          name,
          description: description || "",
          configData: distributions,
          isDefault: false
        });
      }
    }
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
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="mix_materials">
            <span className="material-icons text-sm mr-1">science</span>
            {t('production.mix_materials.title')}
          </TabsTrigger>
          <TabsTrigger value="aba_calculator">
            <span className="material-icons text-sm mr-1">calculate</span>
            {t('production.aba_calculator.title', 'ABA Calculator')}
          </TabsTrigger>
          <TabsTrigger value="aba_config">
            <span className="material-icons text-sm mr-1">settings</span>
            {t('production.aba_calculator.config_tab')}
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
              <CardTitle>{t('production.aba_calculator.title', 'ABA Calculator')}</CardTitle>
            </CardHeader>
            <CardContent>
              <AbaCalculator 
                onPrint={(data) => {
                  setAbaCalculationData(data);
                  // We won't use this callback anymore as the AbaCalculator handles printing internally
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="aba_config">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle>{t('production.aba_calculator.config_tab')}</CardTitle>
              <div className="flex items-center justify-between mt-1">
                <CardDescription>
                  {t('production.aba_calculator.drag_help')}
                </CardDescription>
                <div className="flex space-x-2">
                  {selectedConfigId && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedConfigId(null);
                        setConfigName("");
                        setConfigDescription("");
                        setMaterialDistributions([]);
                      }}
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
                            
                            updateConfigMutation.mutate({
                              id: selectedConfigId,
                              data: {
                                name: newName,
                                description: newDesc || "",
                                configData: materialDistributions,
                                isDefault: false
                              }
                            });
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
                  <AbaConfigSelector />
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