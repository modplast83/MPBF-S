import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      header: t('setup.users.username'),
      accessorKey: "username" as keyof User,
    },
    {
      header: t('setup.users.first_name'),
      accessorKey: "firstName" as keyof User,
      cell: (row: { firstName?: string | null, lastName?: string | null }) => 
        `${row.firstName || ''} ${row.lastName || ''}`.trim() || '-',
    },
    {
      header: t('setup.users.role'),
      accessorKey: "role" as keyof User,
      cell: (row: { role: string }) => formatRole(row.role),
    },
    {
      header: t('setup.users.section'),
      accessorKey: "sectionId" as keyof User,
      cell: (row: { sectionId: string | null }) => getSectionName(row.sectionId),
    },
    {
      header: t('setup.users.status'),
      accessorKey: "isActive" as keyof User,
      cell: (row: { isActive: boolean }) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? t('setup.users.active') : t('setup.users.inactive')}
        </Badge>
      ),
    },
    {
      header: t('common.actions'),
      cell: (row: User) => (
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
    <Button onClick={() => setFormOpen(true)}>
      <span className="material-icons text-sm mr-1">add</span>
      {t('setup.users.add_new')}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">{t('setup.users.title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{t('setup.users.description')}</span>
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
              {editUser ? t('setup.users.edit_user') : t('setup.users.add_new')}
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
            <AlertDialogTitle>{t('setup.users.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('setup.users.delete_confirmation', { 
                name: `${deletingUser?.firstName || ''} ${deletingUser?.lastName || ''}`.trim() || deletingUser?.username || ''
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('setup.users.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {t('setup.users.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
