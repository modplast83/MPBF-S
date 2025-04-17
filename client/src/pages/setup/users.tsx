import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UserForm } from "@/components/setup/user-form";
import { API_ENDPOINTS } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { User, Section } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function Users() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Fetch users and sections
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: [API_ENDPOINTS.USERS],
  });

  const { data: sections } = useQuery<Section[]>({
    queryKey: [API_ENDPOINTS.SECTIONS],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `${API_ENDPOINTS.USERS}/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.USERS] });
      toast({
        title: "User Deleted",
        description: "The user has been deleted successfully.",
      });
      setDeletingUser(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete user: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (user: User) => {
    setEditUser(user);
    setFormOpen(true);
  };

  const handleDelete = (user: User) => {
    setDeletingUser(user);
  };

  const confirmDelete = () => {
    if (deletingUser) {
      deleteMutation.mutate(deletingUser.id);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditUser(null);
  };

  // Helper function to get section name
  const getSectionName = (sectionId: string | null) => {
    if (!sectionId) return "None";
    return sections?.find(s => s.id === sectionId)?.name || "Unknown";
  };

  // Function to capitalize role for display
  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const columns = [
    {
      header: "Username",
      accessorKey: "username",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: (row: { role: string }) => formatRole(row.role),
    },
    {
      header: "Section",
      accessorKey: "sectionId",
      cell: (row: { sectionId: string | null }) => getSectionName(row.sectionId),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (row: { isActive: boolean }) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      cell: (row: User) => (
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
      Add User
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Users</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Manage Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            data={users || []}
            columns={columns}
            isLoading={isLoading}
            actions={tableActions}
          />
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editUser ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <UserForm 
            user={editUser || undefined}
            onSuccess={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user{' '}
              <span className="font-semibold">"{deletingUser?.name}"</span>.
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
