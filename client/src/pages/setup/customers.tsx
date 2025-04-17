import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CustomerForm } from "@/components/setup/customer-form";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Customer, User } from "@shared/schema";

export default function Customers() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);

  // Fetch customers and related data
  const { data: customers, isLoading } = useQuery<Customer[]>({
    queryKey: [API_ENDPOINTS.CUSTOMERS],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.CUSTOMERS}/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.CUSTOMERS] });
      toast({
        title: "Customer Deleted",
        description: "The customer has been deleted successfully.",
      });
      setDeletingCustomer(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete customer: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setFormOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    setDeletingCustomer(customer);
  };

  const confirmDelete = () => {
    if (deletingCustomer) {
      deleteMutation.mutate(deletingCustomer.id);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditCustomer(null);
  };

  // Helper function to get user name from userId
  const getUserName = (userId: string | null) => {
    if (!userId) return "None";
    return users?.find(u => u.id === userId)?.name || "Unknown";
  };

  const columns = [
    {
      header: "ID",
      accessorKey: "id",
    },
    {
      header: "Code",
      accessorKey: "code",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Arabic Name",
      accessorKey: "nameAr",
      cell: (row: { nameAr: string | null }) => row.nameAr || "-",
    },
    {
      header: "Sales Person",
      accessorKey: "userId",
      cell: (row: { userId: string | null }) => getUserName(row.userId),
    },
    {
      header: "Plate Drawer Code",
      accessorKey: "plateDrawerCode",
      cell: (row: { plateDrawerCode: string | null }) => row.plateDrawerCode || "-",
    },
    {
      header: "Actions",
      cell: (row: Customer) => (
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
      Add Customer
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Customers</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manage Customers</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={customers || []}
            columns={columns}
            isLoading={isLoading}
            actions={tableActions}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCustomer ? "Edit Customer" : "Add New Customer"}
            </DialogTitle>
          </DialogHeader>
          <CustomerForm 
            customer={editCustomer || undefined}
            onSuccess={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the customer{' '}
              <span className="font-semibold">"{deletingCustomer?.name}"</span>.
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
