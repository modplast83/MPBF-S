import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { API_ENDPOINTS } from "@/lib/constants";
import { MixMaterial, RawMaterial } from "@shared/schema";
import { formatDateString } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MixMaterialForm } from "@/components/production/mix-material-form";
import { MixDetails } from "@/components/production/mix-details";

export default function MixMaterialsPage() {
  const { t } = useTranslation();
  const [selectedMixId, setSelectedMixId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [printableData, setPrintableData] = useState<{
    mix: any;
    items: any[];
    totalWeight: number;
    materialNames: {[key: number]: string};
  } | null>(null);

  // Fetch all mix materials
  const { data: mixMaterials, isLoading: mixLoading, refetch: refetchMixes } = useQuery<MixMaterial[]>({
    queryKey: [API_ENDPOINTS.MIX_MATERIALS],
  });

  // Fetch raw materials for the select dropdown in the form
  const { data: rawMaterials } = useQuery<RawMaterial[]>({
    queryKey: [API_ENDPOINTS.RAW_MATERIALS],
  });

  // Machines no longer needed for mix materials

  // Table columns for mix materials
  const mixColumns = [
    {
      header: t('production.mix_materials.mix_id'),
      accessorKey: "id" as const,
    },
    {
      header: t('production.mix_materials.date'),
      accessorKey: "mixDate" as const,
      cell: (row: any) => formatDateString(row.mixDate.toString()),
    },
    {
      header: t('production.mix_materials.operator'),
      accessorKey: "mixPerson" as const,
    },
    {
      header: t('production.mix_materials.total_weight'),
      accessorKey: "totalQuantity" as const,
      cell: (row: { totalQuantity: number | null }) => row.totalQuantity?.toFixed(2) || "0.00",
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
              printMixLabel(row.id);
            }}
          >
            <span className="material-icons text-sm">print</span>
          </Button>
        </div>
      ),
    },
  ];
  
  // Function to prepare the data for printing
  const preparePrintData = async (mixId: number) => {
    try {
      // Fetch mix details
      const response = await fetch(`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}`);
      const mixData = await response.json();
      
      // Fetch mix items
      const itemsResponse = await fetch(`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}/items`);
      const mixItems = await itemsResponse.json();
      
      // Calculate total weight
      const totalWeight = mixItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
      
      // Get material names for the items
      const materialNames: {[key: number]: string} = {};
      if (rawMaterials) {
        rawMaterials.forEach(material => {
          materialNames[material.id] = material.name;
        });
      }
      
      // Store the data for the printable label
      setPrintableData({
        mix: mixData,
        items: mixItems,
        totalWeight,
        materialNames
      });
      
      // Trigger print immediately
      setTimeout(() => {
        window.print();
      }, 100);
    } catch (error) {
      console.error("Failed to prepare print data:", error);
    }
  };

  // Function to print a mix label directly
  const printMixLabel = (mixId: number) => {
    preparePrintData(mixId);
  };

  // Create printable label component
  const PrintableLabel = () => {
    if (!printableData) return null;
    
    const { mix, items, totalWeight, materialNames } = printableData;
    
    return (
      <div className="printable-label" style={{ width: "3in", height: "5in", padding: "0.25in" }}>
        <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "10px", textAlign: "center" }}>
          {t('production.mix_materials.mix_label')}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", borderBottom: "1px solid #ccc", paddingBottom: "0.1in" }}>
          <div>{t('production.mix_materials.mix_id')}: {mix.id}</div>
          <div>{t('production.mix_materials.date')}: {formatDateString(mix.mixDate)}</div>
        </div>
        <div style={{ marginBottom: "10px" }}>
          <div>{t('production.mix_materials.operator')}: {mix.mixPerson}</div>
          <div>{t('production.mix_materials.total_weight')}: {totalWeight.toFixed(2)} kg</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>{t('production.mix_materials.material')}</th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>{t('production.mix_materials.quantity')}</th>
              <th style={{ border: "1px solid #ccc", padding: "4px" }}>{t('production.mix_materials.percentage')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const percentage = ((item.quantity / totalWeight) * 100).toFixed(1);
              const materialName = materialNames[item.rawMaterialId] || `Material ${item.rawMaterialId}`;
              return (
                <tr key={item.id}>
                  <td style={{ border: "1px solid #ccc", padding: "4px" }}>{materialName}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px", textAlign: "right" }}>{item.quantity.toFixed(2)}</td>
                  <td style={{ border: "1px solid #ccc", padding: "4px", textAlign: "right" }}>{percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ borderTop: "1px solid #ccc", paddingTop: "0.1in", display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "10px" }}>
          <div>Total: {items.length}</div>
          <div>{totalWeight.toFixed(2)} kg</div>
        </div>
        <div style={{ textAlign: "center", fontSize: "8pt", marginTop: "0.1in" }}>
          {new Date().toLocaleString()}<br/>
          Size: 3" x 5"
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-primary-700">{t('production.mix_materials.title')}</h1>
        <div className="flex space-x-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-1">
                <span className="material-icons text-sm">add</span>
                {t('production.mix_materials.new_mix')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>{t('production.mix_materials.new_mix')}</DialogTitle>
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
          <CardTitle>{t('production.mix_materials.title')}</CardTitle>
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
            <DialogTitle>{t('production.mix_materials.title')}</DialogTitle>
          </DialogHeader>
          {selectedMixId && (
            <MixDetails 
              mixId={selectedMixId} 
              rawMaterials={rawMaterials || []}
              onClose={() => setIsViewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden printable label that will only show when printing */}
      <div className="hidden print:block print:m-0 print:p-0">
        <PrintableLabel />
      </div>
    </div>
  );
}