import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SectionForm } from "@/components/setup/section-form";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Section } from "@shared/schema";

export default function Sections() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [deletingSection, setDeletingSection] = useState<Section | null>(null);

  // Fetch sections
  const { data: sections, isLoading } = useQuery<Section[]>({
    queryKey: [API_ENDPOINTS.SECTIONS],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.SECTIONS}/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.SECTIONS] });
      toast({
        title: "Section Deleted",
        description: "The section has been deleted successfully.",
      });
      setDeletingSection(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete section: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (section: Section) => {
    setEditSection(section);
    setFormOpen(true);
  };

  const handleDelete = (section: Section) => {
    setDeletingSection(section);
  };

  const confirmDelete = () => {
    if (deletingSection) {
      deleteMutation.mutate(deletingSection.id);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditSection(null);
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
      header: "Actions",
      cell: (row: Section) => (
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
      Add Section
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Sections</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manage Sections</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={sections || []}
            columns={columns}
            isLoading={isLoading}
            actions={tableActions}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Section Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editSection ? "Edit Section" : "Add New Section"}
            </DialogTitle>
          </DialogHeader>
          <SectionForm 
            section={editSection || undefined}
            onSuccess={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingSection} onOpenChange={(open) => !open && setDeletingSection(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the section{' '}
              <span className="font-semibold">"{deletingSection?.name}"</span>.
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
