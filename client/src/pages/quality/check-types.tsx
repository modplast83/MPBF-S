import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QualityCheckType {
  id: string;
  name: string;
  description: string | null;
  checklistItems: string[];
  parameters: string[];
  targetStage: string;
  isActive: boolean;
}

const formSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable(),
  checklistItems: z.array(z.string()),
  parameters: z.array(z.string()),
  targetStage: z.string().min(1, "Target stage is required"),
  isActive: z.boolean().default(true),
});

export default function QualityCheckTypes() {
  const [isOpenCreate, setIsOpenCreate] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [selectedCheckType, setSelectedCheckType] = useState<QualityCheckType | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      checklistItems: [],
      parameters: [],
      targetStage: "extrusion",
      isActive: true,
    }
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      checklistItems: [],
      parameters: [],
      targetStage: "extrusion",
      isActive: true,
    }
  });

  const { data: checkTypes, isLoading } = useQuery({
    queryKey: ["/api/quality-check-types"],
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return await apiRequest("POST", "/api/quality-check-types", values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quality check type created successfully",
      });
      setIsOpenCreate(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-check-types"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create quality check type",
        variant: "destructive",
      });
      console.error("Error creating quality check type:", error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return await apiRequest("PATCH", `/api/quality-check-types/${values.id}`, values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quality check type updated successfully",
      });
      setIsOpenEdit(false);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/quality-check-types"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update quality check type",
        variant: "destructive",
      });
      console.error("Error updating quality check type:", error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/quality-check-types/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quality check type deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quality-check-types"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete quality check type",
        variant: "destructive",
      });
      console.error("Error deleting quality check type:", error);
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createMutation.mutate(values);
  };

  const onEdit = (values: z.infer<typeof formSchema>) => {
    updateMutation.mutate(values);
  };

  const handleEdit = (checkType: QualityCheckType) => {
    setSelectedCheckType(checkType);
    editForm.reset(checkType);
    setIsOpenEdit(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this quality check type?")) {
      deleteMutation.mutate(id);
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'extrusion':
        return 'Extrusion';
      case 'printing':
        return 'Printing';
      case 'cutting':
        return 'Cutting';
      case 'final':
        return 'Final Product';
      default:
        return stage;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <PageHeader heading="Quality Check Types" text="Define and manage quality check templates for different production stages" />
        <Dialog open={isOpenCreate} onOpenChange={setIsOpenCreate}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Check Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Quality Check Type</DialogTitle>
              <DialogDescription>
                Define a new quality check type for a specific production stage
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID</FormLabel>
                        <FormControl>
                          <Input placeholder="QCT001" {...field} />
                        </FormControl>
                        <FormDescription>Unique identifier for this check type</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Extrusion Quality Check" {...field} />
                        </FormControl>
                        <FormDescription>Descriptive name</FormDescription>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description of what this check type is for" {...field} value={field.value || ''} />
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
                      <FormLabel>Target Stage</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="extrusion">Extrusion</SelectItem>
                          <SelectItem value="printing">Printing</SelectItem>
                          <SelectItem value="cutting">Cutting</SelectItem>
                          <SelectItem value="final">Final Product</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>The production stage this check applies to</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Inactive check types won't appear in quality check forms
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Check Type"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading quality check types...</div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Target Stage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkTypes && checkTypes.length > 0 ? (
                checkTypes.map((checkType: QualityCheckType) => (
                  <TableRow key={checkType.id}>
                    <TableCell className="font-medium">{checkType.id}</TableCell>
                    <TableCell>{checkType.name}</TableCell>
                    <TableCell>{getStageLabel(checkType.targetStage)}</TableCell>
                    <TableCell>
                      <Badge variant={checkType.isActive ? "default" : "secondary"}>
                        {checkType.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(checkType)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(checkType.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No quality check types found. Create your first one!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isOpenEdit} onOpenChange={setIsOpenEdit}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Quality Check Type</DialogTitle>
            <DialogDescription>
              Update the quality check type details
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID</FormLabel>
                      <FormControl>
                        <Input disabled {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="targetStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Stage</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="extrusion">Extrusion</SelectItem>
                        <SelectItem value="printing">Printing</SelectItem>
                        <SelectItem value="cutting">Cutting</SelectItem>
                        <SelectItem value="final">Final Product</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive check types won't appear in quality check forms
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Check Type"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}