import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { insertMixMaterialSchema, RawMaterial } from "@shared/schema";
import { API_ENDPOINTS } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Create a simplified form schema without machine or order
const formSchema = insertMixMaterialSchema
  .omit({
    mixPerson: true, // We'll set this automatically from the current user
  });

type FormValues = z.infer<typeof formSchema>;

interface MaterialItem {
  rawMaterialId: number;
  quantity: number;
}

interface MixMaterialFormProps {
  rawMaterials: RawMaterial[];
  onSuccess?: () => void;
}

export function MixMaterialForm({ rawMaterials, onSuccess }: MixMaterialFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRawMaterial, setSelectedRawMaterial] = useState<number | null>(null);
  const [rawMaterialQuantity, setRawMaterialQuantity] = useState("");
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  
  // Get current user
  const { data: currentUser } = useQuery<{id: string, name: string}>({
    queryKey: [API_ENDPOINTS.USER],
    staleTime: 300000, // 5 minutes
  });

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  // Create mix material mutation
  const createMixMutation = useMutation({
    mutationFn: async () => {
      // First create the mix with the current user as the operator
      const userId = currentUser?.id;
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      // Create mix with current user as operator
      const mixResponse = await fetch(API_ENDPOINTS.MIX_MATERIALS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          mixPerson: currentUser.name || `User ${userId}`,
        }),
      });
      
      if (!mixResponse.ok) {
        const error = await mixResponse.json();
        throw new Error(error.message || "Failed to create mix");
      }
      
      const mixData = await mixResponse.json();
      const mixId = mixData.id;
      
      // Then add all materials to the mix
      for (const material of materials) {
        const itemResponse = await fetch(API_ENDPOINTS.MIX_ITEMS, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mixId,
            rawMaterialId: material.rawMaterialId,
            quantity: material.quantity,
          }),
        });
        
        if (!itemResponse.ok) {
          const error = await itemResponse.json();
          throw new Error(error.message || "Failed to add material to mix");
        }
      }
      
      return mixData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MIX_MATERIALS] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.RAW_MATERIALS] });
      toast({
        title: "Success",
        description: "Mix material created successfully!",
        variant: "destructive",
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create mix material",
        variant: "destructive",
      });
    },
  });

  const addMaterial = () => {
    if (!selectedRawMaterial) {
      toast({
        title: "Error",
        description: "Please select a raw material",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseFloat(rawMaterialQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid quantity greater than zero",
        variant: "destructive",
      });
      return;
    }

    // Check if we already have this material
    if (materials.some(m => m.rawMaterialId === selectedRawMaterial)) {
      toast({
        title: "Error",
        description: "This material is already added to the mix",
        variant: "destructive",
      });
      return;
    }

    // Add the material to our list
    setMaterials([...materials, { rawMaterialId: selectedRawMaterial, quantity }]);
    
    // Reset the inputs
    setSelectedRawMaterial(null);
    setRawMaterialQuantity("");
  };

  const removeMaterial = (index: number) => {
    const newMaterials = [...materials];
    newMaterials.splice(index, 1);
    setMaterials(newMaterials);
  };

  const onSubmit = () => {
    if (materials.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one material to the mix",
        variant: "destructive",
      });
      return;
    }
    
    createMixMutation.mutate();
  };

  // Get the material name by ID
  const getMaterialName = (id: number) => {
    const material = rawMaterials.find(m => m.id === id);
    return material ? material.name : `Unknown Material (${id})`;
  };

  // Calculate total weight of the mix
  const totalWeight = materials.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4 pt-2">
          {/* Current Operator Display */}
          <Alert className="bg-muted">
            <AlertTitle>Current Operator</AlertTitle>
            <AlertDescription>
              {currentUser?.name || "Loading user information..."}
            </AlertDescription>
          </Alert>

          {/* Material Selection */}
          <div className="space-y-4 border rounded-md p-4">
            <h3 className="text-lg font-medium">Add Materials</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="md:col-span-2">
                <FormLabel>Raw Material</FormLabel>
                <Select
                  value={selectedRawMaterial?.toString() || ""}
                  onValueChange={(value) => setSelectedRawMaterial(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {rawMaterials.map((material) => (
                      <SelectItem key={material.id} value={material.id.toString()}>
                        {material.name} ({material.quantity} {material.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-2">
                <FormLabel>Quantity (kg)</FormLabel>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={rawMaterialQuantity}
                  onChange={(e) => setRawMaterialQuantity(e.target.value)}
                  placeholder="Enter quantity in kg"
                />
              </div>
              
              <div className="flex items-end">
                <Button 
                  type="button" 
                  onClick={addMaterial}
                  className="w-full"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Material List */}
          <div className="border rounded-md p-4">
            <h3 className="text-lg font-medium mb-2">Mix Composition</h3>
            
            {materials.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No materials added yet</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 font-medium text-sm px-2">
                  <div className="col-span-5">Material</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Unit</div>
                  <div className="col-span-2">Percentage</div>
                  <div className="col-span-1"></div>
                </div>
                
                {materials.map((material, index) => {
                  const percentage = totalWeight > 0 
                    ? ((material.quantity / totalWeight) * 100).toFixed(1) 
                    : "0.0";
                    
                  return (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center bg-muted rounded-md p-2">
                      <div className="col-span-5">{getMaterialName(material.rawMaterialId)}</div>
                      <div className="col-span-2">{material.quantity}</div>
                      <div className="col-span-2">kg</div>
                      <div className="col-span-2">
                        <Badge variant="outline">{percentage}%</Badge>
                      </div>
                      <div className="col-span-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeMaterial(index)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  );
                })}
                
                <div className="grid grid-cols-12 gap-2 font-medium text-sm mt-2 pt-2 border-t">
                  <div className="col-span-5">Total</div>
                  <div className="col-span-2">{totalWeight.toFixed(1)}</div>
                  <div className="col-span-2">kg</div>
                  <div className="col-span-2">100.0%</div>
                  <div className="col-span-1"></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setMaterials([])}
            >
              Reset
            </Button>
            <Button 
              type="submit" 
              disabled={createMixMutation.isPending || materials.length === 0}
            >
              {createMixMutation.isPending ? (
                <>
                  <span className="animate-spin mr-2">◌</span>
                  Creating...
                </>
              ) : (
                "Create Mix"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}