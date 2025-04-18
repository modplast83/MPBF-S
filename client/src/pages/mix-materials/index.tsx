import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MixMaterialsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreatingNewMix, setIsCreatingNewMix] = useState(false);
  const [viewingMixId, setViewingMixId] = useState<number | null>(null);
  
  // New mix data states
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [mixNotes, setMixNotes] = useState("");
  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  
  // Material addition states
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
  const [materialQuantity, setMaterialQuantity] = useState<number>(0);
  const [materialNotes, setMaterialNotes] = useState("");
  const [mixMaterials, setMixMaterials] = useState<any[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);

  // Fetch all mixing processes
  const {
    data: mixingProcesses,
    isLoading: isProcessesLoading,
    refetch: refetchProcesses,
  } = useQuery({
    queryKey: ["/api/mixing-processes"],
    enabled: !isCreatingNewMix,
  });

  // Fetch users
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: true,
  });

  // Fetch extrusion machines only
  const { data: machines } = useQuery({
    queryKey: ["/api/machines"],
    select: (machines) => 
      machines?.filter((machine) => machine.sectionId === "SEC001") || [],
    enabled: true,
  });

  // Fetch active orders
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    select: (orders) => 
      orders?.filter((order) => order.status !== "completed" && order.status !== "cancelled") || [],
    enabled: true,
  });

  // Fetch raw materials
  const { data: rawMaterials } = useQuery({
    queryKey: ["/api/raw-materials"],
    enabled: true,
  });

  // Helper function to get user name by ID
  const getUserNameById = (userId: string | null) => {
    if (!userId) return "N/A";
    const user = users?.find(u => u.id === userId);
    return user ? user.name : userId;
  };

  // Helper function to get machine name by ID
  const getMachineNameById = (machineId: string | null) => {
    if (!machineId) return "N/A";
    const machine = machines?.find(m => m.id === machineId);
    return machine ? machine.name : machineId;
  };

  // Helper function to get order number by ID
  const getOrderNumberById = (orderId: number | null) => {
    if (!orderId) return "N/A";
    const order = orders?.find(o => o.id === orderId);
    return order ? `Order #${order.id}` : `Order #${orderId}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch (error) {
      return dateString;
    }
  };

  // Toggle machine selection
  const toggleMachineSelection = (machineId: string) => {
    setSelectedMachines(prev => {
      if (prev.includes(machineId)) {
        return prev.filter(id => id !== machineId);
      } else {
        return [...prev, machineId];
      }
    });
  };

  // Toggle order selection
  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // Handle material selection with automatic quantity detection
  const handleMaterialSelect = (materialId: string) => {
    const id = parseInt(materialId);
    setSelectedMaterialId(id);
    
    // Automatically set the quantity from the material stock
    const material = rawMaterials?.find(m => m.id === id);
    if (material && material.quantity) {
      setMaterialQuantity(material.quantity);
    } else {
      setMaterialQuantity(0);
    }
  };

  // Add material to current mix
  const addMaterialToMix = () => {
    if (!selectedMaterialId || materialQuantity <= 0) {
      toast({
        title: "Invalid Entry",
        description: "Please select a material and enter a quantity greater than zero.",
        variant: "destructive"
      });
      return;
    }

    const material = rawMaterials?.find(m => m.id === selectedMaterialId);
    if (!material) return;
    
    // Check if the material is already in the mix
    const existingMaterialIndex = mixMaterials.findIndex(
      m => m.materialId === selectedMaterialId
    );
    
    const newMixMaterials = [...mixMaterials];
    
    if (existingMaterialIndex >= 0) {
      // Update existing material quantity
      newMixMaterials[existingMaterialIndex].quantity += materialQuantity;
      newMixMaterials[existingMaterialIndex].notes = materialNotes || 
        newMixMaterials[existingMaterialIndex].notes;
    } else {
      // Add new material
      newMixMaterials.push({
        materialId: selectedMaterialId,
        material,
        quantity: materialQuantity,
        notes: materialNotes,
        id: Date.now() // Temporary ID for frontend use
      });
    }
    
    const newTotalWeight = newMixMaterials.reduce((sum, m) => sum + m.quantity, 0);
    
    // Update percentages for all materials
    newMixMaterials.forEach(m => {
      m.percentage = (m.quantity / newTotalWeight) * 100;
    });
    
    setMixMaterials(newMixMaterials);
    setTotalWeight(newTotalWeight);
    setSelectedMaterialId(null);
    setMaterialQuantity(0);
    setMaterialNotes("");
  };

  // Remove material from current mix
  const removeMaterialFromMix = (materialId: number) => {
    const newMixMaterials = mixMaterials.filter(m => m.materialId !== materialId);
    const newTotalWeight = newMixMaterials.reduce((sum, m) => sum + m.quantity, 0);
    
    // Update percentages for all materials
    if (newTotalWeight > 0) {
      newMixMaterials.forEach(m => {
        m.percentage = (m.quantity / newTotalWeight) * 100;
      });
    }
    
    setMixMaterials(newMixMaterials);
    setTotalWeight(newTotalWeight);
  };

  // Create new mix mutation
  const createMixMutation = useMutation({
    mutationFn: async () => {
      if (mixMaterials.length === 0) {
        throw new Error("Cannot save mix without materials");
      }
      
      // 1. Create the mixing process
      const processData = {
        // No notes field
      };
      
      const processResponse = await apiRequest("POST", "/api/mixing-processes", processData);
      const processResult = await processResponse.json();
      
      // Store the process ID to use in subsequent calls
      const processId = processResult.id;
      
      if (!processId) {
        throw new Error("Failed to create mixing process - no ID returned");
      }
      
      // 2. Add machine associations if any
      if (selectedMachines.length > 0) {
        for (const machineId of selectedMachines) {
          await apiRequest("POST", `/api/mixing-processes/${processId}/machines`, { machineId });
        }
      }
      
      // 3. Add order associations if any
      if (selectedOrders.length > 0) {
        for (const orderId of selectedOrders) {
          await apiRequest("POST", `/api/mixing-processes/${processId}/orders`, { orderId });
        }
      }
      
      // 4. Add all materials to the mix
      for (const material of mixMaterials) {
        await apiRequest("POST", "/api/mixing-details", {
          mixingProcessId: processId,
          materialId: material.materialId,
          quantity: material.quantity,
          // No notes field
        });
      }
      
      return processResult;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Mixing process created successfully",
      });
      
      // Reset form and get back to list view
      setIsCreatingNewMix(false);
      resetMixForm();
      refetchProcesses();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create mixing process",
        variant: "destructive",
      });
    },
  });

  // Reset mix form
  const resetMixForm = () => {
    setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    setMixNotes("");
    setSelectedMachines([]);
    setSelectedOrders([]);
    setSelectedMaterialId(null);
    setMaterialQuantity(0);
    setMaterialNotes("");
    setMixMaterials([]);
    setTotalWeight(0);
  };

  // Start creating a new mix
  const startNewMix = () => {
    resetMixForm();
    setIsCreatingNewMix(true);
  };

  // View process details
  const viewProcessDetails = (processId: number) => {
    setLocation(`/mix-materials/${processId}`);
  };

  // Save current mix
  const saveMix = () => {
    if (mixMaterials.length === 0) {
      toast({
        title: "Cannot Save",
        description: "Please add at least one material to the mix",
        variant: "destructive"
      });
      return;
    }
    
    createMixMutation.mutate();
  };

  if (isCreatingNewMix) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Create New Mix</h2>
          <Button variant="outline" onClick={() => setIsCreatingNewMix(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Date and Created By section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
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
          
          {/* Remove Notes section */}
          
          {/* Mix Components Section */}
          <Collapsible open={true} className="w-full space-y-2">
            <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-md">
              <h3 className="text-lg font-semibold">Mix Components</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="space-y-4">
              <Card className="p-4 border-dashed">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">MATERIAL FROM INVENTORY</label>
                      <Select 
                        value={selectedMaterialId?.toString() || ""} 
                        onValueChange={handleMaterialSelect}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a material..." />
                        </SelectTrigger>
                        <SelectContent>
                          {rawMaterials?.map((material) => (
                            <SelectItem key={material.id} value={material.id.toString()}>
                              <div className="flex justify-between w-full">
                                <span>{material.name}</span>
                                <Badge variant={material.quantity > 0 ? "outline" : "destructive"} className="ml-2">
                                  {material.quantity !== null ? `${material.quantity} ${material.unit}` : 'No stock'}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-full sm:w-1/3">
                      <label className="block text-sm font-medium mb-2">QUANTITY (KG)</label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={materialQuantity || ""}
                        onChange={(e) => setMaterialQuantity(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">NOTES (OPTIONAL)</label>
                    <Input
                      placeholder="e.g. batch details, color, specific use"
                      value={materialNotes}
                      onChange={(e) => setMaterialNotes(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={addMaterialToMix}
                      disabled={!selectedMaterialId || materialQuantity <= 0}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add to Mix
                    </Button>
                  </div>
                </div>
              </Card>
              
              {/* Materials in this mix */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-center">
                    <CardTitle>MATERIALS IN THIS MIX</CardTitle>
                    <div className="text-sm font-medium">{totalWeight.toFixed(2)} kg</div>
                  </div>
                </CardHeader>
                <CardContent>
                  {mixMaterials.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No materials added yet. Use the form above to add materials.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>MATERIAL</TableHead>
                          <TableHead>QUANTITY</TableHead>
                          <TableHead>PERCENTAGE</TableHead>
                          <TableHead>NOTES</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mixMaterials.map((item) => (
                          <TableRow key={item.materialId}>
                            <TableCell className="font-medium">
                              {item.material?.name || `Material #${item.materialId}`}
                              <div className="text-xs text-muted-foreground">
                                {item.material?.type}
                              </div>
                            </TableCell>
                            <TableCell>{item.quantity.toFixed(2)} kg</TableCell>
                            <TableCell>{item.percentage.toFixed(2)}%</TableCell>
                            <TableCell>{item.notes || "-"}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeMaterialFromMix(item.materialId)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              
              {/* Mix Composition Summary */}
              {mixMaterials.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>MIX COMPOSITION SUMMARY</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mixMaterials.map((item) => (
                        <div key={item.materialId} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.material?.name}</span>
                            <span>{item.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="text-sm">{item.quantity.toFixed(2)} kg</div>
                          <Progress value={item.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CollapsibleContent>
          </Collapsible>
          
          {/* Related Orders */}
          <Collapsible className="w-full space-y-2">
            <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-md">
              <h3 className="text-lg font-semibold">Related Orders</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent className="p-4">
              <ScrollArea className="h-60 border rounded-md p-4">
                <div className="space-y-2">
                  {orders?.length ? (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                        onClick={() => toggleOrderSelection(order.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order.id)}
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                        <div>
                          <div className="font-medium">Order #{order.id}</div>
                          <div className="text-sm text-muted-foreground">Customer: {order.customerId}</div>
                          <div className="text-sm text-muted-foreground">Status: {order.status}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No active orders available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
          
          {/* Machines */}
          <Collapsible className="w-full space-y-2">
            <div className="flex items-center justify-between px-4 py-2 bg-muted rounded-md">
              <h3 className="text-lg font-semibold">Machines</h3>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Pencil className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            
            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                {machines?.map((machine) => (
                  <div
                    key={machine.id}
                    className={`border rounded-md p-4 cursor-pointer ${
                      selectedMachines.includes(machine.id) ? 'border-primary' : ''
                    }`}
                    onClick={() => toggleMachineSelection(machine.id)}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedMachines.includes(machine.id)}
                        onChange={() => {}}
                        className="mr-3 h-4 w-4"
                      />
                      <div>
                        <div className="font-medium">{machine.name}</div>
                        <div className="text-sm text-muted-foreground">Extruder</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
          
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="outline" onClick={() => setIsCreatingNewMix(false)}>
              Cancel
            </Button>
            <Button 
              onClick={saveMix} 
              disabled={createMixMutation.isPending || mixMaterials.length === 0}
            >
              {createMixMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Mix
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading="Mixes"
        description="Create and manage material mixing processes">
        <Button onClick={startNewMix}>
          <Plus className="mr-2 h-4 w-4" /> New Mix
        </Button>
      </PageHeader>
      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>Mixing Processes</CardTitle>
          <CardDescription>
            All material mixing processes in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isProcessesLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !mixingProcesses || mixingProcesses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No mixing processes found. Click "New Mix" to create one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mixed By</TableHead>
                    <TableHead>Total Weight (kg)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mixingProcesses.map((process) => (
                    <TableRow key={process.id}>
                      <TableCell>{process.id}</TableCell>
                      <TableCell>{formatDate(process.mixingDate)}</TableCell>
                      <TableCell>{getUserNameById(process.mixedById)}</TableCell>
                      <TableCell>{process.totalWeight?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        <Badge variant={process.confirmed ? "success" : "secondary"}>
                          {process.confirmed ? "Confirmed" : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewProcessDetails(process.id)}
                          >
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}