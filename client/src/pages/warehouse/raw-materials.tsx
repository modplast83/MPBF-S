import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { formatDateString } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { RawMaterial } from "@shared/schema";

export default function RawMaterials() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editMaterial, setEditMaterial] = useState<RawMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<RawMaterial | null>(null);
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  
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
      {isMobile ? "" : "Add Material"}
    </Button>
  );
  
  // Mobile card view for raw materials
  const renderMobileCards = () => {
    if (!materials || materials.length === 0) {
      return (
        <div className="text-center py-8 px-4 bg-gray-50 rounded-md">
          <span className="material-icons text-gray-300 text-3xl mb-2">inventory</span>
          <p className="text-gray-500">No raw materials found</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {materials.map((material) => (
          <Card key={material.id} className="overflow-hidden hover:shadow-md transition-all">
            <CardHeader className="p-3 pb-2 flex flex-row justify-between items-start bg-gray-50">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="material-icons text-xs text-primary-500">inventory</span>
                  <CardTitle className="text-sm font-semibold">{material.name}</CardTitle>
                </div>
                <p className="text-xs text-gray-500 mt-1">ID: {material.id}</p>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-2">
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-sm font-medium">{material.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="text-sm font-medium">{material.quantity} {material.unit}</p>
                </div>
              </div>
              
              {material.lastUpdated && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="text-xs text-gray-500">{formatDateString(material.lastUpdated)}</p>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="p-2 pt-0 flex justify-end items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleEdit(material)} 
                className="h-8 w-8 rounded-full text-primary-500 hover:text-primary-700 hover:bg-primary-50"
              >
                <span className="material-icons text-sm">edit</span>
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(material)} 
                className="h-8 w-8 rounded-full text-error-500 hover:text-error-700 hover:bg-error-50"
              >
                <span className="material-icons text-sm">delete</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  // Mobile loading state
  const renderMobileLoadingState = () => {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Raw Materials</h1>
        {isMobile && (
          <Button 
            onClick={() => setFormOpen(true)} 
            className="rounded-full h-10 w-10 p-0"
          >
            <span className="material-icons text-base">add</span>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manage Raw Materials</span>
            {!isMobile && tableActions}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            isMobile ? renderMobileLoadingState() : <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
          ) : isMobile ? (
            renderMobileCards()
          ) : (
            <DataTable 
              data={materials || []}
              columns={columns as any}
              actions={!isMobile ? tableActions : undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Material Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className={isMobile ? "max-w-[95vw] p-4 sm:p-6" : ""}>
          <DialogHeader>
            <DialogTitle>
              {editMaterial ? "Edit Material" : "Add New Material"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isMobile ? (
              // Mobile form layout (stacked)
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
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
              </>
            ) : (
              // Desktop form layout (side by side labels and inputs)
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="desktop-name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="desktop-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="desktop-type" className="text-right">
                    Type
                  </Label>
                  <Input
                    id="desktop-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="desktop-quantity" className="text-right">
                    Quantity
                  </Label>
                  <Input
                    id="desktop-quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="desktop-unit" className="text-right">
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
              </>
            )}
          </div>
          <DialogFooter className={isMobile ? "flex flex-col space-y-2" : ""}>
            <Button 
              variant="outline" 
              onClick={handleCloseForm}
              className={isMobile ? "w-full" : ""}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              className={isMobile ? "w-full" : ""}
            >
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
        <AlertDialogContent className={isMobile ? "max-w-[95vw] p-4 sm:p-6" : ""}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the material{' '}
              <span className="font-semibold">"{deletingMaterial?.name}"</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isMobile ? "flex flex-col space-y-2" : ""}>
            <AlertDialogCancel className={isMobile ? "w-full mt-0" : ""}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className={`bg-error-500 hover:bg-error-600 ${isMobile ? "w-full" : ""}`}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
