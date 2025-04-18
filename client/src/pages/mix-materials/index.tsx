import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import MixingProcessDialog from "@/components/mix-materials/mixing-process-dialog";

export default function MixMaterialsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);

  // Fetch all mixing processes
  const {
    data: mixingProcesses,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/mixing-processes"],
    enabled: true,
  });

  // Fetch users for displaying names
  const { data: users } = useQuery({
    queryKey: ["/api/users"],
    enabled: true,
  });

  // Fetch machines for displaying names
  const { data: machines } = useQuery({
    queryKey: ["/api/machines"],
    enabled: true,
  });

  // Fetch orders for displaying order numbers
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
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
      return format(new Date(dateString), "yyyy-MM-dd HH:mm");
    } catch (error) {
      return dateString;
    }
  };

  const handleProcessCreated = () => {
    refetch();
    setIsCreateDialogOpen(false);
    toast({
      title: "Success",
      description: "Mixing process created successfully",
    });
  };

  const handleProcessUpdated = () => {
    refetch();
    setSelectedProcessId(null);
    toast({
      title: "Success",
      description: "Mixing process updated successfully",
    });
  };

  const viewProcessDetails = (processId: number) => {
    setLocation(`/mix-materials/${processId}`);
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        heading="Mix Materials"
        description="Create and manage material mixing processes">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Mixing Process
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
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !mixingProcesses || mixingProcesses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No mixing processes found. Click "New Mixing Process" to create one.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mixed By</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Order</TableHead>
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
                      <TableCell>{getMachineNameById(process.machineId)}</TableCell>
                      <TableCell>{getOrderNumberById(process.orderId)}</TableCell>
                      <TableCell>{process.totalWeight?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{process.status}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => viewProcessDetails(process.id)}
                          >
                            <Pencil className="h-4 w-4" />
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

      {/* Dialog for creating a new mixing process */}
      <MixingProcessDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleProcessCreated}
      />

      {/* Dialog for editing a mixing process */}
      {selectedProcessId && (
        <MixingProcessDialog
          open={selectedProcessId !== null}
          onOpenChange={() => setSelectedProcessId(null)}
          processId={selectedProcessId}
          onSuccess={handleProcessUpdated}
        />
      )}
    </div>
  );
}