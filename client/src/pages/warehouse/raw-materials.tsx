import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { formatDateString } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { RawMaterial } from "@shared/schema";

export default function RawMaterials() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<RawMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<RawMaterial | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState("Kg");

  // Fetch raw materials
  const { data: materials, isLoading } = useQuery<RawMaterial[]>({
    queryKey: [API_ENDPOINTS.RAW_MATERIALS],
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; quantity: number; unit: string }) => {
      if (editMaterial) {
        await apiRequest("PUT", `${API_ENDPOINTS.RAW_MATERIALS}/${editMaterial.id}`, data);
      } else {
        await apiRequest("POST", API_ENDPOINTS.RAW_MATERIALS, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.RAW_MATERIALS] });
      toast({
        title: `Material ${editMaterial ? "Updated" : "Created"}`,
        description: `The material has been ${editMaterial ? "updated" : "created"} successfully.`,
      });
      handleCloseForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${editMaterial ? "update" : "create"} material: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.RAW_MATERIALS}/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.RAW_MATERIALS] });
      toast({
        title: "Material Deleted",
        description: "The material has been deleted successfully.",
      });
      setDeletingMaterial(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete material: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (material: RawMaterial) => {
    setEditMaterial(material);
    setName(material.name);
    setType(material.type);
    setQuantity(material.quantity);
    setUnit(material.unit);
    setFormOpen(true);
  };

  const handleDelete = (material: RawMaterial) => {
    setDeletingMaterial(material);
  };

  const handleSave = () => {
    if (!name || !type || quantity < 0 || !unit) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({ name, type, quantity, unit });
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditMaterial(null);
    setName("");
    setType("");
    setQuantity(0);
    setUnit("Kg");
  };

  const confirmDelete = () => {
    if (deletingMaterial) {
      deleteMutation.mutate(deletingMaterial.id);
    }
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
      header: "Type",
      accessorKey: "type",
    },
    {
      header: "Quantity",
      accessorKey: (row: RawMaterial) => `${row.quantity} ${row.unit}`,
    },
    {
      header: "Last Updated",
      accessorKey: "lastUpdated",
      cell: (row: { lastUpdated: string }) => formatDateString(row.lastUpdated),
    },
    {
      header: "Actions",
      cell: (row: RawMaterial) => (
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
      Add Material
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Raw Materials</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manage Raw Materials</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={materials || []}
            columns={columns}
            isLoading={isLoading}
            actions={tableActions}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Material Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editMaterial ? "Edit Material" : "Add New Material"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Input
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">
                Unit
              </Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kg">Kilogram (Kg)</SelectItem>
                  <SelectItem value="g">Gram (g)</SelectItem>
                  <SelectItem value="T">Ton (T)</SelectItem>
                  <SelectItem value="L">Liter (L)</SelectItem>
                  <SelectItem value="ml">Milliliter (ml)</SelectItem>
                  <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? editMaterial ? "Updating..." : "Creating..."
                : editMaterial ? "Update" : "Create"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMaterial} onOpenChange={(open) => !open && setDeletingMaterial(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the material{' '}
              <span className="font-semibold">"{deletingMaterial?.name}"</span>.
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
