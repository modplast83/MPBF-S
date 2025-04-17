import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { templateDefinitions, generateCSV, downloadFile } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

export default function ImportExportPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

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
      </Tabs>
    </div>
  );
}