import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/lib/constants";
import { MixMaterial, RawMaterial, Machine } from "@shared/schema";
import { formatDateString } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MixMaterialForm } from "@/components/production/mix-material-form";
import { MixDetails } from "@/components/production/mix-details";

export default function MixMaterialsPage() {
  const [selectedMixId, setSelectedMixId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Fetch all mix materials
  const { data: mixMaterials, isLoading: mixLoading, refetch: refetchMixes } = useQuery<MixMaterial[]>({
    queryKey: [API_ENDPOINTS.MIX_MATERIALS],
  });

  // Fetch raw materials for the select dropdown in the form
  const { data: rawMaterials } = useQuery<RawMaterial[]>({
    queryKey: [API_ENDPOINTS.RAW_MATERIALS],
  });

  // Fetch machines for the select dropdown in the form
  const { data: machines } = useQuery<Machine[]>({
    queryKey: [API_ENDPOINTS.MACHINES],
  });

  // Table columns for mix materials
  const mixColumns = [
    {
      header: "ID",
      accessorKey: "id" as const,
    },
    {
      header: "Date",
      accessorKey: "mixDate" as const,
      cell: (row: { mixDate: string }) => formatDateString(row.mixDate),
    },
    {
      header: "Operator",
      accessorKey: "mixPerson" as const,
    },
    {
      header: "Total Quantity (kg)",
      accessorKey: "totalQuantity" as const,
      cell: (row: { totalQuantity: number | null }) => row.totalQuantity?.toFixed(2) || "0.00",
    },
    {
      header: "Machine",
      accessorKey: "machineId" as const,
      cell: (row: { machineId: string | null }) => {
        if (!row.machineId) return "-";
        const machine = machines?.find(m => m.id === row.machineId);
        return machine ? machine.name : row.machineId;
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: (row: MixMaterial) => (
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-500 hover:text-primary-700"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMixId(row.id);
              setIsViewDialogOpen(true);
            }}
          >
            <span className="material-icons text-sm">visibility</span>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-500 hover:text-primary-700"
            onClick={(e) => {
              e.stopPropagation();
              window.print();
            }}
          >
            <span className="material-icons text-sm">print</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary-700">Mix Materials</h1>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <span className="material-icons text-sm">add</span>
                New Mix
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Mix</DialogTitle>
              </DialogHeader>
              <MixMaterialForm 
                rawMaterials={rawMaterials || []}
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  refetchMixes();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mix Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={mixMaterials || []}
            columns={mixColumns}
            isLoading={mixLoading}
            onRowClick={(row) => {
              setSelectedMixId(row.id);
              setIsViewDialogOpen(true);
            }}
          />
        </CardContent>
      </Card>

      {/* Mix details dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[750px]">
          <DialogHeader>
            <DialogTitle>Mix Details</DialogTitle>
          </DialogHeader>
          {selectedMixId && (
            <MixDetails 
              mixId={selectedMixId} 
              rawMaterials={rawMaterials || []}
              machines={machines || []}
              onClose={() => setIsViewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}