import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { formatDateString } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { RawMaterial, MaterialInput, MaterialInputItem } from "@shared/schema";

export default function RawMaterials() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [inputFormOpen, setInputFormOpen] = useState(false);
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
  
  // Input material form state
  const [inputItems, setInputItems] = useState<{id: number, rawMaterialId: number, quantity: number}[]>([]);
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<number | null>(null);
  const [inputQuantity, setInputQuantity] = useState<number>(0);

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
        title: editMaterial ? t("warehouse.material_updated") : t("warehouse.material_created"),
        description: editMaterial ? t("warehouse.material_updated_success") : t("warehouse.material_created_success"),
      });
      handleCloseForm();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: editMaterial ? t("warehouse.update_material_failed", { error }) : t("warehouse.create_material_failed", { error }),
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.RAW_MATERIALS}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.RAW_MATERIALS] });
      toast({
        title: t("warehouse.material_deleted"),
        description: t("warehouse.material_deleted_success"),
      });
      setDeletingMaterial(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("warehouse.delete_material_failed", { error }),
        variant: "destructive",
      });
    },
  });
  
  // Input Material mutation
  const inputMaterialMutation = useMutation({
    mutationFn: async (data: { items: { rawMaterialId: number, quantity: number }[] }) => {
      return await apiRequest("POST", API_ENDPOINTS.MATERIAL_INPUTS, {
        date: new Date(),
        items: data.items
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.RAW_MATERIALS] });
      toast({
        title: t("warehouse.materials_updated"),
        description: t("warehouse.materials_updated_success"),
      });
      handleCloseInputForm();
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("warehouse.update_materials_failed", { error }),
        variant: "destructive",
      });
    },
  });
  
  // Handle adding an item to the input list
  const handleAddInputItem = () => {
    if (!selectedRawMaterialId || inputQuantity <= 0) {
      toast({
        title: t("warehouse.validation_error"),
        description: t("warehouse.select_material_and_quantity"),
        variant: "destructive",
      });
      return;
    }
    
    // Add item to the list
    const newId = inputItems.length > 0 ? Math.max(...inputItems.map(item => item.id)) + 1 : 1;
    setInputItems([
      ...inputItems,
      { 
        id: newId, 
        rawMaterialId: selectedRawMaterialId, 
        quantity: inputQuantity 
      }
    ]);
    
    // Reset the form
    setSelectedRawMaterialId(null);
    setInputQuantity(0);
  };
  
  // Handle removing an item from the input list
  const handleRemoveInputItem = (id: number) => {
    setInputItems(inputItems.filter(item => item.id !== id));
  };
  
  // Handle saving the input form
  const handleSaveInput = () => {
    if (inputItems.length === 0) {
      toast({
        title: t("warehouse.validation_error"),
        description: t("warehouse.add_at_least_one_material"),
        variant: "destructive",
      });
      return;
    }
    
    inputMaterialMutation.mutate({ 
      items: inputItems.map(item => ({ 
        rawMaterialId: item.rawMaterialId, 
        quantity: item.quantity 
      })) 
    });
  };
  
  // Handle closing the input form
  const handleCloseInputForm = () => {
    setInputFormOpen(false);
    setSelectedRawMaterialId(null);
    setInputQuantity(0);
    setInputItems([]);
  };

  const handleEdit = (material: RawMaterial) => {
    setEditMaterial(material);
    setName(material.name);
    setType(material.type);
    setQuantity(material.quantity || 0);
    setUnit(material.unit);
    setFormOpen(true);
  };

  const handleDelete = (material: RawMaterial) => {
    setDeletingMaterial(material);
  };

  const handleSave = () => {
    if (!name || !type || quantity < 0 || !unit) {
      toast({
        title: t("warehouse.validation_error"),
        description: t("warehouse.fill_required_fields"),
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
      header: t("warehouse.id"),
      accessorKey: "id",
    },
    {
      header: t("warehouse.name"),
      accessorKey: "name",
    },
    {
      header: t("warehouse.type"),
      accessorKey: "type",
    },
    {
      header: t("warehouse.quantity"),
      accessorKey: (row: RawMaterial) => `${row.quantity} ${row.unit}`,
    },
    {
      header: t("warehouse.last_updated"),
      accessorKey: "lastUpdated",
      cell: (row: { lastUpdated: string }) => formatDateString(row.lastUpdated),
    },
    {
      header: t("warehouse.actions"),
      cell: (row: RawMaterial) => (
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
    <div className="flex space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <span className="material-icons text-sm mr-1">add</span>
            {t("warehouse.actions")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setFormOpen(true)}>
            <span className="material-icons text-sm mr-2">add</span>
            {t("warehouse.add_material")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setInputFormOpen(true)}>
            <span className="material-icons text-sm mr-2">add_shopping_cart</span>
            {t("warehouse.input_material")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
  
  // Mobile card view for raw materials
  const renderMobileCards = () => {
    if (!materials || materials.length === 0) {
      return (
        <div className="text-center py-8 px-4 bg-gray-50 rounded-md">
          <span className="material-icons text-gray-300 text-3xl mb-2">inventory</span>
          <p className="text-gray-500">{t("warehouse.no_raw_materials_found")}</p>
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
                  <p className="text-xs text-gray-500">{t("warehouse.type")}</p>
                  <p className="text-sm font-medium">{material.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t("warehouse.quantity")}</p>
                  <p className="text-sm font-medium">{material.quantity} {material.unit}</p>
                </div>
              </div>
              
              {material.lastUpdated && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{t("warehouse.last_updated")}</p>
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
                className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
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
        <h1 className="text-2xl font-bold text-secondary-900">{t('warehouse.raw_materials')}</h1>
        {isMobile && (
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  className="rounded-full h-10 w-10 p-0"
                >
                  <span className="material-icons text-base">add</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFormOpen(true)}>
                  <span className={`material-icons text-sm ${isRTL ? 'ml-2' : 'mr-2'}`}>add</span>
                  {t('warehouse.add_material')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setInputFormOpen(true)}>
                  <span className={`material-icons text-sm ${isRTL ? 'ml-2' : 'mr-2'}`}>add_shopping_cart</span>
                  {t('warehouse.input_material')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t('warehouse.manage_raw_materials')}</span>
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
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Material Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className={`${isMobile ? "max-w-[95vw] p-4 sm:p-6" : ""} ${isRTL ? "rtl" : ""}`}>
          <DialogHeader>
            <DialogTitle>
              {editMaterial ? t('warehouse.edit_material') : t('warehouse.add_new_material')}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isMobile ? (
              // Mobile form layout (stacked)
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('warehouse.name')}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">{t('warehouse.type')}</Label>
                  <Input
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">{t('warehouse.quantity')}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">{t('warehouse.unit')}</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('warehouse.select_unit')} />
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
                  <Label htmlFor="desktop-name" className={`${isRTL ? "text-left" : "text-right"}`}>
                    {t('warehouse.name')}
                  </Label>
                  <Input
                    id="desktop-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="desktop-type" className={`${isRTL ? "text-left" : "text-right"}`}>
                    {t('warehouse.type')}
                  </Label>
                  <Input
                    id="desktop-type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="desktop-quantity" className={`${isRTL ? "text-left" : "text-right"}`}>
                    {t('warehouse.quantity')}
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
                  <Label htmlFor="desktop-unit" className={`${isRTL ? "text-left" : "text-right"}`}>
                    {t('warehouse.unit')}
                  </Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder={t('warehouse.select_unit')} />
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
          <DialogFooter className={`${isMobile ? "flex flex-col space-y-2" : ""} ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button 
              variant="outline" 
              onClick={handleCloseForm}
              className={isMobile ? "w-full" : ""}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saveMutation.isPending}
              className={isMobile ? "w-full" : ""}
            >
              {saveMutation.isPending
                ? editMaterial ? t('common.updating') : t('common.creating')
                : editMaterial ? t('common.update') : t('common.create')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingMaterial} onOpenChange={(open) => !open && setDeletingMaterial(null)}>
        <AlertDialogContent className={`${isMobile ? "max-w-[95vw] p-4 sm:p-6" : ""} ${isRTL ? "rtl" : ""}`}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.delete_confirmation', { item: deletingMaterial?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={`${isMobile ? "flex flex-col space-y-2" : ""} ${isRTL ? "flex-row-reverse" : ""}`}>
            <AlertDialogCancel className={isMobile ? "w-full mt-0" : ""}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className={`bg-red-500 hover:bg-red-600 ${isMobile ? "w-full" : ""}`}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Input Material Dialog */}
      <Dialog open={inputFormOpen} onOpenChange={setInputFormOpen}>
        <DialogContent className={`${isMobile ? "max-w-[95vw] p-4 sm:p-6" : ""} ${isRTL ? "rtl" : ""}`}>
          <DialogHeader>
            <DialogTitle>{t('warehouse.input_material')}</DialogTitle>
            <DialogDescription>
              {t('warehouse.add_quantities_desc')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Add material form */}
            <div className={isMobile ? "space-y-4" : "grid grid-cols-10 gap-4 items-end"}>
              <div className={isMobile ? "space-y-2" : "col-span-6"}>
                <Label htmlFor="material-select">{t('warehouse.name')}</Label>
                <Select 
                  value={selectedRawMaterialId?.toString() || ""} 
                  onValueChange={(value) => setSelectedRawMaterialId(parseInt(value))}
                >
                  <SelectTrigger id="material-select">
                    <SelectValue placeholder={t('warehouse.select_material')} />
                  </SelectTrigger>
                  <SelectContent>
                    {materials?.map((material) => (
                      <SelectItem key={material.id} value={material.id.toString()}>
                        {material.name} ({material.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className={isMobile ? "space-y-2" : "col-span-3"}>
                <Label htmlFor="input-quantity">{t('warehouse.quantity')}</Label>
                <Input
                  id="input-quantity"
                  type="number"
                  value={inputQuantity}
                  onChange={(e) => setInputQuantity(parseFloat(e.target.value))}
                />
              </div>
              
              <Button 
                onClick={handleAddInputItem} 
                className={isMobile ? "w-full" : "col-span-1"} 
                size={isMobile ? "default" : "icon"}
                type="button"
              >
                {isMobile ? t('warehouse.add_to_list') : <span className="material-icons">add</span>}
              </Button>
            </div>
            
            {/* Input items list */}
            {inputItems.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h3 className="font-medium text-sm">{t('warehouse.added_materials')}:</h3>
                <div className="space-y-2">
                  {inputItems.map((item) => {
                    const material = materials?.find(m => m.id === item.rawMaterialId);
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md bg-gray-50"
                      >
                        <div>
                          <p className="font-medium">{material?.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} {material?.unit}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInputItem(item.id)}
                          className="h-8 w-8 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className={`${isMobile ? "flex flex-col space-y-2" : ""} ${isRTL ? "flex-row-reverse" : ""}`}>
            <Button 
              variant="outline" 
              onClick={handleCloseInputForm}
              className={isMobile ? "w-full" : ""}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSaveInput} 
              disabled={inputMaterialMutation.isPending || inputItems.length === 0}
              className={isMobile ? "w-full" : ""}
            >
              {inputMaterialMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
