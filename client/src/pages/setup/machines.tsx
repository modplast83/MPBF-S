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
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";

export default function Machines() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  const [deletingMachine, setDeletingMachine] = useState<Machine | null>(null);

  // Fetch machines and sections
  const { data: machinesData, isLoading } = useQuery<Machine[]>({
    queryKey: [API_ENDPOINTS.MACHINES],
  });

  // Sort machines by ID
  const machines = machinesData ? [...machinesData].sort((a, b) => a.id.localeCompare(b.id)) : [];

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
        title: t("setup.machines.machine_deleted"),
        description: t("setup.machines.machine_deleted_success"),
      });
      setDeletingMachine(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("setup.machines.delete_failed", { error }),
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
      accessorKey: "id" as const,
    },
    {
      header: "Name",
      accessorKey: "name" as const,
    },
    {
      header: "S/N",
      accessorKey: "serialNumber" as const,
      cell: (row: Machine) => row.serialNumber || "N/A",
    },
    {
      header: "Supplier",
      accessorKey: "supplier" as const,
      cell: (row: Machine) => row.supplier || "N/A",
    },
    {
      header: "Date of Manufacturing",
      accessorKey: "dateOfManufacturing" as const,
      cell: (row: Machine) => 
        row.dateOfManufacturing 
          ? new Date(row.dateOfManufacturing).toLocaleDateString()
          : "N/A",
    },
    {
      header: "Model #",
      accessorKey: "modelNumber" as const,
      cell: (row: Machine) => row.modelNumber || "N/A",
    },
    {
      header: "Section",
      accessorKey: "sectionId" as const,
      cell: (row: Machine) => getSectionName(row.sectionId),
    },
    {
      header: "Status",
      accessorKey: "isActive" as const,
      cell: (row: Machine) => (
        <Badge variant={row.isActive === true ? "default" : "secondary"}>
          {row.isActive === true ? "Active" : "Inactive"}
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
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700">
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const tableActions = (
    <Button onClick={() => setFormOpen(true)}>
      <span className="material-icons text-sm mr-1">add</span>
      {t('setup.machines.add_new')}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t('setup.machines.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t('setup.machines.description')}</span>
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
              {editMachine ? t('setup.machines.edit_machine') : t('setup.machines.add_new')}
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
            <AlertDialogTitle>{t('setup.machines.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('setup.machines.delete_confirmation', { name: deletingMachine?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('setup.machines.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {t('setup.machines.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
