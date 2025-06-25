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
import { Plus, Trash2, Calculator, Eye, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";

interface JobOrder {
  id: number;
  orderId: number;
  quantity: number;
  status: string;
  customerId?: string;
  customerProductId: number;
}

interface AbaFormula {
  id: number;
  name: string;
  description?: string;
  aToB: number;
  abRatio: string;
  materials: any[];
}

interface JoMix {
  id: number;
  mixNumber: string;
  totalQuantity: number;
  screwType: string;
  status: string;
  formulaName: string;
  createdAt: string;
  items: any[];
  materials: any[];
}

interface JoMixData {
  abaFormulaId: number;
  jobOrderIds: number[];
  jobOrderQuantities: number[];
}

export default function JoMixPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedJobOrders, setSelectedJobOrders] = useState<Set<number>>(new Set());
  const [selectedFormula, setSelectedFormula] = useState<number | null>(null);
  const [jobOrderQuantities, setJobOrderQuantities] = useState<Record<number, number>>({});
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingMix, setViewingMix] = useState<JoMix | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch JO mixes
  const { data: joMixes = [], isLoading: loadingMixes } = useQuery<JoMix[]>({
    queryKey: ["/api/jo-mixes"],
  });

  // Fetch job orders
  const { data: jobOrders = [], isLoading: loadingJobOrders } = useQuery<JobOrder[]>({
    queryKey: ["/api/job-orders"],
  });

  // Fetch ABA formulas
  const { data: abaFormulas = [], isLoading: loadingFormulas } = useQuery<AbaFormula[]>({
    queryKey: ["/api/aba-formulas"],
  });

  // Create JO mix mutation
  const createJoMixMutation = useMutation({
    mutationFn: async (data: JoMixData) => {
      return apiRequest("POST", "/api/jo-mixes", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jo-mixes"] });
      toast({
        title: "Success",
        description: "JO Mix created successfully",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create JO Mix",
        variant: "destructive",
      });
    },
  });

  // Update mix status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PUT", `/api/jo-mixes/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jo-mixes"] });
      toast({
        title: "Success",
        description: "Mix status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update mix status",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedJobOrders(new Set());
    setSelectedFormula(null);
    setJobOrderQuantities({});
  };

  const handleJobOrderSelection = (jobOrderId: number, checked: boolean) => {
    const newSelected = new Set(selectedJobOrders);
    if (checked) {
      newSelected.add(jobOrderId);
      // Set default quantity to job order quantity
      const jobOrder = jobOrders.find(jo => jo.id === jobOrderId);
      if (jobOrder) {
        setJobOrderQuantities(prev => ({
          ...prev,
          [jobOrderId]: jobOrder.quantity
        }));
      }
    } else {
      newSelected.delete(jobOrderId);
      setJobOrderQuantities(prev => {
        const updated = { ...prev };
        delete updated[jobOrderId];
        return updated;
      });
    }
    setSelectedJobOrders(newSelected);
  };

  const handleQuantityChange = (jobOrderId: number, quantity: number) => {
    setJobOrderQuantities(prev => ({
      ...prev,
      [jobOrderId]: quantity
    }));
  };

  const handleCreateMix = () => {
    if (!selectedFormula) {
      toast({
        title: "Error",
        description: "Please select an ABA formula",
        variant: "destructive",
      });
      return;
    }

    if (selectedJobOrders.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one job order",
        variant: "destructive",
      });
      return;
    }

    const jobOrderIds = Array.from(selectedJobOrders);
    const quantities = jobOrderIds.map(id => jobOrderQuantities[id] || 0);

    if (quantities.some(q => q <= 0)) {
      toast({
        title: "Error",
        description: "All quantities must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    createJoMixMutation.mutate({
      abaFormulaId: selectedFormula,
      jobOrderIds,
      jobOrderQuantities: quantities
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="default">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handlePrintMix = (mix: JoMix) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>JO Mix Report - ${mix.mixNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section h3 { background-color: #f5f5f5; padding: 10px; margin: 0 0 15px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
            .info-label { font-weight: bold; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>JO Mix Production Report</h1>
            <h2>Mix Number: ${mix.mixNumber}</h2>
          </div>
          
          <div class="section">
            <h3>Mix Information</h3>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">Mix Number:</span>
                  <span>${mix.mixNumber}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Total Quantity:</span>
                  <span>${mix.totalQuantity} kg</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Screw Type:</span>
                  <span>${mix.screwType}</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">Formula:</span>
                  <span>${mix.formulaName}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Status:</span>
                  <span>${mix.status.toUpperCase()}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Created:</span>
                  <span>${new Date(mix.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          ${mix.items && mix.items.length > 0 ? `
          <div class="section">
            <h3>Job Order Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Job Order ID</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${mix.items.map(item => `
                  <tr>
                    <td>${item.jobOrderId}</td>
                    <td>${item.quantity} kg</td>
                    <td>${item.status || 'Pending'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          ${mix.materials && mix.materials.length > 0 ? `
          <div class="section">
            <h3>Material Composition</h3>
            <table>
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                ${mix.materials.map(material => `
                  <tr>
                    <td>${material.materialName || 'Unknown Material'}</td>
                    <td>${material.materialType || 'N/A'}</td>
                    <td>${material.quantity}</td>
                    <td>${material.materialUnit || 'kg'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Production Management System - JO Mix Report</p>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const pendingJobOrders = jobOrders.filter(jo => jo.status === 'pending' || jo.status === 'in_progress');

  if (loadingMixes || loadingJobOrders || loadingFormulas) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">JO Mix</h1>
          <p className="text-muted-foreground">
            Create ABA mixing for job orders using predefined formulas
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create JO Mix
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New JO Mix</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Formula Selection */}
              <div className="space-y-2">
                <Label htmlFor="formula">ABA Formula *</Label>
                <Select value={selectedFormula?.toString() || ""} onValueChange={(value) => setSelectedFormula(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ABA Formula" />
                  </SelectTrigger>
                  <SelectContent>
                    {abaFormulas.map((formula) => (
                      <SelectItem key={formula.id} value={formula.id.toString()}>
                        {formula.name} (A:B = {formula.abRatio})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Job Orders Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Job Orders</h3>
                <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>JO #</TableHead>
                        <TableHead>Order #</TableHead>
                        <TableHead>Original Qty (kg)</TableHead>
                        <TableHead>Mix Qty (kg)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingJobOrders.map((jobOrder) => (
                        <TableRow key={jobOrder.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedJobOrders.has(jobOrder.id)}
                              onCheckedChange={(checked) => 
                                handleJobOrderSelection(jobOrder.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell>JO #{jobOrder.id}</TableCell>
                          <TableCell>#{jobOrder.orderId}</TableCell>
                          <TableCell>{jobOrder.quantity.toLocaleString()}</TableCell>
                          <TableCell>
                            {selectedJobOrders.has(jobOrder.id) ? (
                              <Input
                                type="number"
                                value={jobOrderQuantities[jobOrder.id] || ''}
                                onChange={(e) => handleQuantityChange(jobOrder.id, parseFloat(e.target.value) || 0)}
                                className="w-24"
                                min="0"
                                step="0.1"
                              />
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(jobOrder.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Summary */}
              {selectedJobOrders.size > 0 && selectedFormula && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Mix Preview</h3>
                    {(() => {
                      const formula = abaFormulas.find(f => f.id === selectedFormula);
                      const totalQuantity = Array.from(selectedJobOrders).reduce((sum, id) => sum + (jobOrderQuantities[id] || 0), 0);
                      if (formula) {
                        const [aRatio, bRatio] = formula.abRatio.split(':').map(Number);
                        const totalRatio = aRatio + bRatio;
                        const aQuantity = (totalQuantity * aRatio) / totalRatio;
                        const bQuantity = (totalQuantity * bRatio) / totalRatio;
                        const aMixes = Math.ceil(aQuantity / 600);
                        const bMixes = Math.ceil(bQuantity / 600);
                        
                        return (
                          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                            <p><strong>Formula:</strong> {formula.name} ({formula.abRatio})</p>
                            <p><strong>Total Quantity:</strong> {totalQuantity.toLocaleString()} kg</p>
                            <p><strong>A Screw Total:</strong> {aQuantity.toLocaleString()} kg ({aMixes} mix{aMixes !== 1 ? 'es' : ''})</p>
                            <p><strong>B Screw Total:</strong> {bQuantity.toLocaleString()} kg ({bMixes} mix{bMixes !== 1 ? 'es' : ''})</p>
                            <p><strong>Total Mixes:</strong> {aMixes + bMixes}</p>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateMix}
                  disabled={createJoMixMutation.isPending || selectedJobOrders.size === 0 || !selectedFormula}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  {createJoMixMutation.isPending ? "Creating..." : "Create Mix"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* JO Mixes Table */}
      <Card>
        <CardHeader>
          <CardTitle>JO Mixes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mix Number</TableHead>
                  <TableHead>Formula</TableHead>
                  <TableHead>Screw Type</TableHead>
                  <TableHead>Quantity (kg)</TableHead>
                  <TableHead>Percent%</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {joMixes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Calculator className="h-8 w-8" />
                        <p>No JO mixes created yet</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  joMixes.map((mix) => {
                    // Calculate total quantity for all mixes to determine percentage
                    const totalAllMixes = joMixes.reduce((sum, m) => sum + m.totalQuantity, 0);
                    const percentage = totalAllMixes > 0 ? (mix.totalQuantity / totalAllMixes * 100).toFixed(1) : '0.0';
                    
                    return (
                      <TableRow key={mix.id}>
                        <TableCell className="font-medium">{mix.mixNumber}</TableCell>
                        <TableCell>{mix.formulaName}</TableCell>
                        <TableCell>
                          <Badge variant={mix.screwType === 'A' ? 'default' : 'secondary'}>
                            Screw {mix.screwType}
                          </Badge>
                        </TableCell>
                        <TableCell>{mix.totalQuantity.toLocaleString()}</TableCell>
                        <TableCell>{percentage}%</TableCell>
                        <TableCell>{getStatusBadge(mix.status)}</TableCell>
                        <TableCell>{new Date(mix.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setViewingMix(mix);
                              setIsViewDialogOpen(true);
                            }}
                            title="View Mix Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrintMix(mix)}
                            title="Print Mix Report"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          {mix.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: mix.id, status: 'in_progress' })}
                            >
                              Start
                            </Button>
                          )}
                          {mix.status === 'in_progress' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: mix.id, status: 'completed' })}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Mix Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mix Details - {viewingMix?.mixNumber}</DialogTitle>
          </DialogHeader>
          
          {viewingMix && (
            <div className="space-y-6">
              {/* Mix Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Formula</Label>
                  <p className="font-medium">{viewingMix.formulaName}</p>
                </div>
                <div>
                  <Label>Screw Type</Label>
                  <p className="font-medium">Screw {viewingMix.screwType}</p>
                </div>
                <div>
                  <Label>Total Quantity</Label>
                  <p className="font-medium">{viewingMix.totalQuantity.toLocaleString()} kg</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(viewingMix.status)}</div>
                </div>
              </div>

              <Separator />

              {/* Job Orders */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Job Orders</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>JO #</TableHead>
                      <TableHead>Quantity (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingMix.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>JO #{item.jobOrderNumber}</TableCell>
                        <TableCell>{item.quantity.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator />

              {/* Materials */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Materials Required</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Percent%</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingMix.materials.map((material: any) => {
                      // Get percentage from backend data
                      const percentage = material.percentage ? material.percentage.toFixed(1) : '0.0';
                      
                      return (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.materialName}</TableCell>
                          <TableCell>{material.materialType}</TableCell>
                          <TableCell>{percentage}%</TableCell>
                          <TableCell>{material.quantity.toLocaleString()}</TableCell>
                          <TableCell>{material.materialUnit}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}