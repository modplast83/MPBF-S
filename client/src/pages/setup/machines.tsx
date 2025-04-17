import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MachineForm } from "@/components/setup/machine-form";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Machine, Section } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function Machines() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);

  // Fetch machines and sections
  const { data: machines, isLoading } = useQuery<Machine[]>({
    queryKey: [API_ENDPOINTS.MACHINES],
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: [API_ENDPOINTS.SECTIONS],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.MACHINES}/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.MACHINES] });
      toast({
        title: "Machine Deleted",
        description: "The machine has been deleted successfully.",
      });
      setDeletingMachine(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete machine: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (machine: Machine) => {
    setEditMachine(machine);
    setFormOpen(true);
  };

  const handleDelete = (machine: Machine) => {
    setDeletingMachine(machine);
  };

  const confirmDelete = () => {
    if (deletingMachine) {
      deleteMutation.mutate(deletingMachine.id);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditMachine(null);
  };

  // Helper function to get section name
  const getSectionName = (sectionId: string | null) => {
    if (!sectionId) return "None";
    return sections?.find(s => s.id === sectionId)?.name || "Unknown";
  };

  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Section",
      accessorKey: "sectionId",
      cell: (row: { sectionId: string | null }) => getSectionName(row.sectionId),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (row: { isActive: boolean }) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (row: Machine) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)} className="text-primary-500 hover:text-primary-700">
            <span className="material-icons text-sm">edit</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} className="text-error-500 hover:text-error-700">
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const tableActions = (
    <Button onClick={() => setFormOpen(true)}>
      <span className="material-icons text-sm mr-1">add</span>
      Add Machine
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Machines</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manage Machines</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={machines || []}
            columns={columns}
            isLoading={isLoading}
            actions={tableActions}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Machine Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMachine ? "Edit Machine" : "Add New Machine"}
            </DialogTitle>
          </DialogHeader>
          <MachineForm 
            machine={editMachine || undefined}
            onSuccess={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMachine} onOpenChange={(open) => !open && setDeletingMachine(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the machine{' '}
              <span className="font-semibold">"{deletingMachine?.name}"</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-error-500 hover:bg-error-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
