import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WorkflowStage } from "@/components/workflow/workflow-stage";
import { API_ENDPOINTS } from "@/lib/constants";
import { Roll } from "@shared/schema";

export default function WorkflowIndex() {
  // Fetch all rolls
  const { data: rolls, isLoading } = useQuery<Roll[]>({
    queryKey: [API_ENDPOINTS.ROLLS],
  });

  // Count rolls by stage
  const extrusionRolls = rolls?.filter(roll => roll.currentStage === "extrusion") || [];
  const printingRolls = rolls?.filter(roll => roll.currentStage === "printing") || [];
  const cuttingRolls = rolls?.filter(roll => roll.currentStage === "cutting") || [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-secondary-900">Workflow</h1>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center">
            <span className="material-icons text-sm mr-1">filter_list</span>
            Filter
          </Button>
          <Button variant="outline" className="flex items-center">
            <span className="material-icons text-sm mr-1">file_download</span>
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roll Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Extrusion Stage */}
            <div className="lg:w-1/3">
              <WorkflowStage 
                title="Extrusion" 
                icon="merge_type" 
                stage="extrusion"
                iconColor="text-primary-500" 
                iconBgColor="bg-primary-100" 
              />
            </div>
            
            {/* Printing Stage */}
            <div className="lg:w-1/3">
              <WorkflowStage 
                title="Printing" 
                icon="format_color_fill" 
                stage="printing"
                iconColor="text-warning-500" 
                iconBgColor="bg-warning-100" 
              />
            </div>
            
            {/* Cutting Stage */}
            <div className="lg:w-1/3">
              <WorkflowStage 
                title="Cutting" 
                icon="content_cut" 
                stage="cutting"
                iconColor="text-success" 
                iconBgColor="bg-success-100" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
