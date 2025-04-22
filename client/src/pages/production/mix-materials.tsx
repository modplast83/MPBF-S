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
      cell: (row: any) => formatDateString(row.mixDate.toString()),
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
  
  // Function to print a 5"x3" label for a mix
  const printMixLabel = async (mixId: number) => {
    // Fetch mix details
    const response = await fetch(`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}`);
    const mixData = await response.json();
    
    // Fetch mix items
    const itemsResponse = await fetch(`${API_ENDPOINTS.MIX_MATERIALS}/${mixId}/items`);
    const mixItems = await itemsResponse.json();
    
    // Create a new window for printing
    const printWindow = window.open('', '', 'width=5in,height=3in');
    if (!printWindow) return;
    
    // Calculate total weight
    const totalWeight = mixItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    
    // Get material names for the items
    const materialNames: {[key: number]: string} = {};
    if (rawMaterials) {
      rawMaterials.forEach(material => {
        materialNames[material.id] = material.name;
      });
    }
    
    // Generate HTML content for the label
    printWindow.document.write(`
      <html>
        <head>
          <title>Mix Label</title>
          <style>
            @page {
              size: 5in 3in;
              margin: 0;
            }
            body {
              width: 5in;
              height: 3in;
              margin: 0;
              padding: 0.25in;
              box-sizing: border-box;
              font-family: Arial, sans-serif;
              font-size: 10pt;
            }
            .label {
              border: 1px solid #ccc;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px solid #ccc;
              padding-bottom: 0.1in;
              font-weight: bold;
            }
            .mix-details {
              padding-top: 0.1in;
              padding-bottom: 0.1in;
            }
            .materials {
              flex-grow: 1;
              overflow: hidden;
            }
            .material-item {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.1in;
            }
            .material-name {
              flex: 2;
            }
            .material-qty {
              flex: 1;
              text-align: right;
            }
            .material-percent {
              flex: 1;
              text-align: right;
            }
            .title {
              font-weight: bold;
              text-align: center;
              margin-bottom: 0.1in;
              font-size: 12pt;
              border-bottom: 1px solid #ccc;
              padding-bottom: 0.1in;
            }
            .total {
              border-top: 1px solid #ccc;
              font-weight: bold;
              padding-top: 0.1in;
              display: flex;
              justify-content: space-between;
            }
            .footer {
              text-align: center;
              font-size: 8pt;
              margin-top: 0.1in;
            }
            @media print {
              body {
                width: 5in;
                height: 3in;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="title">
              MIX MATERIAL LABEL
            </div>
            <div class="header">
              <div>Mix ID: ${mixData.id}</div>
              <div>Date: ${formatDateString(mixData.mixDate.toString())}</div>
            </div>
            <div class="mix-details">
              <div>Operator: ${mixData.mixPerson}</div>
              <div>Total Weight: ${totalWeight.toFixed(2)} kg</div>
            </div>
            <div class="materials">
              <div class="material-item" style="font-weight: bold;">
                <div class="material-name">Material</div>
                <div class="material-qty">Qty (kg)</div>
                <div class="material-percent">%</div>
              </div>
              ${mixItems.map((item: any) => {
                const percentage = ((item.quantity / totalWeight) * 100).toFixed(1);
                const materialName = materialNames[item.rawMaterialId] || `Material ${item.rawMaterialId}`;
                return `
                  <div class="material-item">
                    <div class="material-name">${materialName}</div>
                    <div class="material-qty">${item.quantity}</div>
                    <div class="material-percent">${percentage}%</div>
                  </div>
                `;
              }).join('')}
            </div>
            <div class="total">
              <div>Total Materials: ${mixItems.length}</div>
              <div>Total Weight: ${totalWeight.toFixed(2)} kg</div>
            </div>
            <div class="footer">
              Printed on ${new Date().toLocaleString()}<br>
              Size: 5" x 3"
            </div>
          </div>
          <div class="no-print" style="margin-top: 0.25in; text-align: center;">
            <button onclick="window.print(); window.close();" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Print Label</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

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