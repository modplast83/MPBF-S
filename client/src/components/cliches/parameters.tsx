import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Edit, Trash, Plus, Loader, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const parameterTypeOptions = [
  { value: "base_price", label: "Base Price (per cm²)" },
  { value: "color_multiplier", label: "Color Price Multiplier" },
  { value: "thickness_multiplier", label: "Thickness Multiplier" }
];

// Schema for parameter form
const parameterSchema = z.object({
  type: z.string().min(1, { message: "Parameter type is required" }),
  name: z.string().min(1, { message: "Parameter name is required" }),
  value: z.coerce.number().min(0, { message: "Value must be a positive number" }),
  description: z.string().optional()
});

type ParameterForm = z.infer<typeof parameterSchema>;

interface PlatePricingParametersProps {
  parameters: any[];
}

export default function PlatePricingParameters({ parameters }: PlatePricingParametersProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<any>(null);

  // Form definition
  const form = useForm<ParameterForm>({
    resolver: zodResolver(parameterSchema),
    defaultValues: {
      type: "",
      name: "",
      value: 0,
      description: ""
    }
  });

  // Create parameter mutation
  const createParameter = useMutation({
    mutationFn: async (data: ParameterForm) => {
      return await apiRequest('/api/plate-pricing-parameters', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plate-pricing-parameters'] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: t('cliches.parameterCreated'),
        description: t('cliches.parameterCreatedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('cliches.createError'),
        description: t('common.errorTryAgain'),
        variant: 'destructive'
      });
    }
  });

  // Update parameter mutation
  const updateParameter = useMutation({
    mutationFn: async (data: ParameterForm & { id: number }) => {
      return await apiRequest(`/api/plate-pricing-parameters/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          type: data.type,
          name: data.name,
          value: data.value,
          description: data.description
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plate-pricing-parameters'] });
      setShowEditDialog(false);
      form.reset();
      toast({
        title: t('cliches.parameterUpdated'),
        description: t('cliches.parameterUpdatedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('cliches.updateError'),
        description: t('common.errorTryAgain'),
        variant: 'destructive'
      });
    }
  });

  // Delete parameter mutation
  const deleteParameter = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/plate-pricing-parameters/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/plate-pricing-parameters'] });
      setShowDeleteDialog(false);
      setSelectedParameter(null);
      toast({
        title: t('cliches.parameterDeleted'),
        description: t('cliches.parameterDeletedSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('cliches.deleteError'),
        description: t('common.errorTryAgain'),
        variant: 'destructive'
      });
    }
  });

  // Handle create form submit
  const handleCreateSubmit = (data: ParameterForm) => {
    createParameter.mutate(data);
  };

  // Handle edit form submit
  const handleEditSubmit = (data: ParameterForm) => {
    if (selectedParameter) {
      updateParameter.mutate({ ...data, id: selectedParameter.id });
    }
  };

  // Handle edit button click
  const handleEditClick = (parameter: any) => {
    setSelectedParameter(parameter);
    form.reset({
      type: parameter.type,
      name: parameter.name,
      value: parameter.value,
      description: parameter.description || ""
    });
    setShowEditDialog(true);
  };

  // Handle delete button click
  const handleDeleteClick = (parameter: any) => {
    setSelectedParameter(parameter);
    setShowDeleteDialog(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = () => {
    if (selectedParameter) {
      deleteParameter.mutate(selectedParameter.id);
    }
  };

  // Get formatted parameter type label
  const getParameterTypeLabel = (type: string) => {
    const option = parameterTypeOptions.find(option => option.value === type);
    return option ? option.label : type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {t('cliches.parametersDescription')}
        </div>
        <Button onClick={() => {
          form.reset({
            type: "",
            name: "",
            value: 0,
            description: ""
          });
          setShowCreateDialog(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          {t('cliches.addParameter')}
        </Button>
      </div>

      {parameters.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {t('cliches.noParameters')}
          </CardContent>
        </Card>
      ) : (
        <div className={`${isMobile ? 'space-y-4' : ''}`}>
          {isMobile ? (
            // Mobile view - cards
            parameters.map((parameter) => (
              <Card key={parameter.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{parameter.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {getParameterTypeLabel(parameter.type)}
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(parameter)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(parameter)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-lg font-bold">{parameter.value}</div>
                    {parameter.description && (
                      <div className="text-sm mt-1">{parameter.description}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Desktop view - table
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('cliches.parameterName')}</TableHead>
                  <TableHead>{t('cliches.parameterType')}</TableHead>
                  <TableHead>{t('cliches.value')}</TableHead>
                  <TableHead>{t('cliches.description')}</TableHead>
                  <TableHead className="w-[100px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parameters.map((parameter) => (
                  <TableRow key={parameter.id}>
                    <TableCell className="font-medium">{parameter.name}</TableCell>
                    <TableCell>{getParameterTypeLabel(parameter.type)}</TableCell>
                    <TableCell>{parameter.value}</TableCell>
                    <TableCell>{parameter.description}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(parameter)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(parameter)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Create Parameter Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className={`sm:max-w-[425px] ${isMobile ? 'h-[70vh]' : ''}`}>
          <DialogHeader>
            <DialogTitle>{t('cliches.addParameter')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.parameterType')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('cliches.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parameterTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.parameterName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.value')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.description')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShowCreateDialog(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={createParameter.isPending}>
                  {createParameter.isPending ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Parameter Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className={`sm:max-w-[425px] ${isMobile ? 'h-[70vh]' : ''}`}>
          <DialogHeader>
            <DialogTitle>{t('cliches.editParameter')}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.parameterType')}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('cliches.selectType')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parameterTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.parameterName')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.value')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('cliches.description')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setShowEditDialog(false)}>
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={updateParameter.isPending}>
                  {updateParameter.isPending ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('cliches.deleteParameter')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('cliches.deleteParameterConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              disabled={deleteParameter.isPending}
            >
              {deleteParameter.isPending ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash className="h-4 w-4 mr-2" />
              )}
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}