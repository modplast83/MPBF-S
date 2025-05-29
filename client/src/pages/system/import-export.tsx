import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { templateDefinitions, generateCSV, downloadFile } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/lib/constants";
import { useTranslation } from "react-i18next";

export default function ImportExportPage() {
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedExportTable, setSelectedExportTable] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  // Available tables for export
  const exportTables = [
    { value: "categories", label: "Categories", endpoint: API_ENDPOINTS.CATEGORIES },
    { value: "customers", label: "Customers", endpoint: API_ENDPOINTS.CUSTOMERS },
    { value: "items", label: "Items", endpoint: API_ENDPOINTS.ITEMS },
    { value: "sections", label: "Sections", endpoint: API_ENDPOINTS.SECTIONS },
    { value: "machines", label: "Machines", endpoint: API_ENDPOINTS.MACHINES },
    { value: "users", label: "Users", endpoint: API_ENDPOINTS.USERS },
    { value: "orders", label: "Orders", endpoint: API_ENDPOINTS.ORDERS },
    { value: "jobOrders", label: "Job Orders", endpoint: API_ENDPOINTS.JOB_ORDERS },
    { value: "rolls", label: "Rolls", endpoint: API_ENDPOINTS.ROLLS },
    { value: "masterBatches", label: "Master Batches", endpoint: API_ENDPOINTS.MASTER_BATCHES },
    { value: "rawMaterials", label: "Raw Materials", endpoint: API_ENDPOINTS.RAW_MATERIALS },
    { value: "finalProducts", label: "Final Products", endpoint: API_ENDPOINTS.FINAL_PRODUCTS },
    { value: "qualityChecks", label: "Quality Checks", endpoint: "/api/quality-checks" },
    { value: "qualityViolations", label: "Quality Violations", endpoint: "/api/quality-violations" },
    { value: "correctiveActions", label: "Corrective Actions", endpoint: "/api/corrective-actions" },
    { value: "mixMaterials", label: "Mix Materials", endpoint: API_ENDPOINTS.MIX_MATERIALS },
  ];

  // Handle download template
  const handleDownloadTemplate = () => {
    if (!selectedTemplate || !templateDefinitions[selectedTemplate as keyof typeof templateDefinitions]) {
      toast({
        title: "Error",
        description: "Please select a template to download",
        variant: "destructive",
      });
      return;
    }

    const template = templateDefinitions[selectedTemplate as keyof typeof templateDefinitions];
    const csv = generateCSV(template.headers, template.sampleData);
    downloadFile(csv, template.fileName);

    toast({
      title: "Template Downloaded",
      description: `Template for ${selectedTemplate} has been downloaded.`,
    });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Handle export current data
  const handleExportData = async () => {
    if (!selectedExportTable) {
      toast({
        title: "Error",
        description: "Please select a table to export",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);

    try {
      const selectedTable = exportTables.find(table => table.value === selectedExportTable);
      if (!selectedTable) {
        throw new Error("Invalid table selection");
      }

      // Fetch data from the API
      const response = await fetch(selectedTable.endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        toast({
          title: "No Data",
          description: `No data found in ${selectedTable.label} table`,
          variant: "destructive",
        });
        return;
      }

      // Generate CSV from the data
      const headers = Object.keys(data[0]);
      const csvData = data.map(row => headers.map(header => {
        const value = row[header];
        // Handle different data types
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
        return String(value);
      }));

      const csv = generateCSV(headers, csvData);
      const fileName = `${selectedExportTable}_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      downloadFile(csv, fileName);

      toast({
        title: "Export Successful",
        description: `${selectedTable.label} data exported successfully (${data.length} records)`,
      });

    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An error occurred during export",
        variant: "destructive",
      });
      console.error("Export error:", error);
    } finally {
      setExporting(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!selectedFile || !selectedTemplate) {
      toast({
        title: "Error",
        description: "Please select both a data type and a file to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);

    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entityType', selectedTemplate);

      // Send the file to the server
      const response = await fetch('/api/import-csv', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Import Successful",
          description: `${result.message}: Created ${result.created}, Updated ${result.updated}${result.failed > 0 ? `, Failed ${result.failed}` : ''}`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.message || "An error occurred during import",
          variant: "destructive",
        });

        if (result.errors && result.errors.length > 0) {
          console.error("Import errors:", result.errors);
        }
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "An error occurred while trying to upload the file",
        variant: "destructive",
      });
      console.error("Import error:", error);
    } finally {
      setImporting(false);
      setSelectedFile(null);
      // Reset the file input
      const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Data Import & Export</h1>

      <Tabs defaultValue="templates">
        <TabsList className="mb-4">
          <TabsTrigger value="templates">Download Templates</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Current Data</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Download Data Templates</CardTitle>
              <CardDescription>
                Get CSV templates for importing your existing data into the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="templateSelect">Select Data Type</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={setSelectedTemplate}
                    >
                      <SelectTrigger id="templateSelect">
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="categories">Categories</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="items">Items</SelectItem>
                        <SelectItem value="customerProducts">Customer Products</SelectItem>
                        <SelectItem value="sections">Sections</SelectItem>
                        <SelectItem value="machines">Machines</SelectItem>
                        <SelectItem value="masterBatches">Master Batches</SelectItem>
                        <SelectItem value="rawMaterials">Raw Materials</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleDownloadTemplate} className="w-full md:w-auto">
                      <span className="material-icons text-sm mr-2">file_download</span>
                      Download Template
                    </Button>
                  </div>
                </div>

                <Alert>
                  <span className="material-icons text-primary">info</span>
                  <AlertTitle>How to use templates</AlertTitle>
                  <AlertDescription>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Download the CSV template for the data type you want to import</li>
                      <li>Open the file in a spreadsheet application (Excel, Google Sheets, etc.)</li>
                      <li>Fill in your data following the sample row format</li>
                      <li>Save as CSV and import using the Import Data tab</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>
                Import your existing data from CSV files into the system.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="importTypeSelect">Select Data Type</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={setSelectedTemplate}
                    >
                      <SelectTrigger id="importTypeSelect">
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="categories">Categories</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="items">Items</SelectItem>
                        <SelectItem value="customerProducts">Customer Products</SelectItem>
                        <SelectItem value="sections">Sections</SelectItem>
                        <SelectItem value="machines">Machines</SelectItem>
                        <SelectItem value="masterBatches">Master Batches</SelectItem>
                        <SelectItem value="rawMaterials">Raw Materials</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fileUpload">Select CSV File</Label>
                    <Input
                      id="fileUpload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleImport}
                    disabled={!selectedFile || !selectedTemplate || importing}
                  >
                    {importing ? (
                      <>
                        <span className="material-icons animate-spin text-sm mr-2">refresh</span>
                        Importing...
                      </>
                    ) : (
                      <>
                        <span className="material-icons text-sm mr-2">upload_file</span>
                        Import Data
                      </>
                    )}
                  </Button>
                </div>

                <Alert>
                  <span className="material-icons text-warning-500">warning</span>
                  <AlertTitle>Important Notes</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Make sure your CSV file matches the template format exactly</li>
                      <li>The system will validate your data before importing</li>
                      <li>Duplicate IDs will update existing records</li>
                      <li>Make sure all referenced IDs (e.g., categoryId in items) already exist</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Current Database Data</CardTitle>
              <CardDescription>
                Export existing data from the database tables to CSV files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exportTableSelect">Select Table to Export</Label>
                    <Select
                      value={selectedExportTable}
                      onValueChange={setSelectedExportTable}
                    >
                      <SelectTrigger id="exportTableSelect">
                        <SelectValue placeholder="Select table to export" />
                      </SelectTrigger>
                      <SelectContent>
                        {exportTables.map((table) => (
                          <SelectItem key={table.value} value={table.value}>
                            {table.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleExportData}
                      disabled={!selectedExportTable || exporting}
                      className="w-full md:w-auto"
                    >
                      {exporting ? (
                        <>
                          <span className="material-icons animate-spin text-sm mr-2">refresh</span>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-sm mr-2">download</span>
                          Export Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Alert>
                  <span className="material-icons text-blue-500">info</span>
                  <AlertTitle>Export Information</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Export generates CSV files with all current data from the selected table</li>
                      <li>The exported file will include all columns and records</li>
                      <li>File name format: {`{table}_export_{date}.csv`}</li>
                      <li>Use this feature to backup your data or analyze it in external tools</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">Available Tables:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {exportTables.map((table) => (
                      <div key={table.value} className="flex items-center space-x-2">
                        <span className="material-icons text-xs text-gray-500">table_chart</span>
                        <span>{table.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}