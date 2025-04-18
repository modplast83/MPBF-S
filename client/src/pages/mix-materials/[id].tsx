import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, ArrowLeft, Plus, Trash2, Save, Edit, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MixingDetailDialog from "@/components/mix-materials/mixing-detail-dialog";

export default function MixingProcessDetailsPage() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Extract the ID from the URL path
  const pathParts = location.split('/');
  const processId = pathParts.length > 2 ? parseInt(pathParts[pathParts.length - 1]) : null;
  const [isAddDetailDialogOpen, setIsAddDetailDialogOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);
  const [newMaterialId, setNewMaterialId] = useState<number | null>(null);
  const [newMaterialQuantity, setNewMaterialQuantity] = useState<string>("");
  const [newMaterialNotes, setNewMaterialNotes] = useState<string>("");

  // Fetch process details with associated machines and orders
  const {
    data: processData,
    isLoading: isProcessLoading,
    error: processError,
    refetch: refetchProcess,
  } = useQuery({
    queryKey: [`/api/mixing-processes/${processId}/details`],
    enabled: !isNaN(processId),
  });

  // Get process, machines, orders, and details from the response
  const process = processData?.process;
  const machines = processData?.machines || [];
  const orders = processData?.orders || [];
  const mixingDetails = processData?.details || [];
  const user = processData?.user;

  // Fetch raw materials
  const { data: rawMaterials } = useQuery({
    queryKey: ["/api/raw-materials"],
    enabled: true,
  });

  // Calculate total weight
  const totalWeight = mixingDetails.reduce((sum, detail) => sum + detail.quantity, 0);

  // Add material mutation
  const addMaterialMutation = useMutation({
    mutationFn: async () => {
      if (!newMaterialId || !newMaterialQuantity || parseFloat(newMaterialQuantity) <= 0) {
        throw new Error("Invalid material or quantity");
      }
      
      const res = await apiRequest("POST", "/api/mixing-details", {
        mixingProcessId: processId,
        materialId: newMaterialId,
        quantity: parseFloat(newMaterialQuantity),
        notes: newMaterialNotes,
      });
      return await res.json();
    },
    onSuccess: () => {
      refetchProcess();
      toast({
        title: "Success",
        description: "Material added to mix successfully",
      });
      // Reset form
      setNewMaterialId(null);
      setNewMaterialQuantity("");
      setNewMaterialNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add material to mix",
        variant: "destructive",
      });
    },
  });

  // Delete detail mutation
  const deleteDetailMutation = useMutation({
    mutationFn: async (detailId: number) => {
      const res = await apiRequest("DELETE", `/api/mixing-details/${detailId}`);
      return res;
    },
    onSuccess: () => {
      refetchProcess();
      toast({
        title: "Success",
        description: "Material removed from mix",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete material from mix",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getMaterialNameById = (materialId: number | null) => {
    if (!materialId) return "N/A";
    const material = rawMaterials?.find(m => m.id === materialId);
    return material ? material.name : `Material #${materialId}`;
  };

  const getMaterialById = (materialId: number) => {
    return rawMaterials?.find(m => m.id === materialId);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch (error) {
      return dateString;
    }
  };

  const handleGoBack = () => {
    setLocation("/mix-materials");
  };

  const handleAddMaterial = () => {
    addMaterialMutation.mutate();
  };

  const handleDeleteDetail = (detailId: number) => {
    if (confirm("Are you sure you want to remove this material from the mix?")) {
      deleteDetailMutation.mutate(detailId);
    }
  };

  if (isProcessLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (processError || !process) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load mixing process. Please try again later.
          </AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Mix Materials
        </Button>
      </div>
    );
  }

  // Confirm mix mutation
  const confirmMixMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest(
        "PUT", 
        `/api/mixing-processes/${processId}`, 
        { confirmed: true }
      );
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to confirm mix: ${errorText}`);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mix confirmed successfully. Raw material quantities have been updated.",
      });
      refetchProcess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm mix",
        variant: "destructive",
      });
    },
  });

  // Handle confirm mix
  const handleConfirmMix = () => {
    if (confirm("Are you sure you want to confirm this mix? This will deduct materials from inventory.")) {
      confirmMixMutation.mutate();
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Mix #{process.id} Details</h2>
          <div className="mt-2">
            {process.confirmed ? (
              <Badge variant="success">Confirmed</Badge>
            ) : (
              <Badge variant="secondary">Draft</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!process.confirmed && (
            <Button 
              variant="primary"
              onClick={handleConfirmMix}
              disabled={confirmMixMutation.isPending}
            >
              {confirmMixMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Confirm Mix
            </Button>
          )}
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Mix List
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Mix Details</TabsTrigger>
          <TabsTrigger value="composition">Composition</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6 mt-6">
          {/* Basic information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="date"
                value={formatDate(process.mixingDate)}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Created By</label>
              <Input
                value={user?.name || ""}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          
          {/* Notes */}
          {process.notes && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Notes</label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{process.notes}</p>
              </div>
            </div>
          )}
          
          {/* Related Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Related Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No orders associated with this mix
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center p-3 border rounded-md">
                      <FileText className="h-5 w-5 mr-3 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Order #{order.id}</div>
                        <div className="text-sm text-muted-foreground">
                          Customer: {order.customerId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Machines */}
          <Card>
            <CardHeader>
              <CardTitle>Machines</CardTitle>
            </CardHeader>
            <CardContent>
              {machines.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No machines associated with this mix
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {machines.map((machine) => (
                    <div key={machine.id} className="p-3 border rounded-md">
                      <div className="font-medium">{machine.name}</div>
                      <div className="text-sm text-muted-foreground">Extruder</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="composition" className="space-y-6 mt-6">
          {/* Add material section - only shown if mix is not confirmed */}
          {!process.confirmed && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Add Material</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Material</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md"
                      value={newMaterialId || ""}
                      onChange={(e) => setNewMaterialId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">Select a material...</option>
                      {rawMaterials?.map((material) => (
                        <option key={material.id} value={material.id}>
                          {material.name} ({material.quantity} {material.unit} available)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity (KG)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newMaterialQuantity}
                      onChange={(e) => setNewMaterialQuantity(e.target.value)}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      className="w-full"
                      onClick={handleAddMaterial}
                      disabled={!newMaterialId || !newMaterialQuantity || parseFloat(newMaterialQuantity) <= 0 || addMaterialMutation.isPending}
                    >
                      {addMaterialMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Add to Mix
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Materials table */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Materials in This Mix</CardTitle>
                <div className="text-sm font-medium">{totalWeight.toFixed(2)} kg</div>
              </div>
            </CardHeader>
            <CardContent>
              {mixingDetails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No materials added yet. Use the form above to add materials.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mixingDetails.map((detail) => {
                      const material = getMaterialById(detail.materialId);
                      return (
                        <TableRow key={detail.id}>
                          <TableCell className="font-medium">
                            {getMaterialNameById(detail.materialId)}
                            <div className="text-xs text-muted-foreground">
                              {material?.type}
                            </div>
                          </TableCell>
                          <TableCell>{detail.quantity.toFixed(2)} kg</TableCell>
                          <TableCell>{detail.percentage.toFixed(2)}%</TableCell>
                          <TableCell>{detail.notes || "-"}</TableCell>
                          <TableCell>
                            {!process.confirmed && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteDetail(detail.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          
          {/* Mix Composition Summary */}
          {mixingDetails.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Mix Composition Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mixingDetails.map((detail) => (
                    <div key={detail.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{getMaterialNameById(detail.materialId)}</span>
                        <span>{detail.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="text-sm">{detail.quantity.toFixed(2)} kg</div>
                      <Progress value={detail.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog for editing a material in the mix */}
      {selectedDetailId && (
        <MixingDetailDialog
          open={selectedDetailId !== null}
          onOpenChange={() => setSelectedDetailId(null)}
          processId={processId}
          detailId={selectedDetailId}
          onSuccess={() => {
            refetchProcess();
            setSelectedDetailId(null);
          }}
        />
      )}
    </div>
  );
}