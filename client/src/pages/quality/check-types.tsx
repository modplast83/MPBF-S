import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/use-language";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page-header";
import { Plus, Edit, Trash2, Search, Filter, CheckCircle, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const checkTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  targetStage: z.string().min(1, "Target stage is required"),
  checklistItems: z.array(z.string()).optional(),
  parameters: z.array(z.string()).optional(),
  isActive: z.boolean().default(true)
});

type CheckTypeForm = z.infer<typeof checkTypeSchema>;

interface QualityCheckType {
  id: string;
  name: string;
  description?: string;
  targetStage: string;
  checklistItems?: string[];
  parameters?: string[];
  isActive?: boolean;
}

export default function QualityCheckTypes() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<QualityCheckType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [checklistInput, setChecklistInput] = useState("");
  const [parameterInput, setParameterInput] = useState("");

  const form = useForm<CheckTypeForm>({
    resolver: zodResolver(checkTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      targetStage: "",
      checklistItems: [],
      parameters: [],
      isActive: true
    }
  });

  const { data: checkTypes = [] } = useQuery<QualityCheckType[]>({
    queryKey: ["/api/quality-check-types"]
  });

  const createMutation = useMutation({
    mutationFn: (data: CheckTypeForm) => apiRequest("/api/quality-check-types", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-check-types"] });
      toast({ title: t("quality.check_type_created_success", "Quality check type created successfully") });
      setShowForm(false);
      form.reset();
    },
    onError: () => {
      toast({ 
        title: t("quality.check_type_created_error", "Failed to create quality check type"), 
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: CheckTypeForm & { id: string }) => 
      apiRequest(`/api/quality-check-types/${data.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-check-types"] });
      toast({ title: t("quality.check_type_updated_success", "Quality check type updated successfully") });
      setShowForm(false);
      setEditingType(null);
      form.reset();
    },
    onError: () => {
      toast({ 
        title: t("quality.check_type_updated_error", "Failed to update quality check type"), 
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/quality-check-types/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-check-types"] });
      toast({ title: t("quality.check_type_deleted_success", "Quality check type deleted successfully") });
    },
    onError: () => {
      toast({ 
        title: t("quality.check_type_deleted_error", "Failed to delete quality check type"), 
        variant: "destructive" 
      });
    }
  });

  const filteredCheckTypes = checkTypes.filter((checkType) => {
    const matchesSearch = checkType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (checkType.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStage = stageFilter === "all" || checkType.targetStage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleEdit = (checkType: QualityCheckType) => {
    setEditingType(checkType);
    form.reset({
      name: checkType.name,
      description: checkType.description || "",
      targetStage: checkType.targetStage,
      checklistItems: checkType.checklistItems || [],
      parameters: checkType.parameters || [],
      isActive: checkType.isActive ?? true
    });
    setShowForm(true);
  };

  const handleDelete = (checkType: QualityCheckType) => {
    if (window.confirm(t("quality.delete_check_type_confirm", { name: checkType.name }))) {
      deleteMutation.mutate(checkType.id);
    }
  };

  const onSubmit = (data: CheckTypeForm) => {
    if (editingType) {
      updateMutation.mutate({ ...data, id: editingType.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const addChecklistItem = () => {
    if (checklistInput.trim()) {
      const currentItems = form.getValues("checklistItems") || [];
      form.setValue("checklistItems", [...currentItems, checklistInput.trim()]);
      setChecklistInput("");
    }
  };

  const removeChecklistItem = (index: number) => {
    const currentItems = form.getValues("checklistItems") || [];
    form.setValue("checklistItems", currentItems.filter((_, i) => i !== index));
  };

  const addParameter = () => {
    if (parameterInput.trim()) {
      const currentParams = form.getValues("parameters") || [];
      form.setValue("parameters", [...currentParams, parameterInput.trim()]);
      setParameterInput("");
    }
  };

  const removeParameter = (index: number) => {
    const currentParams = form.getValues("parameters") || [];
    form.setValue("parameters", currentParams.filter((_, i) => i !== index));
  };

  const stages = ["production", "packaging", "quality_control", "final_inspection", "shipping"];

  return (
    <div className={`container mx-auto py-6 ${isRTL ? 'rtl' : ''}`}>
      <PageHeader 
        title={t("quality.check_types")} 
        description={t("quality.check_types_desc", "Define quality check templates for different stages")} 
      />
      
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={t("quality.search_check_types", "Search check types...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t("quality.filter_by_stage", "Filter by stage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("quality.all_stages", "All Stages")}</SelectItem>
              {stages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {t(`quality.stage_${stage}`, stage)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={showForm} onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            setEditingType(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              {t("quality.add_check_type", "Add Check Type")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 
                  t("quality.edit_check_type", "Edit Check Type") : 
                  t("quality.create_check_type", "Create Check Type")}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.check_type_name", "Name")}</FormLabel>
                        <FormControl>
                          <Input placeholder={t("quality.check_type_name_placeholder", "Enter check type name")} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="targetStage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("quality.target_stage", "Target Stage")}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("quality.select_stage", "Select stage")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stages.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {t(`quality.stage_${stage}`, stage)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("quality.description", "Description")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t("quality.check_type_description_placeholder", "Enter check type description")} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Checklist Items */}
                <div>
                  <FormLabel>{t("quality.checklist_items", "Checklist Items")}</FormLabel>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder={t("quality.add_checklist_item", "Add checklist item")}
                      value={checklistInput}
                      onChange={(e) => setChecklistInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                    />
                    <Button type="button" onClick={addChecklistItem} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(form.watch("checklistItems") || []).map((item, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {item}
                        <button
                          type="button"
                          onClick={() => removeChecklistItem(index)}
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Parameters */}
                <div>
                  <FormLabel>{t("quality.parameters", "Parameters")}</FormLabel>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder={t("quality.add_parameter", "Add parameter")}
                      value={parameterInput}
                      onChange={(e) => setParameterInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParameter())}
                    />
                    <Button type="button" onClick={addParameter} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(form.watch("parameters") || []).map((param, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {param}
                        <button
                          type="button"
                          onClick={() => removeParameter(index)}
                          className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                        >
                          <XCircle className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {editingType ? 
                      t("quality.update_check_type", "Update Check Type") : 
                      t("quality.create_check_type", "Create Check Type")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                  >
                    {t("common.cancel", "Cancel")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Check Types List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("quality.check_types_list", "Quality Check Types")}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCheckTypes.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t("quality.no_check_types_found", "No check types found")}
              </h3>
              <p className="text-gray-500 mb-4">
                {t("quality.create_first_check_type", "Create your first quality check type to get started.")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCheckTypes.map((checkType) => (
                <Card key={checkType.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {checkType.name}
                          </h3>
                          <Badge variant={checkType.isActive ? "default" : "secondary"}>
                            {checkType.isActive ? 
                              t("quality.active", "Active") : 
                              t("quality.inactive", "Inactive")}
                          </Badge>
                          <Badge variant="outline">
                            {t(`quality.stage_${checkType.targetStage}`, checkType.targetStage)}
                          </Badge>
                        </div>
                        
                        {checkType.description && (
                          <p className="text-gray-600 mb-3">{checkType.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {checkType.checklistItems && checkType.checklistItems.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">
                                {t("quality.checklist_items", "Checklist Items")}:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {checkType.checklistItems.map((item, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {item}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {checkType.parameters && checkType.parameters.length > 0 && (
                            <div>
                              <span className="font-medium text-gray-700">
                                {t("quality.parameters", "Parameters")}:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {checkType.parameters.map((param, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {param}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(checkType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(checkType)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}