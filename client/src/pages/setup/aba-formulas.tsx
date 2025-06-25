import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X, Eye, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

interface RawMaterial {
  id: string;
  name: string;
  code: string;
}

interface AbaFormulaMaterial {
  id?: number;
  materialId: number;
  rawMaterialId?: string; // For backward compatibility
  rawMaterialName?: string;
  screwAPercentage: number;
  screwBPercentage: number;
}

interface AbaFormula {
  id: number;
  name: string;
  description?: string;
  aToB: number;
  createdAt: string;
  materials: AbaFormulaMaterial[];
}

interface FormulaFormData {
  name: string;
  description: string;
  aToB: number;
  aValue: number;
  bValue: number;
  materials: AbaFormulaMaterial[];
}

export default function AbaFormulas() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState<AbaFormula | null>(null);
  const [viewingFormula, setViewingFormula] = useState<AbaFormula | null>(null);
  const [formData, setFormData] = useState<FormulaFormData>({
    name: "",
    description: "",
    aToB: 1,
    aValue: 1,
    bValue: 1,
    materials: []
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ABA formulas
  const { data: formulas = [], isLoading: loadingFormulas } = useQuery<AbaFormula[]>({
    queryKey: ["/api/aba-formulas"],
  });

  // Fetch raw materials for dropdown
  const { data: rawMaterials = [], isLoading: loadingMaterials } = useQuery<RawMaterial[]>({
    queryKey: ["/api/raw-materials"],
  });

  // Create formula mutation
  const createFormula = useMutation({
    mutationFn: async (data: Omit<FormulaFormData, 'materials'> & { materials: Omit<AbaFormulaMaterial, 'id' | 'rawMaterialName'>[] }) => {
      return apiRequest("POST", "/api/aba-formulas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aba-formulas"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "ABA formula created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to create ABA formula",
        variant: "destructive"
      });
    },
  });

  // Update formula mutation
  const updateFormula = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Omit<FormulaFormData, 'materials'> & { materials: Omit<AbaFormulaMaterial, 'rawMaterialName'>[] } }) => {
      return apiRequest("PUT", `/api/aba-formulas/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aba-formulas"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Success", description: "ABA formula updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to update ABA formula",
        variant: "destructive"
      });
    },
  });

  // Delete formula mutation
  const deleteFormula = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/aba-formulas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/aba-formulas"] });
      toast({ title: "Success", description: "ABA formula deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error", 
        description: error.message || "Failed to delete ABA formula",
        variant: "destructive"
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      aToB: 1,
      aValue: 1,
      bValue: 1,
      materials: []
    });
    setEditingFormula(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (formula: AbaFormula) => {
    setEditingFormula(formula);
    // Parse existing ratio back to A and B values (assuming B=1 for display)
    const aValue = formula.aToB;
    const bValue = 1;
    setFormData({
      name: formula.name,
      description: formula.description || "",
      aToB: formula.aToB,
      aValue: aValue,
      bValue: bValue,
      materials: formula.materials
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (formula: AbaFormula) => {
    setViewingFormula(formula);
    setIsViewDialogOpen(true);
  };

  const printFormula = (formula: AbaFormula) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const materialsList = formula.materials.map(material => {
      const materialId = material.materialId || material.rawMaterialId;
      const rawMaterial = rawMaterials.find(rm => rm.id === Number(materialId));
      return `
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">${rawMaterial?.name || 'Unknown Material'}</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${material.screwAPercentage}%</td>
          <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${material.screwBPercentage}%</td>
        </tr>
      `;
    }).join('');

    const totalScrewA = formula.materials.reduce((sum, m) => sum + m.screwAPercentage, 0);
    const totalScrewB = formula.materials.reduce((sum, m) => sum + m.screwBPercentage, 0);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>ABA Formula - ${formula.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-section { margin-bottom: 20px; }
            .info-label { font-weight: bold; display: inline-block; width: 120px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .totals { margin-top: 15px; font-weight: bold; }
            .print-date { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ABA Formula Report</h1>
            <h2>${formula.name}</h2>
          </div>
          
          <div class="info-section">
            <div><span class="info-label">Formula Name:</span> ${formula.name}</div>
            <div><span class="info-label">Description:</span> ${formula.description || 'N/A'}</div>
            <div><span class="info-label">A:B Ratio:</span> ${formula.aToB}:1</div>
            <div><span class="info-label">Created:</span> ${new Date(formula.createdAt).toLocaleDateString()}</div>
            <div><span class="info-label">Total Materials:</span> ${formula.materials.length}</div>
          </div>

          <h3>Material Composition</h3>
          <table>
            <thead>
              <tr>
                <th>Material Name</th>
                <th style="text-align: center;">Screw A (%)</th>
                <th style="text-align: center;">Screw B (%)</th>
              </tr>
            </thead>
            <tbody>
              ${materialsList}
            </tbody>
          </table>

          <div class="totals">
            <div>Total Screw A: ${totalScrewA}%</div>
            <div>Total Screw B: ${totalScrewB}%</div>
          </div>

          <div class="print-date">
            Printed on: ${new Date().toLocaleString()}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, {
        rawMaterialId: "",
        screwAPercentage: 0.01,
        screwBPercentage: 0.01
      }]
    }));
  };

  const updateMaterial = (index: number, field: keyof AbaFormulaMaterial, value: any) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const calculateTotalPercentages = () => {
    const totalA = formData.materials.reduce((sum, material) => sum + (material.screwAPercentage || 0), 0);
    const totalB = formData.materials.reduce((sum, material) => sum + (material.screwBPercentage || 0), 0);
    return { totalA, totalB };
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Formula name is required", variant: "destructive" });
      return;
    }

    if (formData.materials.length === 0) {
      toast({ title: "Error", description: "At least one material is required", variant: "destructive" });
      return;
    }

    const { totalA, totalB } = calculateTotalPercentages();
    if (Math.abs(totalA - 100) > 0.01 || Math.abs(totalB - 100) > 0.01) {
      toast({ 
        title: "Error", 
        description: "Total percentages for both screws must equal 100%", 
        variant: "destructive" 
      });
      return;
    }

    // Check for duplicate materials
    const materialIds = formData.materials.map(m => m.rawMaterialId);
    if (new Set(materialIds).size !== materialIds.length) {
      toast({ title: "Error", description: "Duplicate materials are not allowed", variant: "destructive" });
      return;
    }

    // Check for empty material selections
    if (formData.materials.some(m => !m.rawMaterialId)) {
      toast({ title: "Error", description: "Please select a material for each row or remove empty rows", variant: "destructive" });
      return;
    }

    // Check for zero values in material percentages
    if (formData.materials.some(m => m.screwAPercentage <= 0 || m.screwBPercentage <= 0)) {
      toast({ title: "Error", description: "Material percentages must be greater than 0", variant: "destructive" });
      return;
    }

    // Calculate A:B ratio from separate A and B values
    const calculatedRatio = formData.bValue !== 0 ? formData.aValue / formData.bValue : formData.aValue;

    const submitData = {
      name: formData.name,
      description: formData.description,
      aToB: calculatedRatio,
      materials: formData.materials.map(({ rawMaterialName, ...material }) => material)
    };

    if (editingFormula) {
      updateFormula.mutate({ id: editingFormula.id, data: submitData });
    } else {
      createFormula.mutate(submitData);
    }
  };

  const { totalA, totalB } = calculateTotalPercentages();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ABA Formulas</h1>
          <p className="text-muted-foreground">Manage ABA material formulas with screw A and B percentages</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Formula
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ABA Formulas</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFormulas ? (
            <div className="text-center py-4">Loading formulas...</div>
          ) : formulas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No ABA formulas found. Create your first formula to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>A:B Ratio</TableHead>
                  <TableHead>Materials</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formulas.map((formula) => (
                  <TableRow key={formula.id}>
                    <TableCell className="font-medium">{formula.name}</TableCell>
                    <TableCell>{formula.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formula.aToB}:1</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{formula.materials.length} materials</Badge>
                    </TableCell>
                    <TableCell>{new Date(formula.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openViewDialog(formula)}
                          title="View Formula"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printFormula(formula)}
                          title="Print Formula"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(formula)}
                          title="Edit Formula"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteFormula.mutate(formula.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingFormula ? "Edit ABA Formula" : "Create ABA Formula"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Formula Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter formula name"
                />
              </div>
              <div>
                <Label>A:B Ratio</Label>
                <div className="flex items-center space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="aValue" className="text-sm text-muted-foreground">A Value</Label>
                    <Input
                      id="aValue"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={formData.aValue}
                      onChange={(e) => {
                        const aValue = parseFloat(e.target.value) || 1;
                        setFormData(prev => ({ 
                          ...prev, 
                          aValue,
                          aToB: formData.bValue !== 0 ? aValue / formData.bValue : aValue
                        }));
                      }}
                      placeholder="A"
                    />
                  </div>
                  <span className="text-lg font-semibold">:</span>
                  <div className="flex-1">
                    <Label htmlFor="bValue" className="text-sm text-muted-foreground">B Value</Label>
                    <Input
                      id="bValue"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={formData.bValue}
                      onChange={(e) => {
                        const bValue = parseFloat(e.target.value) || 1;
                        setFormData(prev => ({ 
                          ...prev, 
                          bValue,
                          aToB: bValue !== 0 ? formData.aValue / bValue : formData.aValue
                        }));
                      }}
                      placeholder="B"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Ratio: {formData.aValue}:{formData.bValue} = {(formData.aValue / formData.bValue).toFixed(2)}:1
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter formula description (optional)"
              />
            </div>

            <Separator />

            {/* Materials Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Materials</h3>
                <Button onClick={addMaterial} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Material
                </Button>
              </div>

              {formData.materials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No materials added. Click "Add Material" to start building your formula.
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.materials.map((material, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                          <Label>Material</Label>
                          <Select
                            value={material.rawMaterialId}
                            onValueChange={(value) => updateMaterial(index, 'rawMaterialId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {rawMaterials.map((rawMaterial) => (
                                <SelectItem key={rawMaterial.id} value={rawMaterial.id}>
                                  {rawMaterial.name} ({rawMaterial.code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Screw A %</Label>
                          <Input
                            type="number"
                            min="0.01"
                            max="100"
                            step="0.01"
                            value={material.screwAPercentage}
                            onChange={(e) => updateMaterial(index, 'screwAPercentage', parseFloat(e.target.value) || 0.01)}
                          />
                        </div>
                        <div>
                          <Label>Screw B %</Label>
                          <Input
                            type="number"
                            min="0.01"
                            max="100"
                            step="0.01"
                            value={material.screwBPercentage}
                            onChange={(e) => updateMaterial(index, 'screwBPercentage', parseFloat(e.target.value) || 0.01)}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMaterial(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Totals Display */}
              {formData.materials.length > 0 && (
                <Card className="mt-4 p-4 bg-muted/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <Label>Total Screw A %</Label>
                      <div className={`text-2xl font-bold ${Math.abs(totalA - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalA.toFixed(2)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <Label>Total Screw B %</Label>
                      <div className={`text-2xl font-bold ${Math.abs(totalB - 100) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalB.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  {(Math.abs(totalA - 100) > 0.01 || Math.abs(totalB - 100) > 0.01) && (
                    <div className="text-center mt-2 text-sm text-red-600">
                      Both totals must equal 100% to save the formula
                    </div>
                  )}
                </Card>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createFormula.isPending || updateFormula.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingFormula ? "Update Formula" : "Create Formula"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Formula Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View ABA Formula - {viewingFormula?.name}</DialogTitle>
          </DialogHeader>
          {viewingFormula && (
            <div className="space-y-6">
              {/* Formula Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Formula Name</Label>
                  <p className="text-lg">{viewingFormula.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">A:B Ratio</Label>
                  <div>
                    <Badge variant="outline" className="text-sm">
                      {viewingFormula.aToB}:1
                    </Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-semibold text-gray-600">Description</Label>
                  <p className="text-sm text-gray-700">{viewingFormula.description || "No description provided"}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Created Date</Label>
                  <p className="text-sm">{new Date(viewingFormula.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-600">Total Materials</Label>
                  <p className="text-sm">{viewingFormula.materials.length} materials</p>
                </div>
              </div>

              <Separator />

              {/* Materials Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Material Composition</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material Name</TableHead>
                      <TableHead className="text-center">Screw A (%)</TableHead>
                      <TableHead className="text-center">Screw B (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingFormula.materials.map((material, index) => {
                      const materialId = material.materialId || material.rawMaterialId;
                      const rawMaterial = rawMaterials.find(rm => rm.id === Number(materialId));
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {rawMaterial?.name || 'Unknown Material'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{material.screwAPercentage}%</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{material.screwBPercentage}%</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Total Percentages</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Total Screw A:</Label>
                    <p className="text-lg font-semibold">
                      {viewingFormula.materials.reduce((sum, m) => sum + m.screwAPercentage, 0)}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Total Screw B:</Label>
                    <p className="text-lg font-semibold">
                      {viewingFormula.materials.reduce((sum, m) => sum + m.screwBPercentage, 0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => printFormula(viewingFormula)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Formula
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    openEditDialog(viewingFormula);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Formula
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}