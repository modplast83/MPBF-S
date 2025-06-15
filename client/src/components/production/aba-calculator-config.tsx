import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";
import { AbaMaterialConfig, RawMaterial, User } from "@shared/schema";
import { formatNumber } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth-v2";

// Material distribution with new formula format
export interface MaterialDistribution {
  material: string;
  aKg: number;
  bKg: number;
  totalKg: number;
  aPercentage: number;
  bPercentage: number;
  color?: string; // For UI display
}

interface AbaCalculatorConfigProps {
  rawMaterials: RawMaterial[];
  totalQuantity?: number;
  onCalculate?: (result: {
    items: MaterialDistribution[];
    totalQuantity: number;
    aTotalKg: number;
    bTotalKg: number;
    aPercentage: number;
    bPercentage: number;
  }) => void;
}

export function AbaCalculatorConfig({ rawMaterials, totalQuantity = 670, onCalculate }: AbaCalculatorConfigProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [configName, setConfigName] = useState("");
  const [configDescription, setConfigDescription] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");
  const [quantity, setQuantity] = useState(totalQuantity);
  
  // Formula parameters with default values
  const [formulaParameters, setFormulaParameters] = useState({
    aTotalWeight: 155, // Target weight for screw A
    bTotalWeight: 515, // Target weight for screw B
    showFormulaSettings: false // Toggle for formula settings panel
  });
  
  // Material distributions that match the formula shown in the image
  const [materials, setMaterials] = useState<MaterialDistribution[]>([
    {
      material: "HDPE",
      aKg: 75,
      bKg: 100,
      totalKg: 175,
      aPercentage: 48.5,
      bPercentage: 19.4,
      color: "#FFB74D"
    },
    {
      material: "LLDPE",
      aKg: 50,
      bKg: 50,
      totalKg: 100,
      aPercentage: 32.2,
      bPercentage: 9.7,
      color: "#4FC3F7"
    },
    {
      material: "Filler",
      aKg: 25,
      bKg: 350,
      totalKg: 375,
      aPercentage: 16.1,
      bPercentage: 68.0,
      color: "#AED581"
    },
    {
      material: "MasterBach",
      aKg: 5,
      bKg: 15,
      totalKg: 20,
      aPercentage: 3.2,
      bPercentage: 2.9,
      color: "#FF8A65"
    }
  ]);

  // Fetch existing configurations
  const { data: abaConfigs, isLoading: configsLoading } = useQuery<AbaMaterialConfig[]>({
    queryKey: [API_ENDPOINTS.ABA_MATERIAL_CONFIGS],
  });

  // Fetch default configuration
  const { data: defaultConfig, isLoading: defaultConfigLoading } = useQuery<AbaMaterialConfig>({
    queryKey: [`${API_ENDPOINTS.ABA_MATERIAL_CONFIGS}/default`],
  });

  // Process default config when it's loaded
  useEffect(() => {
    if (defaultConfig && defaultConfig.configData) {
      try {
        // Try to parse as new format first
        const parsedData = JSON.parse(defaultConfig.configData as string);
        
        if (parsedData.materials && Array.isArray(parsedData.materials)) {
          // New format with materials and formula parameters
          setMaterials(parsedData.materials);
          
          // Set formula parameters if they exist
          if (parsedData.formulaParameters) {
            setFormulaParameters(prev => ({
              ...prev,
              aTotalWeight: parsedData.formulaParameters.aTotalWeight || 155,
              bTotalWeight: parsedData.formulaParameters.bTotalWeight || 515
            }));
          }
          
          recalculateDistribution(parsedData.materials);
        } else if (Array.isArray(parsedData) && parsedData.length > 0) {
          // Legacy format - just an array of materials
          setMaterials(parsedData);
          recalculateDistribution(parsedData);
        }
      } catch (err) {
        console.error("Failed to parse config data", err);
      }
    }
  }, [defaultConfig]);

  // Save configuration mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      createdBy: string;
      configData: string;
    }) => {
      return apiRequest("POST", API_ENDPOINTS.ABA_MATERIAL_CONFIGS, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ABA_MATERIAL_CONFIGS] });
      if (makeDefault && data.id) {
        setDefaultMutation.mutate({ id: data.id });
      } else {
        toast({
          title: "Success",
          description: "Configuration saved successfully!",
          variant: "default",
        });
        setShowSaveDialog(false);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  // Set default configuration mutation
  const setDefaultMutation = useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      return apiRequest("POST", `${API_ENDPOINTS.ABA_MATERIAL_CONFIGS}/${id}/set-default`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.ABA_MATERIAL_CONFIGS] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.ABA_MATERIAL_CONFIGS}/default`] });
      toast({
        title: "Success",
        description: "Configuration saved and set as default!",
        variant: "default",
      });
      setShowSaveDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set as default",
        variant: "destructive",
      });
    },
  });

  // Load configuration mutation
  const loadConfigMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("GET", `${API_ENDPOINTS.ABA_MATERIAL_CONFIGS}/${id}`, {});
    },
    onSuccess: (data) => {
      if (data && data.configData) {
        try {
          // Try to parse as new format first
          const parsedData = JSON.parse(data.configData as string);
          
          if (parsedData.materials && Array.isArray(parsedData.materials)) {
            // New format with materials and formula parameters
            setMaterials(parsedData.materials);
            
            // Set formula parameters if they exist
            if (parsedData.formulaParameters) {
              setFormulaParameters(prev => ({
                ...prev,
                aTotalWeight: parsedData.formulaParameters.aTotalWeight || 155,
                bTotalWeight: parsedData.formulaParameters.bTotalWeight || 515
              }));
            }
            
            recalculateDistribution(parsedData.materials);
            toast({
              title: "Success",
              description: "Configuration loaded successfully!",
              variant: "default",
            });
          } else if (Array.isArray(parsedData) && parsedData.length > 0) {
            // Legacy format - just an array of materials
            setMaterials(parsedData);
            recalculateDistribution(parsedData);
            toast({
              title: "Success",
              description: "Configuration loaded successfully (legacy format)!",
              variant: "default",
            });
          } else {
            throw new Error("Invalid configuration format");
          }
        } catch (err) {
          console.error("Failed to parse config data", err);
          toast({
            title: "Error",
            description: "Failed to parse configuration data",
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to load configuration",
        variant: "destructive",
      });
    },
  });

  // Effect to update calculations when materials or quantity changes
  useEffect(() => {
    recalculateDistribution(materials);
  }, [materials, quantity]);

  // Function to recalculate all material distributions
  const recalculateDistribution = (currentMaterials: MaterialDistribution[]) => {
    if (!currentMaterials || currentMaterials.length === 0) return;

    // Calculate total weights for A and B
    const totalA = currentMaterials.reduce((sum, item) => sum + item.aKg, 0);
    const totalB = currentMaterials.reduce((sum, item) => sum + item.bKg, 0);
    const totalWeight = totalA + totalB;

    // Calculate percentages of A and B in the overall mix
    const aPercentage = totalWeight > 0 ? (totalA / totalWeight) * 100 : 0;
    const bPercentage = totalWeight > 0 ? (totalB / totalWeight) * 100 : 0;

    // Get the target weights from the formula parameters
    const { aTotalWeight, bTotalWeight } = formulaParameters;

    // Calculate percentages for each material within its screw
    // Use the formula parameters to control the percentage calculations
    const updatedMaterials = currentMaterials.map(item => {
      // Calculate the percentage based on the formula parameters
      const calculatedAPercentage = totalA > 0 ? (item.aKg / totalA) * 100 : 0;
      const calculatedBPercentage = totalB > 0 ? (item.bKg / totalB) * 100 : 0;
      
      return {
        ...item,
        totalKg: item.aKg + item.bKg,
        aPercentage: calculatedAPercentage,
        bPercentage: calculatedBPercentage
      };
    });

    // Pass the results back to the parent component
    if (onCalculate) {
      onCalculate({
        items: updatedMaterials,
        totalQuantity: quantity,
        aTotalKg: totalA,
        bTotalKg: totalB,
        aPercentage,
        bPercentage
      });
    }
  };

  // Function to update a specific material value
  const handleMaterialUpdate = (index: number, field: 'aKg' | 'bKg', value: number) => {
    const updatedMaterials = [...materials];
    updatedMaterials[index][field] = value;
    updatedMaterials[index].totalKg = updatedMaterials[index].aKg + updatedMaterials[index].bKg;
    setMaterials(updatedMaterials);
  };

  // Function to add a new material
  const handleAddMaterial = () => {
    const newMaterial: MaterialDistribution = {
      material: "New Material",
      aKg: 0,
      bKg: 0,
      totalKg: 0,
      aPercentage: 0,
      bPercentage: 0
    };
    setMaterials([...materials, newMaterial]);
  };

  // Function to remove a material
  const handleRemoveMaterial = (index: number) => {
    const updatedMaterials = [...materials];
    updatedMaterials.splice(index, 1);
    setMaterials(updatedMaterials);
  };

  // Function to save the current configuration
  const handleSaveConfig = () => {
    if (!configName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the configuration",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save configurations",
        variant: "destructive",
      });
      return;
    }

    // Include both materials and formula parameters in the configuration
    const configData = {
      materials,
      formulaParameters: {
        aTotalWeight: formulaParameters.aTotalWeight,
        bTotalWeight: formulaParameters.bTotalWeight
      }
    };
    
    saveConfigMutation.mutate({
      name: configName,
      description: configDescription,
      createdBy: user.id,
      configData: JSON.stringify(configData)
    });
  };

  // Function to load a configuration by ID
  const handleLoadConfig = (id: number) => {
    loadConfigMutation.mutate(id);
  };

  // Calculate totals for display
  const aTotalKg = materials.reduce((sum, item) => sum + item.aKg, 0);
  const bTotalKg = materials.reduce((sum, item) => sum + item.bKg, 0);
  const totalKg = aTotalKg + bTotalKg;
  const aPercentage = totalKg > 0 ? (aTotalKg / totalKg) * 100 : 0;
  const bPercentage = totalKg > 0 ? (bTotalKg / totalKg) * 100 : 0;

  // Calculate scaled values based on total quantity
  const scaleFactor = quantity / totalKg;
  const scaledMaterials = materials.map(item => ({
    ...item,
    scaledAKg: item.aKg * scaleFactor,
    scaledBKg: item.bKg * scaleFactor,
    scaledTotalKg: (item.aKg + item.bKg) * scaleFactor
  }));

  const scaledATotalKg = aTotalKg * scaleFactor;
  const scaledBTotalKg = bTotalKg * scaleFactor;
  const scaledTotalKg = totalKg * scaleFactor;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('production.aba_calculator.title')}</CardTitle>
        <CardDescription>
          {t('production.aba_calculator.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calculator">{t('production.aba_calculator.formula_parameters')}</TabsTrigger>
            <TabsTrigger value="configurations">{t('production.aba_calculator.configurations')}</TabsTrigger>
            <TabsTrigger value="result">{t('production.aba_calculator.result')}</TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="quantity">{t('production.mix_materials.total_quantity')} (kg)</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(parseFloat(e.target.value) || totalQuantity)}
                />
              </div>
              <div className="flex items-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setFormulaParameters(prev => ({...prev, showFormulaSettings: !prev.showFormulaSettings}))}
                  className="flex-1"
                >
                  <span className="material-icons text-sm mr-1">settings</span>
                  {formulaParameters.showFormulaSettings ? t('common.hide_formula_settings') : t('common.formula_settings')}
                </Button>
              </div>
              <div className="flex items-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSaveDialog(true)}
                  className="flex-1"
                >
                  <span className="material-icons text-sm mr-1">save</span>
                  {t('common.save')}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleAddMaterial}
                  className="flex-1"
                >
                  <span className="material-icons text-sm mr-1">add</span>
                  {t('production.mix_materials.add_material')}
                </Button>
              </div>
            </div>
            
            {/* Formula Settings Panel */}
            {formulaParameters.showFormulaSettings && (
              <div className="p-4 mb-4 border rounded-md bg-muted/50">
                <h3 className="text-lg font-medium mb-3">{t('production.mix_materials.formula_settings')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="aTotalWeight">{t('production.mix_materials.a_total_weight')} (kg)</Label>
                    <Input
                      id="aTotalWeight"
                      type="number"
                      min="1"
                      value={formulaParameters.aTotalWeight}
                      onChange={e => setFormulaParameters(prev => ({
                        ...prev, 
                        aTotalWeight: parseFloat(e.target.value) || 155
                      }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('production.mix_materials.a_total_weight_help')}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="bTotalWeight">{t('production.mix_materials.b_total_weight')} (kg)</Label>
                    <Input
                      id="bTotalWeight"
                      type="number"
                      min="1"
                      value={formulaParameters.bTotalWeight}
                      onChange={e => setFormulaParameters(prev => ({
                        ...prev, 
                        bTotalWeight: parseFloat(e.target.value) || 515
                      }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('production.mix_materials.b_total_weight_help')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('production.mix_materials.material')}</TableHead>
                    <TableHead className="text-right">A (kg)</TableHead>
                    <TableHead className="text-right">B (kg)</TableHead>
                    <TableHead className="text-right">{t('production.mix_materials.total')} (kg)</TableHead>
                    <TableHead className="text-right">A %</TableHead>
                    <TableHead className="text-right">B %</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Input
                          value={material.material}
                          onChange={e => {
                            const updatedMaterials = [...materials];
                            updatedMaterials[index].material = e.target.value;
                            setMaterials(updatedMaterials);
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          value={material.aKg}
                          onChange={e => handleMaterialUpdate(index, 'aKg', parseFloat(e.target.value) || 0)}
                          className="w-20 text-right ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          value={material.bKg}
                          onChange={e => handleMaterialUpdate(index, 'bKg', parseFloat(e.target.value) || 0)}
                          className="w-20 text-right ml-auto"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(material.totalKg, 1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(material.aPercentage, 1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(material.bPercentage, 1)}%
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMaterial(index)}
                          disabled={materials.length <= 1}
                        >
                          <span className="material-icons text-sm">delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-secondary-50">
                    <TableCell>{t('common.total')}</TableCell>
                    <TableCell className="text-right">{formatNumber(aTotalKg, 1)}</TableCell>
                    <TableCell className="text-right">{formatNumber(bTotalKg, 1)}</TableCell>
                    <TableCell className="text-right">{formatNumber(totalKg, 1)}</TableCell>
                    <TableCell className="text-right">{formatNumber(aPercentage, 1)}%</TableCell>
                    <TableCell className="text-right">{formatNumber(bPercentage, 1)}%</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Configurations Tab */}
          <TabsContent value="configurations" className="space-y-4">
            {configsLoading ? (
              <div className="text-center p-4">{t('common.loading')}...</div>
            ) : !abaConfigs || abaConfigs.length === 0 ? (
              <div className="text-center p-4">
                {t('production.mix_materials.no_configurations')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.description')}</TableHead>
                    <TableHead>{t('common.created_by')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abaConfigs.map(config => (
                    <TableRow key={config.id}>
                      <TableCell>
                        {config.name}
                        {config.isDefault && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {t('common.default')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{config.description}</TableCell>
                      <TableCell>{config.createdBy}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLoadConfig(config.id)}
                        >
                          <span className="material-icons text-sm">download</span>
                        </Button>
                        {!config.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultMutation.mutate({ id: config.id })}
                          >
                            <span className="material-icons text-sm">star</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          {/* Result Tab */}
          <TabsContent value="result" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-lg font-medium mb-2">{t('production.aba_calculator.input_summary')}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t('production.mix_materials.total_quantity')}:</span>
                    <span className="font-medium">{formatNumber(quantity, 1)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('production.mix_materials.total_a')}:</span>
                    <span className="font-medium">{formatNumber(scaledATotalKg, 1)} kg ({formatNumber(aPercentage, 1)}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('production.mix_materials.total_b')}:</span>
                    <span className="font-medium">{formatNumber(scaledBTotalKg, 1)} kg ({formatNumber(bPercentage, 1)}%)</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="text-sm font-medium mb-1">{t('production.mix_materials.formula_parameters')}</div>
                    <div className="flex justify-between">
                      <span>{t('production.mix_materials.a_total_weight')}:</span>
                      <span className="font-medium">{formatNumber(formulaParameters.aTotalWeight, 1)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('production.mix_materials.b_total_weight')}:</span>
                      <span className="font-medium">{formatNumber(formulaParameters.bTotalWeight, 1)} kg</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">{t('production.aba_calculator.scaled_results')}</h3>
                <p className="text-sm text-secondary-500 mb-2">
                  {t('production.aba_calculator.scaled_to')} {formatNumber(quantity, 1)} kg
                </p>
                <Button variant="outline" onClick={() => window.print()}>
                  <span className="material-icons text-sm mr-2">print</span>
                  {t('production.mix_materials.print_formula')}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('production.mix_materials.material')}</TableHead>
                    <TableHead className="text-right">A (kg)</TableHead>
                    <TableHead className="text-right">B (kg)</TableHead>
                    <TableHead className="text-right">A+B (kg)</TableHead>
                    <TableHead className="text-right">A+B %</TableHead>
                    <TableHead className="text-right">A %</TableHead>
                    <TableHead className="text-right">B %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scaledMaterials.map((material, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{material.material}</TableCell>
                      <TableCell className="text-right">{formatNumber(material.scaledAKg, 1)}</TableCell>
                      <TableCell className="text-right">{formatNumber(material.scaledBKg, 1)}</TableCell>
                      <TableCell className="text-right">{formatNumber(material.scaledTotalKg, 1)}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber((material.scaledTotalKg / quantity) * 100, 2)}%
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(material.aPercentage, 1)}%</TableCell>
                      <TableCell className="text-right">{formatNumber(material.bPercentage, 1)}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-secondary-50">
                    <TableCell>{t('common.total')}</TableCell>
                    <TableCell className="text-right">{formatNumber(scaledATotalKg, 1)}</TableCell>
                    <TableCell className="text-right">{formatNumber(scaledBTotalKg, 1)}</TableCell>
                    <TableCell className="text-right">{formatNumber(scaledTotalKg, 1)}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell className="text-right">{formatNumber(aPercentage, 1)}%</TableCell>
                    <TableCell className="text-right">{formatNumber(bPercentage, 1)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="print-only mt-8">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold">ABA-HDPE</h2>
                <p className="text-xl">Qty: {formatNumber(quantity, 0)}</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>A</TableHead>
                    <TableHead>Materials</TableHead>
                    <TableHead>B</TableHead>
                    <TableHead>A+B Kg</TableHead>
                    <TableHead>A+B%</TableHead>
                    <TableHead>A %</TableHead>
                    <TableHead>B %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scaledMaterials.map((material, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatNumber(material.scaledAKg, 1)}</TableCell>
                      <TableCell className="font-bold">{material.material}</TableCell>
                      <TableCell>{formatNumber(material.scaledBKg, 1)}</TableCell>
                      <TableCell>{formatNumber(material.scaledTotalKg, 1)}</TableCell>
                      <TableCell>
                        {formatNumber((material.scaledTotalKg / quantity) * 100, 2)}%
                      </TableCell>
                      <TableCell>{formatNumber(material.aPercentage, 1)}%</TableCell>
                      <TableCell>{formatNumber(material.bPercentage, 1)}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold">
                    <TableCell>{formatNumber(scaledATotalKg, 1)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell>{formatNumber(scaledBTotalKg, 1)}</TableCell>
                    <TableCell>{formatNumber(scaledTotalKg, 1)}</TableCell>
                    <TableCell>100%</TableCell>
                    <TableCell>{formatNumber(aPercentage, 1)}%</TableCell>
                    <TableCell>{formatNumber(bPercentage, 1)}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <div className="text-right mt-4">
                <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Save Configuration Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('production.mix_materials.save_configuration')}</DialogTitle>
            <DialogDescription>
              {t('production.mix_materials.save_configuration_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="config-name">{t('common.name')}</Label>
              <Input
                id="config-name"
                value={configName}
                onChange={e => setConfigName(e.target.value)}
                placeholder={t('production.mix_materials.config_name_placeholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config-description">{t('common.description')}</Label>
              <Input
                id="config-description"
                value={configDescription}
                onChange={e => setConfigDescription(e.target.value)}
                placeholder={t('production.mix_materials.config_description_placeholder')}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="make-default"
                checked={makeDefault}
                onChange={e => setMakeDefault(e.target.checked)}
              />
              <Label htmlFor="make-default">{t('production.mix_materials.make_default')}</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveConfig} disabled={saveConfigMutation.isPending}>
              {saveConfigMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  {t('common.saving')}...
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-only, .print-only * {
              visibility: visible;
            }
            .print-only {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
          @media screen {
            .print-only {
              display: none;
            }
          }
        `
      }} />
    </Card>
  );
}