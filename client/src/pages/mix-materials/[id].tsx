import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { Loader2, ArrowLeft, Plus, Trash2, Save, Edit } from "lucide-react";
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
import MixingDetailDialog from "@/components/mix-materials/mixing-detail-dialog";

export default function MixingProcessDetailsPage({ params }: { params: { id: string } }) {
  const processId = parseInt(params.id);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAddDetailDialogOpen, setIsAddDetailDialogOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<number | null>(null);

  // Fetch process details
  const {
    data: process,
    isLoading: isProcessLoading,
    error: processError,
  } = useQuery({
    queryKey: [`/api/mixing-processes/${processId}`],
    enabled: !isNaN(processId),
  });

  // Fetch mixing details
  const {
    data: mixingDetails,
    isLoading: isDetailsLoading,
    refetch: refetchDetails,
  } = useQuery({
    queryKey: [`/api/mixing-processes/${processId}/details`],
    enabled: !isNaN(processId),
  });

  // Fetch related data
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: true,
  });

  const { data: machines } = useQuery({
    queryKey: ["/api/machines"],
    enabled: true,
  });

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    enabled: true,
  });

  const { data: rawMaterials } = useQuery({
    queryKey: ["/api/raw-materials"],
    enabled: true,
  });

  // Delete detail mutation
  const deleteDetailMutation = useMutation({
    mutationFn: async (detailId: number) => {
      const res = await apiRequest("DELETE", `/api/mixing-details/${detailId}`);
      return res;
    },
    onSuccess: () => {
      refetchDetails();
      toast({
        title: "Success",
        description: "Material deleted successfully from mix",
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
  const getUserNameById = (userId: string | null) => {
    if (!userId) return "N/A";
    const user = users?.find(u => u.id === userId);
    return user ? user.name : userId;
  };

  const getMachineNameById = (machineId: string | null) => {
    if (!machineId) return "N/A";
    const machine = machines?.find(m => m.id === machineId);
    return machine ? machine.name : machineId;
  };

  const getOrderNumberById = (orderId: number | null) => {
    if (!orderId) return "N/A";
    const order = orders?.find(o => o.id === orderId);
    return order ? `Order #${order.id}` : `Order #${orderId}`;
  };

  const getMaterialNameById = (materialId: number | null) => {
    if (!materialId) return "N/A";
    const material = rawMaterials?.find(m => m.id === materialId);
    return material ? material.name : `Material #${materialId}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  const handleGoBack = () => {
    setLocation("/mix-materials");
  };

  const handleDetailCreated = () => {
    refetchDetails();
    setIsAddDetailDialogOpen(false);
    toast({
      title: "Success",
      description: "Material added to mix successfully",
    });
  };

  const handleDetailUpdated = () => {
    refetchDetails();
    setSelectedDetailId(null);
    toast({
      title: "Success",
      description: "Mix material updated successfully",
    });
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

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading={`Mixing Process #${process.id}`}
        description="View and manage material mix details">
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </div>
      </PageHeader>
      <Separator className="my-6" />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mixing Process Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Process ID</p>
                  <p className="text-sm text-muted-foreground">{process.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(process.mixingDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Mixed By</p>
                  <p className="text-sm text-muted-foreground">{getUserNameById(process.mixedById)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Machine</p>
                  <p className="text-sm text-muted-foreground">{getMachineNameById(process.machineId)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Order</p>
                  <p className="text-sm text-muted-foreground">{getOrderNumberById(process.orderId)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <Badge>{process.status}</Badge>
                </div>
              </div>

              {process.notes && (
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground">{process.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between w-full">
              <p className="text-sm font-medium">Total Weight</p>
              <p className="text-lg font-bold">{process.totalWeight?.toFixed(2) || '0.00'} kg</p>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Mix Materials</CardTitle>
              <CardDescription>Materials used in this mixing process</CardDescription>
            </div>
            <Button onClick={() => setIsAddDetailDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Material
            </Button>
          </CardHeader>
          <CardContent>
            {isDetailsLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !mixingDetails || mixingDetails.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No materials added yet. Click "Add Material" to add materials to this mix.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Quantity (kg)</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mixingDetails.map((detail) => (
                      <TableRow key={detail.id}>
                        <TableCell>{getMaterialNameById(detail.materialId)}</TableCell>
                        <TableCell className="text-right">{detail.quantity.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{detail.percentage.toFixed(2)}%</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setSelectedDetailId(detail.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDeleteDetail(detail.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Dialog for adding a material to the mix */}
      <MixingDetailDialog
        open={isAddDetailDialogOpen}
        onOpenChange={setIsAddDetailDialogOpen}
        processId={processId}
        onSuccess={handleDetailCreated}
      />

      {/* Dialog for editing a material in the mix */}
      {selectedDetailId && (
        <MixingDetailDialog
          open={selectedDetailId !== null}
          onOpenChange={() => setSelectedDetailId(null)}
          processId={processId}
          detailId={selectedDetailId}
          onSuccess={handleDetailUpdated}
        />
      )}
    </div>
  );
}