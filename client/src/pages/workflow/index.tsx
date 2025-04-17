import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RollCard } from "@/components/workflow/roll-card";
import { JobOrdersForExtrusion } from "@/components/workflow/job-orders-for-extrusion-fixed";
import { API_ENDPOINTS } from "@/lib/constants";
import { Roll } from "@shared/schema";

export default function WorkflowIndex() {
  const [activeTab, setActiveTab] = useState("extrusion");
  
  // Fetch rolls by stage
  const { data: extrusionRolls, isLoading: extrusionLoading } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/extrusion`],
  });
  
  const { data: printingRolls, isLoading: printingLoading } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/printing`],
  });
  
  const { data: cuttingRolls, isLoading: cuttingLoading } = useQuery<Roll[]>({
    queryKey: [`${API_ENDPOINTS.ROLLS}/stage/cutting`],
  });
  
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
          <Tabs defaultValue="extrusion" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="extrusion" className="flex items-center gap-2">
                <span className="material-icons text-primary-500">merge_type</span>
                <span>Extrusion</span>
                <span className="ml-2 h-5 w-5 rounded-full bg-primary-100 text-xs flex items-center justify-center">
                  {extrusionLoading ? "-" : extrusionRolls?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="printing" className="flex items-center gap-2">
                <span className="material-icons text-warning-500">format_color_fill</span>
                <span>Printing</span>
                <span className="ml-2 h-5 w-5 rounded-full bg-warning-100 text-xs flex items-center justify-center">
                  {printingLoading ? "-" : printingRolls?.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="cutting" className="flex items-center gap-2">
                <span className="material-icons text-success">content_cut</span>
                <span>Cutting</span>
                <span className="ml-2 h-5 w-5 rounded-full bg-success-100 text-xs flex items-center justify-center">
                  {cuttingLoading ? "-" : cuttingRolls?.length || 0}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="extrusion" className="space-y-4">
              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-primary-100 p-2 mr-3">
                    <span className="material-icons text-primary-500">merge_type</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Extrusion Stage</h4>
                    <p className="text-sm text-secondary-500">Create rolls from active job orders</p>
                  </div>
                </div>
                
                {/* Job Orders for Extrusion */}
                <JobOrdersForExtrusion />
                
                {/* Active Extrusion Rolls */}
                <div className="mt-6">
                  <h5 className="font-medium mb-3">Rolls in Extrusion</h5>
                  <div className="space-y-3">
                    {extrusionLoading ? (
                      <>
                        <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                        <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                      </>
                    ) : extrusionRolls && extrusionRolls.length > 0 ? (
                      extrusionRolls.map((roll) => (
                        <RollCard key={roll.id} roll={roll} />
                      ))
                    ) : (
                      <div className="py-6 text-center text-secondary-400 bg-white rounded-lg border border-dashed border-secondary-200">
                        <span className="material-icons text-3xl mb-2">hourglass_empty</span>
                        <p>No rolls currently in extrusion</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="printing" className="space-y-4">
              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-warning-100 p-2 mr-3">
                    <span className="material-icons text-warning-500">format_color_fill</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Printing Stage</h4>
                    <p className="text-sm text-secondary-500">
                      {printingLoading 
                        ? "Loading..." 
                        : `${printingRolls?.length || 0} rolls ready for printing`}
                    </p>
                    <p className="text-xs text-secondary-400 italic">
                      Printing quantity is automatically set equal to extrusion quantity
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {printingLoading ? (
                    <>
                      <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                      <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                    </>
                  ) : printingRolls && printingRolls.length > 0 ? (
                    printingRolls.map((roll) => (
                      <RollCard key={roll.id} roll={roll} />
                    ))
                  ) : (
                    <div className="py-8 text-center text-secondary-400">
                      <span className="material-icons text-3xl mb-2">hourglass_empty</span>
                      <p>No rolls in printing stage</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="cutting" className="space-y-4">
              <div className="bg-secondary-50 rounded-lg p-4">
                <div className="flex items-center mb-4">
                  <div className="rounded-full bg-success-100 p-2 mr-3">
                    <span className="material-icons text-success">content_cut</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Cutting Stage</h4>
                    <p className="text-sm text-secondary-500">
                      {cuttingLoading 
                        ? "Loading..." 
                        : `${cuttingRolls?.length || 0} rolls ready for cutting`}
                    </p>
                    <p className="text-xs text-secondary-400 italic">
                      Input cutting quantity - the difference is calculated as waste
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {cuttingLoading ? (
                    <>
                      <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                      <div className="animate-pulse bg-white p-3 rounded border border-secondary-200 h-32"></div>
                    </>
                  ) : cuttingRolls && cuttingRolls.length > 0 ? (
                    cuttingRolls.map((roll) => (
                      <RollCard key={roll.id} roll={roll} />
                    ))
                  ) : (
                    <div className="py-8 text-center text-secondary-400">
                      <span className="material-icons text-3xl mb-2">hourglass_empty</span>
                      <p>No rolls in cutting stage</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}