import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ProductForm } from "@/components/setup/product-form";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { CustomerProduct, Customer, Item, Category } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Printer } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTranslation } from "react-i18next";

export default function Products() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<CustomerProduct | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<CustomerProduct | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch products and related data
  const { data: allProducts, isLoading } = useQuery<CustomerProduct[]>({
    queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS],
  });

  const { data: customers, isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  const { data: items } = useQuery<Item[]>({
    queryKey: [API_ENDPOINTS.ITEMS],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: [API_ENDPOINTS.CATEGORIES],
  });
  
  // Filter customers by search query
  const filteredCustomers = customers?.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter products by selected customer
  const products = selectedCustomerId 
    ? allProducts?.filter(product => product.customerId === selectedCustomerId)
    : [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.CUSTOMER_PRODUCTS}/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CUSTOMER_PRODUCTS] });
      toast({
        title: t("setup.products.product_deleted"),
        description: t("setup.products.product_deleted_success"),
      });
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: t("setup.products.delete_failed", { error }),
        variant: "destructive",
      });
    },
  });

  const handleEdit = (product: CustomerProduct) => {
    setEditProduct(product);
    setFormOpen(true);
  };
  
  const handleDuplicate = (product: CustomerProduct) => {
    // Set the product data to be duplicated
    setEditProduct(product);
    // Set the duplicate flag
    setIsDuplicating(true);
    // Open the form in duplicate mode
    setFormOpen(true);
  };

  const handleDelete = (product: CustomerProduct) => {
    setDeletingProduct(product);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditProduct(null);
    setIsDuplicating(false); // Reset the duplicate flag
  };
  
  // Pre-select customer for new product
  const handleAddProduct = () => {
    setEditProduct(null);
    setFormOpen(true);
  };

  // Helper functions to get related data
  const getCustomerName = (customerId: string) => {
    return customers?.find(c => c.id === customerId)?.name || "Unknown";
  };

  const getItemName = (itemId: string) => {
    return items?.find(i => i.id === itemId)?.name || "Unknown";
  };

  const getCategoryName = (categoryId: string) => {
    return categories?.find(c => c.id === categoryId)?.name || "Unknown";
  };

  // Print function to generate A4 PDF
  const handlePrintProducts = () => {
    if (!selectedCustomerId || !products || products.length === 0) {
      toast({
        title: t("common.no_data"),
        description: t("setup.products.please_select_customer"),
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();
    const customerName = getCustomerName(selectedCustomerId);
    const currentDate = new Date().toLocaleDateString();
    
    // Add header
    doc.setFontSize(20);
    doc.text(t("setup.products.report_title"), 20, 20);
    
    doc.setFontSize(12);
    doc.text(`${t("setup.products.customer")}: ${customerName}`, 20, 35);
    doc.text(`${t("setup.products.date")}: ${currentDate}`, 20, 45);
    doc.text(`${t("setup.products.total_products")}: ${products.length}`, 20, 55);
    
    // Prepare table data
    const tableData = products.map((product, index) => [
      index + 1,
      product.id.toString(),
      getCategoryName(product.categoryId),
      getItemName(product.itemId),
      product.sizeCaption || '-',
      product.thickness ? product.thickness.toString() : '-',
      product.lengthCm ? product.lengthCm.toString() : '-',
      product.width ? product.width.toString() : '-',
      product.unitWeight ? product.unitWeight.toString() + ' kg' : '-'
    ]);

    // Add table
    autoTable(doc, {
      head: [[t("setup.products.sn"), t("setup.products.id"), t("setup.products.category"), t("common.item"), t("setup.products.size_caption"), t("setup.products.thickness"), t("setup.products.length_cm"), t("setup.products.width"), t("setup.products.unit_weight")]],
      body: tableData,
      startY: 70,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 15 }, // S/N
        1: { cellWidth: 20 }, // ID
        2: { cellWidth: 25 }, // Category
        3: { cellWidth: 25 }, // Item
        4: { cellWidth: 25 }, // Size Caption
        5: { cellWidth: 20 }, // Thickness
        6: { cellWidth: 25 }, // Length
        7: { cellWidth: 25 }, // Width
        8: { cellWidth: 20 }  // Unit Weight
      }
    });

    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      doc.text(t("setup.products.generated_by"), 20, doc.internal.pageSize.height - 10);
    }

    // Save the PDF
    doc.save(`${customerName}_Products_${currentDate.replace(/\//g, '-')}.pdf`);
    
    toast({
      title: t("setup.products.pdf_generated"),
      description: t("setup.products.pdf_generated_desc", { customer: customerName }),
    });
  };

  // Define columns with proper typing
  const columns = [
    {
      header: "S/N",
      id: "index",
      cell: (_row: CustomerProduct, index?: number) => (index !== undefined ? index + 1 : 0)
    },
    {
      header: "ID",
      accessorKey: "id" as const,
    },
    {
      header: t("setup.products.category"),
      id: "categoryName",
      cell: (row: CustomerProduct) => getCategoryName(row.categoryId)
    },
    {
      header: t("common.item"),
      id: "itemName",
      cell: (row: CustomerProduct) => getItemName(row.itemId)
    },
    {
      header: t("setup.products.size"),
      id: "sizeCaption",
      cell: (row: CustomerProduct) => row.sizeCaption || "-"
    },
    {
      header: t("setup.products.thickness"),
      id: "thickness",
      cell: (row: CustomerProduct) => row.thickness ? `${row.thickness}` : "-"
    },
    {
      header: t("common.length") + " (cm)",
      id: "lengthCm",
      cell: (row: CustomerProduct) => row.lengthCm ? `${row.lengthCm}` : "-"
    },
    {
      header: t("setup.products.actions"),
      id: "actions",
      cell: (row: CustomerProduct) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)} className="text-primary-500 hover:text-primary-700" title={t("common.edit")}>
            <span className="material-icons text-sm">edit</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDuplicate(row)} className="text-secondary-500 hover:text-secondary-700" title={t("setup.products.duplicate_product")}>
            <span className="material-icons text-sm">content_copy</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(row)} className="text-red-500 hover:text-red-700" title={t("setup.products.delete_product")}>
            <span className="material-icons text-sm">delete</span>
          </Button>
        </div>
      ),
    },
  ];

  const tableActions = (
    <Button onClick={handleAddProduct}>
      <span className="material-icons text-sm mr-1">add</span>
      {t("setup.products.add_new")}
    </Button>
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t("setup.products.title")}</h1>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t("setup.products.customer_products")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 relative">
              <Input
                placeholder={t("setup.products.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
            <Select 
              value={selectedCustomerId} 
              onValueChange={setSelectedCustomerId}
              disabled={customersLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("setup.products.select_a_customer")} />
              </SelectTrigger>
              <SelectContent>
                {filteredCustomers?.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>
              {selectedCustomerId 
                ? t("setup.products.products_for", { customer: getCustomerName(selectedCustomerId) })
                : t("setup.products.select_customer_to_view")}
            </span>
            {selectedCustomerId && products && products.length > 0 && (
              <Button 
                onClick={handlePrintProducts}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                {t("setup.products.print_a4")}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCustomerId ? (
            <DataTable 
              data={products || []}
              columns={columns}
              isLoading={isLoading}
              actions={selectedCustomerId ? tableActions : undefined}
              pagination={true}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="material-icons text-4xl mb-2">people</span>
              <p>{t("setup.products.please_select_customer")}</p>
            </div>
          )}
        </CardContent>
      </Card>
      {/* Add/Edit Product Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isDuplicating 
                ? t("setup.products.duplicate_product")
                : editProduct 
                  ? t("setup.products.edit_product")
                  : t("setup.products.add_new")
              }
            </DialogTitle>
          </DialogHeader>
          <ProductForm 
            product={editProduct || undefined}
            onSuccess={handleFormClose}
            preSelectedCustomerId={selectedCustomerId}
            isDuplicate={isDuplicating}
          />
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("setup.products.are_you_sure")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("setup.products.delete_confirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("setup.products.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {t("setup.products.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
