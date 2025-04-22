import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { API_ENDPOINTS } from "@/lib/constants";
import { MixMaterial, MixItem, RawMaterial } from "@shared/schema";
import { formatDateString } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MixDetailsProps {
  mixId: number;
  rawMaterials: RawMaterial[];
  onClose?: () => void;
}

export function MixDetails({ mixId, rawMaterials, onClose }: MixDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);

  // Fetch mix details
  const { data: mix, isLoading: mixLoading } = useQuery<MixMaterial>({
    queryKey: [`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}`],
  });

  // Fetch mix items
  const { data: mixItems, isLoading: itemsLoading } = useQuery<MixItem[]>({
    queryKey: [`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}/items`],
  });

  // Add mix item mutation
  const addMixItemMutation = useMutation({
    mutationFn: async (data: { mixId: number; rawMaterialId: number; quantity: number }) => {
      return apiRequest(API_ENDPOINTS.MIX_ITEMS, {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}`] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.RAW_MATERIALS] });
      setSelectedMaterial(null);
      setQuantity("");
      setIsAddingMaterial(false);
      toast({
        title: "Success",
        description: "Material added to mix successfully!",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add material to mix",
        variant: "destructive",
      });
    },
  });

  // Remove mix item mutation
  const removeMixItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`${API_ENDPOINTS.MIX_ITEMS}/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}`] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.RAW_MATERIALS] });
      toast({
        title: "Success",
        description: "Material removed from mix successfully!",
        variant: "success",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove material from mix",
        variant: "destructive",
      });
    },
  });

  const handleAddMaterial = () => {
    if (!selectedMaterial || !quantity) {
      toast({
        title: "Error",
        description: "Please select a material and enter a quantity",
        variant: "destructive",
      });
      return;
    }

    const quantityNumber = parseFloat(quantity);
    if (isNaN(quantityNumber) || quantityNumber <= 0) {
      toast({
        title: "Error",
        description: "Quantity must be a positive number",
        variant: "destructive",
      });
      return;
    }

    addMixItemMutation.mutate({
      mixId,
      rawMaterialId: selectedMaterial,
      quantity: quantityNumber,
    });
  };

  const handleRemoveMaterial = (id: number) => {
    if (confirm("Are you sure you want to remove this material from the mix?")) {
      removeMixItemMutation.mutate(id);
    }
  };

  // Machine field no longer used

  const getRawMaterialName = (id: number) => {
    const rawMaterial = rawMaterials.find(m => m.id === id);
    return rawMaterial ? rawMaterial.name : `Material #${id}`;
  };

  // Function to generate the label content for printing
  const generatePrintableLabel = () => {
    if (!mix || !mixItems) return null;

    return (
      <div className="printable-label" style={{ width: "5in", height: "3in", padding: "0.25in" }}>
        <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "10px" }}>
          Mix Material #{mix.id}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <div>Date: {formatDateString(mix.mixDate)}</div>
          <div>Operator: {mix.mixPerson}</div>
        </div>
        <div style={{ marginBottom: "10px" }}>
          Total Weight: {mix.totalQuantity?.toFixed(2) || "0.00"} kg
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>Material</th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>Quantity (kg)</th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {mixItems.map((item) => (
              <tr key={item.id}>
                <td style={{ border: "1px solid #ccc", padding: "4px" }}>{getRawMaterialName(item.rawMaterialId)}</td>
                <td style={{ border: "1px solid #ccc", padding: "4px", textAlign: "right" }}>{item.quantity.toFixed(2)}</td>
                <td style={{ border: "1px solid #ccc", padding: "4px", textAlign: "right" }}>{item.percentage.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (mixLoading) {
    return <div className="flex justify-center p-4">Loading mix details...</div>;
  }

  if (!mix) {
    return <div className="text-center p-4 text-secondary-400">Mix not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Mix Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="font-medium text-secondary-500">Mix ID</div>
                  <div>{mix.id}</div>
                </div>
                <div>
                  <div className="font-medium text-secondary-500">Date</div>
                  <div>{formatDateString(mix.mixDate)}</div>
                </div>
                <div>
                  <div className="font-medium text-secondary-500">Operator</div>
                  <div>{mix.mixPerson}</div>
                </div>

                <div>
                  <div className="font-medium text-secondary-500">Total Weight</div>
                  <div className="font-semibold text-primary-600">{mix.totalQuantity?.toFixed(2) || "0.00"} kg</div>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-center"
                  onClick={() => window.print()}
                >
                  <span className="material-icons mr-2">print</span>
                  Print Label
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Materials</CardTitle>
          </CardHeader>
          <CardContent>
            {isAddingMaterial ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Raw Material</label>
                  <Select
                    value={selectedMaterial?.toString() || ""}
                    onValueChange={(value) => setSelectedMaterial(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {rawMaterials.map((material) => (
                        <SelectItem 
                          key={material.id} 
                          value={material.id.toString()}
                          disabled={material.quantity === null || material.quantity <= 0}
                        >
                          {material.name} ({material.quantity !== null ? `${material.quantity.toFixed(2)} ${material.unit}` : 'Out of stock'})
                        </SelectItem>
                      ))}
                      {rawMaterials.length === 0 && (
                        <SelectItem value="no-materials">No materials available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity (kg)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <div className="flex space-x-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddingMaterial(false);
                      setSelectedMaterial(null);
                      setQuantity("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAddMaterial}
                    disabled={addMixItemMutation.isPending}
                  >
                    {addMixItemMutation.isPending ? (
                      <>
                        <span className="animate-spin mr-2">◌</span>
                        Adding...
                      </>
                    ) : (
                      "Add Material"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full justify-center"
                onClick={() => setIsAddingMaterial(true)}
              >
                <span className="material-icons mr-2">add</span>
                Add Material to Mix
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mix Composition</CardTitle>
        </CardHeader>
        <CardContent>
          {itemsLoading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-10 bg-secondary-100 rounded"></div>
              <div className="h-10 bg-secondary-100 rounded"></div>
              <div className="h-10 bg-secondary-100 rounded"></div>
            </div>
          ) : mixItems && mixItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Quantity (kg)</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mixItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {getRawMaterialName(item.rawMaterialId)}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.percentage.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive-500"
                        onClick={() => handleRemoveMaterial(item.id)}
                        disabled={removeMixItemMutation.isPending}
                      >
                        <span className="material-icons text-sm">delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-secondary-400">
              No materials added to this mix yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden printable label section that will only show when printing */}
      <div className="hidden print:block print:m-0 print:p-0">
        {generatePrintableLabel()}
      </div>
    </div>
  );
}