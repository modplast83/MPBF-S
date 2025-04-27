import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/lib/constants";

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";

// Define parameter schema
const parameterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.string().min(1, "Value is required").transform(val => parseFloat(val)),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
});

type ParameterFormValues = z.infer<typeof parameterSchema>;

// Parameter types
const PARAMETER_TYPES = [
  { value: "base_price", label: "Base Price per cm²" },
  { value: "color_multiplier", label: "Color Multiplier" },
  { value: "thickness_multiplier", label: "Thickness Multiplier" },
];

export default function Parameters() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form setup
  const form = useForm<ParameterFormValues>({
    resolver: zodResolver(parameterSchema),
    defaultValues: {
      name: "",
      value: "",
      type: "",
      description: "",
    },
  });

  // Fetch parameters
  const { data: parameters, isLoading } = useQuery({
    queryKey: [API_ENDPOINTS.PLATE_PRICING_PARAMETERS],
    enabled: true,
  });

  // Add parameter mutation
  const addMutation = useMutation({
    mutationFn: async (data: ParameterFormValues) => {
      return apiRequest(API_ENDPOINTS.PLATE_PRICING_PARAMETERS, {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PLATE_PRICING_PARAMETERS] });
      toast({
        title: t("common.success"),
        description: t("Parameter added successfully"),
      });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Update parameter mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ParameterFormValues & { id: number }) => {
      return apiRequest(`${API_ENDPOINTS.PLATE_PRICING_PARAMETERS}/${data.id}`, {
        method: "PUT",
        data: {
          name: data.name,
          value: data.value,
          type: data.type,
          description: data.description,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PLATE_PRICING_PARAMETERS] });
      toast({
        title: t("common.success"),
        description: t("Parameter updated successfully"),
      });
      setIsAddDialogOpen(false);
      form.reset();
      setIsEditing(false);
      setSelectedParameter(null);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Delete parameter mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`${API_ENDPOINTS.PLATE_PRICING_PARAMETERS}/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.PLATE_PRICING_PARAMETERS] });
      toast({
        title: t("common.success"),
        description: t("Parameter deleted successfully"),
      });
      setIsDeleteDialogOpen(false);
      setSelectedParameter(null);
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: ParameterFormValues) => {
    if (isEditing && selectedParameter) {
      updateMutation.mutate({
        ...values,
        id: selectedParameter.id,
      });
    } else {
      addMutation.mutate(values);
    }
  };

  // Edit parameter
  const handleEdit = (parameter: any) => {
    setSelectedParameter(parameter);
    setIsEditing(true);
    form.reset({
      name: parameter.name,
      value: parameter.value.toString(),
      type: parameter.type,
      description: parameter.description || "",
    });
    setIsAddDialogOpen(true);
  };

  // Delete parameter
  const handleDelete = (parameter: any) => {
    setSelectedParameter(parameter);
    setIsDeleteDialogOpen(true);
  };

  // Confirm deletion
  const confirmDelete = () => {
    if (selectedParameter) {
      deleteMutation.mutate(selectedParameter.id);
    }
  };

  // Cancel dialog
  const handleCancelDialog = () => {
    setIsAddDialogOpen(false);
    setIsEditing(false);
    setSelectedParameter(null);
    form.reset();
  };

  // Get parameter type label
  const getParameterTypeLabel = (type: string) => {
    const parameterType = PARAMETER_TYPES.find(pt => pt.value === type);
    return parameterType ? parameterType.label : type;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("cliches.parametersTitle")}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setIsEditing(false);
                setSelectedParameter(null);
                form.reset();
              }}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("cliches.addParameter")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? t("Edit Parameter") : t("cliches.addParameter")}
              </DialogTitle>
              <DialogDescription>
                {isEditing 
                  ? t("Update the parameter details below") 
                  : t("Add a new parameter to the system")}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.parameterName")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Base Price per cm²" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.parameterType")}</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parameter type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PARAMETER_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("cliches.value")}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
                        />
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
                      <FormLabel>{t("cliches.description")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Optional description" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancelDialog}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addMutation.isPending || updateMutation.isPending}
                  >
                    {(addMutation.isPending || updateMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.saving")}
                      </>
                    ) : (
                      isEditing ? t("common.update") : t("common.save")
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className={isMobile ? "space-y-4" : ""}>
              {isMobile ? (
                <div className="space-y-4">
                  {parameters && parameters.length > 0 ? parameters.map((parameter: any) => (
                    <Card key={parameter.id} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 p-4">
                        <CardTitle className="text-base font-medium">
                          {parameter.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              {t("cliches.parameterType")}
                            </span>
                            <span className="text-sm font-medium">
                              {getParameterTypeLabel(parameter.type)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              {t("cliches.value")}
                            </span>
                            <span className="text-sm font-medium">
                              {parameter.value}
                            </span>
                          </div>
                          {parameter.description && (
                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-muted-foreground">
                                {t("cliches.description")}
                              </span>
                              <span className="text-sm">
                                {parameter.description}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(parameter)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={isDeleteDialogOpen && selectedParameter?.id === parameter.id}
                            onOpenChange={(open) => {
                              if (!open) setIsDeleteDialogOpen(false);
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDelete(parameter)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t("common.delete_confirmation")}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("common.delete_confirmation_message", { item: "parameter" })}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t("common.cancel")}
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={confirmDelete}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {t("common.delete")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No parameters found. Add your first parameter to get started.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("cliches.parameterName")}</TableHead>
                      <TableHead>{t("cliches.parameterType")}</TableHead>
                      <TableHead>{t("cliches.value")}</TableHead>
                      <TableHead>{t("cliches.description")}</TableHead>
                      <TableHead className="text-right">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parameters && parameters.length > 0 ? parameters.map((parameter: any) => (
                      <TableRow key={parameter.id}>
                        <TableCell className="font-medium">{parameter.name}</TableCell>
                        <TableCell>{getParameterTypeLabel(parameter.type)}</TableCell>
                        <TableCell>{parameter.value}</TableCell>
                        <TableCell>{parameter.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEdit(parameter)}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              {t("common.edit")}
                            </Button>
                            <AlertDialog
                              open={isDeleteDialogOpen && selectedParameter?.id === parameter.id}
                              onOpenChange={(open) => {
                                if (!open) setIsDeleteDialogOpen(false);
                              }}
                            >
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleDelete(parameter)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  {t("common.delete")}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {t("common.delete_confirmation")}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t("common.delete_confirmation_message", { item: "parameter" })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    {t("common.cancel")}
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={confirmDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {t("common.delete")}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          <p className="text-muted-foreground">
                            No parameters found. Add your first parameter to get started.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}